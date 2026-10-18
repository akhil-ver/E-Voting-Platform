package com.sovereign.democracy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Election ID is required")
    private String electionId;

    @NotBlank(message = "Last 4 digits of Aadhaar are required")
    @Pattern(regexp = "^[0-9]{4}$", message = "Aadhaar must be exactly 4 numeric digits")
    private String aadhaarLast4;

    @NotBlank(message = "Password is required")
    @Size(min = 4, message = "Password must be at least 4 characters")
    private String password;

    public RegisterRequest() {}

    public RegisterRequest(String electionId, String aadhaarLast4, String password) {
        this.electionId = electionId;
        this.aadhaarLast4 = aadhaarLast4;
        this.password = password;
    }

    public String getElectionId() { return electionId; }
    public void setElectionId(String electionId) { this.electionId = electionId; }

    public String getAadhaarLast4() { return aadhaarLast4; }
    public void setAadhaarLast4(String aadhaarLast4) { this.aadhaarLast4 = aadhaarLast4; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
