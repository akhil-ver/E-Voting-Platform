package com.sovereign.democracy.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sovereign.democracy.ai.dto.AreaTurnoutMetricDto;
import com.sovereign.democracy.ai.dto.ElectionInsightsDto;
import com.sovereign.democracy.ai.dto.PublicElectionInsightsDto;
import com.sovereign.democracy.entity.Area;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.enums.BlockchainStatus;
import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.exception.ResourceNotFoundException;
import com.sovereign.democracy.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ElectionInsightsService {

    private static final Logger log = LoggerFactory.getLogger(ElectionInsightsService.class);

    private static final int DEFAULT_WINDOW_MINUTES = 15;
    private static final double LOW_TURNOUT_THRESHOLD = 20.0;
    private static final double HIGH_TURNOUT_THRESHOLD = 60.0;

    private final ElectionRepository electionRepository;
    private final AreaRepository areaRepository;
    private final VoterRecordRepository voterRecordRepository;
    private final VoteParticipationRepository voteParticipationRepository;
    private final BlockchainTransactionRepository blockchainTransactionRepository;
    private final GeminiClientService geminiClientService;
    private final ObjectMapper objectMapper;

    public ElectionInsightsService(ElectionRepository electionRepository,
                                  AreaRepository areaRepository,
                                  VoterRecordRepository voterRecordRepository,
                                  VoteParticipationRepository voteParticipationRepository,
                                  BlockchainTransactionRepository blockchainTransactionRepository,
                                  GeminiClientService geminiClientService,
                                  ObjectMapper objectMapper) {
        this.electionRepository = electionRepository;
        this.areaRepository = areaRepository;
        this.voterRecordRepository = voterRecordRepository;
        this.voteParticipationRepository = voteParticipationRepository;
        this.blockchainTransactionRepository = blockchainTransactionRepository;
        this.geminiClientService = geminiClientService;
        this.objectMapper = objectMapper;
    }

    /**
     * Generates full administrative insights including operational metrics and grounded Gemini explanation.
     */
    @Transactional(readOnly = true)
    public ElectionInsightsDto getAdminInsights(Long electionId) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

        LocalDateTime now = LocalDateTime.now();
        List<AreaTurnoutMetricDto> areaMetrics = calculateAreaMetrics(election, now, DEFAULT_WINDOW_MINUTES);

        ElectionInsightsDto dto = new ElectionInsightsDto();
        dto.setElectionId(election.getId());
        dto.setElectionCode(election.getElectionCode());
        dto.setElectionName(election.getName());
        dto.setElectionStatus(election.getStatus().name());
        dto.setConstituencyName(election.getArea() != null ? election.getArea().getConstituencyName() : "");
        dto.setAreaMetrics(areaMetrics);

        // Aggregate election totals
        long totalEligible = areaMetrics.stream().mapToLong(AreaTurnoutMetricDto::getEligibleVoters).sum();
        long totalAccepted = areaMetrics.stream().mapToLong(AreaTurnoutMetricDto::getAcceptedVotes).sum();
        double overallTurnout = totalEligible > 0 ? (totalAccepted * 100.0) / totalEligible : 0.0;

        double overallSpeed = areaMetrics.stream().mapToDouble(AreaTurnoutMetricDto::getCurrentVotingSpeedPerMin).sum();
        double prevSpeed = areaMetrics.stream().mapToDouble(AreaTurnoutMetricDto::getPreviousVotingSpeedPerMin).sum();
        double speedChange = prevSpeed > 0 ? ((overallSpeed - prevSpeed) / prevSpeed) * 100.0 : (overallSpeed > 0 ? 100.0 : 0.0);

        dto.setTotalEligibleVoters(totalEligible);
        dto.setTotalAcceptedVotes(totalAccepted);
        dto.setOverallTurnoutPercentage(Math.round(overallTurnout * 10.0) / 10.0);
        dto.setOverallVotingSpeedPerMin(Math.round(overallSpeed * 100.0) / 100.0);
        dto.setOverallSpeedChangePercentage(Math.round(speedChange * 10.0) / 10.0);
        dto.setOverallParticipationTier(classifyParticipation(overallTurnout));

        // Operational stats for Admin
        long pendingTx = blockchainTransactionRepository.countByStatusIn(Arrays.asList(BlockchainStatus.PENDING, BlockchainStatus.SUBMITTED));
        long confirmedTx = blockchainTransactionRepository.countByStatusIn(Collections.singletonList(BlockchainStatus.CONFIRMED));
        long failedTx = blockchainTransactionRepository.countByStatusIn(Collections.singletonList(BlockchainStatus.FAILED));

        dto.setPendingBlockchainTransactions(pendingTx);
        dto.setConfirmedBlockchainTransactions(confirmedTx);
        dto.setFailedBlockchainTransactions(failedTx);
        dto.setBlockchainNodeStatus(pendingTx > 0 ? "SYNCHRONIZING" : "STABLE");
        dto.setMetricsCalculatedAt(now);

        // Build AI prompt strictly with non-sensitive aggregates
        generateAiInsights(dto, election);

        return dto;
    }

    /**
     * Generates safe public insights containing only approved aggregated statistics without operational or voter details.
     */
    @Transactional(readOnly = true)
    public PublicElectionInsightsDto getPublicInsights(Long electionId) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

        LocalDateTime now = LocalDateTime.now();
        List<AreaTurnoutMetricDto> areaMetrics = calculateAreaMetrics(election, now, DEFAULT_WINDOW_MINUTES);

        PublicElectionInsightsDto dto = new PublicElectionInsightsDto();
        dto.setElectionId(election.getId());
        dto.setElectionCode(election.getElectionCode());
        dto.setElectionName(election.getName());
        dto.setElectionStatus(election.getStatus().name());

        long totalEligible = areaMetrics.stream().mapToLong(AreaTurnoutMetricDto::getEligibleVoters).sum();
        long totalAccepted = areaMetrics.stream().mapToLong(AreaTurnoutMetricDto::getAcceptedVotes).sum();
        double overallTurnout = totalEligible > 0 ? (totalAccepted * 100.0) / totalEligible : 0.0;
        double overallSpeed = areaMetrics.stream().mapToDouble(AreaTurnoutMetricDto::getCurrentVotingSpeedPerMin).sum();

        dto.setTotalEligibleVoters(totalEligible);
        dto.setTotalAcceptedVotes(totalAccepted);
        dto.setOverallTurnoutPercentage(Math.round(overallTurnout * 10.0) / 10.0);
        dto.setOverallVotingSpeedPerMin(Math.round(overallSpeed * 100.0) / 100.0);
        dto.setOverallParticipationTier(classifyParticipation(overallTurnout));
        dto.setPublishedAt(now);

        double prevSpeed = areaMetrics.stream().mapToDouble(AreaTurnoutMetricDto::getPreviousVotingSpeedPerMin).sum();
        double speedChangePct = 0.0;
        String trend = "STABLE";
        if (prevSpeed > 0) {
            speedChangePct = ((overallSpeed - prevSpeed) / prevSpeed) * 100.0;
            if (speedChangePct > 10.0) trend = "INCREASING";
            else if (speedChangePct < -10.0) trend = "DECREASING";
            else trend = "STABLE";
        } else if (overallSpeed > 0) {
            trend = "INCREASING";
        }
        dto.setSpeedChangePercentage(Math.round(speedChangePct * 10.0) / 10.0);
        dto.setParticipationTrend(trend);

        List<PublicElectionInsightsDto.PublicAreaTurnoutDto> publicAreas = new ArrayList<>();
        for (AreaTurnoutMetricDto am : areaMetrics) {
            publicAreas.add(new PublicElectionInsightsDto.PublicAreaTurnoutDto(
                    am.getAreaName(),
                    am.getTurnoutPercentage(),
                    am.getParticipationTier()
            ));
        }
        dto.setAreaTurnouts(publicAreas);

        // Deterministic default summary
        String defaultSummary = String.format("As of %s, overall voter turnout in %s is %s%% with %d accepted ballots. Participation is currently classified as %s with a %s voting pace.",
                now.toLocalTime().withNano(0), election.getName(), dto.getOverallTurnoutPercentage(), totalAccepted, dto.getOverallParticipationTier(), trend.toLowerCase());
        dto.setPublicSummary(defaultSummary);

        // Grounded Gemini Neutral Summary
        if (geminiClientService.isEnabled()) {
            try {
                String prompt = String.format("""
                    You are a neutral election observer synthesizing public turnout for citizens.
                    Ground your response strictly in these verified metrics:
                    - Election: %s (Status: %s)
                    - Overall Turnout: %.1f%% (%d of %d eligible voters)
                    - Current Voting Speed: %.2f ballots/minute (Trend: %s)
                    - Participation Tier: %s

                    Instructions:
                    1. Write a 2-sentence neutral, non-partisan summary of civic voter participation.
                    2. Do NOT mention individual candidates, vote shares, or predict outcomes.
                    3. Do NOT invent official figures. Output plain text.
                    """,
                    election.getName(), election.getStatus(),
                    dto.getOverallTurnoutPercentage(), totalAccepted, totalEligible,
                    dto.getOverallVotingSpeedPerMin(), dto.getParticipationTrend(),
                    dto.getOverallParticipationTier()
                );
                Optional<String> textOpt = geminiClientService.generateContent(prompt);
                textOpt.filter(t -> !t.trim().isEmpty()).ifPresent(dto::setPublicSummary);
            } catch (Exception e) {
                log.warn("Gemini public summary failed, falling back to deterministic summary: {}", e.getMessage());
            }
        }

        List<String> observations = new ArrayList<>();
        observations.add(String.format("Current civic voting velocity is %.2f ballots per minute across polling areas (Trend: %s).", overallSpeed, trend));
        observations.add("Ballots are cryptographically anonymized and audited against local and blockchain ledgers.");
        dto.setGeneralObservations(observations);

        return dto;
    }

    private List<AreaTurnoutMetricDto> calculateAreaMetrics(Election election, LocalDateTime now, int windowMinutes) {
        List<AreaTurnoutMetricDto> metrics = new ArrayList<>();

        LocalDateTime windowStart = now.minusMinutes(windowMinutes);
        LocalDateTime prevWindowStart = windowStart.minusMinutes(windowMinutes);

        // 1. Primary election area
        Area primaryArea = election.getArea();
        if (primaryArea != null) {
            metrics.add(calculateSingleAreaMetric(election, primaryArea, windowStart, now, prevWindowStart, windowMinutes));
        }

        // 2. Additional configured demonstration areas for comparison if applicable
        List<Area> allAreas = areaRepository.findAll();
        for (Area area : allAreas) {
            if (primaryArea == null || !area.getId().equals(primaryArea.getId())) {
                long eligible = voterRecordRepository.countByArea(area);
                // In demo, other areas can have 0 votes for this specific municipal election
                metrics.add(new AreaTurnoutMetricDto(
                        area.getId(),
                        area.getName(),
                        area.getConstituencyName(),
                        eligible,
                        0L,
                        0.0,
                        windowMinutes,
                        0L,
                        0L,
                        0.0,
                        0.0,
                        0.0,
                        "LOW",
                        "Outside jurisdiction or no open ballot"
                ));
            }
        }

        return metrics;
    }

    private AreaTurnoutMetricDto calculateSingleAreaMetric(Election election, Area area,
                                                           LocalDateTime windowStart, LocalDateTime now,
                                                           LocalDateTime prevWindowStart, int windowMinutes) {
        long eligible = voterRecordRepository.countByArea(area);
        long accepted = voteParticipationRepository.countByElection(election);

        double turnout = eligible > 0 ? (accepted * 100.0) / eligible : 0.0;
        turnout = Math.round(turnout * 10.0) / 10.0;

        long currentWindowVotes = voteParticipationRepository.countByElectionAndVotedAtBetween(election, windowStart, now);
        long prevWindowVotes = voteParticipationRepository.countByElectionAndVotedAtBetween(election, prevWindowStart, windowStart);

        double currentSpeed = windowMinutes > 0 ? (double) currentWindowVotes / windowMinutes : 0.0;
        double prevSpeed = windowMinutes > 0 ? (double) prevWindowVotes / windowMinutes : 0.0;

        double speedChange = prevSpeed > 0
                ? ((currentSpeed - prevSpeed) / prevSpeed) * 100.0
                : (currentSpeed > 0 ? 100.0 : 0.0);

        String tier = classifyParticipation(turnout);

        String operationalStatus = "NORMAL";
        if (election.getStatus() == ElectionStatus.OPEN && eligible > 0 && accepted == 0) {
            operationalStatus = "AWAITING_FIRST_BALLOT";
        } else if (election.getStatus() == ElectionStatus.CLOSED || election.getStatus() == ElectionStatus.RESULT_DECLARED) {
            operationalStatus = "POLLS_CLOSED";
        } else if (currentSpeed == 0 && accepted > 0) {
            operationalStatus = "VOTING_PAUSED_OR_SLOW";
        }

        return new AreaTurnoutMetricDto(
                area.getId(),
                area.getName(),
                area.getConstituencyName(),
                eligible,
                accepted,
                turnout,
                windowMinutes,
                currentWindowVotes,
                prevWindowVotes,
                Math.round(currentSpeed * 100.0) / 100.0,
                Math.round(prevSpeed * 100.0) / 100.0,
                Math.round(speedChange * 10.0) / 10.0,
                tier,
                operationalStatus
        );
    }

    public static String classifyParticipation(double turnoutPercentage) {
        if (turnoutPercentage < LOW_TURNOUT_THRESHOLD) {
            return "LOW";
        } else if (turnoutPercentage <= HIGH_TURNOUT_THRESHOLD) {
            return "NORMAL";
        } else {
            return "HIGH";
        }
    }

    private void generateAiInsights(ElectionInsightsDto dto, Election election) {
        String prompt = buildPromptFromMetrics(dto);

        Optional<String> aiTextOpt = geminiClientService.generateContent(prompt, 1024, 0.2);

        if (aiTextOpt.isPresent()) {
            try {
                String raw = aiTextOpt.get();
                // Extract JSON if model wrapped it in markdown codeblocks
                if (raw.contains("```json")) {
                    raw = raw.substring(raw.indexOf("```json") + 7);
                    if (raw.contains("```")) {
                        raw = raw.substring(0, raw.lastIndexOf("```"));
                    }
                } else if (raw.contains("```")) {
                    raw = raw.substring(raw.indexOf("```") + 3);
                    if (raw.contains("```")) {
                        raw = raw.substring(0, raw.lastIndexOf("```"));
                    }
                }

                Map<String, Object> jsonMap = objectMapper.readValue(raw.trim(), new TypeReference<Map<String, Object>>() {});

                dto.setSummary((String) jsonMap.getOrDefault("summary", buildDeterministicSummary(dto)));
                dto.setObservations(toStringList(jsonMap.get("observations")));
                dto.setRecommendations(toStringList(jsonMap.get("recommendations")));
                dto.setLimitations(toStringList(jsonMap.get("limitations")));
                dto.setAiGenerated(true);
                dto.setModelUsed(geminiClientService.getConfiguredModel());
                dto.setAiGeneratedAt(LocalDateTime.now());
                return;
            } catch (Exception e) {
                log.warn("Failed to parse Gemini structured JSON response: {}. Falling back to deterministic summary.", e.getMessage());
            }
        }

        // Deterministic Fallback if AI is offline or response parsing failed
        applyDeterministicFallback(dto);
    }

    private String buildPromptFromMetrics(ElectionInsightsDto dto) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert election analytics assistant analyzing real-time civic participation metrics.\n");
        sb.append("STRICT SECURITY RULES:\n");
        sb.append("1. Base your summary entirely and strictly on the supplied figures below. Do NOT invent or assume numbers.\n");
        sb.append("2. Do NOT mention individual candidates, political parties, vote shares, or predict winners.\n");
        sb.append("3. Return ONLY a valid JSON object with the exact keys: 'summary', 'observations', 'recommendations', 'limitations'.\n\n");

        sb.append("ELECTION METRICS:\n");
        sb.append("Election: ").append(dto.getElectionName()).append(" (Status: ").append(dto.getElectionStatus()).append(")\n");
        sb.append("Overall Turnout: ").append(dto.getOverallTurnoutPercentage()).append("% (Total Accepted Ballots: ")
          .append(dto.getTotalAcceptedVotes()).append(" / ").append(dto.getTotalEligibleVoters()).append(" Eligible Voters)\n");
        sb.append("Overall Voting Speed: ").append(dto.getOverallVotingSpeedPerMin()).append(" ballots/min (Speed change: ")
          .append(dto.getOverallSpeedChangePercentage()).append("%)\n");
        sb.append("Participation Classification: ").append(dto.getOverallParticipationTier()).append("\n");
        sb.append("Blockchain Telemetry: Pending tx: ").append(dto.getPendingBlockchainTransactions())
          .append(", Confirmed tx: ").append(dto.getConfirmedBlockchainTransactions())
          .append(", Failed tx: ").append(dto.getFailedBlockchainTransactions()).append("\n\n");

        sb.append("AREA-WISE BREAKDOWN:\n");
        for (AreaTurnoutMetricDto area : dto.getAreaMetrics()) {
            if (area.getEligibleVoters() > 0) {
                sb.append("- ").append(area.getAreaName()).append(": Turnout ").append(area.getTurnoutPercentage())
                  .append("%, Speed ").append(area.getCurrentVotingSpeedPerMin()).append(" ballots/min, Tier: ")
                  .append(area.getParticipationTier()).append(", Status: ").append(area.getOperationalStatus()).append("\n");
            }
        }

        sb.append("\nReturn JSON format:\n");
        sb.append("{\n");
        sb.append("  \"summary\": \"short 2-sentence summary of turnout patterns\",\n");
        sb.append("  \"observations\": [\"observation 1\", \"observation 2\"],\n");
        sb.append("  \"recommendations\": [\"operational recommendation 1\"],\n");
        sb.append("  \"limitations\": [\"analytical limitation note\"]\n");
        sb.append("}");

        return sb.toString();
    }

    private void applyDeterministicFallback(ElectionInsightsDto dto) {
        dto.setSummary(buildDeterministicSummary(dto));

        List<String> obs = new ArrayList<>();
        obs.add(String.format("Recorded %d accepted ballots across %d eligible registered voters (Turnout: %.1f%%).",
                dto.getTotalAcceptedVotes(), dto.getTotalEligibleVoters(), dto.getOverallTurnoutPercentage()));
        obs.add(String.format("Voting velocity is currently %.2f ballots per minute (Tier: %s).",
                dto.getOverallVotingSpeedPerMin(), dto.getOverallParticipationTier()));
        if (dto.getPendingBlockchainTransactions() > 0) {
            obs.add(String.format("%d blockchain ballot commitment transactions are awaiting on-chain inclusion.",
                    dto.getPendingBlockchainTransactions()));
        }
        dto.setObservations(obs);

        List<String> recs = new ArrayList<>();
        if (dto.getPendingBlockchainTransactions() > 0) {
            recs.add("Trigger administrative blockchain reconciliation to clear pending commitment sync.");
        }
        if (dto.getOverallTurnoutPercentage() < LOW_TURNOUT_THRESHOLD && "OPEN".equalsIgnoreCase(dto.getElectionStatus())) {
            recs.add("Promote civic voter awareness in areas experiencing lower turnout.");
        } else {
            recs.add("Continue monitoring voting velocity across configured polling zones.");
        }
        dto.setRecommendations(recs);

        List<String> lims = new ArrayList<>();
        lims.add("Calculated from accepted voter participation timestamps over the last 15-minute sliding window.");
        lims.add("Deterministic fallback mode utilized (Gemini AI service offline, unconfigured, or rate-limited).");
        dto.setLimitations(lims);

        dto.setAiGenerated(false);
        dto.setModelUsed("Deterministic Rule-Based Engine (Fallback)");
        dto.setAiGeneratedAt(LocalDateTime.now());
    }

    private String buildDeterministicSummary(ElectionInsightsDto dto) {
        return String.format("Election '%s' is %s with an overall voter turnout of %.1f%% (%d of %d eligible voters). Civic participation velocity is currently at %.2f ballots/min with %s participation classification.",
                dto.getElectionName(), dto.getElectionStatus(), dto.getOverallTurnoutPercentage(),
                dto.getTotalAcceptedVotes(), dto.getTotalEligibleVoters(), dto.getOverallVotingSpeedPerMin(),
                dto.getOverallParticipationTier());
    }

    @SuppressWarnings("unchecked")
    private List<String> toStringList(Object obj) {
        if (obj instanceof List) {
            List<?> rawList = (List<?>) obj;
            List<String> res = new ArrayList<>();
            for (Object item : rawList) {
                if (item != null) {
                    res.add(item.toString());
                }
            }
            return res;
        }
        return Collections.emptyList();
    }
}
