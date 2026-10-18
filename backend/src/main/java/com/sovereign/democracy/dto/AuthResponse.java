package com.sovereign.democracy.dto;

import com.sovereign.democracy.enums.Role;

public class AuthResponse {
    private String token;
    private String tokenType = "Bearer";
    private String username;
    private Role role;
    private String fullName;
    private String voterId;
    private String areaName;
    private Long areaId;

    private String email;
    private String fatherName;
    private String motherName;

    public AuthResponse() {}

    public AuthResponse(String token, String username, Role role, String fullName, String voterId, String areaName, Long areaId) {
        this(token, username, role, fullName, voterId, areaName, areaId, null, null, null);
    }

    public AuthResponse(String token, String username, Role role, String fullName, String voterId, String areaName, Long areaId, String email) {
        this(token, username, role, fullName, voterId, areaName, areaId, email, null, null);
    }

    public AuthResponse(String token, String username, Role role, String fullName, String voterId, String areaName, Long areaId, String email, String fatherName, String motherName) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.fullName = fullName;
        this.voterId = voterId;
        this.areaName = areaName;
        this.areaId = areaId;
        this.email = email;
        this.fatherName = fatherName;
        this.motherName = motherName;
    }

    public String getFatherName() { return fatherName; }
    public void setFatherName(String fatherName) { this.fatherName = fatherName; }

    public String getMotherName() { return motherName; }
    public void setMotherName(String motherName) { this.motherName = motherName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getVoterId() { return voterId; }
    public void setVoterId(String voterId) { this.voterId = voterId; }

    public String getAreaName() { return areaName; }
    public void setAreaName(String areaName) { this.areaName = areaName; }

    public Long getAreaId() { return areaId; }
    public void setAreaId(Long areaId) { this.areaId = areaId; }
}
