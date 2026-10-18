package com.sovereign.democracy.service;

import com.sovereign.democracy.dto.SecretVotingKeyDto;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.entity.SecretVotingKey;
import com.sovereign.democracy.entity.UserAccount;
import com.sovereign.democracy.entity.VoterRecord;
import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.enums.SecretKeyStatus;
import com.sovereign.democracy.exception.BadRequestException;
import com.sovereign.democracy.exception.ResourceNotFoundException;
import com.sovereign.democracy.repository.ElectionRepository;
import com.sovereign.democracy.repository.SecretVotingKeyRepository;
import com.sovereign.democracy.repository.UserAccountRepository;
import com.sovereign.democracy.repository.VoteParticipationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Service
public class SecretVotingKeyService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private final SecureRandom secureRandom = new SecureRandom();

    private final SecretVotingKeyRepository secretVotingKeyRepository;
    private final UserAccountRepository userAccountRepository;
    private final ElectionRepository electionRepository;
    private final VoteParticipationRepository voteParticipationRepository;
    private final AuditLogService auditLogService;
    private final org.springframework.transaction.support.TransactionTemplate requiresNewTransactionTemplate;

    public SecretVotingKeyService(SecretVotingKeyRepository secretVotingKeyRepository,
                                  UserAccountRepository userAccountRepository,
                                  ElectionRepository electionRepository,
                                  VoteParticipationRepository voteParticipationRepository,
                                  AuditLogService auditLogService,
                                  org.springframework.transaction.PlatformTransactionManager transactionManager) {
        this.secretVotingKeyRepository = secretVotingKeyRepository;
        this.userAccountRepository = userAccountRepository;
        this.electionRepository = electionRepository;
        this.voteParticipationRepository = voteParticipationRepository;
        this.auditLogService = auditLogService;
        this.requiresNewTransactionTemplate = new org.springframework.transaction.support.TransactionTemplate(transactionManager);
        this.requiresNewTransactionTemplate.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /**
     * Issues or reissues a secret voting key for an authenticated voter in an eligible election.
     */
    @Transactional
    public SecretVotingKeyDto issueOrReissueKey(String username, Long electionId, boolean forceReissue, String clientIp) {
        UserAccount user = userAccountRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        VoterRecord voter = user.getVoterRecord();
        if (voter == null || !voter.isEligible()) {
            throw new BadRequestException("Citizen is not eligible to vote");
        }

        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

        if (election.getStatus() != ElectionStatus.OPEN) {
            throw new BadRequestException("Voting key can only be generated for OPEN elections. Status: " + election.getStatus());
        }

        if (!voter.getArea().getId().equals(election.getArea().getId())) {
            throw new BadRequestException("Constituency Mismatch: You are enrolled in " +
                    voter.getArea().getName() + " and cannot obtain a key for " + election.getArea().getName());
        }

        if (voteParticipationRepository.existsByElectionAndVoterRecord(election, voter)) {
            throw new BadRequestException("Ballot already cast: A secret voting key cannot be issued after participating.");
        }

        Optional<SecretVotingKey> activeKeyOpt = secretVotingKeyRepository
                .findTopByElectionAndVoterRecordAndStatusOrderByIssuedAtDesc(election, voter, SecretKeyStatus.ISSUED);

        if (activeKeyOpt.isPresent() && !forceReissue) {
            SecretVotingKey existing = activeKeyOpt.get();
            // If already locked out due to failed attempts, tell user to force reissue
            if (existing.getFailedAttempts() >= MAX_FAILED_ATTEMPTS) {
                throw new BadRequestException("Your active voting key is locked due to too many failed attempts. Please request a reissuance.");
            }
            return new SecretVotingKeyDto(
                    election.getId(),
                    election.getElectionCode(),
                    election.getName(),
                    existing.getKeyPrefix(),
                    existing.getStatus(),
                    existing.getIssuedAt(),
                    null,
                    null,
                    "Active secret voting key already exists (" + existing.getKeyPrefix() + "...). Use your saved key or select Reissue if forgotten."
            );
        }

        // Revoke any existing active keys for this voter & election
        if (activeKeyOpt.isPresent()) {
            SecretVotingKey oldKey = activeKeyOpt.get();
            oldKey.setStatus(SecretKeyStatus.REVOKED);
            oldKey.setRevokedAt(LocalDateTime.now());
            secretVotingKeyRepository.save(oldKey);
        }

        // Generate 128-bit cryptographically secure key
        byte[] keyBytes = new byte[16];
        secureRandom.nextBytes(keyBytes);
        String rawHex = HexFormat.of().formatHex(keyBytes).toUpperCase();
        // Format as SVK-XXXX-XXXX-XXXX-XXXX
        String rawKey = "SVK-" + rawHex.substring(0, 4) + "-" + rawHex.substring(4, 8) + "-" +
                rawHex.substring(8, 12) + "-" + rawHex.substring(12, 16);

        // Salt and hash verifier
        byte[] saltBytes = new byte[16];
        secureRandom.nextBytes(saltBytes);
        String salt = HexFormat.of().formatHex(saltBytes);
        String keyHash = hashKeyWithSalt(salt, rawKey);
        String keyPrefix = rawKey.substring(0, 8);

        SecretVotingKey newKey = new SecretVotingKey(voter, election, keyHash, salt, keyPrefix);
        secretVotingKeyRepository.save(newKey);

        auditLogService.logAction(
                "SECRET_KEY_GENERATED",
                "SecretVotingKey",
                election.getElectionCode(),
                username,
                "Secret voting key generated with prefix " + keyPrefix + " for election " + election.getElectionCode(),
                clientIp
        );

        return new SecretVotingKeyDto(
                election.getId(),
                election.getElectionCode(),
                election.getName(),
                keyPrefix,
                SecretKeyStatus.ISSUED,
                newKey.getIssuedAt(),
                null,
                rawKey,
                "New secret voting key successfully generated. Copy and store it securely; it will not be displayed again."
        );
    }

    /**
     * Retrieves key status without exposing the raw secret.
     */
    @Transactional(readOnly = true)
    public SecretVotingKeyDto getKeyStatus(String username, Long electionId) {
        UserAccount user = userAccountRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        VoterRecord voter = user.getVoterRecord();
        if (voter == null) {
            throw new BadRequestException("No voter record associated with user");
        }

        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found with id: " + electionId));

        List<SecretVotingKey> keys = secretVotingKeyRepository.findByElectionAndVoterRecordOrderByIssuedAtDesc(election, voter);
        if (keys.isEmpty()) {
            return new SecretVotingKeyDto(
                    election.getId(),
                    election.getElectionCode(),
                    election.getName(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    "No secret voting key generated yet."
            );
        }

        SecretVotingKey latest = keys.get(0);
        return new SecretVotingKeyDto(
                election.getId(),
                election.getElectionCode(),
                election.getName(),
                latest.getKeyPrefix(),
                latest.getStatus(),
                latest.getIssuedAt(),
                latest.getConsumedAt(),
                null,
                "Key status: " + latest.getStatus()
        );
    }

    /**
     * Validates and atomically consumes the secret voting key during ballot cast.
     */
    @Transactional
    public void validateAndConsumeKey(VoterRecord voter, Election election, String rawSecretKey) {
        if (rawSecretKey == null || rawSecretKey.trim().isEmpty()) {
            throw new BadRequestException("Secret voting key is required to cast a ballot in this election.");
        }

        String normalizedKey = rawSecretKey.trim().toUpperCase();

        SecretVotingKey key = secretVotingKeyRepository
                .findTopByElectionAndVoterRecordAndStatusOrderByIssuedAtDesc(election, voter, SecretKeyStatus.ISSUED)
                .orElseThrow(() -> new BadRequestException(
                        "No active secret voting key found for this election. Please generate your secret voting key before casting a ballot."
                ));

        if (key.getFailedAttempts() >= MAX_FAILED_ATTEMPTS) {
            throw new BadRequestException("Secret voting key is locked due to too many failed attempts. Please reissue your key.");
        }

        String expectedHash = hashKeyWithSalt(key.getKeySalt(), normalizedKey);
        if (!MessageDigest.isEqual(expectedHash.getBytes(StandardCharsets.UTF_8), key.getKeyHash().getBytes(StandardCharsets.UTF_8))) {
            final Long keyId = key.getId();
            int attempts = requiresNewTransactionTemplate.execute(status -> {
                SecretVotingKey freshKey = secretVotingKeyRepository.findById(keyId).orElse(key);
                int att = freshKey.getFailedAttempts() + 1;
                freshKey.setFailedAttempts(att);
                freshKey.setLastAttemptAt(LocalDateTime.now());
                secretVotingKeyRepository.saveAndFlush(freshKey);
                return att;
            });

            int remaining = MAX_FAILED_ATTEMPTS - attempts;
            if (remaining > 0) {
                throw new BadRequestException("Invalid secret voting key. " + remaining + " attempts remaining before lockout.");
            } else {
                throw new BadRequestException("Invalid secret voting key. Maximum attempts exceeded; key is now locked. Please reissue your key.");
            }
        }

        // Concurrency-safe atomic consumption
        int updatedRows = secretVotingKeyRepository.consumeKeyAtomically(
                key.getId(),
                SecretKeyStatus.ISSUED,
                SecretKeyStatus.CONSUMED,
                LocalDateTime.now()
        );

        if (updatedRows == 0) {
            throw new BadRequestException("Secret voting key has already been consumed or invalidated by a concurrent request.");
        }
    }

    public String hashKeyWithSalt(String salt, String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(salt.getBytes(StandardCharsets.UTF_8));
            byte[] encodedhash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encodedhash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }
}
