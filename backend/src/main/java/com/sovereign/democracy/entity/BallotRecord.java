package com.sovereign.democracy.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Anonymized ballot pool for counting.
 * Decoupled from voter identity to protect vote secrecy.
 */
@Entity
@Table(name = "ballot_records", indexes = {
    @Index(name = "idx_ballot_election", columnList = "election_id")
})
public class BallotRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @Column(name = "ballot_hash", nullable = false, length = 64)
    private String ballotHash;

    @Column(name = "cast_at", nullable = false)
    private LocalDateTime castAt = LocalDateTime.now();

    public BallotRecord() {}

    public BallotRecord(Election election, Candidate candidate, String ballotHash) {
        this.election = election;
        this.candidate = candidate;
        this.ballotHash = ballotHash;
        this.castAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        this.castAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Election getElection() { return election; }
    public void setElection(Election election) { this.election = election; }

    public Candidate getCandidate() { return candidate; }
    public void setCandidate(Candidate candidate) { this.candidate = candidate; }

    public String getBallotHash() { return ballotHash; }
    public void setBallotHash(String ballotHash) { this.ballotHash = ballotHash; }

    public LocalDateTime getCastAt() { return castAt; }
}
