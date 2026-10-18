package com.sovereign.democracy.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ElectionResultDto {
    private Long id;
    private Long candidateId;
    private String candidateCode;
    private String candidateName;
    private String partyName;
    private String partySymbol;
    private String symbolImageUrl;
    private Long voteCount;
    private BigDecimal votePercentage;
    private boolean winner;
    private LocalDateTime publishedAt;
    private String declaredBy;
    private Long electionId;
    private String electionCode;
    private String electionName;
    private String areaName;
    private String constituencyName;
    private Long totalValidVotes;

    public ElectionResultDto() {}

    public ElectionResultDto(Long id, Long candidateId, String candidateCode, String candidateName,
                             String partyName, String partySymbol, String symbolImageUrl,
                             Long voteCount, BigDecimal votePercentage, boolean winner,
                             LocalDateTime publishedAt, String declaredBy) {
        this.id = id;
        this.candidateId = candidateId;
        this.candidateCode = candidateCode;
        this.candidateName = candidateName;
        this.partyName = partyName;
        this.partySymbol = partySymbol;
        this.symbolImageUrl = symbolImageUrl;
        this.voteCount = voteCount;
        this.votePercentage = votePercentage;
        this.winner = winner;
        this.publishedAt = publishedAt;
        this.declaredBy = declaredBy;
    }

    public ElectionResultDto(Long id, Long candidateId, String candidateCode, String candidateName,
                             String partyName, String partySymbol, String symbolImageUrl,
                             Long voteCount, BigDecimal votePercentage, boolean winner,
                             LocalDateTime publishedAt, String declaredBy,
                             Long electionId, String electionCode, String electionName,
                             String areaName, String constituencyName, Long totalValidVotes) {
        this(id, candidateId, candidateCode, candidateName, partyName, partySymbol, symbolImageUrl, voteCount, votePercentage, winner, publishedAt, declaredBy);
        this.electionId = electionId;
        this.electionCode = electionCode;
        this.electionName = electionName;
        this.areaName = areaName;
        this.constituencyName = constituencyName;
        this.totalValidVotes = totalValidVotes;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCandidateId() { return candidateId; }
    public void setCandidateId(Long candidateId) { this.candidateId = candidateId; }

    public String getCandidateCode() { return candidateCode; }
    public void setCandidateCode(String candidateCode) { this.candidateCode = candidateCode; }

    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }

    public String getPartyName() { return partyName; }
    public void setPartyName(String partyName) { this.partyName = partyName; }

    public String getPartySymbol() { return partySymbol; }
    public void setPartySymbol(String partySymbol) { this.partySymbol = partySymbol; }

    public String getSymbolImageUrl() { return symbolImageUrl; }
    public void setSymbolImageUrl(String symbolImageUrl) { this.symbolImageUrl = symbolImageUrl; }

    public Long getVoteCount() { return voteCount; }
    public void setVoteCount(Long voteCount) { this.voteCount = voteCount; }

    public BigDecimal getVotePercentage() { return votePercentage; }
    public void setVotePercentage(BigDecimal votePercentage) { this.votePercentage = votePercentage; }

    public boolean isWinner() { return winner; }
    public void setWinner(boolean winner) { this.winner = winner; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }

    public String getDeclaredBy() { return declaredBy; }
    public void setDeclaredBy(String declaredBy) { this.declaredBy = declaredBy; }

    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }

    public String getElectionCode() { return electionCode; }
    public void setElectionCode(String electionCode) { this.electionCode = electionCode; }

    public String getElectionName() { return electionName; }
    public void setElectionName(String electionName) { this.electionName = electionName; }

    public String getAreaName() { return areaName; }
    public void setAreaName(String areaName) { this.areaName = areaName; }

    public String getConstituencyName() { return constituencyName; }
    public void setConstituencyName(String constituencyName) { this.constituencyName = constituencyName; }

    public Long getTotalValidVotes() { return totalValidVotes; }
    public void setTotalValidVotes(Long totalValidVotes) { this.totalValidVotes = totalValidVotes; }
}
