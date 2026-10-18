package com.sovereign.democracy.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidates", uniqueConstraints = {
    @UniqueConstraint(name = "uq_election_candidate", columnNames = {"election_id", "candidate_code"})
})
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "candidate_code", nullable = false, length = 50)
    private String candidateCode;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "party_name", nullable = false, length = 150)
    private String partyName;

    @Column(name = "party_symbol", nullable = false, length = 100)
    private String partySymbol;

    @Column(name = "symbol_image_url", length = 500)
    private String symbolImageUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(nullable = false, length = 30)
    private String status = "ACTIVE";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Candidate() {}

    public Candidate(String candidateCode, Election election, String fullName, String partyName, String partySymbol, String symbolImageUrl, String bio) {
        this.candidateCode = candidateCode;
        this.election = election;
        this.fullName = fullName;
        this.partyName = partyName;
        this.partySymbol = partySymbol;
        this.symbolImageUrl = symbolImageUrl;
        this.bio = bio;
        this.status = "ACTIVE";
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCandidateCode() { return candidateCode; }
    public void setCandidateCode(String candidateCode) { this.candidateCode = candidateCode; }

    public Election getElection() { return election; }
    public void setElection(Election election) { this.election = election; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPartyName() { return partyName; }
    public void setPartyName(String partyName) { this.partyName = partyName; }

    public String getPartySymbol() { return partySymbol; }
    public void setPartySymbol(String partySymbol) { this.partySymbol = partySymbol; }

    public String getSymbolImageUrl() { return symbolImageUrl; }
    public void setSymbolImageUrl(String symbolImageUrl) { this.symbolImageUrl = symbolImageUrl; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
