package com.sovereign.democracy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sovereign.democracy.dto.CastVoteRequest;
import com.sovereign.democracy.dto.LoginRequest;
import com.sovereign.democracy.dto.RegisterRequest;
import com.sovereign.democracy.entity.*;
import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.enums.SecretKeyStatus;
import com.sovereign.democracy.repository.*;
import com.sovereign.democracy.service.SecretVotingKeyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import org.springframework.test.annotation.DirtiesContext;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class SecretVotingKeyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ElectionRepository electionRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private VoterRecordRepository voterRecordRepository;

    @Autowired
    private SecretVotingKeyRepository secretVotingKeyRepository;

    @Autowired
    private SecretVotingKeyService secretVotingKeyService;

    private String voterToken;
    private Election election;
    private Candidate candidate;
    private VoterRecord voterRecord;

    @BeforeEach
    void setUp() throws Exception {
        // Register and login a test voter for Mumbai (VOT-MUM-1002, aadhaar 2034)
        voterRecord = voterRecordRepository.findByVoterIdIgnoreCase("VOT-MUM-1002").orElseThrow();
        RegisterRequest regReq = new RegisterRequest("VOT-MUM-1002", "2034", "pass123");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regReq)));

        LoginRequest loginReq = new LoginRequest("VOT-MUM-1002", "pass123");
        MvcResult loginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andReturn();

        Map<?, ?> loginMap = objectMapper.readValue(loginRes.getResponse().getContentAsString(), Map.class);
        Map<?, ?> loginData = (Map<?, ?>) loginMap.get("data");
        voterToken = "Bearer " + loginData.get("token");

        election = electionRepository.findAll().stream()
                .filter(e -> e.getArea().getName().equalsIgnoreCase("Mumbai") && e.getStatus() == ElectionStatus.OPEN)
                .findFirst().orElseThrow();

        candidate = candidateRepository.findByElectionId(election.getId()).get(0);
    }

    @Test
    @DisplayName("Generate key creates high-entropy key, returns raw key once, and stores salted hash verifier")
    void testKeyGenerationAndVerifierStorage() throws Exception {
        MvcResult res = mockMvc.perform(post("/api/voting/keys/generate/" + election.getId())
                        .header("Authorization", voterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.rawKey").isNotEmpty())
                .andExpect(jsonPath("$.data.keyPrefix").isNotEmpty())
                .andExpect(jsonPath("$.data.status").value("ISSUED"))
                .andReturn();

        Map<?, ?> map = objectMapper.readValue(res.getResponse().getContentAsString(), Map.class);
        Map<?, ?> data = (Map<?, ?>) map.get("data");
        String rawKey = (String) data.get("rawKey");
        String prefix = (String) data.get("keyPrefix");

        assertThat(rawKey).startsWith("SVK-");
        assertThat(prefix).isEqualTo(rawKey.substring(0, 8));

        // Verify entity in DB stores verifier hash and salt, NOT the raw key
        SecretVotingKey entity = secretVotingKeyRepository
                .findTopByElectionAndVoterRecordAndStatusOrderByIssuedAtDesc(election, voterRecord, SecretKeyStatus.ISSUED)
                .orElseThrow();

        assertThat(entity.getKeyHash()).isNotEqualTo(rawKey);
        assertThat(entity.getKeyHash()).hasSize(64); // SHA-256 hex string
        assertThat(entity.getKeySalt()).isNotEmpty();

        // Status endpoint must NOT leak raw key
        mockMvc.perform(get("/api/voting/keys/status/" + election.getId())
                        .header("Authorization", voterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rawKey").doesNotExist())
                .andExpect(jsonPath("$.data.keyPrefix").value(prefix))
                .andExpect(jsonPath("$.data.status").value("ISSUED"));
    }

    @Test
    @DisplayName("Successful ballot cast using valid secret key consumes key and prevents reuse")
    void testValidKeyConsumptionAndOneTimeUse() throws Exception {
        // 1. Generate key
        MvcResult res = mockMvc.perform(post("/api/voting/keys/generate/" + election.getId())
                        .header("Authorization", voterToken))
                .andExpect(status().isOk())
                .andReturn();

        Map<?, ?> map = objectMapper.readValue(res.getResponse().getContentAsString(), Map.class);
        Map<?, ?> data = (Map<?, ?>) map.get("data");
        String rawKey = (String) data.get("rawKey");

        // 2. Cast ballot with secret key
        CastVoteRequest voteReq = new CastVoteRequest(election.getId(), candidate.getId(), rawKey);
        mockMvc.perform(post("/api/voting/cast")
                        .header("Authorization", voterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(voteReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.receiptCode").isNotEmpty());

        // 3. Key in DB is marked CONSUMED
        SecretVotingKey entity = secretVotingKeyRepository.findById(
                secretVotingKeyRepository.findByElectionAndVoterRecordOrderByIssuedAtDesc(election, voterRecord).get(0).getId()
        ).orElseThrow();
        assertThat(entity.getStatus()).isEqualTo(SecretKeyStatus.CONSUMED);
        assertThat(entity.getConsumedAt()).isNotNull();

        // 4. Repeated use of same key fails
        mockMvc.perform(post("/api/voting/cast")
                        .header("Authorization", voterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(voteReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Invalid secret key is rejected and locks after 5 failed attempts")
    void testInvalidKeyAndBruteForceLockout() throws Exception {
        // 1. Generate key
        mockMvc.perform(post("/api/voting/keys/generate/" + election.getId())
                        .header("Authorization", voterToken))
                .andExpect(status().isOk());

        // 2. Try 4 incorrect keys -> all fail with remaining attempts message
        CastVoteRequest wrongReq = new CastVoteRequest(election.getId(), candidate.getId(), "SVK-0000-0000-0000-0000");
        for (int i = 1; i <= 4; i++) {
            mockMvc.perform(post("/api/voting/cast")
                            .header("Authorization", voterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(wrongReq)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("attempts remaining")));
        }

        // 3. 5th incorrect attempt -> locks key
        mockMvc.perform(post("/api/voting/cast")
                        .header("Authorization", voterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("locked")));

        // 4. Any further attempt reports locked
        mockMvc.perform(post("/api/voting/cast")
                        .header("Authorization", voterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("locked")));
    }

    @Test
    @DisplayName("Reissuance revokes old key and creates a fresh valid key")
    void testKeyReissuance() throws Exception {
        // 1. Generate initial key
        MvcResult res1 = mockMvc.perform(post("/api/voting/keys/generate/" + election.getId())
                        .header("Authorization", voterToken))
                .andExpect(status().isOk())
                .andReturn();
        String key1 = (String) ((Map<?, ?>) objectMapper.readValue(res1.getResponse().getContentAsString(), Map.class).get("data")).get("rawKey");

        // 2. Force reissue
        MvcResult res2 = mockMvc.perform(post("/api/voting/keys/generate/" + election.getId() + "?forceReissue=true")
                        .header("Authorization", voterToken))
                .andExpect(status().isOk())
                .andReturn();
        String key2 = (String) ((Map<?, ?>) objectMapper.readValue(res2.getResponse().getContentAsString(), Map.class).get("data")).get("rawKey");

        assertThat(key2).isNotEqualTo(key1);

        // 3. Trying to cast with old key1 fails
        CastVoteRequest oldReq = new CastVoteRequest(election.getId(), candidate.getId(), key1);
        mockMvc.perform(post("/api/voting/cast")
                        .header("Authorization", voterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oldReq)))
                .andExpect(status().isBadRequest());

        // 4. Casting with new key2 succeeds
        CastVoteRequest newReq = new CastVoteRequest(election.getId(), candidate.getId(), key2);
        mockMvc.perform(post("/api/voting/cast")
                        .header("Authorization", voterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newReq)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Constituency protection prevents key generation for election outside voter's area")
    void testConstituencyRestrictionOnKeyGeneration() throws Exception {
        // Find Delhi election (voter is registered in Mumbai)
        Election delhiElection = electionRepository.findAll().stream()
                .filter(e -> e.getArea().getName().equalsIgnoreCase("Delhi"))
                .findFirst().orElseThrow();

        mockMvc.perform(post("/api/voting/keys/generate/" + delhiElection.getId())
                        .header("Authorization", voterToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Constituency Mismatch")));
    }

    @Test
    @DisplayName("Unauthenticated request to generate or status check keys is rejected")
    void testUnauthorizedKeyAccess() throws Exception {
        mockMvc.perform(post("/api/voting/keys/generate/" + election.getId()))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/voting/keys/status/" + election.getId()))
                .andExpect(status().isForbidden());
    }
}
