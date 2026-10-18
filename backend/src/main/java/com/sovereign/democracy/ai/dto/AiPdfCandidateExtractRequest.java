package com.sovereign.democracy.ai.dto;

import com.sovereign.democracy.dto.PdfCandidateRowDto;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class AiPdfCandidateExtractRequest {

    @NotNull(message = "Election ID is required")
    private Long electionId;

    private String rawExtractedText;

    public AiPdfCandidateExtractRequest() {}

    public AiPdfCandidateExtractRequest(Long electionId, String rawExtractedText) {
        this.electionId = electionId;
        this.rawExtractedText = rawExtractedText;
    }

    public Long getElectionId() {
        return electionId;
    }

    public void setElectionId(Long electionId) {
        this.electionId = electionId;
    }

    public String getRawExtractedText() {
        return rawExtractedText;
    }

    public void setRawExtractedText(String rawExtractedText) {
        this.rawExtractedText = rawExtractedText;
    }
}
