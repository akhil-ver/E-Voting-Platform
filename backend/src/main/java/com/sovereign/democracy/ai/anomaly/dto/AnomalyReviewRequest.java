package com.sovereign.democracy.ai.anomaly.dto;

import com.sovereign.democracy.enums.AnomalyReviewStatus;
import jakarta.validation.constraints.NotNull;

public class AnomalyReviewRequest {

    @NotNull(message = "Review status is required")
    private AnomalyReviewStatus reviewStatus;

    private String adminNotes;

    public AnomalyReviewRequest() {}

    public AnomalyReviewRequest(AnomalyReviewStatus reviewStatus, String adminNotes) {
        this.reviewStatus = reviewStatus;
        this.adminNotes = adminNotes;
    }

    public AnomalyReviewStatus getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(AnomalyReviewStatus reviewStatus) { this.reviewStatus = reviewStatus; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
}
