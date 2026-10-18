package com.sovereign.democracy.entity;

import com.sovereign.democracy.enums.SecretKeyStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "secret_voting_keys", indexes = {
    @Index(name = "idx_svk_election_voter", columnList = "election_id, voter_record_id"),
    @Index(name = "idx_svk_status", columnList = "status")
})
public class SecretVotingKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voter_record_id", nullable = false)
    private VoterRecord voterRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;

    @Column(name = "key_hash", nullable = false, length = 128)
    private String keyHash;

    @Column(name = "key_salt", nullable = false, length = 64)
    private String keySalt;

    @Column(name = "key_prefix", nullable = false, length = 16)
    private String keyPrefix;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SecretKeyStatus status = SecretKeyStatus.ISSUED;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt = LocalDateTime.now();

    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts = 0;

    @Column(name = "last_attempt_at")
    private LocalDateTime lastAttemptAt;

    public SecretVotingKey() {}

    public SecretVotingKey(VoterRecord voterRecord, Election election, String keyHash, String keySalt, String keyPrefix) {
        this.voterRecord = voterRecord;
        this.election = election;
        this.keyHash = keyHash;
        this.keySalt = keySalt;
        this.keyPrefix = keyPrefix;
        this.status = SecretKeyStatus.ISSUED;
        this.issuedAt = LocalDateTime.now();
        this.failedAttempts = 0;
    }

    @PrePersist
    protected void onCreate() {
        if (this.issuedAt == null) {
            this.issuedAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public VoterRecord getVoterRecord() { return voterRecord; }
    public void setVoterRecord(VoterRecord voterRecord) { this.voterRecord = voterRecord; }

    public Election getElection() { return election; }
    public void setElection(Election election) { this.election = election; }

    public String getKeyHash() { return keyHash; }
    public void setKeyHash(String keyHash) { this.keyHash = keyHash; }

    public String getKeySalt() { return keySalt; }
    public void setKeySalt(String keySalt) { this.keySalt = keySalt; }

    public String getKeyPrefix() { return keyPrefix; }
    public void setKeyPrefix(String keyPrefix) { this.keyPrefix = keyPrefix; }

    public SecretKeyStatus getStatus() { return status; }
    public void setStatus(SecretKeyStatus status) { this.status = status; }

    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }

    public LocalDateTime getConsumedAt() { return consumedAt; }
    public void setConsumedAt(LocalDateTime consumedAt) { this.consumedAt = consumedAt; }

    public LocalDateTime getRevokedAt() { return revokedAt; }
    public void setRevokedAt(LocalDateTime revokedAt) { this.revokedAt = revokedAt; }

    public int getFailedAttempts() { return failedAttempts; }
    public void setFailedAttempts(int failedAttempts) { this.failedAttempts = failedAttempts; }

    public LocalDateTime getLastAttemptAt() { return lastAttemptAt; }
    public void setLastAttemptAt(LocalDateTime lastAttemptAt) { this.lastAttemptAt = lastAttemptAt; }
}
