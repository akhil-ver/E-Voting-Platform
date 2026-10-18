package com.sovereign.democracy.ai.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ElectionInsightsDto {

    private Long electionId;
    private String electionCode;
    private String electionName;
    private String electionStatus;
    private String constituencyName;

    // Aggregated Election Level Metrics
    private long totalEligibleVoters;
    private long totalAcceptedVotes;
    private double overallTurnoutPercentage;
    private double overallVotingSpeedPerMin;
    private double overallSpeedChangePercentage;
    private String overallParticipationTier;

    // Area-wise breakdown
    private List<AreaTurnoutMetricDto> areaMetrics;

    // Administrator Operational Metrics
    private long pendingBlockchainTransactions;
    private long confirmedBlockchainTransactions;
    private long failedBlockchainTransactions;
    private String blockchainNodeStatus;

    // AI-Generated Insights (grounded in above statistics)
    private String summary;
    private List<String> observations;
    private List<String> recommendations;
    private List<String> limitations;

    // Metadata
    private LocalDateTime metricsCalculatedAt;
    private LocalDateTime aiGeneratedAt;
    private boolean aiGenerated;
    private String modelUsed;

    public ElectionInsightsDto() {}

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

    public String getConstituencyName() {
        return constituencyName;
    }

    public void setConstituencyName(String constituencyName) {
        this.constituencyName = constituencyName;
    }

    public long getTotalEligibleVoters() {
        return totalEligibleVoters;
    }

    public void setTotalEligibleVoters(long totalEligibleVoters) {
        this.totalEligibleVoters = totalEligibleVoters;
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

    public double getOverallSpeedChangePercentage() {
        return overallSpeedChangePercentage;
    }

    public void setOverallSpeedChangePercentage(double overallSpeedChangePercentage) {
        this.overallSpeedChangePercentage = overallSpeedChangePercentage;
    }

    public String getOverallParticipationTier() {
        return overallParticipationTier;
    }

    public void setOverallParticipationTier(String overallParticipationTier) {
        this.overallParticipationTier = overallParticipationTier;
    }

    public List<AreaTurnoutMetricDto> getAreaMetrics() {
        return areaMetrics;
    }

    public void setAreaMetrics(List<AreaTurnoutMetricDto> areaMetrics) {
        this.areaMetrics = areaMetrics;
    }

    public long getPendingBlockchainTransactions() {
        return pendingBlockchainTransactions;
    }

    public void setPendingBlockchainTransactions(long pendingBlockchainTransactions) {
        this.pendingBlockchainTransactions = pendingBlockchainTransactions;
    }

    public long getConfirmedBlockchainTransactions() {
        return confirmedBlockchainTransactions;
    }

    public void setConfirmedBlockchainTransactions(long confirmedBlockchainTransactions) {
        this.confirmedBlockchainTransactions = confirmedBlockchainTransactions;
    }

    public long getFailedBlockchainTransactions() {
        return failedBlockchainTransactions;
    }

    public void setFailedBlockchainTransactions(long failedBlockchainTransactions) {
        this.failedBlockchainTransactions = failedBlockchainTransactions;
    }

    public String getBlockchainNodeStatus() {
        return blockchainNodeStatus;
    }

    public void setBlockchainNodeStatus(String blockchainNodeStatus) {
        this.blockchainNodeStatus = blockchainNodeStatus;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public List<String> getObservations() {
        return observations;
    }

    public void setObservations(List<String> observations) {
        this.observations = observations;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
    }

    public List<String> getLimitations() {
        return limitations;
    }

    public void setLimitations(List<String> limitations) {
        this.limitations = limitations;
    }

    public LocalDateTime getMetricsCalculatedAt() {
        return metricsCalculatedAt;
    }

    public void setMetricsCalculatedAt(LocalDateTime metricsCalculatedAt) {
        this.metricsCalculatedAt = metricsCalculatedAt;
    }

    public LocalDateTime getAiGeneratedAt() {
        return aiGeneratedAt;
    }

    public void setAiGeneratedAt(LocalDateTime aiGeneratedAt) {
        this.aiGeneratedAt = aiGeneratedAt;
    }

    public boolean isAiGenerated() {
        return aiGenerated;
    }

    public void setAiGenerated(boolean aiGenerated) {
        this.aiGenerated = aiGenerated;
    }

    public String getModelUsed() {
        return modelUsed;
    }

    public void setModelUsed(String modelUsed) {
        this.modelUsed = modelUsed;
    }
}
