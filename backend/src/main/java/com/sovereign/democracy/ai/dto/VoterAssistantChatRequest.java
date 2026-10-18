package com.sovereign.democracy.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class VoterAssistantChatRequest {

    @NotBlank(message = "Message cannot be blank")
    @Size(max = 1000, message = "Message must not exceed 1000 characters")
    private String message;

    private Long electionId;

    public VoterAssistantChatRequest() {}

    public VoterAssistantChatRequest(String message, Long electionId) {
        this.message = message;
        this.electionId = electionId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getElectionId() {
        return electionId;
    }

    public void setElectionId(Long electionId) {
        this.electionId = electionId;
    }
}
