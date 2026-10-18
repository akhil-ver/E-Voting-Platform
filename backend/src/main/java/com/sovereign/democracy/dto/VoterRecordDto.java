package com.sovereign.democracy.dto;

public class VoterRecordDto {
    private Long id;
    private String voterId;
    private String fullName;
    private String fatherName;
    private String motherName;
    private String aadhaarMasked;
    private String areaName;
    private Long areaId;
    private boolean eligible;
    private boolean hasRegisteredAccount;
    private Long userAccountId;
    private Boolean accountEnabled;

    public VoterRecordDto() {}

    public VoterRecordDto(Long id, String voterId, String fullName, String fatherName, String motherName,
                          String aadhaarLast4, String areaName, Long areaId, boolean eligible, boolean hasRegisteredAccount) {
        this.id = id;
        this.voterId = voterId;
        this.fullName = fullName;
        this.fatherName = fatherName;
        this.motherName = motherName;
        this.aadhaarMasked = "•••• •••• " + (aadhaarLast4 != null ? aadhaarLast4 : "••••");
        this.areaName = areaName;
        this.areaId = areaId;
        this.eligible = eligible;
        this.hasRegisteredAccount = hasRegisteredAccount;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getVoterId() { return voterId; }
    public void setVoterId(String voterId) { this.voterId = voterId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getFatherName() { return fatherName; }
    public void setFatherName(String fatherName) { this.fatherName = fatherName; }

    public String getMotherName() { return motherName; }
    public void setMotherName(String motherName) { this.motherName = motherName; }

    public String getAadhaarMasked() { return aadhaarMasked; }
    public void setAadhaarMasked(String aadhaarMasked) { this.aadhaarMasked = aadhaarMasked; }

    public String getAreaName() { return areaName; }
    public void setAreaName(String areaName) { this.areaName = areaName; }

    public Long getAreaId() { return areaId; }
    public void setAreaId(Long areaId) { this.areaId = areaId; }

    public boolean isEligible() { return eligible; }
    public void setEligible(boolean eligible) { this.eligible = eligible; }

    public boolean isHasRegisteredAccount() { return hasRegisteredAccount; }
    public void setHasRegisteredAccount(boolean hasRegisteredAccount) { this.hasRegisteredAccount = hasRegisteredAccount; }

    public Long getUserAccountId() { return userAccountId; }
    public void setUserAccountId(Long userAccountId) { this.userAccountId = userAccountId; }

    public Boolean getAccountEnabled() { return accountEnabled; }
    public void setAccountEnabled(Boolean accountEnabled) { this.accountEnabled = accountEnabled; }

    private String email;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
