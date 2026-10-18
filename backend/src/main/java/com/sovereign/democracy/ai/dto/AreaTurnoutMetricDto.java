package com.sovereign.democracy.ai.dto;

import java.time.LocalDateTime;

public class AreaTurnoutMetricDto {

    private Long areaId;
    private String areaName;
    private String constituencyName;
    private long eligibleVoters;
    private long acceptedVotes;
    private double turnoutPercentage;

    // Speed metrics over recent window
    private int windowMinutes;
    private long votesInCurrentWindow;
    private long votesInPreviousWindow;
    private double currentVotingSpeedPerMin;
    private double previousVotingSpeedPerMin;
    private double speedChangePercentage;

    // Classification: "LOW", "NORMAL", "HIGH"
    private String participationTier;

    // Operational alerts if any (e.g., zero votes in active window, sudden drop)
    private String operationalStatus;

    public AreaTurnoutMetricDto() {}

    public AreaTurnoutMetricDto(Long areaId, String areaName, String constituencyName,
                                long eligibleVoters, long acceptedVotes, double turnoutPercentage,
                                int windowMinutes, long votesInCurrentWindow, long votesInPreviousWindow,
                                double currentVotingSpeedPerMin, double previousVotingSpeedPerMin,
                                double speedChangePercentage, String participationTier,
                                String operationalStatus) {
        this.areaId = areaId;
        this.areaName = areaName;
        this.constituencyName = constituencyName;
        this.eligibleVoters = eligibleVoters;
        this.acceptedVotes = acceptedVotes;
        this.turnoutPercentage = turnoutPercentage;
        this.windowMinutes = windowMinutes;
        this.votesInCurrentWindow = votesInCurrentWindow;
        this.votesInPreviousWindow = votesInPreviousWindow;
        this.currentVotingSpeedPerMin = currentVotingSpeedPerMin;
        this.previousVotingSpeedPerMin = previousVotingSpeedPerMin;
        this.speedChangePercentage = speedChangePercentage;
        this.participationTier = participationTier;
        this.operationalStatus = operationalStatus;
    }

    public Long getAreaId() {
        return areaId;
    }

    public void setAreaId(Long areaId) {
        this.areaId = areaId;
    }

    public String getAreaName() {
        return areaName;
    }

    public void setAreaName(String areaName) {
        this.areaName = areaName;
    }

    public String getConstituencyName() {
        return constituencyName;
    }

    public void setConstituencyName(String constituencyName) {
        this.constituencyName = constituencyName;
    }

    public long getEligibleVoters() {
        return eligibleVoters;
    }

    public void setEligibleVoters(long eligibleVoters) {
        this.eligibleVoters = eligibleVoters;
    }

    public long getAcceptedVotes() {
        return acceptedVotes;
    }

    public void setAcceptedVotes(long acceptedVotes) {
        this.acceptedVotes = acceptedVotes;
    }

    public double getTurnoutPercentage() {
        return turnoutPercentage;
    }

    public void setTurnoutPercentage(double turnoutPercentage) {
        this.turnoutPercentage = turnoutPercentage;
    }

    public int getWindowMinutes() {
        return windowMinutes;
    }

    public void setWindowMinutes(int windowMinutes) {
        this.windowMinutes = windowMinutes;
    }

    public long getVotesInCurrentWindow() {
        return votesInCurrentWindow;
    }

    public void setVotesInCurrentWindow(long votesInCurrentWindow) {
        this.votesInCurrentWindow = votesInCurrentWindow;
    }

    public long getVotesInPreviousWindow() {
        return votesInPreviousWindow;
    }

    public void setVotesInPreviousWindow(long votesInPreviousWindow) {
        this.votesInPreviousWindow = votesInPreviousWindow;
    }

    public double getCurrentVotingSpeedPerMin() {
        return currentVotingSpeedPerMin;
    }

    public void setCurrentVotingSpeedPerMin(double currentVotingSpeedPerMin) {
        this.currentVotingSpeedPerMin = currentVotingSpeedPerMin;
    }

    public double getPreviousVotingSpeedPerMin() {
        return previousVotingSpeedPerMin;
    }

    public void setPreviousVotingSpeedPerMin(double previousVotingSpeedPerMin) {
        this.previousVotingSpeedPerMin = previousVotingSpeedPerMin;
    }

    public double getSpeedChangePercentage() {
        return speedChangePercentage;
    }

    public void setSpeedChangePercentage(double speedChangePercentage) {
        this.speedChangePercentage = speedChangePercentage;
    }

    public String getParticipationTier() {
        return participationTier;
    }

    public void setParticipationTier(String participationTier) {
        this.participationTier = participationTier;
    }

    public String getOperationalStatus() {
        return operationalStatus;
    }

    public void setOperationalStatus(String operationalStatus) {
        this.operationalStatus = operationalStatus;
    }
}
