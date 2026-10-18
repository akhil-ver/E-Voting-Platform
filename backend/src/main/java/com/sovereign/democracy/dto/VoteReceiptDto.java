package com.sovereign.democracy.dto;

import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.enums.ReceiptStatus;
import java.time.LocalDateTime;
import java.util.List;

public class VoteReceiptDto {
    private String receiptCode;
    private String voteHash;
    private Long electionId;
    private String electionCode;
    private String electionName;
    private String areaName;
    private String constituencyName;
    private ElectionStatus electionStatus;
    private boolean resultDeclared;
    private String inclusionStatus;
    private ReceiptStatus status;
    private LocalDateTime issuedAt;
    private boolean valid;
    private Long totalValidVotes;
    private String winnerName;
    private String winnerParty;
    private List<ElectionResultDto> candidateResults;

    public VoteReceiptDto() {}

    public VoteReceiptDto(String receiptCode, Long electionId, String electionCode,
                          String electionName, String areaName, ReceiptStatus status,
                          LocalDateTime issuedAt, boolean valid) {
        this.receiptCode = receiptCode;
        this.electionId = electionId;
        this.electionCode = electionCode;
        this.electionName = electionName;
        this.areaName = areaName;
        this.status = status;
        this.issuedAt = issuedAt;
        this.valid = valid;
    }

    public VoteReceiptDto(String receiptCode, Long electionId, String electionCode,
                          String electionName, String areaName, String constituencyName,
                          ElectionStatus electionStatus, boolean resultDeclared,
                          String inclusionStatus, ReceiptStatus status,
                          LocalDateTime issuedAt, boolean valid,
                          Long totalValidVotes, String winnerName, String winnerParty,
                          List<ElectionResultDto> candidateResults) {
        this(receiptCode, electionId, electionCode, electionName, areaName, status, issuedAt, valid);
        this.constituencyName = constituencyName;
        this.electionStatus = electionStatus;
        this.resultDeclared = resultDeclared;
        this.inclusionStatus = inclusionStatus;
        this.totalValidVotes = totalValidVotes;
        this.winnerName = winnerName;
        this.winnerParty = winnerParty;
        this.candidateResults = candidateResults;
    }

    public String getReceiptCode() { return receiptCode; }
    public void setReceiptCode(String receiptCode) { this.receiptCode = receiptCode; }

    public String getVoteHash() { return voteHash; }
    public void setVoteHash(String voteHash) { this.voteHash = voteHash; }

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

    public ElectionStatus getElectionStatus() { return electionStatus; }
    public void setElectionStatus(ElectionStatus electionStatus) { this.electionStatus = electionStatus; }

    public boolean isResultDeclared() { return resultDeclared; }
    public void setResultDeclared(boolean resultDeclared) { this.resultDeclared = resultDeclared; }

    public String getInclusionStatus() { return inclusionStatus; }
    public void setInclusionStatus(String inclusionStatus) { this.inclusionStatus = inclusionStatus; }

    public ReceiptStatus getStatus() { return status; }
    public void setStatus(ReceiptStatus status) { this.status = status; }

    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public Long getTotalValidVotes() { return totalValidVotes; }
    public void setTotalValidVotes(Long totalValidVotes) { this.totalValidVotes = totalValidVotes; }

    public String getWinnerName() { return winnerName; }
    public void setWinnerName(String winnerName) { this.winnerName = winnerName; }

    public String getWinnerParty() { return winnerParty; }
    public void setWinnerParty(String winnerParty) { this.winnerParty = winnerParty; }

    public List<ElectionResultDto> getCandidateResults() { return candidateResults; }
    public void setCandidateResults(List<ElectionResultDto> candidateResults) { this.candidateResults = candidateResults; }
}
