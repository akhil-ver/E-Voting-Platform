package com.sovereign.democracy.ai.dto;

import java.time.LocalDateTime;
import java.util.List;

public class PublicElectionInsightsDto {

    private Long electionId;
    private String electionCode;
    private String electionName;
    private String electionStatus;

    // Public aggregate figures
    private long totalEligibleVoters;
    private long totalAcceptedVotes;
    private double overallTurnoutPercentage;
    private double overallVotingSpeedPerMin;
    private double speedChangePercentage;
    private String participationTrend; // INCREASING, DECREASING, STABLE
    private String overallParticipationTier;

    // Area-wise public percentages
    private List<PublicAreaTurnoutDto> areaTurnouts;

    // Neutral trend summary
    private String publicSummary;
    private List<String> generalObservations;
    private LocalDateTime publishedAt;

    public PublicElectionInsightsDto() {}

    public long getTotalEligibleVoters() {
        return totalEligibleVoters;
    }

    public void setTotalEligibleVoters(long totalEligibleVoters) {
        this.totalEligibleVoters = totalEligibleVoters;
    }

    public double getSpeedChangePercentage() {
        return speedChangePercentage;
    }

    public void setSpeedChangePercentage(double speedChangePercentage) {
        this.speedChangePercentage = speedChangePercentage;
    }

    public String getParticipationTrend() {
        return participationTrend;
    }

    public void setParticipationTrend(String participationTrend) {
        this.participationTrend = participationTrend;
    }

    public Long getElectionId() {
        return electionId;
    }

    public void setElectionId(Long electionId) {
        this.electionId = electionId;
    }

    public String getElectionCode() {
        return electionCode;
    }

    public void setElectionCode(String electionCode) {
        this.electionCode = electionCode;
    }

    public String getElectionName() {
        return electionName;
    }

    public void setElectionName(String electionName) {
        this.electionName = electionName;
    }

    public String getElectionStatus() {
        return electionStatus;
    }

    public void setElectionStatus(String electionStatus) {
        this.electionStatus = electionStatus;
    }

    public long getTotalAcceptedVotes() {
        return totalAcceptedVotes;
    }

    public void setTotalAcceptedVotes(long totalAcceptedVotes) {
        this.totalAcceptedVotes = totalAcceptedVotes;
    }

    public double getOverallTurnoutPercentage() {
        return overallTurnoutPercentage;
    }

    public void setOverallTurnoutPercentage(double overallTurnoutPercentage) {
        this.overallTurnoutPercentage = overallTurnoutPercentage;
    }

    public double getOverallVotingSpeedPerMin() {
        return overallVotingSpeedPerMin;
    }

    public void setOverallVotingSpeedPerMin(double overallVotingSpeedPerMin) {
        this.overallVotingSpeedPerMin = overallVotingSpeedPerMin;
    }

    public String getOverallParticipationTier() {
        return overallParticipationTier;
    }

    public void setOverallParticipationTier(String overallParticipationTier) {
        this.overallParticipationTier = overallParticipationTier;
    }

    public List<PublicAreaTurnoutDto> getAreaTurnouts() {
        return areaTurnouts;
    }

    public void setAreaTurnouts(List<PublicAreaTurnoutDto> areaTurnouts) {
        this.areaTurnouts = areaTurnouts;
    }

    public String getPublicSummary() {
        return publicSummary;
    }

    public void setPublicSummary(String publicSummary) {
        this.publicSummary = publicSummary;
    }

    public List<String> getGeneralObservations() {
        return generalObservations;
    }

    public void setGeneralObservations(List<String> generalObservations) {
        this.generalObservations = generalObservations;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }

    public static class PublicAreaTurnoutDto {
        private String areaName;
        private double turnoutPercentage;
        private String participationTier;

        public PublicAreaTurnoutDto() {}

        public PublicAreaTurnoutDto(String areaName, double turnoutPercentage, String participationTier) {
            this.areaName = areaName;
            this.turnoutPercentage = turnoutPercentage;
            this.participationTier = participationTier;
        }

        public String getAreaName() {
            return areaName;
        }

        public void setAreaName(String areaName) {
            this.areaName = areaName;
        }

        public double getTurnoutPercentage() {
            return turnoutPercentage;
        }

        public void setTurnoutPercentage(double turnoutPercentage) {
            this.turnoutPercentage = turnoutPercentage;
        }

        public String getParticipationTier() {
            return participationTier;
        }

        public void setParticipationTier(String participationTier) {
            this.participationTier = participationTier;
        }
    }
}
