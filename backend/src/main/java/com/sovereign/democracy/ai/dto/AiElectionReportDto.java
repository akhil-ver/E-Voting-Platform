package com.sovereign.democracy.ai.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AiElectionReportDto {

    private Long electionId;
    private String electionCode;
    private String electionName;
    private String electionStatus;
    private LocalDateTime closureTimestamp;

    // Verified Official Tally Facts (Source of Truth)
    private long totalAcceptedBallots;
    private long totalEligibleVoters;
    private double finalTurnoutPercentage;
    private String winnerName;
    private String winnerParty;
    private double winningPercentage;

    // Blockchain Telemetry Summary
    private String onChainTallyHash;
    private String onChainTallyTxHash;
    private boolean onChainTallyVerified;
    private long totalOnChainBallots;

    // AI-Generated Post-Election Executive Summary
    private String executiveSummary;
    private List<String> keyHighlights;
    private List<String> areaParticipationAnalysis;
    private List<String> auditAndIntegrityNotes;
    private String disclaimer;
    private LocalDateTime generatedAt;

    public AiElectionReportDto() {}

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

    public LocalDateTime getClosureTimestamp() {
        return closureTimestamp;
    }

    public void setClosureTimestamp(LocalDateTime closureTimestamp) {
        this.closureTimestamp = closureTimestamp;
    }

    public long getTotalAcceptedBallots() {
        return totalAcceptedBallots;
    }

    public void setTotalAcceptedBallots(long totalAcceptedBallots) {
        this.totalAcceptedBallots = totalAcceptedBallots;
    }

    public long getTotalEligibleVoters() {
        return totalEligibleVoters;
    }

    public void setTotalEligibleVoters(long totalEligibleVoters) {
        this.totalEligibleVoters = totalEligibleVoters;
    }

    public double getFinalTurnoutPercentage() {
        return finalTurnoutPercentage;
    }

    public void setFinalTurnoutPercentage(double finalTurnoutPercentage) {
        this.finalTurnoutPercentage = finalTurnoutPercentage;
    }

    public String getWinnerName() {
        return winnerName;
    }

    public void setWinnerName(String winnerName) {
        this.winnerName = winnerName;
    }

    public String getWinnerParty() {
        return winnerParty;
    }

    public void setWinnerParty(String winnerParty) {
        this.winnerParty = winnerParty;
    }

    public double getWinningPercentage() {
        return winningPercentage;
    }

    public void setWinningPercentage(double winningPercentage) {
        this.winningPercentage = winningPercentage;
    }

    public String getOnChainTallyHash() {
        return onChainTallyHash;
    }

    public void setOnChainTallyHash(String onChainTallyHash) {
        this.onChainTallyHash = onChainTallyHash;
    }

    public String getOnChainTallyTxHash() {
        return onChainTallyTxHash;
    }

    public void setOnChainTallyTxHash(String onChainTallyTxHash) {
        this.onChainTallyTxHash = onChainTallyTxHash;
    }

    public boolean isOnChainTallyVerified() {
        return onChainTallyVerified;
    }

    public void setOnChainTallyVerified(boolean onChainTallyVerified) {
        this.onChainTallyVerified = onChainTallyVerified;
    }

    public long getTotalOnChainBallots() {
        return totalOnChainBallots;
    }

    public void setTotalOnChainBallots(long totalOnChainBallots) {
        this.totalOnChainBallots = totalOnChainBallots;
    }

    public String getExecutiveSummary() {
        return executiveSummary;
    }

    public void setExecutiveSummary(String executiveSummary) {
        this.executiveSummary = executiveSummary;
    }

    public List<String> getKeyHighlights() {
        return keyHighlights;
    }

    public void setKeyHighlights(List<String> keyHighlights) {
        this.keyHighlights = keyHighlights;
    }

    public List<String> getAreaParticipationAnalysis() {
        return areaParticipationAnalysis;
    }

    public void setAreaParticipationAnalysis(List<String> areaParticipationAnalysis) {
        this.areaParticipationAnalysis = areaParticipationAnalysis;
    }

    public List<String> getAuditAndIntegrityNotes() {
        return auditAndIntegrityNotes;
    }

    public void setAuditAndIntegrityNotes(List<String> auditAndIntegrityNotes) {
        this.auditAndIntegrityNotes = auditAndIntegrityNotes;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}
