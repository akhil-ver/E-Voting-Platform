package com.sovereign.democracy.dto;

import java.util.ArrayList;
import java.util.List;

public class PdfCandidateImportPreviewDto {
    private Long electionId;
    private String electionCode;
    private String electionName;
    private String areaName;
    private int totalParsed;
    private int validCount;
    private int errorCount;
    private int duplicateCount;
    private List<PdfCandidateRowDto> rows = new ArrayList<>();
    private String notes;
    private String rawExtractedText;

    public PdfCandidateImportPreviewDto() {}

    public String getRawExtractedText() { return rawExtractedText; }
    public void setRawExtractedText(String rawExtractedText) { this.rawExtractedText = rawExtractedText; }

    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }

    public String getElectionCode() { return electionCode; }
    public void setElectionCode(String electionCode) { this.electionCode = electionCode; }

    public String getElectionName() { return electionName; }
    public void setElectionName(String electionName) { this.electionName = electionName; }

    public String getAreaName() { return areaName; }
    public void setAreaName(String areaName) { this.areaName = areaName; }

    public int getTotalParsed() { return totalParsed; }
    public void setTotalParsed(int totalParsed) { this.totalParsed = totalParsed; }

    public int getValidCount() { return validCount; }
    public void setValidCount(int validCount) { this.validCount = validCount; }

    public int getErrorCount() { return errorCount; }
    public void setErrorCount(int errorCount) { this.errorCount = errorCount; }

    public int getDuplicateCount() { return duplicateCount; }
    public void setDuplicateCount(int duplicateCount) { this.duplicateCount = duplicateCount; }

    public List<PdfCandidateRowDto> getRows() { return rows; }
    public void setRows(List<PdfCandidateRowDto> rows) { this.rows = rows; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
