package com.sovereign.democracy.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "election_results", uniqueConstraints = {
    @UniqueConstraint(name = "uq_result_election_candidate", columnNames = {"election_id", "candidate_id"})
})
public class ElectionResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @Column(name = "vote_count", nullable = false)
    private Long voteCount = 0L;

    @Column(name = "vote_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal votePercentage = BigDecimal.ZERO;

    @Column(name = "published_at", nullable = false)
    private LocalDateTime publishedAt = LocalDateTime.now();

    @Column(name = "declared_by_username", nullable = false, length = 50)
    private String declaredByUsername;

    public ElectionResult() {}

    public ElectionResult(Election election, Candidate candidate, Long voteCount, BigDecimal votePercentage, String declaredByUsername) {
        this.election = election;
        this.candidate = candidate;
        this.voteCount = voteCount;
        this.votePercentage = votePercentage;
        this.declaredByUsername = declaredByUsername;
        this.publishedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        this.publishedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Election getElection() { return election; }
    public void setElection(Election election) { this.election = election; }

    public Candidate getCandidate() { return candidate; }
    public void setCandidate(Candidate candidate) { this.candidate = candidate; }

    public Long getVoteCount() { return voteCount; }
    public void setVoteCount(Long voteCount) { this.voteCount = voteCount; }

    public BigDecimal getVotePercentage() { return votePercentage; }
    public void setVotePercentage(BigDecimal votePercentage) { this.votePercentage = votePercentage; }

    public LocalDateTime getPublishedAt() { return publishedAt; }

    public String getDeclaredByUsername() { return declaredByUsername; }
    public void setDeclaredByUsername(String declaredByUsername) { this.declaredByUsername = declaredByUsername; }
}
