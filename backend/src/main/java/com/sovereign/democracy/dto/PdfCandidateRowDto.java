package com.sovereign.democracy.dto;

import java.util.ArrayList;
import java.util.List;

public class PdfCandidateRowDto {
    private int rowIndex;
    private String candidateCode;
    private String fullName;
    private String partyName;
    private String partySymbol;
    private String symbolImageUrl;
    private String bio;
    private boolean valid;
    private boolean duplicate;
    private List<String> validationErrors = new ArrayList<>();

    public PdfCandidateRowDto() {}

    public PdfCandidateRowDto(int rowIndex, String candidateCode, String fullName,
                              String partyName, String partySymbol, String symbolImageUrl, String bio) {
        this.rowIndex = rowIndex;
        this.candidateCode = candidateCode;
        this.fullName = fullName;
        this.partyName = partyName;
        this.partySymbol = partySymbol;
        this.symbolImageUrl = symbolImageUrl;
        this.bio = bio;
    }

    public int getRowIndex() { return rowIndex; }
    public void setRowIndex(int rowIndex) { this.rowIndex = rowIndex; }

    public String getCandidateCode() { return candidateCode; }
    public void setCandidateCode(String candidateCode) { this.candidateCode = candidateCode; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPartyName() { return partyName; }
    public void setPartyName(String partyName) { this.partyName = partyName; }

    public String getPartySymbol() { return partySymbol; }
    public void setPartySymbol(String partySymbol) { this.partySymbol = partySymbol; }

    public String getSymbolImageUrl() { return symbolImageUrl; }
    public void setSymbolImageUrl(String symbolImageUrl) { this.symbolImageUrl = symbolImageUrl; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public boolean isDuplicate() { return duplicate; }
    public void setDuplicate(boolean duplicate) { this.duplicate = duplicate; }

    public List<String> getValidationErrors() { return validationErrors; }
    public void setValidationErrors(List<String> validationErrors) { this.validationErrors = validationErrors; }
}
