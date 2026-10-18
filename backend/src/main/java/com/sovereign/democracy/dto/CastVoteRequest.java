package com.sovereign.democracy.dto;

public class CastVoteRequest {
    private Long electionId;
    private Long candidateId;
    private String secretVotingKey;

    public CastVoteRequest() {}

    public CastVoteRequest(Long electionId, Long candidateId) {
        this.electionId = electionId;
        this.candidateId = candidateId;
    }

    public CastVoteRequest(Long electionId, Long candidateId, String secretVotingKey) {
        this.electionId = electionId;
        this.candidateId = candidateId;
        this.secretVotingKey = secretVotingKey;
    }

    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }

    public Long getCandidateId() { return candidateId; }
    public void setCandidateId(Long candidateId) { this.candidateId = candidateId; }

    public String getSecretVotingKey() { return secretVotingKey; }
    public void setSecretVotingKey(String secretVotingKey) { this.secretVotingKey = secretVotingKey; }
}
