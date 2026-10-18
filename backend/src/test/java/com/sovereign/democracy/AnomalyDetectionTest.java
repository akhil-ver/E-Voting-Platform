package com.sovereign.democracy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sovereign.democracy.ai.anomaly.AnomalyDetectionService;
import com.sovereign.democracy.ai.anomaly.AnomalyFeatureVector;
import com.sovereign.democracy.ai.anomaly.IsolationForestModel;
import com.sovereign.democracy.ai.anomaly.SyntheticElectionDataGenerator;
import com.sovereign.democracy.ai.anomaly.dto.AnomalyEvaluationDto;
import com.sovereign.democracy.ai.anomaly.dto.AnomalyReviewRequest;
import com.sovereign.democracy.dto.LoginRequest;
import com.sovereign.democracy.entity.Area;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.enums.AnomalyReviewStatus;
import com.sovereign.democracy.enums.AnomalySeverity;
import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.repository.AreaRepository;
import com.sovereign.democracy.repository.ElectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class AnomalyDetectionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AreaRepository areaRepository;

    @Autowired
    private ElectionRepository electionRepository;

    @Autowired
    private AnomalyDetectionService anomalyDetectionService;

    @Autowired
    private IsolationForestModel isolationForestModel;

    private String adminToken;
    private String voterToken;
    private Election election;

    @BeforeEach
    void setUp() throws Exception {
        // 1. Authenticate Admin
        LoginRequest adminLogin = new LoginRequest("ADMIN-001", "admin123");
        MvcResult adminResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        Map<?, ?> adminResp = objectMapper.readValue(adminResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> adminData = (Map<?, ?>) adminResp.get("data");
        this.adminToken = "Bearer " + adminData.get("token");

        // 2. Register and Authenticate Citizen Voter
        MvcResult voterRegResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"electionId\":\"VOT-MUM-1002\",\"aadhaarLast4\":\"2034\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        Map<?, ?> voterResp = objectMapper.readValue(voterRegResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> voterData = (Map<?, ?>) voterResp.get("data");
        this.voterToken = "Bearer " + voterData.get("token");

        // 3. Setup test election
        Area area = areaRepository.findByAreaCodeIgnoreCase("AREA-MUM").orElseThrow();
        election = new Election(
                "MUNICIPAL-2026-ANOMALY",
                "Municipal Anomaly Audit 2026",
                "Anomaly test election",
                area,
                LocalDateTime.now().minusHours(2),
                LocalDateTime.now().plusDays(1)
        );
        election.setStatus(ElectionStatus.OPEN);
        election = electionRepository.save(election);
    }

    @Test
    @DisplayName("Unit: Isolation Forest normal operational telemetry produces score below warning threshold")
    void testIsolationForest_normalActivityScoresLow() {
        // Typical normal polling telemetry
        double[] normalVector = new double[] { 0.8, 0.0, 0.0, 1.0, 0.0, 3.5, 0.2 };
        double score = isolationForestModel.computeScore(normalVector);

        assertThat(score).isLessThan(IsolationForestModel.WARNING_THRESHOLD);
    }

    @Test
    @DisplayName("Unit: Isolation Forest flags synthetic anomaly scenarios above warning threshold")
    void testIsolationForest_syntheticAnomaliesScoreHigh() {
        // Scenario 1: Vote flooding (rapid submit burst)
        double[] voteFlood = new double[] { 35.0, 2.0, 0.0, 1.0, 8.0, 25.0, 34.2 };
        double floodScore = isolationForestModel.computeScore(voteFlood);
        assertThat(floodScore).isGreaterThanOrEqualTo(IsolationForestModel.WARNING_THRESHOLD);

        // Scenario 2: Brute-force credential stuffing
        double[] authAttack = new double[] { 0.5, 2.0, 0.0, 65.0, 0.0, 4.0, 0.3 };
        double authScore = isolationForestModel.computeScore(authAttack);
        assertThat(authScore).isGreaterThanOrEqualTo(IsolationForestModel.WARNING_THRESHOLD);

        // Scenario 3: Duplicate vote storm
        double[] dupStorm = new double[] { 1.2, 8.0, 30.0, 0.0, 1.0, 5.0, 0.4 };
        double dupScore = isolationForestModel.computeScore(dupStorm);
        assertThat(dupScore).isGreaterThanOrEqualTo(IsolationForestModel.WARNING_THRESHOLD);

        // Scenario 4: Blockchain RPC congestion / stall
        double[] btxStall = new double[] { 0.9, 0.0, 0.0, 0.0, 35.0, 350.0, 0.1 };
        double stallScore = isolationForestModel.computeScore(btxStall);
        assertThat(stallScore).isGreaterThanOrEqualTo(IsolationForestModel.WARNING_THRESHOLD);
    }

    @Test
    @DisplayName("Unit: Isolation Forest handles extreme and boundary metric values safely")
    void testIsolationForest_extremeValues() {
        // Zero values
        double[] zeros = new double[] { 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 };
        double zeroScore = isolationForestModel.computeScore(zeros);
        assertThat(zeroScore).isBetween(0.0, 1.0);

        // Massive extreme values
        double[] massive = new double[] { 9999.0, 999.0, 999.0, 999.0, 999.0, 9999.0, 9999.0 };
        double massiveScore = isolationForestModel.computeScore(massive);
        assertThat(massiveScore).isGreaterThan(0.70);
    }

    @Test
    @DisplayName("Unit: Isolation Forest training is strictly reproducible given fixed seed")
    void testIsolationForest_reproducibility() {
        IsolationForestModel m1 = new IsolationForestModel(50, 128, 12345L);
        IsolationForestModel m2 = new IsolationForestModel(50, 128, 12345L);

        List<double[]> data = SyntheticElectionDataGenerator.getNormalTrainingData(200, 42L);
        m1.fit(data);
        m2.fit(data);

        double[] sample = new double[] { 2.5, 1.0, 0.0, 2.0, 1.0, 6.0, 1.7 };
        assertThat(m1.computeScore(sample)).isEqualTo(m2.computeScore(sample));
    }

    @Test
    @DisplayName("Security: Detailed anomaly endpoints strictly reject unauthenticated and citizen users")
    void testAnomalyEndpoints_authorization() throws Exception {
        // Unauthenticated access rejected with 403 Forbidden
        mockMvc.perform(get("/api/ai/anomalies/elections/" + election.getId()))
                .andExpect(status().isForbidden());

        // Ordinary voter access forbidden (requires ADMIN)
        mockMvc.perform(get("/api/ai/anomalies/elections/" + election.getId())
                        .header("Authorization", voterToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Integration: Administrator evaluates election anomaly telemetry successfully")
    void testAdminAnomalyEvaluation_success() throws Exception {
        mockMvc.perform(get("/api/ai/anomalies/elections/" + election.getId())
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.electionId").value(election.getId()))
                .andExpect(jsonPath("$.data.electionCode").value(election.getElectionCode()))
                .andExpect(jsonPath("$.data.modelVersion").value("IsolationForest-v1.0"))
                .andExpect(jsonPath("$.data.anomalyScore").isNumber())
                .andExpect(jsonPath("$.data.severity").exists())
                .andExpect(jsonPath("$.data.primaryReason").isNotEmpty())
                .andExpect(jsonPath("$.data.featureVector").exists());
    }

    @Test
    @DisplayName("Integration: Administrator reviews anomaly alert, updates review status and notes")
    void testAdminAnomalyReviewWorkflow() throws Exception {
        // 1. Manually evaluate election
        AnomalyEvaluationDto evaluation = anomalyDetectionService.evaluateElection(election.getId());
        assertThat(evaluation).isNotNull();

        // 2. Fetch list of anomaly alerts
        mockMvc.perform(get("/api/ai/anomalies")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 3. If an alert exists, update review status
        if (evaluation.getId() != null) {
            AnomalyReviewRequest reviewReq = new AnomalyReviewRequest(
                    AnomalyReviewStatus.CONFIRMED_INCIDENT,
                    "Verified network bottleneck causing temporary voter retry loop."
            );

            mockMvc.perform(patch("/api/ai/anomalies/" + evaluation.getId() + "/review")
                            .header("Authorization", adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(reviewReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.reviewStatus").value("CONFIRMED_INCIDENT"))
                    .andExpect(jsonPath("$.data.adminNotes").value("Verified network bottleneck causing temporary voter retry loop."))
                    .andExpect(jsonPath("$.data.reviewedBy").isNotEmpty());
        }
    }

    @Test
    @DisplayName("Feature 2: Public AI Election Insights is accessible unauthenticated and excludes sensitive fields")
    void testPublicInsights_unauthenticatedAndPrivacySafe() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/ai/elections/" + election.getId() + "/public-insights"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.electionId").value(election.getId()))
                .andExpect(jsonPath("$.data.electionName").value(election.getName()))
                .andExpect(jsonPath("$.data.overallTurnoutPercentage").isNumber())
                .andExpect(jsonPath("$.data.overallVotingSpeedPerMin").isNumber())
                .andExpect(jsonPath("$.data.participationTrend").isNotEmpty())
                .andExpect(jsonPath("$.data.overallParticipationTier").isNotEmpty())
                .andExpect(jsonPath("$.data.publicSummary").isNotEmpty())
                .andExpect(jsonPath("$.data.areaTurnouts").isArray())
                // Ensure sensitive operational and voter data are strictly excluded
                .andExpect(jsonPath("$.data.anomalyScore").doesNotExist())
                .andExpect(jsonPath("$.data.blockchainLatencySec").doesNotExist())
                .andExpect(jsonPath("$.data.authFailuresCount").doesNotExist())
                .andExpect(jsonPath("$.data.rejectedDuplicateAttempts").doesNotExist())
                .andExpect(jsonPath("$.data.secretVotingKey").doesNotExist())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertThat(body).doesNotContain("aadhaar");
        assertThat(body).doesNotContain("password");
        assertThat(body).doesNotContain("privateKey");
    }

    @Test
    @DisplayName("Feature 2: Authenticated voter can also view public election insights")
    void testPublicInsights_authenticatedVoter() throws Exception {
        mockMvc.perform(get("/api/ai/elections/" + election.getId() + "/public-insights")
                        .header("Authorization", voterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.electionCode").value(election.getElectionCode()));
    }
}
