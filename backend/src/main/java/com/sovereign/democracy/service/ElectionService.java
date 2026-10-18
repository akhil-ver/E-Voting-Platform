package com.sovereign.democracy.service;

import com.sovereign.democracy.dto.ElectionDto;
import com.sovereign.democracy.dto.ElectionResultDto;
import com.sovereign.democracy.entity.Area;
import com.sovereign.democracy.entity.Candidate;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.entity.ElectionResult;
import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.exception.BadRequestException;
import com.sovereign.democracy.exception.ResourceNotFoundException;
import com.sovereign.democracy.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ElectionService {

    private final ElectionRepository electionRepository;
    private final AreaRepository areaRepository;
    private final CandidateRepository candidateRepository;
    private final VoterRecordRepository voterRecordRepository;
    private final VoteParticipationRepository voteParticipationRepository;
    private final BallotRecordRepository ballotRecordRepository;
    private final VoteReceiptRepository voteReceiptRepository;
    private final ElectionResultRepository electionResultRepository;
    private final AuditLogService auditLogService;
    private final BlockchainService blockchainService;

    public ElectionService(ElectionRepository electionRepository,
                           AreaRepository areaRepository,
                           CandidateRepository candidateRepository,
                           VoterRecordRepository voterRecordRepository,
                           VoteParticipationRepository voteParticipationRepository,
                           BallotRecordRepository ballotRecordRepository,
                           VoteReceiptRepository voteReceiptRepository,
                           ElectionResultRepository electionResultRepository,
                           AuditLogService auditLogService,
                           BlockchainService blockchainService) {
        this.electionRepository = electionRepository;
        this.areaRepository = areaRepository;
        this.candidateRepository = candidateRepository;
        this.voterRecordRepository = voterRecordRepository;
        this.voteParticipationRepository = voteParticipationRepository;
        this.ballotRecordRepository = ballotRecordRepository;
        this.voteReceiptRepository = voteReceiptRepository;
        this.electionResultRepository = electionResultRepository;
        this.auditLogService = auditLogService;
        this.blockchainService = blockchainService;
    }

    @Transactional(readOnly = true)
    public List<ElectionDto> getAllElections() {
        return electionRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ElectionDto> getElectionsByArea(Long areaId) {
        return electionRepository.findByAreaId(areaId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ElectionDto getElectionById(Long id) {
        Election election = electionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + id));
        return mapToDto(election);
    }

    @Transactional
    public ElectionDto createElection(String electionCode, String name, String electionType,
                                      Long areaId, LocalDateTime startTime, LocalDateTime endTime,
                                      String adminUsername, String clientIp) {
        if (electionCode == null || electionCode.trim().isEmpty()) {
            throw new BadRequestException("Election code is required");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new BadRequestException("Election name is required");
        }
        if (areaId == null) {
            throw new BadRequestException("Area ID is required");
        }
        if (startTime == null || endTime == null || !endTime.isAfter(startTime)) {
            throw new BadRequestException("Valid start time and end time (after start time) are required");
        }

        if (electionRepository.findByElectionCodeIgnoreCase(electionCode.trim()).isPresent()) {
            throw new BadRequestException("An election with code '" + electionCode.trim() + "' already exists");
        }

        Area area = areaRepository.findById(areaId)
                .orElseThrow(() -> new ResourceNotFoundException("Area not found with id: " + areaId));

        Election election = new Election(
                electionCode.trim().toUpperCase(),
                name.trim(),
                electionType != null ? electionType.trim() : area.getElectionType(),
                area,
                startTime,
                endTime
        );

        Election saved = electionRepository.save(election);

        auditLogService.logAction(
                "ELECTION_CREATED",
                "Election",
                saved.getId().toString(),
                adminUsername,
                "Created election " + saved.getName() + " for area " + area.getName(),
                clientIp
        );

        return mapToDto(saved);
    }

    /**
     * Requirement 6: Missing Candidate Validation
     * Before opening an election, verify that the candidate list has been configured for that election.
     * At least 2 contesting candidates are required to open a democratic election.
     */
    @Transactional
    public ElectionDto openElection(Long electionId, String adminUsername, String clientIp) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

        if (election.getStatus() == ElectionStatus.OPEN) {
            throw new BadRequestException("Election is already OPEN");
        }
        if (election.getStatus() == ElectionStatus.CLOSED || election.getStatus() == ElectionStatus.RESULT_DECLARED) {
            throw new BadRequestException("Cannot reopen a closed or declared election");
        }

        // Validate candidate roster
        long candidateCount = candidateRepository.countByElectionId(electionId);
        if (candidateCount < 2) {
            throw new BadRequestException("Missing candidate configuration: At least 2 candidates must be registered before opening an election. Found: " + candidateCount);
        }

        election.setStatus(ElectionStatus.OPEN);
        Election updated = electionRepository.save(election);

        auditLogService.logAction(
                "ELECTION_OPENED",
                "Election",
                updated.getId().toString(),
                adminUsername,
                "Opened election polls for " + updated.getName() + " with " + candidateCount + " locked candidates",
                clientIp
        );

        return mapToDto(updated);
    }

    @Transactional
    public ElectionDto closeElection(Long electionId, String adminUsername, String clientIp) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

        if (election.getStatus() != ElectionStatus.OPEN) {
            throw new BadRequestException("Only an OPEN election can be closed. Current status: " + election.getStatus());
        }

        election.setStatus(ElectionStatus.CLOSED);
        election.setClosureTimestamp(LocalDateTime.now());
        Election updated = electionRepository.save(election);

        auditLogService.logAction(
                "ELECTION_CLOSED",
                "Election",
                updated.getId().toString(),
                adminUsername,
                "Closed election polls for " + updated.getName() + ". Total ballots cast: " + ballotRecordRepository.countByElection(updated),
                clientIp
        );

        return mapToDto(updated);
    }

    /**
     * Requirement 4: Election-Wise Results
     * After the election is closed and the result is officially declared,
     * display each candidate's total votes, party name, party symbol, and final result.
     */
    @Transactional
    public List<ElectionResultDto> tallyAndDeclareResults(Long electionId, String adminUsername, String clientIp) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

        if (election.getStatus() != ElectionStatus.CLOSED && election.getStatus() != ElectionStatus.TALLYING) {
            throw new BadRequestException("Election must be CLOSED before results can be tallied and declared. Current status: " + election.getStatus());
        }

        // Fetch all candidates for this election
        List<Candidate> candidates = candidateRepository.findByElectionId(electionId);
        if (candidates.isEmpty()) {
            throw new BadRequestException("No candidates found for this election to tally");
        }

        // Clean any existing results for idempotent declaration
        electionResultRepository.deleteByElection(election);

        long totalBallots = ballotRecordRepository.countByElection(election);

        // Count votes per candidate from anonymized ballot_records
        List<ElectionResult> resultsToSave = new ArrayList<>();
        long maxVotes = -1;

        for (Candidate c : candidates) {
            long count = ballotRecordRepository.countByElectionAndCandidate(election, c);
            if (count > maxVotes) {
                maxVotes = count;
            }

            BigDecimal percentage = BigDecimal.ZERO;
            if (totalBallots > 0) {
                percentage = BigDecimal.valueOf(count)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(totalBallots), 2, RoundingMode.HALF_UP);
            }

            ElectionResult result = new ElectionResult(election, c, count, percentage, adminUsername);
            resultsToSave.add(result);
        }

        List<ElectionResult> savedResults = electionResultRepository.saveAll(resultsToSave);

        // Publish tally commitment on-chain
        StringBuilder sb = new StringBuilder("ELECTION:" + election.getId() + ":TALLY:");
        for (ElectionResult r : savedResults) {
            sb.append(r.getCandidate().getId()).append("=").append(r.getVoteCount()).append(";");
        }
        String tallyHash = sha256(sb.toString());
        String txHash = blockchainService.publishTallyOnChain(election, tallyHash, totalBallots, "/api/elections/" + election.getId() + "/results");
        if (txHash != null) {
            election.setTallyTxHash(txHash);
            election.setTallyHash(tallyHash);
        }

        election.setStatus(ElectionStatus.RESULT_DECLARED);
        electionRepository.save(election);

        auditLogService.logAction(
                "RESULTS_DECLARED",
                "Election",
                election.getId().toString(),
                adminUsername,
                "Officially declared election results for " + election.getName() + ". Total tally: " + totalBallots,
                clientIp
        );

        final long highestVotes = maxVotes;
        return savedResults.stream()
                .map(r -> new ElectionResultDto(
                        r.getId(),
                        r.getCandidate().getId(),
                        r.getCandidate().getCandidateCode(),
                        r.getCandidate().getFullName(),
                        r.getCandidate().getPartyName(),
                        r.getCandidate().getPartySymbol(),
                        r.getCandidate().getSymbolImageUrl(),
                        r.getVoteCount(),
                        r.getVotePercentage(),
                        totalBallots > 0 && r.getVoteCount() == highestVotes,
                        r.getPublishedAt(),
                        r.getDeclaredByUsername(),
                        election.getId(),
                        election.getElectionCode(),
                        election.getName(),
                        election.getArea().getName(),
                        election.getArea().getConstituencyName(),
                        totalBallots
                ))
                .sorted((a, b) -> Long.compare(b.getVoteCount(), a.getVoteCount()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ElectionResultDto> getResults(Long electionId) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

        if (election.getStatus() != ElectionStatus.RESULT_DECLARED) {
            throw new BadRequestException("Election results have not been officially declared yet. Status: " + election.getStatus());
        }

        List<ElectionResult> results = electionResultRepository.findByElectionIdOrderByVoteCountDesc(electionId);
        long maxVotes = results.stream().mapToLong(ElectionResult::getVoteCount).max().orElse(0L);
        long totalValidVotes = results.stream().mapToLong(ElectionResult::getVoteCount).sum();

        return results.stream()
                .map(r -> new ElectionResultDto(
                        r.getId(),
                        r.getCandidate().getId(),
                        r.getCandidate().getCandidateCode(),
                        r.getCandidate().getFullName(),
                        r.getCandidate().getPartyName(),
                        r.getCandidate().getPartySymbol(),
                        r.getCandidate().getSymbolImageUrl(),
                        r.getVoteCount(),
                        r.getVotePercentage(),
                        maxVotes > 0 && r.getVoteCount() == maxVotes,
                        r.getPublishedAt(),
                        r.getDeclaredByUsername(),
                        election.getId(),
                        election.getElectionCode(),
                        election.getName(),
                        election.getArea().getName(),
                        election.getArea().getConstituencyName(),
                        totalValidVotes
                ))
                .collect(Collectors.toList());
    }

    /**
     * Requirement: Clear Results / Reset Polls
     * Allows administrator to wipe results, ballots, receipts, and participation records,
     * resetting election status back to OPEN for re-running.
     */
    @Transactional
    public ElectionDto clearResultsAndReset(Long electionId, String adminUsername, String clientIp) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

        // Delete all election results, ballot records, vote receipts, and voter participations for this election
        electionResultRepository.deleteByElection(election);
        voteReceiptRepository.deleteByElection(election);
        ballotRecordRepository.deleteByElection(election);
        voteParticipationRepository.deleteByElection(election);

        // Reset election status to OPEN and clear closure timestamp so voting can resume fresh
        election.setStatus(ElectionStatus.OPEN);
        election.setClosureTimestamp(null);
        Election updated = electionRepository.save(election);

        auditLogService.logAction(
                "ELECTION_RESULTS_CLEARED",
                "Election",
                updated.getId().toString(),
                adminUsername,
                "Cleared results and reset polls to OPEN for election " + updated.getName(),
                clientIp
        );

        return mapToDto(updated);
    }

    private ElectionDto mapToDto(Election election) {
        long candidateCount = candidateRepository.countByElectionId(election.getId());
        long totalEligibleVoters = voterRecordRepository.countByArea(election.getArea());
        long votesCast = voteParticipationRepository.countByElectionId(election.getId());

        return new ElectionDto(
                election.getId(),
                election.getElectionCode(),
                election.getName(),
                election.getElectionType(),
                election.getArea().getId(),
                election.getArea().getName(),
                election.getArea().getAreaCode(),
                election.getArea().getConstituencyName(),
                election.getStartTime(),
                election.getEndTime(),
                election.getStatus(),
                election.getClosureTimestamp(),
                candidateCount,
                totalEligibleVoters,
                votesCast
        );
    }

    private String sha256(String input) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(encodedhash);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 unavailable", e);
        }
    }
}
