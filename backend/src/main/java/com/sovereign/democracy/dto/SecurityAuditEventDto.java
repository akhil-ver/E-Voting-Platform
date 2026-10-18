package com.sovereign.democracy.dto;

import java.time.LocalDateTime;

public class SecurityAuditEventDto {

    private Long id;
    private String eventId;
    private String eventType;
    private String accountRef;
    private LocalDateTime timestamp;
    private boolean success;
    private String reasonCategory;
    private String correlationId;
    private String source;
    private String firebaseStatus; // PENDING, DELIVERED, FAILED, N/A
    private String details;

    public SecurityAuditEventDto() {
    }

    public SecurityAuditEventDto(Long id, String eventId, String eventType, String accountRef,
                                 LocalDateTime timestamp, boolean success, String reasonCategory,
                                 String correlationId, String source, String firebaseStatus, String details) {
        this.id = id;
        this.eventId = eventId;
        this.eventType = eventType;
        this.accountRef = accountRef;
        this.timestamp = timestamp;
        this.success = success;
        this.reasonCategory = reasonCategory;
        this.correlationId = correlationId;
        this.source = source;
        this.firebaseStatus = firebaseStatus;
        this.details = details;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getAccountRef() {
        return accountRef;
    }

    public void setAccountRef(String accountRef) {
        this.accountRef = accountRef;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getReasonCategory() {
        return reasonCategory;
    }

    public void setReasonCategory(String reasonCategory) {
        this.reasonCategory = reasonCategory;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getFirebaseStatus() {
        return firebaseStatus;
    }

    public void setFirebaseStatus(String firebaseStatus) {
        this.firebaseStatus = firebaseStatus;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}
