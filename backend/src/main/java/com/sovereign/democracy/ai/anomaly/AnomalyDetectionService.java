package com.sovereign.democracy.ai.anomaly;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sovereign.democracy.ai.anomaly.dto.AnomalyEvaluationDto;
import com.sovereign.democracy.ai.dto.GeminiRequestDto;
import com.sovereign.democracy.ai.dto.GeminiResponseDto;
import com.sovereign.democracy.ai.service.GeminiClientService;
import com.sovereign.democracy.entity.AnomalyAlert;
import com.sovereign.democracy.entity.BlockchainTransaction;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.enums.AnomalyReviewStatus;
import com.sovereign.democracy.enums.AnomalySeverity;
import com.sovereign.democracy.enums.BlockchainStatus;
import com.sovereign.democracy.exception.ResourceNotFoundException;
import com.sovereign.democracy.repository.AnomalyAlertRepository;
import com.sovereign.democracy.repository.AuditLogRepository;
import com.sovereign.democracy.repository.BlockchainTransactionRepository;
import com.sovereign.democracy.repository.ElectionRepository;
import com.sovereign.democracy.repository.VoteParticipationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AnomalyDetectionService {

    private static final Logger log = LoggerFactory.getLogger(AnomalyDetectionService.class);
    private static final int WINDOW_MINUTES = 15;

    private final IsolationForestModel isolationForestModel;
    private final AnomalyAlertRepository anomalyAlertRepository;
    private final ElectionRepository electionRepository;
    private final VoteParticipationRepository voteParticipationRepository;
    private final AuditLogRepository auditLogRepository;
    private final BlockchainTransactionRepository blockchainTransactionRepository;
    private final GeminiClientService geminiClientService;
    private final ObjectMapper objectMapper;

    public AnomalyDetectionService(IsolationForestModel isolationForestModel,
                                   AnomalyAlertRepository anomalyAlertRepository,
                                   ElectionRepository electionRepository,
                                   VoteParticipationRepository voteParticipationRepository,
                                   AuditLogRepository auditLogRepository,
                                   BlockchainTransactionRepository blockchainTransactionRepository,
                                   GeminiClientService geminiClientService,
                                   ObjectMapper objectMapper) {
        this.isolationForestModel = isolationForestModel;
        this.anomalyAlertRepository = anomalyAlertRepository;
        this.electionRepository = electionRepository;
        this.voteParticipationRepository = voteParticipationRepository;
        this.auditLogRepository = auditLogRepository;
        this.blockchainTransactionRepository = blockchainTransactionRepository;
        this.geminiClientService = geminiClientService;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void initializeModel() {
        if (!isolationForestModel.isFitted()) {
            log.info("Bootstrapping Isolation Forest with synthetic baseline operational data (500 samples)...");
            List<double[]> trainingData = SyntheticElectionDataGenerator.getNormalTrainingData(500, 42L);
            isolationForestModel.fit(trainingData);
        }
    }

    /**
     * Gathers operational metrics, evaluates anomaly score using Isolation Forest,
     * queries Gemini for grounded technical diagnostic explanation if needed,
     * and persists alert to MySQL if above warning threshold.
     */
    @Transactional
    public AnomalyEvaluationDto evaluateElection(Long electionId) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = now.minusMinutes(WINDOW_MINUTES);

        // 1. Gather Aggregated Operational Metrics
        long acceptedVotesInWindow = voteParticipationRepository.countByElectionAndVotedAtAfter(election, windowStart);
        double acceptedBallotsPerMin = Math.round((acceptedVotesInWindow / (double) WINDOW_MINUTES) * 100.0) / 100.0;

        long failedSubmissions = auditLogRepository.countByActionInAndTimestampBetween(
                List.of("INVALID_SVK", "KEY_LOCKOUT", "VOTE_REJECTED"), windowStart, now);

        long duplicateBlocks = auditLogRepository.countByActionAndTimestampBetween(
                "DUPLICATE_VOTE_BLOCKED", windowStart, now);

        long authFailures = auditLogRepository.countByActionAndTimestampBetween(
                "LOGIN_FAILURE", windowStart, now);

        long pendingTxCount = blockchainTransactionRepository.countByStatusIn(
                List.of(BlockchainStatus.PENDING, BlockchainStatus.SUBMITTED));

        double blockchainLatencySec = Math.round(calculateBlockchainLatencySec() * 10.0) / 10.0;

        // Baseline speed comparison (historical overall ballots/min for election area)
        double historicalBaseline = 0.8; // Standard expected baseline
        double speedDelta = Math.round(Math.abs(acceptedBallotsPerMin - historicalBaseline) * 100.0) / 100.0;

        AnomalyFeatureVector featureVector = new AnomalyFeatureVector(
                acceptedBallotsPerMin,
                (double) failedSubmissions,
                (double) duplicateBlocks,
                (double) authFailures,
                (double) pendingTxCount,
                blockchainLatencySec,
                speedDelta
        );

        // 2. Score with Isolation Forest Model
        double rawScore = isolationForestModel.computeScore(featureVector.toArray());
        double anomalyScore = Math.round(rawScore * 1000.0) / 1000.0;

        AnomalySeverity severity;
        if (anomalyScore >= IsolationForestModel.CRITICAL_THRESHOLD) {
            severity = AnomalySeverity.CRITICAL;
        } else if (anomalyScore >= IsolationForestModel.WARNING_THRESHOLD) {
            severity = AnomalySeverity.WARNING;
        } else {
            severity = AnomalySeverity.NORMAL;
        }

        // 3. Determine Model-Derived Technical Reason
        Map<String, Double> contributingMetrics = isolationForestModel.computeContributingMetrics(featureVector.toArray());
        String primaryReason = formulateTechnicalReason(severity, featureVector, contributingMetrics);

        // 4. Gemini AI Explanation (or Deterministic Fallback)
        String geminiExplanation = null;
        if (severity != AnomalySeverity.NORMAL || anomalyScore >= 0.55) {
            geminiExplanation = generateGeminiExplanation(election, anomalyScore, severity, featureVector, primaryReason);
        }

        // 5. Persist Anomaly Alert if Warning or Critical (without duplicates in the same 15-min window)
        AnomalyAlert persistedAlert = null;
        if (severity != AnomalySeverity.NORMAL) {
            boolean recentExists = anomalyAlertRepository.existsByElectionAndObservationTimestampBetween(
                    election, now.minusMinutes(WINDOW_MINUTES), now);

            if (!recentExists) {
                try {
                    String metricsJson = objectMapper.writeValueAsString(featureVector.toMap());
                    AnomalyAlert alert = new AnomalyAlert(
                            election,
                            election.getArea(),
                            now,
                            anomalyScore,
                            severity,
                            AnomalyReviewStatus.PENDING_REVIEW,
                            IsolationForestModel.MODEL_VERSION,
                            primaryReason,
                            geminiExplanation,
                            metricsJson
                    );
                    persistedAlert = anomalyAlertRepository.save(alert);
                    log.info("Persisted new [{}] anomaly alert (score={}) for election {}",
                            severity, anomalyScore, election.getElectionCode());
                } catch (Exception e) {
                    log.error("Failed to serialize anomaly metrics to JSON: {}", e.getMessage());
                }
            } else {
                log.debug("Skipping duplicate anomaly alert persistence within active window for election {}",
                        election.getElectionCode());
            }
        }

        // 6. Assemble Evaluation DTO
        AnomalyEvaluationDto dto = new AnomalyEvaluationDto();
        if (persistedAlert != null) {
            dto.setId(persistedAlert.getId());
            dto.setAdminNotes(persistedAlert.getAdminNotes());
            dto.setReviewStatus(persistedAlert.getReviewStatus());
        } else {
            dto.setReviewStatus(AnomalyReviewStatus.PENDING_REVIEW);
        }

        dto.setElectionId(election.getId());
        dto.setElectionCode(election.getElectionCode());
        dto.setElectionName(election.getName());
        dto.setAreaName(election.getArea() != null ? election.getArea().getName() : "All Areas");
        dto.setObservationTimestamp(now);
        dto.setAnomalyScore(anomalyScore);
        dto.setSeverity(severity);
        dto.setModelVersion(IsolationForestModel.MODEL_VERSION);
        dto.setPrimaryReason(primaryReason);
        dto.setGeminiExplanation(geminiExplanation);
        dto.setContributingMetrics(contributingMetrics);
        dto.setFeatureVector(featureVector);

        return dto;
    }

    /**
     * Returns paginated anomaly alerts for administrative audit.
     */
    @Transactional(readOnly = true)
    public Page<AnomalyEvaluationDto> getAlerts(AnomalyReviewStatus statusFilter, Pageable pageable) {
        Page<AnomalyAlert> page;
        if (statusFilter != null) {
            page = anomalyAlertRepository.findByReviewStatusOrderByObservationTimestampDesc(statusFilter, pageable);
        } else {
            page = anomalyAlertRepository.findAllByOrderByObservationTimestampDesc(pageable);
        }
        return page.map(this::mapToDto);
    }

    /**
     * Updates administrative review status and notes on an anomaly alert.
     */
    @Transactional
    public AnomalyEvaluationDto reviewAlert(Long alertId, AnomalyReviewStatus newStatus, String adminNotes, String reviewerUsername) {
        AnomalyAlert alert = anomalyAlertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Anomaly alert not found with id: " + alertId));

        alert.setReviewStatus(newStatus);
        if (adminNotes != null && !adminNotes.trim().isEmpty()) {
            alert.setAdminNotes(adminNotes.trim());
        }
        alert.setReviewedBy(reviewerUsername);
        alert.setReviewedAt(LocalDateTime.now());

        AnomalyAlert saved = anomalyAlertRepository.save(alert);
        log.info("Administrator {} updated anomaly alert #{} to status {}", reviewerUsername, alertId, newStatus);
        return mapToDto(saved);
    }

    private AnomalyEvaluationDto mapToDto(AnomalyAlert alert) {
        AnomalyEvaluationDto dto = new AnomalyEvaluationDto();
        dto.setId(alert.getId());
        dto.setElectionId(alert.getElection().getId());
        dto.setElectionCode(alert.getElection().getElectionCode());
        dto.setElectionName(alert.getElection().getName());
        dto.setAreaName(alert.getArea() != null ? alert.getArea().getName() : "All Areas");
        dto.setObservationTimestamp(alert.getObservationTimestamp());
        dto.setAnomalyScore(alert.getAnomalyScore());
        dto.setSeverity(alert.getSeverity());
        dto.setReviewStatus(alert.getReviewStatus());
        dto.setModelVersion(alert.getModelVersion());
        dto.setPrimaryReason(alert.getPrimaryReason());
        dto.setGeminiExplanation(alert.getGeminiExplanation());
        dto.setAdminNotes(alert.getAdminNotes());
        dto.setReviewedBy(alert.getReviewedBy());
        dto.setReviewedAt(alert.getReviewedAt());

        if (alert.getContributingMetrics() != null) {
            try {
                Map<String, Object> map = objectMapper.readValue(alert.getContributingMetrics(), new TypeReference<>() {});
                Map<String, Double> doubles = new LinkedHashMap<>();
                map.forEach((k, v) -> {
                    if (v instanceof Number n) doubles.put(k, n.doubleValue());
                });
                dto.setContributingMetrics(doubles);
            } catch (Exception ignored) {}
        }

        return dto;
    }

    private double calculateBlockchainLatencySec() {
        List<BlockchainTransaction> pendingTxs = blockchainTransactionRepository.findByStatusIn(
                List.of(BlockchainStatus.PENDING, BlockchainStatus.SUBMITTED));
        if (pendingTxs.isEmpty()) {
            return 2.5; // Nominal fast dev node latency
        }

        LocalDateTime now = LocalDateTime.now();
        double maxAgeSec = 0.0;
        for (BlockchainTransaction tx : pendingTxs) {
            if (tx.getCreatedAt() != null) {
                double age = Duration.between(tx.getCreatedAt(), now).toSeconds();
                if (age > maxAgeSec) maxAgeSec = age;
            }
        }
        return Math.max(3.0, maxAgeSec);
    }

    private String formulateTechnicalReason(AnomalySeverity severity, AnomalyFeatureVector f, Map<String, Double> contrib) {
        if (severity == AnomalySeverity.NORMAL) {
            return "Operational telemetry within standard municipal baseline parameters (nominal voting speed, zero duplicate storm, low auth failure rate).";
        }

        List<String> signals = new ArrayList<>();
        if (f.getRejectedDuplicateAttempts() > 3) {
            signals.add(String.format("%.0f duplicate ballot attempts blocked by transactional constraints", f.getRejectedDuplicateAttempts()));
        }
        if (f.getAuthFailuresCount() > 5) {
            signals.add(String.format("%.0f authentication failures recorded in recent window", f.getAuthFailuresCount()));
        }
        if (f.getAcceptedBallotsPerMin() > 10.0) {
            signals.add(String.format("High voting velocity (%.2f ballots/min, +%.2f vs baseline)", f.getAcceptedBallotsPerMin(), f.getSpeedVsBaselineDiff()));
        }
        if (f.getPendingBlockchainTxCount() > 5 || f.getBlockchainLatencySec() > 60.0) {
            signals.add(String.format("Blockchain synchronization backlog (%.0f pending txs, %.1fs latency)", f.getPendingBlockchainTxCount(), f.getBlockchainLatencySec()));
        }
        if (f.getFailedSubmissionsCount() > 3) {
            signals.add(String.format("%.0f failed ballot submissions recorded", f.getFailedSubmissionsCount()));
        }

        if (signals.isEmpty()) {
            return "Subtle multi-dimensional deviation from standard operational baseline identified by Isolation Forest.";
        }

        return "Unusual operational activity detected: " + String.join("; ", signals) + ". Flagged for administrative investigation.";
    }

    private String generateGeminiExplanation(Election election, double score, AnomalySeverity severity,
                                             AnomalyFeatureVector f, String primaryReason) {
        if (!geminiClientService.isEnabled()) {
            return deterministicFallbackExplanation(severity, f, primaryReason);
        }

        try {
            String prompt = String.format("""
                You are an election systems telemetry auditor. An Isolation Forest anomaly model flagged an observation.
                Analyze the following verified aggregated operational metrics neutrally:
                - Election: %s
                - Anomaly Score: %.3f (Severity: %s)
                - Accepted Ballots/Min: %.2f (vs baseline diff: %.2f)
                - Blocked Duplicate Attempts: %.0f
                - Authentication Failures: %.0f
                - Failed Submissions: %.0f
                - Pending Blockchain Transactions: %.0f
                - Blockchain Latency: %.1f seconds
                - Model Diagnostics: %s

                Instructions:
                1. Provide a neutral 2-3 sentence technical explanation of why this pattern is unusual.
                2. State whether it could be a technical issue (e.g. voter retry loop, network latency) or operational burst.
                3. Recommend 1-2 concrete technical checks for the administrator.
                4. NEVER declare fraud or voter misconduct. Do NOT invent numbers. Keep output concise plain text.
                """,
                election.getName(), score, severity,
                f.getAcceptedBallotsPerMin(), f.getSpeedVsBaselineDiff(),
                f.getRejectedDuplicateAttempts(), f.getAuthFailuresCount(),
                f.getFailedSubmissionsCount(), f.getPendingBlockchainTxCount(),
                f.getBlockchainLatencySec(), primaryReason
            );

            Optional<String> textOpt = geminiClientService.generateContent(prompt, 512, 0.2);
            if (textOpt.isPresent() && !textOpt.get().trim().isEmpty()) {
                return textOpt.get().trim();
            }
        } catch (Exception e) {
            log.warn("Gemini anomaly explanation failed, using deterministic fallback: {}", e.getMessage());
        }

        return deterministicFallbackExplanation(severity, f, primaryReason);
    }

    private String deterministicFallbackExplanation(AnomalySeverity severity, AnomalyFeatureVector f, String reason) {
        StringBuilder sb = new StringBuilder();
        sb.append("Isolation Forest detected an operational pattern deviation (Severity: ").append(severity).append("). ");
        if (f.getRejectedDuplicateAttempts() > 0) {
            sb.append("Voters may be inadvertently resubmitting ballots due to network latency, or duplicate attempts were blocked by cryptographic database constraints. ");
        } else if (f.getPendingBlockchainTxCount() > 3 || f.getBlockchainLatencySec() > 30) {
            sb.append("The blockchain node or JSON-RPC provider is experiencing confirmation latency, resulting in an accumulator queue of unanchored ballot commitments. ");
        } else if (f.getAuthFailuresCount() > 5) {
            sb.append("Elevated login errors suggest either citizen credential confusion or automated retry requests. ");
        } else {
            sb.append("Voting velocity or submission rate exhibited a sudden spike relative to the historical baseline. ");
        }
        sb.append("Recommended Administrator Action: Verify node connectivity, inspect local audit logs, and confirm that official ballot persistence remains unaffected.");
        return sb.toString();
    }
}
