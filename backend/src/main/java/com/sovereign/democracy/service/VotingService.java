package com.sovereign.democracy.service;

import com.sovereign.democracy.dto.ElectionResultDto;
import com.sovereign.democracy.dto.VoteReceiptDto;
import com.sovereign.democracy.entity.*;
import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.enums.ReceiptStatus;
import com.sovereign.democracy.exception.BadRequestException;
import com.sovereign.democracy.exception.ResourceNotFoundException;
import com.sovereign.democracy.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VotingService {

    private final UserAccountRepository userAccountRepository;
    private final ElectionRepository electionRepository;
    private final CandidateRepository candidateRepository;
    private final VoteParticipationRepository voteParticipationRepository;
    private final BallotRecordRepository ballotRecordRepository;
    private final VoteReceiptRepository voteReceiptRepository;
    private final ElectionResultRepository electionResultRepository;
    private final AuditLogService auditLogService;
    private final SecretVotingKeyService secretVotingKeyService;
    private final BlockchainService blockchainService;
    private final BlockchainTransactionRepository blockchainTransactionRepository;

    public VotingService(UserAccountRepository userAccountRepository,
                         ElectionRepository electionRepository,
                         CandidateRepository candidateRepository,
                         VoteParticipationRepository voteParticipationRepository,
                         BallotRecordRepository ballotRecordRepository,
                         VoteReceiptRepository voteReceiptRepository,
                         ElectionResultRepository electionResultRepository,
                         AuditLogService auditLogService,
                         SecretVotingKeyService secretVotingKeyService,
                         BlockchainService blockchainService,
                         BlockchainTransactionRepository blockchainTransactionRepository) {
        this.userAccountRepository = userAccountRepository;
        this.electionRepository = electionRepository;
        this.candidateRepository = candidateRepository;
        this.voteParticipationRepository = voteParticipationRepository;
        this.ballotRecordRepository = ballotRecordRepository;
        this.voteReceiptRepository = voteReceiptRepository;
        this.electionResultRepository = electionResultRepository;
        this.auditLogService = auditLogService;
        this.secretVotingKeyService = secretVotingKeyService;
        this.blockchainService = blockchainService;
        this.blockchainTransactionRepository = blockchainTransactionRepository;
    }

    @Transactional
    public VoteReceiptDto castBallot(String username, Long electionId, Long candidateId, String clientIp) {
        return castBallot(username, electionId, candidateId, null, clientIp);
    }

    @Transactional
    public VoteReceiptDto castBallot(String username, Long electionId, Long candidateId, String secretVotingKey, String clientIp) {
        UserAccount user = userAccountRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found: " + username));

        VoterRecord voter = user.getVoterRecord();
        if (voter == null || !voter.isEligible()) {
            throw new BadRequestException("Citizen is not eligible to vote");
        }

        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

        // 1. Election status check: Polls must be OPEN
        if (election.getStatus() != ElectionStatus.OPEN) {
            throw new BadRequestException("Voting is not open for this election. Status: " + election.getStatus());
        }

        // 2. Area constituency check: Voter must reside in this election's area
        if (!voter.getArea().getId().equals(election.getArea().getId())) {
            throw new BadRequestException("Constituency Mismatch: You are enrolled in " +
                    voter.getArea().getName() + " and cannot cast a ballot in " + election.getArea().getName());
        }

        // 3. Duplicate Prevention Check
        if (voteParticipationRepository.existsByElectionAndVoterRecord(election, voter)) {
            auditLogService.logAction(
                    username,
                    "USER",
                    "DUPLICATE_VOTE_BLOCKED",
                    "Election:" + election.getElectionCode(),
                    "Duplicate ballot submission attempt blocked for voter " + voter.getVoterId(),
                    clientIp
            );
            throw new BadRequestException("Duplicate vote rejected: You have already cast your ballot in this election.");
        }

        // 3b. Validate and Atomically Consume Secret Voting Key
        secretVotingKeyService.validateAndConsumeKey(voter, election, secretVotingKey);

        // 4. Validate Candidate
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found with id: " + candidateId));

        if (!candidate.getElection().getId().equals(election.getId())) {
            throw new BadRequestException("Candidate does not contest in this election");
        }

        // 5. Cryptographically Anonymize Ballot into Ballot Vault
        String entropy = UUID.randomUUID().toString();
        String ballotHash = sha256(election.getId() + ":" + candidate.getId() + ":" + entropy);
        BallotRecord ballotRecord = new BallotRecord(election, candidate, ballotHash);
        ballotRecordRepository.save(ballotRecord);

        // 6. Issue Cryptographic Receipt Token (Derived from the cryptographic ballot hash)
        String receiptCode = "RCP-" + ballotHash.substring(0, 16).toUpperCase();
        VoteReceipt receipt = new VoteReceipt(receiptCode, election, ReceiptStatus.COUNTED);
        VoteReceipt savedReceipt = voteReceiptRepository.save(receipt);

        // 7. Enforce Participation (Tracks that voter voted; ZERO candidate reference; retains their receipt token)
        VoteParticipation participation = new VoteParticipation(election, voter, receiptCode, ballotHash);
        voteParticipationRepository.save(participation);

        // 7b. Submit anonymous ballot commitment to blockchain audit vault
        BlockchainTransaction btx = blockchainService.recordBallotCommitment(election, ballotHash, receiptCode);
        if (btx != null && btx.getTxHash() != null) {
            savedReceipt.setBlockchainTxHash(btx.getTxHash());
            savedReceipt.setBlockchainStatus(btx.getStatus());
            savedReceipt.setBlockNumber(btx.getBlockNumber());
            savedReceipt.setBallotCommitment(btx.getBallotCommitment());
            savedReceipt.setNullifierHash(btx.getNullifierHash());
            voteReceiptRepository.save(savedReceipt);
        }

        // 8. Audit Log without choice leakage
        auditLogService.logAction(
                "BALLOT_CAST",
                "Election",
                election.getId().toString(),
                username,
                "Ballot successfully cast and receipt issued for election " + election.getElectionCode(),
                clientIp
        );

        boolean isDeclared = election.getStatus() == ElectionStatus.RESULT_DECLARED;
        String inclusionStatus = isDeclared
                ? "COUNTED IN CERTIFIED TALLY"
                : "STILL COUNTING — RESULT NOT DECLARED";

        VoteReceiptDto dto = new VoteReceiptDto(
                savedReceipt.getReceiptCode(),
                election.getId(),
                election.getElectionCode(),
                election.getName(),
                election.getArea().getName(),
                election.getArea().getConstituencyName(),
                election.getStatus(),
                isDeclared,
                inclusionStatus,
                savedReceipt.getStatus(),
                savedReceipt.getIssuedAt(),
                true,
                null,
                null,
                null,
                null
        );
        dto.setVoteHash(ballotHash);
        blockchainService.enrichWithBlockchainVerification(dto, savedReceipt);
        return dto;
    }

    @Transactional(readOnly = true)
    public boolean hasUserVoted(String username, Long electionId) {
        UserAccount user = userAccountRepository.findByUsernameIgnoreCase(username).orElse(null);
        if (user == null || user.getVoterRecord() == null) return false;

        Election election = electionRepository.findById(electionId).orElse(null);
        if (election == null) return false;

        return voteParticipationRepository.existsByElectionAndVoterRecord(election, user.getVoterRecord());
    }

    @Transactional
    public VoteReceiptDto getMyReceipt(String username, Long electionId) {
        UserAccount user = userAccountRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        if (user.getVoterRecord() == null) {
            throw new BadRequestException("No voter record associated with user");
        }
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

        VoteParticipation participation = voteParticipationRepository.findByElectionAndVoterRecord(election, user.getVoterRecord())
                .orElseThrow(() -> new ResourceNotFoundException("No ballot cast by user in election " + election.getElectionCode()));

        return buildDtoForParticipation(participation);
    }

    @Transactional
    public List<VoteReceiptDto> getMyReceipts(String username) {
        UserAccount user = userAccountRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        if (user.getVoterRecord() == null) {
            return List.of();
        }

        List<VoteParticipation> participations = voteParticipationRepository.findByVoterRecord(user.getVoterRecord());
        return participations.stream()
                .map(this::buildDtoForParticipation)
                .collect(Collectors.toList());
    }

    private VoteReceiptDto buildDtoForParticipation(VoteParticipation participation) {
        Election election = participation.getElection();
        String receiptCode = participation.getReceiptCode();
        String voteHash = participation.getVoteHash();

        if (receiptCode == null && voteHash != null) {
            receiptCode = "RCP-" + voteHash.substring(0, Math.min(16, voteHash.length())).toUpperCase();
        } else if (receiptCode == null) {
            receiptCode = voteReceiptRepository.findByElection(election).stream()
                    .filter(r -> Math.abs(java.time.Duration.between(r.getIssuedAt(), participation.getVotedAt()).getSeconds()) <= 15)
                    .map(VoteReceipt::getReceiptCode)
                    .findFirst()
                    .orElse("RCP-" + sha256(election.getId() + ":" + participation.getId()).substring(0, 16).toUpperCase());
        }

        if (voteHash == null && receiptCode != null && receiptCode.startsWith("RCP-")) {
            String prefix = receiptCode.substring(4).toLowerCase();
            voteHash = ballotRecordRepository.findByElectionId(election.getId()).stream()
                    .map(BallotRecord::getBallotHash)
                    .filter(h -> h.toLowerCase().startsWith(prefix))
                    .findFirst()
                    .orElse(null);
        }

        boolean isDeclared = election.getStatus() == ElectionStatus.RESULT_DECLARED;
        String inclusionStatus = isDeclared
                ? "COUNTED IN CERTIFIED TALLY"
                : "STILL COUNTING — RESULT NOT DECLARED";

        VoteReceiptDto dto = new VoteReceiptDto(
                receiptCode,
                election.getId(),
                election.getElectionCode(),
                election.getName(),
                election.getArea().getName(),
                election.getArea().getConstituencyName(),
                election.getStatus(),
                isDeclared,
                inclusionStatus,
                ReceiptStatus.COUNTED,
                participation.getVotedAt(),
                true,
                null,
                null,
                null,
                null
        );
        dto.setVoteHash(voteHash);
        voteReceiptRepository.findFirstByReceiptCodeOrderByIdDesc(receiptCode).ifPresent(vr ->
                blockchainService.enrichWithBlockchainVerification(dto, vr)
        );
        return dto;
    }

    @Transactional
    public VoteReceiptDto verifyReceipt(String receiptCodeOrHash) {
        if (receiptCodeOrHash == null || receiptCodeOrHash.trim().isEmpty()) {
            throw new BadRequestException("Receipt code or cryptographic vote hash is required");
        }

        String raw = receiptCodeOrHash.trim();
        String clean = raw.startsWith("0x") || raw.startsWith("0X") ? raw.substring(2) : raw;

        Election election;
        ReceiptStatus status;
        LocalDateTime issuedAt;
        String resolvedReceiptCode;
        String resolvedVoteHash = null;

        Optional<VoteReceipt> receiptOpt = voteReceiptRepository.findFirstByReceiptCodeOrderByIdDesc(clean.toUpperCase());
        if (receiptOpt.isEmpty()) {
            receiptOpt = voteReceiptRepository.findFirstByBallotCommitmentOrderByIdDesc(clean.toLowerCase());
        }
        if (receiptOpt.isEmpty()) {
            receiptOpt = voteReceiptRepository.findFirstByBlockchainTxHashOrderByIdDesc(raw);
        }
        if (receiptOpt.isEmpty()) {
            Optional<BlockchainTransaction> txLookup = blockchainTransactionRepository.findFirstByBallotCommitmentOrderByIdDesc(clean.toLowerCase());
            if (txLookup.isEmpty()) {
                txLookup = blockchainTransactionRepository.findFirstByTxHashOrderByIdDesc(raw);
            }
            if (txLookup.isPresent() && txLookup.get().getReceiptCode() != null) {
                receiptOpt = voteReceiptRepository.findFirstByReceiptCodeOrderByIdDesc(txLookup.get().getReceiptCode());
            }
        }

        if (receiptOpt.isPresent()) {
            VoteReceipt receipt = receiptOpt.get();
            election = receipt.getElection();
            status = receipt.getStatus();
            issuedAt = receipt.getIssuedAt();
            resolvedReceiptCode = receipt.getReceiptCode();

            // Find matching ballot hash if available
            String hashPrefix = resolvedReceiptCode.startsWith("RCP-") ? resolvedReceiptCode.substring(4).toLowerCase() : "";
            resolvedVoteHash = ballotRecordRepository.findByElectionId(election.getId()).stream()
                    .map(BallotRecord::getBallotHash)
                    .filter(h -> (!hashPrefix.isEmpty() && h.toLowerCase().startsWith(hashPrefix)) || h.equalsIgnoreCase(clean))
                    .findFirst()
                    .orElse(null);
        } else {
            // Check if user submitted the 64-character SHA-256 vote hash
            Optional<BallotRecord> ballotOpt = ballotRecordRepository.findByBallotHash(clean.toLowerCase());
            if (ballotOpt.isPresent()) {
                BallotRecord ballot = ballotOpt.get();
                election = ballot.getElection();
                status = ReceiptStatus.COUNTED;
                issuedAt = ballot.getCastAt();
                resolvedVoteHash = ballot.getBallotHash();
                resolvedReceiptCode = "RCP-" + resolvedVoteHash.substring(0, 16).toUpperCase();
            } else {
                // Check if user submitted a blockchain transaction reference directly
                Optional<BlockchainTransaction> txOpt = blockchainTransactionRepository.findFirstByBallotCommitmentOrderByIdDesc(clean.toLowerCase());
                if (txOpt.isEmpty()) {
                    txOpt = blockchainTransactionRepository.findFirstByTxHashOrderByIdDesc(raw);
                }
                if (txOpt.isEmpty()) {
                    txOpt = blockchainTransactionRepository.findFirstByReceiptCodeOrderByIdDesc(clean.toUpperCase());
                }
                if (txOpt.isPresent()) {
                    BlockchainTransaction tx = txOpt.get();
                    election = tx.getElection();
                    status = ReceiptStatus.COUNTED;
                    issuedAt = tx.getCreatedAt() != null ? tx.getCreatedAt() : LocalDateTime.now();
                    resolvedReceiptCode = tx.getReceiptCode() != null ? tx.getReceiptCode() : "RCP-COMMITMENT";
                } else {
                    throw new ResourceNotFoundException("No valid vote receipt or cryptographic hash found for reference: " + raw);
                }
            }
        }

        boolean isDeclared = election.getStatus() == ElectionStatus.RESULT_DECLARED;

        List<ElectionResultDto> candidateResults = null;
        Long totalValidVotes = null;
        String winnerName = null;
        String winnerParty = null;

        if (isDeclared) {
            List<ElectionResult> results = electionResultRepository.findByElectionIdOrderByVoteCountDesc(election.getId());
            long maxVotes = results.stream().mapToLong(ElectionResult::getVoteCount).max().orElse(0L);
            totalValidVotes = results.stream().mapToLong(ElectionResult::getVoteCount).sum();

            final long finalTotal = totalValidVotes;
            candidateResults = results.stream()
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
                            finalTotal
                    ))
                    .collect(Collectors.toList());

            if (!results.isEmpty() && maxVotes > 0) {
                Candidate winner = results.get(0).getCandidate();
                winnerName = winner.getFullName();
                winnerParty = winner.getPartyName();
            }
        }

        String inclusionStatus = isDeclared
                ? "COUNTED IN CERTIFIED TALLY"
                : "STILL COUNTING — RESULT NOT DECLARED";

        VoteReceiptDto dto = new VoteReceiptDto(
                resolvedReceiptCode,
                election.getId(),
                election.getElectionCode(),
                election.getName(),
                election.getArea().getName(),
                election.getArea().getConstituencyName(),
                election.getStatus(),
                isDeclared,
                inclusionStatus,
                status,
                issuedAt,
                true,
                totalValidVotes,
                winnerName,
                winnerParty,
                candidateResults
        );
        dto.setVoteHash(resolvedVoteHash);
        blockchainService.enrichWithBlockchainVerification(dto, receiptOpt.orElse(null));
        return dto;
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encodedhash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
