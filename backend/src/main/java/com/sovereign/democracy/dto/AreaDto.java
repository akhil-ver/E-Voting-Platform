package com.sovereign.democracy.dto;

public class AreaDto {
    private Long id;
    private String areaCode;
    private String name;
    private String constituencyName;
    private String electionType;
    private String description;
    private boolean active;
    private long totalVoterRecords;
    private long registeredAccounts;

    public AreaDto() {}

    public AreaDto(Long id, String areaCode, String name, String constituencyName, String electionType,
                   String description, boolean active, long totalVoterRecords, long registeredAccounts) {
        this.id = id;
        this.areaCode = areaCode;
        this.name = name;
        this.constituencyName = constituencyName;
        this.electionType = electionType;
        this.description = description;
        this.active = active;
        this.totalVoterRecords = totalVoterRecords;
        this.registeredAccounts = registeredAccounts;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAreaCode() { return areaCode; }
    public void setAreaCode(String areaCode) { this.areaCode = areaCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getConstituencyName() { return constituencyName; }
    public void setConstituencyName(String constituencyName) { this.constituencyName = constituencyName; }

    public String getElectionType() { return electionType; }
    public void setElectionType(String electionType) { this.electionType = electionType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public long getTotalVoterRecords() { return totalVoterRecords; }
    public void setTotalVoterRecords(long totalVoterRecords) { this.totalVoterRecords = totalVoterRecords; }

    public long getRegisteredAccounts() { return registeredAccounts; }
    public void setRegisteredAccounts(long registeredAccounts) { this.registeredAccounts = registeredAccounts; }
}
