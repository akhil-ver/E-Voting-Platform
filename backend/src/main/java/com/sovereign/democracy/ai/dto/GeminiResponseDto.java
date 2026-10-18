package com.sovereign.democracy.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class GeminiResponseDto {

    private List<Candidate> candidates;
    private PromptFeedback promptFeedback;

    public List<Candidate> getCandidates() {
        return candidates;
    }

    public void setCandidates(List<Candidate> candidates) {
        this.candidates = candidates;
    }

    public PromptFeedback getPromptFeedback() {
        return promptFeedback;
    }

    public void setPromptFeedback(PromptFeedback promptFeedback) {
        this.promptFeedback = promptFeedback;
    }

    public String getFirstText() {
        if (candidates != null && !candidates.isEmpty()) {
            Candidate cand = candidates.get(0);
            if (cand.getContent() != null && cand.getContent().getParts() != null && !cand.getContent().getParts().isEmpty()) {
                return cand.getContent().getParts().get(0).getText();
            }
        }
        return null;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Candidate {
        private Content content;
        private String finishReason;

        public Content getContent() {
            return content;
        }

        public void setContent(Content content) {
            this.content = content;
        }

        public String getFinishReason() {
            return finishReason;
        }

        public void setFinishReason(String finishReason) {
            this.finishReason = finishReason;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Content {
        private List<Part> parts;
        private String role;

        public List<Part> getParts() {
            return parts;
        }

        public void setParts(List<Part> parts) {
            this.parts = parts;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Part {
        private String text;

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PromptFeedback {
        private String blockReason;

        public String getBlockReason() {
            return blockReason;
        }

        public void setBlockReason(String blockReason) {
            this.blockReason = blockReason;
        }
    }
}
