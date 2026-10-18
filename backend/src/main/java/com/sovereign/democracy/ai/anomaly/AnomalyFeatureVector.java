package com.sovereign.democracy.ai.anomaly;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 7-dimensional operational feature vector for election anomaly detection:
 * 1. acceptedBallotsPerMin: Accepted voting rate in ballots/minute
 * 2. failedSubmissionsCount: Number of failed/rejected voting attempts in window
 * 3. rejectedDuplicateAttempts: Number of duplicate-vote attempts blocked by constraint
 * 4. authFailuresCount: Aggregated citizen/admin authentication failures
 * 5. pendingBlockchainTxCount: Number of pending/broadcasting blockchain transactions
 * 6. blockchainLatencySec: Blockchain confirmation latency / oldest unconfirmed tx age
 * 7. speedVsBaselineDiff: Absolute difference between current speed and historical baseline
 */
public class AnomalyFeatureVector {

    public static final String[] FEATURE_NAMES = {
        "acceptedBallotsPerMin",
        "failedSubmissionsCount",
        "rejectedDuplicateAttempts",
        "authFailuresCount",
        "pendingBlockchainTxCount",
        "blockchainLatencySec",
        "speedVsBaselineDiff"
    };

    public static final String[] FEATURE_DESCRIPTIONS = {
        "Accepted Ballots / Min",
        "Failed Voting Submissions",
        "Blocked Duplicate Ballot Attempts",
        "Authentication Failures",
        "Pending Blockchain Transactions",
        "Blockchain Latency (Seconds)",
        "Voting Speed vs Baseline Delta"
    };

    private double acceptedBallotsPerMin;
    private double failedSubmissionsCount;
    private double rejectedDuplicateAttempts;
    private double authFailuresCount;
    private double pendingBlockchainTxCount;
    private double blockchainLatencySec;
    private double speedVsBaselineDiff;

    public AnomalyFeatureVector() {}

    public AnomalyFeatureVector(double acceptedBallotsPerMin, double failedSubmissionsCount,
                                double rejectedDuplicateAttempts, double authFailuresCount,
                                double pendingBlockchainTxCount, double blockchainLatencySec,
                                double speedVsBaselineDiff) {
        this.acceptedBallotsPerMin = acceptedBallotsPerMin;
        this.failedSubmissionsCount = failedSubmissionsCount;
        this.rejectedDuplicateAttempts = rejectedDuplicateAttempts;
        this.authFailuresCount = authFailuresCount;
        this.pendingBlockchainTxCount = pendingBlockchainTxCount;
        this.blockchainLatencySec = blockchainLatencySec;
        this.speedVsBaselineDiff = speedVsBaselineDiff;
    }

    public double[] toArray() {
        return new double[] {
            acceptedBallotsPerMin,
            failedSubmissionsCount,
            rejectedDuplicateAttempts,
            authFailuresCount,
            pendingBlockchainTxCount,
            blockchainLatencySec,
            speedVsBaselineDiff
        };
    }

    public Map<String, Double> toMap() {
        Map<String, Double> map = new LinkedHashMap<>();
        map.put("acceptedBallotsPerMin", Math.round(acceptedBallotsPerMin * 100.0) / 100.0);
        map.put("failedSubmissionsCount", failedSubmissionsCount);
        map.put("rejectedDuplicateAttempts", rejectedDuplicateAttempts);
        map.put("authFailuresCount", authFailuresCount);
        map.put("pendingBlockchainTxCount", pendingBlockchainTxCount);
        map.put("blockchainLatencySec", Math.round(blockchainLatencySec * 10.0) / 10.0);
        map.put("speedVsBaselineDiff", Math.round(speedVsBaselineDiff * 100.0) / 100.0);
        return map;
    }

    public double getAcceptedBallotsPerMin() { return acceptedBallotsPerMin; }
    public void setAcceptedBallotsPerMin(double acceptedBallotsPerMin) { this.acceptedBallotsPerMin = acceptedBallotsPerMin; }

    public double getFailedSubmissionsCount() { return failedSubmissionsCount; }
    public void setFailedSubmissionsCount(double failedSubmissionsCount) { this.failedSubmissionsCount = failedSubmissionsCount; }

    public double getRejectedDuplicateAttempts() { return rejectedDuplicateAttempts; }
    public void setRejectedDuplicateAttempts(double rejectedDuplicateAttempts) { this.rejectedDuplicateAttempts = rejectedDuplicateAttempts; }

    public double getAuthFailuresCount() { return authFailuresCount; }
    public void setAuthFailuresCount(double authFailuresCount) { this.authFailuresCount = authFailuresCount; }

    public double getPendingBlockchainTxCount() { return pendingBlockchainTxCount; }
    public void setPendingBlockchainTxCount(double pendingBlockchainTxCount) { this.pendingBlockchainTxCount = pendingBlockchainTxCount; }

    public double getBlockchainLatencySec() { return blockchainLatencySec; }
    public void setBlockchainLatencySec(double blockchainLatencySec) { this.blockchainLatencySec = blockchainLatencySec; }

    public double getSpeedVsBaselineDiff() { return speedVsBaselineDiff; }
    public void setSpeedVsBaselineDiff(double speedVsBaselineDiff) { this.speedVsBaselineDiff = speedVsBaselineDiff; }
}
