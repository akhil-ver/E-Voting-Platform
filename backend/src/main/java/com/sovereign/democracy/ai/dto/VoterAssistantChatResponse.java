package com.sovereign.democracy.ai.dto;

import java.time.LocalDateTime;
import java.util.List;

public class VoterAssistantChatResponse {

    private String reply;
    private List<String> suggestedActions;
    private boolean grounded;
    private LocalDateTime timestamp;

    public VoterAssistantChatResponse() {}

    public VoterAssistantChatResponse(String reply, List<String> suggestedActions, boolean grounded) {
        this.reply = reply;
        this.suggestedActions = suggestedActions;
        this.grounded = grounded;
        this.timestamp = LocalDateTime.now();
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public List<String> getSuggestedActions() {
        return suggestedActions;
    }

    public void setSuggestedActions(List<String> suggestedActions) {
        this.suggestedActions = suggestedActions;
    }

    public boolean isGrounded() {
        return grounded;
    }

    public void setGrounded(boolean grounded) {
        this.grounded = grounded;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
