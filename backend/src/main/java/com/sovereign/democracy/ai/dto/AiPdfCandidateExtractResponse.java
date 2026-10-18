package com.sovereign.democracy.ai.dto;

import com.sovereign.democracy.dto.PdfCandidateRowDto;

import java.util.List;

public class AiPdfCandidateExtractResponse {

    private boolean success;
    private String message;
    private List<PdfCandidateRowDto> candidates;
    private List<String> warnings;

    public AiPdfCandidateExtractResponse() {}

    public AiPdfCandidateExtractResponse(boolean success, String message, List<PdfCandidateRowDto> candidates, List<String> warnings) {
        this.success = success;
        this.message = message;
        this.candidates = candidates;
        this.warnings = warnings;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<PdfCandidateRowDto> getCandidates() {
        return candidates;
    }

    public void setCandidates(List<PdfCandidateRowDto> candidates) {
        this.candidates = candidates;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }
}
