package com.sovereign.democracy.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sovereign.democracy.ai.dto.AiElectionReportDto;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.entity.ElectionResult;
import com.sovereign.democracy.enums.BlockchainStatus;
import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.exception.BadRequestException;
import com.sovereign.democracy.exception.ResourceNotFoundException;
import com.sovereign.democracy.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AiElectionReportService {

    private static final Logger log = LoggerFactory.getLogger(AiElectionReportService.class);

    private final ElectionRepository electionRepository;
    private final ElectionResultRepository electionResultRepository;
    private final VoteParticipationRepository voteParticipationRepository;
    private final VoterRecordRepository voterRecordRepository;
    private final BlockchainTransactionRepository blockchainTransactionRepository;
    private final GeminiClientService geminiClientService;
    private final ObjectMapper objectMapper;

    public AiElectionReportService(ElectionRepository electionRepository,
                                  ElectionResultRepository electionResultRepository,
                                  VoteParticipationRepository voteParticipationRepository,
                                  VoterRecordRepository voterRecordRepository,
                                  BlockchainTransactionRepository blockchainTransactionRepository,
                                  GeminiClientService geminiClientService,
                                  ObjectMapper objectMapper) {
        this.electionRepository = electionRepository;
        this.electionResultRepository = electionResultRepository;
        this.voteParticipationRepository = voteParticipationRepository;
        this.voterRecordRepository = voterRecordRepository;
        this.blockchainTransactionRepository = blockchainTransactionRepository;
        this.geminiClientService = geminiClientService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public AiElectionReportDto generatePostElectionReport(Long electionId) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

        if (election.getStatus() != ElectionStatus.RESULT_DECLARED) {
            throw new BadRequestException("An AI Post-Election Report can only be compiled after results are officially declared. Current status: " + election.getStatus());
        }

        List<ElectionResult> results = electionResultRepository.findByElectionOrderByVoteCountDesc(election);
        if (results.isEmpty()) {
            throw new BadRequestException("No declared results found for election id: " + electionId);
        }

        ElectionResult winner = results.get(0);
        long totalBallots = results.stream().mapToLong(ElectionResult::getVoteCount).sum();
        long eligibleVoters = election.getArea() != null ? voterRecordRepository.countByArea(election.getArea()) : 0;
        double turnout = eligibleVoters > 0 ? (totalBallots * 100.0) / eligibleVoters : 0.0;

        AiElectionReportDto dto = new AiElectionReportDto();
        dto.setElectionId(election.getId());
        dto.setElectionCode(election.getElectionCode());
        dto.setElectionName(election.getName());
        dto.setElectionStatus(election.getStatus().name());
        dto.setClosureTimestamp(election.getClosureTimestamp());

        // Official Facts
        dto.setTotalAcceptedBallots(totalBallots);
        dto.setTotalEligibleVoters(eligibleVoters);
        dto.setFinalTurnoutPercentage(Math.round(turnout * 10.0) / 10.0);
        dto.setWinnerName(winner.getCandidate().getFullName());
        dto.setWinnerParty(winner.getCandidate().getPartyName());
        dto.setWinningPercentage(winner.getVotePercentage() != null ? winner.getVotePercentage().doubleValue() : 0.0);

        // Blockchain status
        dto.setOnChainTallyHash(election.getTallyHash());
        dto.setOnChainTallyTxHash(election.getTallyTxHash());
        dto.setOnChainTallyVerified(election.getTallyTxHash() != null && !election.getTallyTxHash().trim().isEmpty());
        long confirmedTx = blockchainTransactionRepository.countByStatusIn(Collections.singletonList(BlockchainStatus.CONFIRMED));
        dto.setTotalOnChainBallots(confirmedTx);

        dto.setGeneratedAt(LocalDateTime.now());
        dto.setDisclaimer("This executive overview was compiled using verified election data and assisted by Google Gemini AI. Official database figures and on-chain tally commitments represent the certified legal source of truth.");

        // Generate AI analysis
        generateAiSummary(dto, election, results);

        return dto;
    }

    private void generateAiSummary(AiElectionReportDto dto, Election election, List<ElectionResult> results) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an official civic election post-audit analyst. Summarize this concluded election:\n");
        prompt.append("VERIFIED OFFICIAL RESULTS:\n");
        prompt.append("Election: ").append(dto.getElectionName()).append(" (Code: ").append(dto.getElectionCode()).append(")\n");
        prompt.append("Area: ").append(election.getArea() != null ? election.getArea().getName() : "General").append("\n");
        prompt.append("Total Accepted Ballots: ").append(dto.getTotalAcceptedBallots()).append(" of ")
              .append(dto.getTotalEligibleVoters()).append(" Eligible Voters (Turnout: ")
              .append(dto.getFinalTurnoutPercentage()).append("%)\n");
        prompt.append("Certified Winner: ").append(dto.getWinnerName()).append(" (")
              .append(dto.getWinnerParty()).append(") with ")
              .append(dto.getWinningPercentage()).append("% of the certified vote.\n");
        prompt.append("Blockchain Audit: On-Chain Tally Hash: ").append(dto.getOnChainTallyHash())
              .append(", Tx Hash: ").append(dto.getOnChainTallyTxHash()).append("\n\n");

        prompt.append("CANDIDATE ROSTER TALLY:\n");
        for (ElectionResult r : results) {
            prompt.append("- ").append(r.getCandidate().getFullName()).append(" (").append(r.getCandidate().getPartyName())
                  .append("): ").append(r.getVoteCount()).append(" votes (").append(r.getVotePercentage()).append("%)\n");
        }

        prompt.append("\nReturn ONLY valid JSON in format:\n");
        prompt.append("{\n");
        prompt.append("  \"executiveSummary\": \"2-3 sentence neutral overview of certified election outcome\",\n");
        prompt.append("  \"keyHighlights\": [\"point 1\", \"point 2\"],\n");
        prompt.append("  \"areaParticipationAnalysis\": [\"turnout note 1\"],\n");
        prompt.append("  \"auditAndIntegrityNotes\": [\"blockchain and receipt verification note\"]\n");
        prompt.append("}");

        Optional<String> aiRes = geminiClientService.generateContent(prompt.toString(), 1000, 0.2);

        if (aiRes.isPresent()) {
            try {
                String raw = aiRes.get().trim();
                if (raw.contains("```json")) {
                    raw = raw.substring(raw.indexOf("```json") + 7);
                    if (raw.contains("```")) raw = raw.substring(0, raw.lastIndexOf("```"));
                } else if (raw.contains("```")) {
                    raw = raw.substring(raw.indexOf("```") + 3);
                    if (raw.contains("```")) raw = raw.substring(0, raw.lastIndexOf("```"));
                }

                Map<String, Object> map = objectMapper.readValue(raw.trim(), new TypeReference<Map<String, Object>>() {});
                dto.setExecutiveSummary((String) map.getOrDefault("executiveSummary", buildFallbackExecutiveSummary(dto)));
                dto.setKeyHighlights(toStringList(map.get("keyHighlights")));
                dto.setAreaParticipationAnalysis(toStringList(map.get("areaParticipationAnalysis")));
                dto.setAuditAndIntegrityNotes(toStringList(map.get("auditAndIntegrityNotes")));
                return;
            } catch (Exception e) {
                log.warn("Failed to parse AI post-election report response: {}", e.getMessage());
            }
        }

        // Fallback
        dto.setExecutiveSummary(buildFallbackExecutiveSummary(dto));
        dto.setKeyHighlights(Arrays.asList(
                String.format("Certified victor: %s (%s) securing %.1f%% of cast ballots.",
                        dto.getWinnerName(), dto.getWinnerParty(), dto.getWinningPercentage()),
                String.format("Total civic participation reached %d accepted votes (%.1f%% turnout).",
                        dto.getTotalAcceptedBallots(), dto.getFinalTurnoutPercentage())
        ));
        dto.setAreaParticipationAnalysis(Collections.singletonList(
                String.format("Area %s recorded %d ballots across %d authorized voter records.",
                        election.getArea() != null ? election.getArea().getName() : "General",
                        dto.getTotalAcceptedBallots(), dto.getTotalEligibleVoters())
        ));
        dto.setAuditAndIntegrityNotes(Arrays.asList(
                dto.isOnChainTallyVerified()
                        ? "Certified tally commitment anchored and verified on Ethereum / Besu blockchain."
                        : "Ballot records certified in relational database; blockchain audit confirmation pending."
        ));
    }

    private String buildFallbackExecutiveSummary(AiElectionReportDto dto) {
        return String.format("The official results for '%s' have been certified. %s of the %s party emerged as the winner with %.1f%% of valid votes cast. Overall citizen turnout reached %.1f%% with %d accepted ballots.",
                dto.getElectionName(), dto.getWinnerName(), dto.getWinnerParty(), dto.getWinningPercentage(),
                dto.getFinalTurnoutPercentage(), dto.getTotalAcceptedBallots());
    }

    @SuppressWarnings("unchecked")
    private List<String> toStringList(Object obj) {
        if (obj instanceof List) {
            List<?> rawList = (List<?>) obj;
            List<String> res = new ArrayList<>();
            for (Object item : rawList) {
                if (item != null) res.add(item.toString());
            }
            return res;
        }
        return Collections.emptyList();
    }
}
