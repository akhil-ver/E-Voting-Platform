package com.sovereign.democracy.dto;

public class CandidateDto {
    private Long id;
    private String candidateCode;
    private Long electionId;
    private String electionName;
    private String areaName;
    private String fullName;
    private String partyName;
    private String partySymbol;
    private String symbolImageUrl;
    private String bio;
    private String status;

    public CandidateDto() {}

    public CandidateDto(Long id, String candidateCode, Long electionId, String electionName,
                        String areaName, String fullName, String partyName, String partySymbol,
                        String symbolImageUrl, String bio, String status) {
        this.id = id;
        this.candidateCode = candidateCode;
        this.electionId = electionId;
        this.electionName = electionName;
        this.areaName = areaName;
        this.fullName = fullName;
        this.partyName = partyName;
        this.partySymbol = partySymbol;
        this.symbolImageUrl = symbolImageUrl;
        this.bio = bio;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCandidateCode() { return candidateCode; }
    public void setCandidateCode(String candidateCode) { this.candidateCode = candidateCode; }

    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }

    public String getElectionName() { return electionName; }
    public void setElectionName(String electionName) { this.electionName = electionName; }

    public String getAreaName() { return areaName; }
    public void setAreaName(String areaName) { this.areaName = areaName; }

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
}
