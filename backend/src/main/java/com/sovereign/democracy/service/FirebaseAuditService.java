package com.sovereign.democracy.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sovereign.democracy.dto.FirebaseOutboxStatusDto;
import com.sovereign.democracy.dto.SecurityAuditEventDto;
import com.sovereign.democracy.entity.FirebaseAuditOutbox;
import com.sovereign.democracy.entity.UserAccount;
import com.sovereign.democracy.repository.FirebaseAuditOutboxRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.io.File;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing transactional audit outbox persistence in MySQL and confirmed
 * asynchronous dispatch to Google Cloud Firestore collections.
 *
 * Guarantees zero-drop security auditing: events are durably persisted in MySQL
 * within the local transaction, dispatched idempotently via Firestore REST API,
 * and confirmed prior to status transition to DELIVERED.
 */
@Service
public class FirebaseAuditService {

    private static final Logger log = LoggerFactory.getLogger(FirebaseAuditService.class);

    private final FirebaseAuditOutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;
    private RestClient restClient;

    private final String projectId;
    private final String apiKey;
    private final String databaseUrl;
    private final String serviceAccountPath;
    private final String auditCollection;
    private final String memberCollection;
    private final boolean firebaseConfigured;

    public FirebaseAuditService(
            FirebaseAuditOutboxRepository outboxRepository,
            ObjectMapper objectMapper,
            @Value("${firebase.project-id:evotingsystem-4c3a1}") String projectId,
            @Value("${firebase.api-key:AIzaSyCJGa3s2WAM6q3Gndw1-KPEQc4ZhoP_vZg}") String apiKey,
            @Value("${firebase.database-url:https://evotingsystem-4c3a1-default-rtdb.firebaseio.com}") String databaseUrl,
            @Value("${firebase.service-account-path:}") String serviceAccountPath,
            @Value("${firebase.firestore.collection.audit:security_audit_logs}") String auditCollection,
            @Value("${firebase.firestore.collection.member:member_metadata}") String memberCollection,
            @Value("${firebase.enabled:true}") boolean firebaseEnabled) {
        this.outboxRepository = outboxRepository;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
        this.projectId = projectId;
        this.apiKey = apiKey;
        this.databaseUrl = databaseUrl;
        this.serviceAccountPath = serviceAccountPath;
        this.auditCollection = (auditCollection != null && !auditCollection.isBlank()) ? auditCollection : "security_audit_logs";
        this.memberCollection = (memberCollection != null && !memberCollection.isBlank()) ? memberCollection : "member_metadata";
        this.firebaseConfigured = firebaseEnabled && projectId != null && !projectId.isBlank();

        inspectCredentials();
    }

    /**
     * For unit and integration testing: allows substituting a configured RestClient.
     */
    public void setRestClient(RestClient restClient) {
        this.restClient = restClient;
    }

    private void inspectCredentials() {
        if (!firebaseConfigured) {
            log.info("Firebase Firestore audit outbox is disabled (firebase.enabled=false). Events will queue in MySQL outbox.");
            return;
        }

        String adcPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
        if (serviceAccountPath != null && !serviceAccountPath.isBlank()) {
            File saFile = new File(serviceAccountPath);
            if (saFile.exists() && saFile.canRead()) {
                log.info("Firebase Firestore service-account JSON credential verified at: {}", serviceAccountPath);
            } else {
                log.warn("Configured firebase.service-account-path does not exist or cannot be read: {}. Using API Key fallback.", serviceAccountPath);
            }
        } else if (adcPath != null && !adcPath.isBlank()) {
            File adcFile = new File(adcPath);
            if (adcFile.exists() && adcFile.canRead()) {
                log.info("Firebase Firestore Application Default Credentials (ADC) detected at: {}", adcPath);
            } else {
                log.warn("GOOGLE_APPLICATION_CREDENTIALS path is not accessible: {}. Using API Key fallback.", adcPath);
            }
        } else {
            log.info("Firebase Firestore initialized for project [{}] (collection: '{}') using Web API Key authentication.",
                    projectId, auditCollection);
        }
    }

    /**
     * Records a security audit event in the MySQL outbox table and attempts dispatch.
     * Guarantees that failure to deliver to Firebase never affects the transaction.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public FirebaseAuditOutbox recordSecurityEvent(
            String eventType,
            String accountRef,
            boolean success,
            String reasonCategory,
            String correlationId,
            String source,
            Map<String, Object> details,
            String ipAddress) {

        String eventId = "evt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);

        Map<String, Object> eventPayload = new HashMap<>();
        eventPayload.put("eventId", eventId);
        eventPayload.put("eventType", eventType);
        eventPayload.put("accountRef", accountRef != null ? accountRef : "ANONYMOUS");
        eventPayload.put("success", success);
        eventPayload.put("reasonCategory", reasonCategory != null ? reasonCategory : (success ? "AUTHORIZED" : "SECURITY_VIOLATION"));
        eventPayload.put("correlationId", correlationId != null ? correlationId : UUID.randomUUID().toString());
        eventPayload.put("source", source != null ? source : "APPLICATION_BACKEND");
        eventPayload.put("ipAddress", ipAddress != null ? ipAddress : "0.0.0.0");
        eventPayload.put("timestamp", LocalDateTime.now().toString());
        if (details != null && !details.isEmpty()) {
            eventPayload.put("details", details);
        }

        String serializedPayload;
        try {
            serializedPayload = objectMapper.writeValueAsString(eventPayload);
        } catch (Exception e) {
            serializedPayload = "{\"eventId\":\"" + eventId + "\",\"error\":\"Payload serialization failure\"}";
            log.error("Failed to serialize security event payload: {}", e.getMessage());
        }

        FirebaseAuditOutbox outbox = new FirebaseAuditOutbox(eventId, eventType, accountRef, serializedPayload);
        outbox = outboxRepository.save(outbox);

        // Attempt immediate dispatch
        tryDispatchEvent(outbox, eventPayload);
        return outbox;
    }

    /**
     * Synchronizes non-sensitive member metadata to Firestore collection 'member_metadata'.
     * Never transmits passwords, hashes, SVKs, or ballot votes.
     */
    public void syncMemberMetadata(UserAccount account) {
        if (!firebaseConfigured || account == null) {
            return;
        }

        try {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("username", account.getUsername());
            metadata.put("role", account.getRole().name());
            metadata.put("enabled", account.isEnabled());
            metadata.put("hasRegisteredAccount", true);
            if (account.getPasswordChangedAt() != null) {
                metadata.put("passwordChangedAt", account.getPasswordChangedAt().toString());
            }
            if (account.getLastLoginAt() != null) {
                metadata.put("lastLoginAt", account.getLastLoginAt().toString());
            }
            metadata.put("lastAuditedAt", LocalDateTime.now().toString());

            if (account.getVoterRecord() != null) {
                metadata.put("fullName", account.getVoterRecord().getFullName());
                metadata.put("voterId", account.getVoterRecord().getVoterId());
                if (account.getVoterRecord().getArea() != null) {
                    metadata.put("areaName", account.getVoterRecord().getArea().getName());
                }
            }

            String url = buildFirestoreDocUrl(memberCollection, account.getUsername());
            Map<String, Object> firestoreBody = convertToFirestoreDocument(metadata);

            ResponseEntity<String> response = restClient.patch()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(firestoreBody)
                    .retrieve()
                    .toEntity(String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Synced non-sensitive member metadata to Firestore for [{}] in collection [{}]",
                        account.getUsername(), memberCollection);
            }
        } catch (Exception e) {
            log.warn("Supplementary Firebase member metadata sync skipped/failed: {}", e.getMessage());
        }
    }

    /**
     * Builds the idempotent Google Cloud Firestore REST API URI for a specific document.
     */
    private String buildFirestoreDocUrl(String collection, String documentId) {
        StringBuilder url = new StringBuilder();
        url.append("https://firestore.googleapis.com/v1/projects/")
                .append(projectId)
                .append("/databases/(default)/documents/")
                .append(collection)
                .append("/")
                .append(documentId);
        if (apiKey != null && !apiKey.isBlank()) {
            url.append("?key=").append(apiKey);
        }
        return url.toString();
    }

    /**
     * Converts a generic Map into Google Cloud Firestore typed 'fields' structure.
     */
    public Map<String, Object> convertToFirestoreDocument(Map<String, Object> data) {
        Map<String, Object> root = new HashMap<>();
        Map<String, Object> fields = new HashMap<>();
        if (data != null) {
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (entry.getKey() != null) {
                    Map<String, Object> converted = convertValue(entry.getValue());
                    if (converted != null) {
                        fields.put(entry.getKey(), converted);
                    }
                }
            }
        }
        root.put("fields", fields);
        return root;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> convertValue(Object value) {
        if (value == null) {
            return Collections.singletonMap("nullValue", null);
        }
        if (value instanceof Boolean b) {
            return Collections.singletonMap("booleanValue", b);
        }
        if (value instanceof Byte || value instanceof Short || value instanceof Integer || value instanceof Long) {
            return Collections.singletonMap("integerValue", String.valueOf(value));
        }
        if (value instanceof Float || value instanceof Double) {
            return Collections.singletonMap("doubleValue", ((Number) value).doubleValue());
        }
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> subFields = new HashMap<>();
            for (Map.Entry<?, ?> subEntry : map.entrySet()) {
                if (subEntry.getKey() != null) {
                    Map<String, Object> subVal = convertValue(subEntry.getValue());
                    if (subVal != null) {
                        subFields.put(subEntry.getKey().toString(), subVal);
                    }
                }
            }
            return Collections.singletonMap("mapValue", Collections.singletonMap("fields", subFields));
        }
        if (value instanceof Collection<?> coll) {
            List<Map<String, Object>> arrayValues = new ArrayList<>();
            for (Object item : coll) {
                Map<String, Object> itemVal = convertValue(item);
                if (itemVal != null) {
                    arrayValues.add(itemVal);
                }
            }
            return Collections.singletonMap("arrayValue", Collections.singletonMap("values", arrayValues));
        }
        return Collections.singletonMap("stringValue", String.valueOf(value));
    }

    /**
     * Dispatches an outbox event to Cloud Firestore via idempotent PATCH.
     * Verifies that the write is confirmed by Firestore before transitioning to DELIVERED.
     */
    public void tryDispatchEvent(FirebaseAuditOutbox outbox, Map<String, Object> eventPayload) {
        if (!firebaseConfigured) {
            outbox.setStatus("PENDING");
            outbox.setErrorMessage("Firebase offline or unconfigured. Event queued safely in MySQL outbox.");
            outbox.setLastAttemptAt(LocalDateTime.now());
            outboxRepository.save(outbox);
            return;
        }

        try {
            String firestoreUrl = buildFirestoreDocUrl(auditCollection, outbox.getEventId());
            Map<String, Object> firestoreBody = convertToFirestoreDocument(eventPayload);

            ResponseEntity<String> response = restClient.patch()
                    .uri(firestoreUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(firestoreBody)
                    .retrieve()
                    .toEntity(String.class);

            if (response.getStatusCode().is2xxSuccessful()
                    && response.getBody() != null
                    && response.getBody().contains(outbox.getEventId())) {

                outbox.setStatus("DELIVERED");
                outbox.setDeliveredAt(LocalDateTime.now());
                outbox.setLastAttemptAt(LocalDateTime.now());
                outbox.setErrorMessage(null);
                outboxRepository.save(outbox);
                log.info("Confirmed successful Firestore delivery for event [{}] in collection [{}]",
                        outbox.getEventId(), auditCollection);
            } else {
                throw new IllegalStateException("Firestore response unconfirmed (status: "
                        + response.getStatusCode() + ")");
            }
        } catch (Exception e) {
            outbox.setRetryCount(outbox.getRetryCount() + 1);
            outbox.setLastAttemptAt(LocalDateTime.now());
            String errorMsg = e.getMessage() != null && e.getMessage().length() > 490
                    ? e.getMessage().substring(0, 490) : (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            outbox.setErrorMessage(errorMsg);

            if (outbox.getRetryCount() >= 5) {
                outbox.setStatus("FAILED");
            } else {
                outbox.setStatus("PENDING");
            }
            outboxRepository.save(outbox);
            log.warn("Firebase audit dispatch failed for event [{}], queued in outbox (attempt {}/5): {}",
                    outbox.getEventId(), outbox.getRetryCount(), errorMsg);
        }
    }

    /**
     * Retries pending events in the MySQL outbox.
     * Retries are idempotent: calling multiple times overwrites the exact same document in Firestore.
     */
    @Transactional
    public FirebaseOutboxStatusDto retryPendingOutbox() {
        List<FirebaseAuditOutbox> pending = outboxRepository.findByStatus("PENDING");
        int retriedCount = 0;
        int deliveredCount = 0;

        for (FirebaseAuditOutbox outbox : pending) {
            retriedCount++;
            try {
                Map<String, Object> payloadMap = objectMapper.readValue(outbox.getPayload(),
                        new TypeReference<Map<String, Object>>() {});
                tryDispatchEvent(outbox, payloadMap);
                if ("DELIVERED".equals(outbox.getStatus())) {
                    deliveredCount++;
                }
            } catch (Exception e) {
                outbox.setRetryCount(outbox.getRetryCount() + 1);
                outbox.setLastAttemptAt(LocalDateTime.now());
                outbox.setErrorMessage("Retry parse/dispatch failure: " + e.getMessage());
                outboxRepository.save(outbox);
            }
        }

        log.info("Retried {} pending Firebase outbox events, {} successfully delivered", retriedCount, deliveredCount);
        return getOutboxStatus();
    }

    public FirebaseOutboxStatusDto getOutboxStatus() {
        long pending = outboxRepository.countByStatus("PENDING");
        long delivered = outboxRepository.countByStatus("DELIVERED");
        long failed = outboxRepository.countByStatus("FAILED");

        List<FirebaseAuditOutbox> recentOutbox = outboxRepository.findRecentOutbox(PageRequest.of(0, 15));
        LocalDateTime lastDelivered = recentOutbox.stream()
                .filter(o -> o.getDeliveredAt() != null)
                .map(FirebaseAuditOutbox::getDeliveredAt)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        List<SecurityAuditEventDto> dtoList = recentOutbox.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return new FirebaseOutboxStatusDto(pending, delivered, failed, lastDelivered, firebaseConfigured, dtoList);
    }

    public List<SecurityAuditEventDto> getRecentEvents(int limit) {
        return outboxRepository.findRecentOutbox(PageRequest.of(0, Math.min(limit, 100)))
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private SecurityAuditEventDto toDto(FirebaseAuditOutbox outbox) {
        boolean success = true;
        String reasonCategory = "INFO";
        String correlationId = null;
        String source = "APPLICATION_BACKEND";
        String details = outbox.getPayload();

        try {
            Map<String, Object> map = objectMapper.readValue(outbox.getPayload(),
                    new TypeReference<Map<String, Object>>() {});
            if (map.containsKey("success") && map.get("success") instanceof Boolean b) {
                success = b;
            }
            if (map.containsKey("reasonCategory") && map.get("reasonCategory") != null) {
                reasonCategory = map.get("reasonCategory").toString();
            }
            if (map.containsKey("correlationId") && map.get("correlationId") != null) {
                correlationId = map.get("correlationId").toString();
            }
            if (map.containsKey("source") && map.get("source") != null) {
                source = map.get("source").toString();
            }
        } catch (Exception ignored) {
        }

        return new SecurityAuditEventDto(
                outbox.getId(),
                outbox.getEventId(),
                outbox.getEventType(),
                outbox.getAccountRef(),
                outbox.getCreatedAt(),
                success,
                reasonCategory,
                correlationId,
                source,
                outbox.getStatus(),
                details
        );
    }
}
