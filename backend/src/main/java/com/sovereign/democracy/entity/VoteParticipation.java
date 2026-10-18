package com.sovereign.democracy.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Enforces one vote per voter per election strictly in the database.
 * Crucially, does NOT store the candidate chosen, separating voter identity from choice.
 */
@Entity
@Table(name = "vote_participations", uniqueConstraints = {
    @UniqueConstraint(name = "uq_voter_election_vote", columnNames = {"election_id", "voter_record_id"})
})
public class VoteParticipation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voter_record_id", nullable = false)
    private VoterRecord voterRecord;

    @Column(name = "voted_at", nullable = false)
    private LocalDateTime votedAt = LocalDateTime.now();

    @Column(name = "receipt_code", length = 64)
    private String receiptCode;

    @Column(name = "vote_hash", length = 64)
    private String voteHash;

    public VoteParticipation() {}

    public VoteParticipation(Election election, VoterRecord voterRecord) {
        this.election = election;
        this.voterRecord = voterRecord;
        this.votedAt = LocalDateTime.now();
    }

    public VoteParticipation(Election election, VoterRecord voterRecord, String receiptCode, String voteHash) {
        this.election = election;
        this.voterRecord = voterRecord;
        this.receiptCode = receiptCode;
        this.voteHash = voteHash;
        this.votedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        this.votedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Election getElection() { return election; }
    public void setElection(Election election) { this.election = election; }

    public VoterRecord getVoterRecord() { return voterRecord; }
    public void setVoterRecord(VoterRecord voterRecord) { this.voterRecord = voterRecord; }

    public LocalDateTime getVotedAt() { return votedAt; }

    public String getReceiptCode() { return receiptCode; }
    public void setReceiptCode(String receiptCode) { this.receiptCode = receiptCode; }

    public String getVoteHash() { return voteHash; }
    public void setVoteHash(String voteHash) { this.voteHash = voteHash; }
}
