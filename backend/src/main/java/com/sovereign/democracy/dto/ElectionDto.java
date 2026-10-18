package com.sovereign.democracy.dto;

import com.sovereign.democracy.enums.ElectionStatus;
import java.time.LocalDateTime;

public class ElectionDto {
    private Long id;
    private String electionCode;
    private String name;
    private String electionType;
    private Long areaId;
    private String areaName;
    private String areaCode;
    private String constituencyName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private ElectionStatus status;
    private LocalDateTime closureTimestamp;
    private long candidateCount;
    private long totalEligibleVoters;
    private long votesCast;
    private double turnoutPercentage;

    public ElectionDto() {}

    public ElectionDto(Long id, String electionCode, String name, String electionType,
                       Long areaId, String areaName, String areaCode, String constituencyName,
                       LocalDateTime startTime, LocalDateTime endTime,
                       ElectionStatus status, LocalDateTime closureTimestamp,
                       long candidateCount, long totalEligibleVoters, long votesCast) {
        this.id = id;
        this.electionCode = electionCode;
        this.name = name;
        this.electionType = electionType;
        this.areaId = areaId;
        this.areaName = areaName;
        this.areaCode = areaCode;
        this.constituencyName = constituencyName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.closureTimestamp = closureTimestamp;
        this.candidateCount = candidateCount;
        this.totalEligibleVoters = totalEligibleVoters;
        this.votesCast = votesCast;
        this.turnoutPercentage = totalEligibleVoters > 0
                ? Math.round(((double) votesCast / totalEligibleVoters) * 10000.0) / 100.0
                : 0.0;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getElectionCode() { return electionCode; }
    public void setElectionCode(String electionCode) { this.electionCode = electionCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getElectionType() { return electionType; }
    public void setElectionType(String electionType) { this.electionType = electionType; }

    public Long getAreaId() { return areaId; }
    public void setAreaId(Long areaId) { this.areaId = areaId; }

    public String getAreaName() { return areaName; }
    public void setAreaName(String areaName) { this.areaName = areaName; }

    public String getAreaCode() { return areaCode; }
    public void setAreaCode(String areaCode) { this.areaCode = areaCode; }

    public String getConstituencyName() { return constituencyName; }
    public void setConstituencyName(String constituencyName) { this.constituencyName = constituencyName; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public ElectionStatus getStatus() { return status; }
    public void setStatus(ElectionStatus status) { this.status = status; }

    public LocalDateTime getClosureTimestamp() { return closureTimestamp; }
    public void setClosureTimestamp(LocalDateTime closureTimestamp) { this.closureTimestamp = closureTimestamp; }

    public long getCandidateCount() { return candidateCount; }
    public void setCandidateCount(long candidateCount) { this.candidateCount = candidateCount; }

    public long getTotalEligibleVoters() { return totalEligibleVoters; }
    public void setTotalEligibleVoters(long totalEligibleVoters) { this.totalEligibleVoters = totalEligibleVoters; }

    public long getVotesCast() { return votesCast; }
    public void setVotesCast(long votesCast) { this.votesCast = votesCast; }

    public double getTurnoutPercentage() { return turnoutPercentage; }
    public void setTurnoutPercentage(double turnoutPercentage) { this.turnoutPercentage = turnoutPercentage; }
}
