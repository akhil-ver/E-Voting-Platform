package com.sovereign.democracy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sovereign.democracy.dto.FirebaseOutboxStatusDto;
import com.sovereign.democracy.entity.FirebaseAuditOutbox;
import com.sovereign.democracy.repository.FirebaseAuditOutboxRepository;
import com.sovereign.democracy.service.FirebaseAuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

public class FirebaseFirestoreAuditTest {

    private FirebaseAuditOutboxRepository outboxRepository;
    private ObjectMapper objectMapper;
    private RestClient.Builder restClientBuilder;
    private MockRestServiceServer mockServer;
    private FirebaseAuditService firebaseAuditService;

    @BeforeEach
    void setUp() {
        outboxRepository = Mockito.mock(FirebaseAuditOutboxRepository.class);
        objectMapper = new ObjectMapper();
        restClientBuilder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();

        firebaseAuditService = new FirebaseAuditService(
                outboxRepository,
                objectMapper,
                "evotingsystem-4c3a1",
                "test-api-key",
                "https://evotingsystem-4c3a1-default-rtdb.firebaseio.com",
                null,
                "security_audit_logs",
                "member_metadata",
                true
        );
        firebaseAuditService.setRestClient(restClientBuilder.build());
    }

    @Test
    @DisplayName("Confirmed Firestore write transitions outbox event to DELIVERED")
    void testSuccessfulDeliveryToFirestoreConfirmed() {
        String eventId = "evt_test_confirm_123";
        Map<String, Object> payload = Map.of(
                "eventId", eventId,
                "eventType", "PASSWORD_RESET_REQUESTED",
                "success", true,
                "accountRef", "ADMIN-001"
        );

        FirebaseAuditOutbox outbox = new FirebaseAuditOutbox(eventId, "PASSWORD_RESET_REQUESTED", "ADMIN-001", "{}");
        when(outboxRepository.save(any(FirebaseAuditOutbox.class))).thenAnswer(i -> i.getArgument(0));

        // Mock confirmed 200 response from Firestore
        String responseBody = String.format("""
            {
              "name": "projects/evotingsystem-4c3a1/databases/(default)/documents/security_audit_logs/%s",
              "updateTime": "2026-10-19T02:00:00.000000Z"
            }
            """, eventId);

        mockServer.expect(requestTo("https://firestore.googleapis.com/v1/projects/evotingsystem-4c3a1/databases/(default)/documents/security_audit_logs/" + eventId + "?key=test-api-key"))
                .andExpect(method(HttpMethod.PATCH))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        firebaseAuditService.tryDispatchEvent(outbox, payload);

        mockServer.verify();
        assertThat(outbox.getStatus()).isEqualTo("DELIVERED");
        assertThat(outbox.getDeliveredAt()).isNotNull();
        assertThat(outbox.getErrorMessage()).isNull();
        verify(outboxRepository, atLeastOnce()).save(outbox);
    }

    @Test
    @DisplayName("Firestore failure keeps event PENDING and increments retry count")
    void testFirestoreWriteFailureRemainsRetryable() {
        String eventId = "evt_test_failure_456";
        Map<String, Object> payload = Map.of("eventId", eventId);

        FirebaseAuditOutbox outbox = new FirebaseAuditOutbox(eventId, "AUTH_FAILURE", "ANONYMOUS", "{}");
        assertThat(outbox.getRetryCount()).isEqualTo(0);
        when(outboxRepository.save(any(FirebaseAuditOutbox.class))).thenAnswer(i -> i.getArgument(0));

        // Mock 503 Service Unavailable from Firestore
        mockServer.expect(requestTo("https://firestore.googleapis.com/v1/projects/evotingsystem-4c3a1/databases/(default)/documents/security_audit_logs/" + eventId + "?key=test-api-key"))
                .andExpect(method(HttpMethod.PATCH))
                .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE).body("{\"error\": \"Backend temporarily unavailable\"}"));

        firebaseAuditService.tryDispatchEvent(outbox, payload);

        mockServer.verify();
        assertThat(outbox.getStatus()).isEqualTo("PENDING");
        assertThat(outbox.getRetryCount()).isEqualTo(1);
        assertThat(outbox.getDeliveredAt()).isNull();
        assertThat(outbox.getErrorMessage()).isNotNull();
        assertThat(outbox.getErrorMessage()).contains("503");
        verify(outboxRepository, atLeastOnce()).save(outbox);
    }

    @Test
    @DisplayName("Exhausted retries (>5) transitions event status to FAILED")
    void testExhaustedRetriesMarkedFailed() {
        String eventId = "evt_test_exhausted_789";
        Map<String, Object> payload = Map.of("eventId", eventId);

        FirebaseAuditOutbox outbox = new FirebaseAuditOutbox(eventId, "KEY_LOCKOUT", "VOTER-123", "{}");
        outbox.setRetryCount(4); // 5th attempt will exhaust retries
        when(outboxRepository.save(any(FirebaseAuditOutbox.class))).thenAnswer(i -> i.getArgument(0));

        // Mock 500 error
        mockServer.expect(requestTo("https://firestore.googleapis.com/v1/projects/evotingsystem-4c3a1/databases/(default)/documents/security_audit_logs/" + eventId + "?key=test-api-key"))
                .andExpect(method(HttpMethod.PATCH))
                .andRespond(withServerError());

        firebaseAuditService.tryDispatchEvent(outbox, payload);

        mockServer.verify();
        assertThat(outbox.getStatus()).isEqualTo("FAILED");
        assertThat(outbox.getRetryCount()).isEqualTo(5);
        verify(outboxRepository, atLeastOnce()).save(outbox);
    }

    @Test
    @DisplayName("Retries are idempotent and target exact same document ID without creating duplicates")
    void testRetryIdempotency() {
        String eventId = "evt_test_idempotent_999";
        Map<String, Object> payload = Map.of(
                "eventId", eventId,
                "eventType", "PASSWORD_RESET_REQUESTED",
                "success", true
        );

        FirebaseAuditOutbox outbox = new FirebaseAuditOutbox(eventId, "PASSWORD_RESET_REQUESTED", "ADMIN-001", "{}");
        when(outboxRepository.save(any(FirebaseAuditOutbox.class))).thenAnswer(i -> i.getArgument(0));

        String responseBody = String.format("""
            {
              "name": "projects/evotingsystem-4c3a1/databases/(default)/documents/security_audit_logs/%s",
              "updateTime": "2026-10-19T02:00:00.000000Z"
            }
            """, eventId);

        // Attempt 1 succeeds
        mockServer.expect(requestTo("https://firestore.googleapis.com/v1/projects/evotingsystem-4c3a1/databases/(default)/documents/security_audit_logs/" + eventId + "?key=test-api-key"))
                .andExpect(method(HttpMethod.PATCH))
                .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        firebaseAuditService.tryDispatchEvent(outbox, payload);
        assertThat(outbox.getStatus()).isEqualTo("DELIVERED");

        // Attempt 2 (idempotent re-run) targets the EXACT SAME URL
        mockServer.reset();
        mockServer.expect(requestTo("https://firestore.googleapis.com/v1/projects/evotingsystem-4c3a1/databases/(default)/documents/security_audit_logs/" + eventId + "?key=test-api-key"))
                .andExpect(method(HttpMethod.PATCH))
                .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        firebaseAuditService.tryDispatchEvent(outbox, payload);
        assertThat(outbox.getStatus()).isEqualTo("DELIVERED");
        mockServer.verify();
    }

    @Test
    @DisplayName("Offline or unconfigured Firebase safely queues event in MySQL with PENDING status")
    void testOfflineFirebaseQueuesSafely() {
        FirebaseAuditService offlineService = new FirebaseAuditService(
                outboxRepository,
                objectMapper,
                "evotingsystem-4c3a1",
                "test-api-key",
                null,
                null,
                "security_audit_logs",
                "member_metadata",
                false // disabled
        );

        FirebaseAuditOutbox outbox = new FirebaseAuditOutbox("evt_offline", "LOGIN", "USER", "{}");
        when(outboxRepository.save(any(FirebaseAuditOutbox.class))).thenAnswer(i -> i.getArgument(0));

        offlineService.tryDispatchEvent(outbox, Map.of("eventId", "evt_offline"));

        assertThat(outbox.getStatus()).isEqualTo("PENDING");
        assertThat(outbox.getErrorMessage()).contains("Firebase offline or unconfigured");
        verify(outboxRepository).save(outbox);
    }

    @Test
    @DisplayName("Firestore document converter maps primitives, maps, lists, and nulls correctly")
    void testFirestoreDocumentConversion() {
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("strVal", "Hello World");
        input.put("boolVal", true);
        input.put("intVal", 42);
        input.put("doubleVal", 3.14159);
        input.put("nullVal", null);
        input.put("listVal", List.of("alpha", "beta"));
        input.put("nestedMap", Map.of("subKey", "subVal"));

        Map<String, Object> result = firebaseAuditService.convertToFirestoreDocument(input);

        assertThat(result).containsKey("fields");
        @SuppressWarnings("unchecked")
        Map<String, Object> fields = (Map<String, Object>) result.get("fields");

        assertThat(fields.get("strVal")).isEqualTo(Map.of("stringValue", "Hello World"));
        assertThat(fields.get("boolVal")).isEqualTo(Map.of("booleanValue", true));
        assertThat(fields.get("intVal")).isEqualTo(Map.of("integerValue", "42"));
        assertThat(fields.get("doubleVal")).isEqualTo(Map.of("doubleValue", 3.14159));
        assertThat(fields.get("nullVal")).isEqualTo(Collections.singletonMap("nullValue", null));

        @SuppressWarnings("unchecked")
        Map<String, Object> nested = (Map<String, Object>) fields.get("nestedMap");
        assertThat(nested).containsKey("mapValue");

        @SuppressWarnings("unchecked")
        Map<String, Object> arrayField = (Map<String, Object>) fields.get("listVal");
        assertThat(arrayField).containsKey("arrayValue");
    }
}
