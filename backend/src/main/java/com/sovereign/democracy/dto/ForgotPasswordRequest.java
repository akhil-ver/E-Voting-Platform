package com.sovereign.democracy.dto;

import jakarta.validation.constraints.NotBlank;

public class ForgotPasswordRequest {

    @NotBlank(message = "Username or recovery email is required")
    private String identifier;

    public ForgotPasswordRequest() {
    }

    public ForgotPasswordRequest(String identifier) {
        this.identifier = identifier;
    }

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }
}
