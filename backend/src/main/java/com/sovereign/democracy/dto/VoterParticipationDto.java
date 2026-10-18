package com.sovereign.democracy.dto;

import java.time.LocalDateTime;

/**
 * Area-wise Voter Participation DTO.
 * Strictly decoupled from candidate choices to protect ballot secrecy.
 */
public class VoterParticipationDto {
    private Long voterRecordId;
    private String voterId;
    private String fullName;
    private String fatherName;
    private String motherName;
    private String aadhaarMasked;
    private String areaName;
    private boolean hasRegisteredAccount;
    private String participationStatus; // "VOTED" or "NOT_VOTED"
    private LocalDateTime votedAt;
    private Long electionId;
    private String electionCode;
    private String electionName;

    public VoterParticipationDto() {}

    public VoterParticipationDto(Long voterRecordId, String voterId, String fullName,
                                 String fatherName, String motherName, String aadhaarLast4,
                                 String areaName, boolean hasRegisteredAccount,
                                 String participationStatus, LocalDateTime votedAt) {
        this.voterRecordId = voterRecordId;
        this.voterId = voterId;
        this.fullName = fullName;
        this.fatherName = fatherName;
        this.motherName = motherName;
        this.aadhaarMasked = "•••• •••• " + (aadhaarLast4 != null ? aadhaarLast4 : "••••");
        this.areaName = areaName;
        this.hasRegisteredAccount = hasRegisteredAccount;
        this.participationStatus = participationStatus;
        this.votedAt = votedAt;
    }

    public VoterParticipationDto(Long voterRecordId, String voterId, String fullName,
                                 String fatherName, String motherName, String aadhaarLast4,
                                 String areaName, boolean hasRegisteredAccount,
                                 String participationStatus, LocalDateTime votedAt,
                                 Long electionId, String electionCode, String electionName) {
        this(voterRecordId, voterId, fullName, fatherName, motherName, aadhaarLast4, areaName, hasRegisteredAccount, participationStatus, votedAt);
        this.electionId = electionId;
        this.electionCode = electionCode;
        this.electionName = electionName;
    }

    public Long getVoterRecordId() { return voterRecordId; }
    public void setVoterRecordId(Long voterRecordId) { this.voterRecordId = voterRecordId; }

    public String getVoterId() { return voterId; }
    public void setVoterId(String voterId) { this.voterId = voterId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getFatherName() { return fatherName; }
    public void setFatherName(String fatherName) { this.fatherName = fatherName; }

    public String getMotherName() { return motherName; }
    public void setMotherName(String motherName) { this.motherName = motherName; }

    public String getAadhaarMasked() { return aadhaarMasked; }
    public void setAadhaarMasked(String aadhaarMasked) { this.aadhaarMasked = aadhaarMasked; }

    public String getAreaName() { return areaName; }
    public void setAreaName(String areaName) { this.areaName = areaName; }

    public boolean isHasRegisteredAccount() { return hasRegisteredAccount; }
    public void setHasRegisteredAccount(boolean hasRegisteredAccount) { this.hasRegisteredAccount = hasRegisteredAccount; }

    public String getParticipationStatus() { return participationStatus; }
    public void setParticipationStatus(String participationStatus) { this.participationStatus = participationStatus; }

    public LocalDateTime getVotedAt() { return votedAt; }
    public void setVotedAt(LocalDateTime votedAt) { this.votedAt = votedAt; }

    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }

    public String getElectionCode() { return electionCode; }
    public void setElectionCode(String electionCode) { this.electionCode = electionCode; }

    public String getElectionName() { return electionName; }
    public void setElectionName(String electionName) { this.electionName = electionName; }
}
