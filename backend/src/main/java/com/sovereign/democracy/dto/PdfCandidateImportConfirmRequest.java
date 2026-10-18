package com.sovereign.democracy.dto;

import java.util.ArrayList;
import java.util.List;

public class PdfCandidateImportConfirmRequest {
    private Long electionId;
    private List<PdfCandidateRowDto> candidates = new ArrayList<>();

    public PdfCandidateImportConfirmRequest() {}

    public PdfCandidateImportConfirmRequest(Long electionId, List<PdfCandidateRowDto> candidates) {
        this.electionId = electionId;
        this.candidates = candidates;
    }

    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }

    public List<PdfCandidateRowDto> getCandidates() { return candidates; }
    public void setCandidates(List<PdfCandidateRowDto> candidates) { this.candidates = candidates; }
}
