package com.sovereign.democracy.dto;

import java.util.ArrayList;
import java.util.List;

public class PdfCandidateImportResultDto {
    private int totalSubmitted;
    private int importedCount;
    private int skippedCount;
    private List<CandidateDto> importedCandidates = new ArrayList<>();
    private List<String> errors = new ArrayList<>();

    public PdfCandidateImportResultDto() {}

    public PdfCandidateImportResultDto(int totalSubmitted, int importedCount, int skippedCount,
                                       List<CandidateDto> importedCandidates, List<String> errors) {
        this.totalSubmitted = totalSubmitted;
        this.importedCount = importedCount;
        this.skippedCount = skippedCount;
        this.importedCandidates = importedCandidates;
        this.errors = errors;
    }

    public int getTotalSubmitted() { return totalSubmitted; }
    public void setTotalSubmitted(int totalSubmitted) { this.totalSubmitted = totalSubmitted; }

    public int getImportedCount() { return importedCount; }
    public void setImportedCount(int importedCount) { this.importedCount = importedCount; }

    public int getSkippedCount() { return skippedCount; }
    public void setSkippedCount(int skippedCount) { this.skippedCount = skippedCount; }

    public List<CandidateDto> getImportedCandidates() { return importedCandidates; }
    public void setImportedCandidates(List<CandidateDto> importedCandidates) { this.importedCandidates = importedCandidates; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }
}
