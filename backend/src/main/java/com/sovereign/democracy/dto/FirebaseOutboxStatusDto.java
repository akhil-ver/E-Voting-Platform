package com.sovereign.democracy.dto;

import java.time.LocalDateTime;
import java.util.List;

public class FirebaseOutboxStatusDto {

    private long totalPending;
    private long totalDelivered;
    private long totalFailed;
    private LocalDateTime lastDeliveredAt;
    private boolean firebaseConfigured;
    private List<SecurityAuditEventDto> recentOutboxEvents;

    public FirebaseOutboxStatusDto() {
    }

    public FirebaseOutboxStatusDto(long totalPending, long totalDelivered, long totalFailed,
                                   LocalDateTime lastDeliveredAt, boolean firebaseConfigured,
                                   List<SecurityAuditEventDto> recentOutboxEvents) {
        this.totalPending = totalPending;
        this.totalDelivered = totalDelivered;
        this.totalFailed = totalFailed;
        this.lastDeliveredAt = lastDeliveredAt;
        this.firebaseConfigured = firebaseConfigured;
        this.recentOutboxEvents = recentOutboxEvents;
    }

    public long getTotalPending() {
        return totalPending;
    }

    public void setTotalPending(long totalPending) {
        this.totalPending = totalPending;
    }

    public long getTotalDelivered() {
        return totalDelivered;
    }

    public void setTotalDelivered(long totalDelivered) {
        this.totalDelivered = totalDelivered;
    }

    public long getTotalFailed() {
        return totalFailed;
    }

    public void setTotalFailed(long totalFailed) {
        this.totalFailed = totalFailed;
    }

    public LocalDateTime getLastDeliveredAt() {
        return lastDeliveredAt;
    }

    public void setLastDeliveredAt(LocalDateTime lastDeliveredAt) {
        this.lastDeliveredAt = lastDeliveredAt;
    }

    public boolean isFirebaseConfigured() {
        return firebaseConfigured;
    }

    public void setFirebaseConfigured(boolean firebaseConfigured) {
        this.firebaseConfigured = firebaseConfigured;
    }

    public List<SecurityAuditEventDto> getRecentOutboxEvents() {
        return recentOutboxEvents;
    }

    public void setRecentOutboxEvents(List<SecurityAuditEventDto> recentOutboxEvents) {
        this.recentOutboxEvents = recentOutboxEvents;
    }
}
