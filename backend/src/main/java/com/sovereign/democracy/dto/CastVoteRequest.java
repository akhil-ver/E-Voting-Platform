package com.sovereign.democracy.dto;

public class CastVoteRequest {
    private Long electionId;
    private Long candidateId;

    public CastVoteRequest() {}

    public CastVoteRequest(Long electionId, Long candidateId) {
        this.electionId = electionId;
        this.candidateId = candidateId;
    }

    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }

    public Long getCandidateId() { return candidateId; }
    public void setCandidateId(Long candidateId) { this.candidateId = candidateId; }
}
