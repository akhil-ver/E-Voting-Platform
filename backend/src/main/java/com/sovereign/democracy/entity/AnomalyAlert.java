package com.sovereign.democracy.entity;

import com.sovereign.democracy.enums.AnomalyReviewStatus;
import com.sovereign.democracy.enums.AnomalySeverity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "anomaly_alerts", indexes = {
    @Index(name = "idx_anomaly_election", columnList = "election_id"),
    @Index(name = "idx_anomaly_status", columnList = "review_status"),
    @Index(name = "idx_anomaly_timestamp", columnList = "observation_timestamp"),
    @Index(name = "idx_anomaly_severity", columnList = "severity")
})
public class AnomalyAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id")
    private Area area;

    @Column(name = "observation_timestamp", nullable = false)
    private LocalDateTime observationTimestamp;

    @Column(name = "anomaly_score", nullable = false)
    private double anomalyScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AnomalySeverity severity = AnomalySeverity.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", nullable = false, length = 30)
    private AnomalyReviewStatus reviewStatus = AnomalyReviewStatus.PENDING_REVIEW;

    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion = "IsolationForest-v1.0";

    @Column(name = "primary_reason", nullable = false, columnDefinition = "TEXT")
    private String primaryReason;

    @Column(name = "gemini_explanation", columnDefinition = "TEXT")
    private String geminiExplanation;

    @Column(name = "contributing_metrics", columnDefinition = "TEXT")
    private String contributingMetrics;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "reviewed_by", length = 50)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public AnomalyAlert() {}

    public AnomalyAlert(Election election, Area area, LocalDateTime observationTimestamp,
                        double anomalyScore, AnomalySeverity severity, AnomalyReviewStatus reviewStatus,
                        String modelVersion, String primaryReason, String geminiExplanation,
                        String contributingMetrics) {
        this.election = election;
        this.area = area;
        this.observationTimestamp = observationTimestamp;
        this.anomalyScore = anomalyScore;
        this.severity = severity;
        this.reviewStatus = reviewStatus;
        this.modelVersion = modelVersion;
        this.primaryReason = primaryReason;
        this.geminiExplanation = geminiExplanation;
        this.contributingMetrics = contributingMetrics;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Election getElection() { return election; }
    public void setElection(Election election) { this.election = election; }

    public Area getArea() { return area; }
    public void setArea(Area area) { this.area = area; }

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

    public String getContributingMetrics() { return contributingMetrics; }
    public void setContributingMetrics(String contributingMetrics) { this.contributingMetrics = contributingMetrics; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
