package com.sovereign.democracy.ai.anomaly.dto;

import com.sovereign.democracy.ai.anomaly.AnomalyFeatureVector;
import com.sovereign.democracy.enums.AnomalyReviewStatus;
import com.sovereign.democracy.enums.AnomalySeverity;

import java.time.LocalDateTime;
import java.util.Map;

public class AnomalyEvaluationDto {

    private Long id;
    private Long electionId;
    private String electionCode;
    private String electionName;
    private String areaName;
    private LocalDateTime observationTimestamp;

    private double anomalyScore;
    private AnomalySeverity severity;
    private AnomalyReviewStatus reviewStatus;
    private String modelVersion;

    private String primaryReason;
    private String geminiExplanation;
    private Map<String, Double> contributingMetrics;
    private AnomalyFeatureVector featureVector;

    private String adminNotes;
    private String reviewedBy;
    private LocalDateTime reviewedAt;

    public AnomalyEvaluationDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }

    public String getElectionCode() { return electionCode; }
    public void setElectionCode(String electionCode) { this.electionCode = electionCode; }

    public String getElectionName() { return electionName; }
    public void setElectionName(String electionName) { this.electionName = electionName; }

    public String getAreaName() { return areaName; }
    public void setAreaName(String areaName) { this.areaName = areaName; }

    public LocalDateTime getObservationTimestamp() { return observationTimestamp; }
    public void setObservationTimestamp(LocalDateTime observationTimestamp) { this.observationTimestamp = observationTimestamp; }

    public double getAnomalyScore() { return anomalyScore; }
    public void setAnomalyScore(double anomalyScore) { this.anomalyScore = anomalyScore; }

    public AnomalySeverity getSeverity() { return severity; }
    public void setSeverity(AnomalySeverity severity) { this.severity = severity; }

    public AnomalyReviewStatus getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(AnomalyReviewStatus reviewStatus) { this.reviewStatus = reviewStatus; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public String getPrimaryReason() { return primaryReason; }
    public void setPrimaryReason(String primaryReason) { this.primaryReason = primaryReason; }

    public String getGeminiExplanation() { return geminiExplanation; }
    public void setGeminiExplanation(String geminiExplanation) { this.geminiExplanation = geminiExplanation; }

    public Map<String, Double> getContributingMetrics() { return contributingMetrics; }
    public void setContributingMetrics(Map<String, Double> contributingMetrics) { this.contributingMetrics = contributingMetrics; }

    public AnomalyFeatureVector getFeatureVector() { return featureVector; }
    public void setFeatureVector(AnomalyFeatureVector featureVector) { this.featureVector = featureVector; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}
