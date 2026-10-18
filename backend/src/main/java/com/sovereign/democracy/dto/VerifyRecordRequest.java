package com.sovereign.democracy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class VerifyRecordRequest {

    @NotBlank(message = "Election ID is required")
    private String electionId;

    @NotBlank(message = "Last 4 digits of Aadhaar are required")
    @Pattern(regexp = "^[0-9]{4}$", message = "Aadhaar must be exactly 4 numeric digits")
    private String aadhaarLast4;

    public VerifyRecordRequest() {}

    public VerifyRecordRequest(String electionId, String aadhaarLast4) {
        this.electionId = electionId;
        this.aadhaarLast4 = aadhaarLast4;
    }

    public String getElectionId() { return electionId; }
    public void setElectionId(String electionId) { this.electionId = electionId; }

    public String getAadhaarLast4() { return aadhaarLast4; }
    public void setAadhaarLast4(String aadhaarLast4) { this.aadhaarLast4 = aadhaarLast4; }
}
