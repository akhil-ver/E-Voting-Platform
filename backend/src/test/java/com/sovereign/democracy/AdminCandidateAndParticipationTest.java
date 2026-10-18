package com.sovereign.democracy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sovereign.democracy.dto.LoginRequest;
import com.sovereign.democracy.dto.RegisterRequest;
import com.sovereign.democracy.entity.*;
import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.repository.*;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminCandidateAndParticipationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AreaRepository areaRepository;

    @Autowired
    private ElectionRepository electionRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private VoterRecordRepository voterRecordRepository;

    @Autowired
    private VoteParticipationRepository voteParticipationRepository;

    @Autowired
    private BallotRecordRepository ballotRecordRepository;

    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        // Authenticate as single root administrator
        LoginRequest adminLogin = new LoginRequest("ADMIN-001", "admin123");
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = res.getResponse().getContentAsString();
        Map<?, ?> map = objectMapper.readValue(responseBody, Map.class);
        Map<?, ?> data = (Map<?, ?>) map.get("data");
        String adminToken = "Bearer " + data.get("token");
        this.adminToken = adminToken;
    }

    @Test
    @DisplayName("Admin Requirement 1: Complete Candidate Management (Add, Edit, List with Party & Symbols)")
    void testCandidateManagement() throws Exception {
        Area area = areaRepository.findByAreaCodeIgnoreCase("AREA-PUN").orElseThrow();

        // 1. Create a fresh test election
        Election election = new Election(
                "ELEC-TEST-PUN-01",
                "Pune Municipal Council Ward 14 Election",
                "Municipal Corporation",
                area,
                LocalDateTime.now().minusHours(1),
                LocalDateTime.now().plusDays(2)
        );
        election.setStatus(ElectionStatus.CONFIGURED);
        Election savedElec = electionRepository.save(election);

        // 2. Admin adds candidate 1
        Map<String, Object> c1 = Map.of(
                "electionId", savedElec.getId(),
                "candidateCode", "CAND-PUN-01",
                "fullName", "Anand Deshmukh",
                "partyName", "Progressive Vikas Party",
                "partySymbol", "Rising Sun ☀️",
                "bio", "Community organizer and municipal reforms advocate."
        );

        mockMvc.perform(post("/api/candidates")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(c1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Anand Deshmukh"))
                .andExpect(jsonPath("$.data.partySymbol").value("Rising Sun ☀️"));

        // 3. Admin edits candidate 1
        Candidate candidate = candidateRepository.findByElectionAndCandidateCodeIgnoreCase(savedElec, "CAND-PUN-01").orElseThrow();
        Map<String, Object> update = Map.of(
                "fullName", "Anand V. Deshmukh",
                "partyName", "Progressive Vikas Mahayuti",
                "partySymbol", "Rising Sun ☀️"
        );

        mockMvc.perform(put("/api/candidates/" + candidate.getId())
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Anand V. Deshmukh"))
                .andExpect(jsonPath("$.data.partyName").value("Progressive Vikas Mahayuti"));

        // 4. Retrieve candidates for election
        mockMvc.perform(get("/api/candidates/election/" + savedElec.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    @DisplayName("Admin Requirement 6: Missing Candidate Validation & Roster Locking")
    void testMissingCandidateValidationAndRosterLocking() throws Exception {
        Area area = areaRepository.findByAreaCodeIgnoreCase("AREA-BLR").orElseThrow();

        // 1. Create election with 0 candidates
        Election election = new Election(
                "ELEC-TEST-BLR-01",
                "Bengaluru South Municipal Council Election",
                "Municipal Corporation",
                area,
                LocalDateTime.now().minusHours(2),
                LocalDateTime.now().plusDays(3)
        );
        election.setStatus(ElectionStatus.CONFIGURED);
        Election savedElec = electionRepository.save(election);

        // 2. Attempt to open election with 0 candidates -> must fail
        mockMvc.perform(post("/api/elections/" + savedElec.getId() + "/open")
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("At least 2 candidates must be registered")));

        // 3. Add 1 candidate and attempt to open -> must still fail
        candidateRepository.save(new Candidate("CAND-BLR-01", savedElec, "Divya Hegde", "Green Future Party", "Tree 🌳", null, "Bio"));

        mockMvc.perform(post("/api/elections/" + savedElec.getId() + "/open")
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("At least 2 candidates must be registered")));

        // 4. Add 2nd candidate -> opening must now succeed
        candidateRepository.save(new Candidate("CAND-BLR-02", savedElec, "Karthik Swaminathan", "Urban Reform Coalition", "Torch 🔥", null, "Bio"));

        mockMvc.perform(post("/api/elections/" + savedElec.getId() + "/open")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("OPEN"));

        // 5. Admin can add a candidate to an active OPEN election
        Map<String, Object> additionalCandidate = Map.of(
                "electionId", savedElec.getId(),
                "candidateCode", "CAND-BLR-03",
                "fullName", "Late Entrant",
                "partyName", "Independent",
                "partySymbol", "Bicycle 🚲"
        );

        mockMvc.perform(post("/api/candidates")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(additionalCandidate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Late Entrant"));

        // 6. Once results are declared, candidate roster is locked
        savedElec.setStatus(ElectionStatus.RESULT_DECLARED);
        electionRepository.save(savedElec);

        Map<String, Object> blockedCandidate = Map.of(
                "electionId", savedElec.getId(),
                "candidateCode", "CAND-BLR-04",
                "fullName", "Blocked Candidate",
                "partyName", "Independent",
                "partySymbol", "Clock ⏰"
        );

        mockMvc.perform(post("/api/candidates")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blockedCandidate)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Candidate roster is locked")));
    }

    @Test
    @DisplayName("Admin Requirements 2, 3, 5: Area-wise Voter Participation List & Zero Candidate Choice Leakage")
    void testVoterParticipationAndPrivacyProtection() throws Exception {
        Area area = areaRepository.findByAreaCodeIgnoreCase("AREA-MUM").orElseThrow();
        Election election = electionRepository.findByElectionCodeIgnoreCase("ELEC-2026-MUM-01").orElseThrow();

        // Grab voters in Mumbai
        List<VoterRecord> mumbaiVoters = voterRecordRepository.findByArea(area);
        assertThat(mumbaiVoters).isNotEmpty();
        VoterRecord voter1 = mumbaiVoters.get(0);
        VoterRecord voter2 = mumbaiVoters.get(1);

        // Record participation for voter1 (voter1 has voted)
        voteParticipationRepository.save(new VoteParticipation(election, voter1));

        // Anonymously deposit a ballot into ballot_records (strictly separate from voter identity)
        List<Candidate> candidates = candidateRepository.findByElection(election);
        Candidate candidate = candidates.get(0);
        ballotRecordRepository.save(new BallotRecord(election, candidate, "sample-anonymized-ballot-hash-12345"));

        // Admin queries voter participation list
        MvcResult result = mockMvc.perform(get("/api/elections/" + election.getId() + "/voter-participation")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andReturn();

        String json = result.getResponse().getContentAsString();

        // 1. Confirm Participation Status: voter1 is 'VOTED', voter2 is 'NOT_VOTED'
        assertThat(json).contains("\"participationStatus\":\"VOTED\"");
        assertThat(json).contains("\"participationStatus\":\"NOT_VOTED\"");

        // 2. PRIVACY GUARANTEE: The participation response must NOT contain any candidate choice info
        assertThat(json).doesNotContain("\"candidateId\"");
        assertThat(json).doesNotContain("\"candidateName\"");
        assertThat(json).doesNotContain("\"ballotHash\"");
        assertThat(json).doesNotContain("sample-anonymized-ballot-hash");
    }

    @Test
    @DisplayName("Admin Requirement 4: Election-Wise Results Publication")
    void testResultsCalculationAndDeclaration() throws Exception {
        Area area = areaRepository.findByAreaCodeIgnoreCase("AREA-DEL").orElseThrow();
        Election election = electionRepository.findByElectionCodeIgnoreCase("ELEC-2026-DEL-02").orElseThrow();

        // Set status to OPEN then CLOSED
        election.setStatus(ElectionStatus.CLOSED);
        electionRepository.save(election);

        List<Candidate> candidates = candidateRepository.findByElection(election);
        Candidate c1 = candidates.get(0);
        Candidate c2 = candidates.get(1);

        // Cast 3 anonymous ballots for c1, 1 for c2
        ballotRecordRepository.save(new BallotRecord(election, c1, "hash-001"));
        ballotRecordRepository.save(new BallotRecord(election, c1, "hash-002"));
        ballotRecordRepository.save(new BallotRecord(election, c1, "hash-003"));
        ballotRecordRepository.save(new BallotRecord(election, c2, "hash-004"));

        // Admin officially declares results
        mockMvc.perform(post("/api/elections/" + election.getId() + "/declare-results")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].candidateCode").value(c1.getCandidateCode()))
                .andExpect(jsonPath("$.data[0].voteCount").value(3))
                .andExpect(jsonPath("$.data[0].votePercentage").value(75.00))
                .andExpect(jsonPath("$.data[0].winner").value(true))
                .andExpect(jsonPath("$.data[1].candidateCode").value(c2.getCandidateCode()))
                .andExpect(jsonPath("$.data[1].voteCount").value(1))
                .andExpect(jsonPath("$.data[1].votePercentage").value(25.00))
                .andExpect(jsonPath("$.data[1].winner").value(false));

        // Public results endpoint should now serve declared results
        mockMvc.perform(get("/api/elections/" + election.getId() + "/results"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(candidates.size()));
    }

    @Test
    @DisplayName("Admin Requirement 7: Admin Role Access Control (Ordinary User Rejected)")
    void testAdminRoleAccessControl() throws Exception {
        Area area = areaRepository.findAll().get(0);
        VoterRecord voter = voterRecordRepository.findByArea(area).get(0);

        // Register voter as ordinary citizen
        RegisterRequest registerRequest = new RegisterRequest(
                voter.getVoterId(),
                voter.getAadhaarLast4(),
                "citizenSecurePass123"
        );
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)));

        // Login as ordinary citizen
        LoginRequest userLogin = new LoginRequest(voter.getVoterId(), "citizenSecurePass123");
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userLogin)))
                .andExpect(status().isOk())
                .andReturn();

        Map<?, ?> map = objectMapper.readValue(res.getResponse().getContentAsString(), Map.class);
        Map<?, ?> data = (Map<?, ?>) map.get("data");
        String userToken = "Bearer " + data.get("token");

        // Citizen attempts to access admin voter participation -> 403 Forbidden
        mockMvc.perform(get("/api/elections/1/voter-participation")
                        .header("Authorization", userToken))
                .andExpect(status().isForbidden());

        // Citizen attempts to add a candidate -> 403 Forbidden
        Map<String, Object> payload = Map.of("electionId", 1, "candidateCode", "TEST", "fullName", "Test");
        mockMvc.perform(post("/api/candidates")
                        .header("Authorization", userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin Feature: Clear Results and Reset Polls to OPEN")
    void testClearResultsAndResetPolls() throws Exception {
        Area area = areaRepository.findAll().get(0);
        Election election = new Election(
                "ELEC-RESET-TEST",
                "Reset Test Election",
                "Municipal",
                area,
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(2)
        );
        election.setStatus(ElectionStatus.CLOSED);
        election = electionRepository.save(election);

        Candidate c1 = candidateRepository.save(new Candidate("CAND-RST-1", election, "Candidate 1", "Party A", "Star ⭐", null, "Bio"));
        Candidate c2 = candidateRepository.save(new Candidate("CAND-RST-2", election, "Candidate 2", "Party B", "Moon 🌙", null, "Bio"));

        // Declare results
        mockMvc.perform(post("/api/elections/" + election.getId() + "/declare-results")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk());

        Election declared = electionRepository.findById(election.getId()).orElseThrow();
        assertThat(declared.getStatus()).isEqualTo(ElectionStatus.RESULT_DECLARED);

        // Clear results and reset
        mockMvc.perform(post("/api/elections/" + election.getId() + "/clear-results")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("OPEN"));

        Election reset = electionRepository.findById(election.getId()).orElseThrow();
        assertThat(reset.getStatus()).isEqualTo(ElectionStatus.OPEN);
        assertThat(reset.getClosureTimestamp()).isNull();
    }
}
