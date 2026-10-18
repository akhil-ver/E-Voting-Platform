package com.sovereign.democracy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sovereign.democracy.dto.CastVoteRequest;
import com.sovereign.democracy.dto.LoginRequest;
import com.sovereign.democracy.dto.RegisterRequest;
import com.sovereign.democracy.entity.Area;
import com.sovereign.democracy.entity.Candidate;
import com.sovereign.democracy.entity.Election;
import com.sovereign.democracy.entity.VoterRecord;
import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.repository.AreaRepository;
import com.sovereign.democracy.repository.CandidateRepository;
import com.sovereign.democracy.repository.ElectionRepository;
import com.sovereign.democracy.repository.VoterRecordRepository;
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

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
public class VotingAndVerificationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AreaRepository areaRepository;

    @Autowired
    private VoterRecordRepository voterRecordRepository;

    @Autowired
    private ElectionRepository electionRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    @Test
    @DisplayName("Layer 2 & 3: Ballot Casting, Double-Vote Prevention, and Receipt Verification")
    void testBallotCastingAndVerification() throws Exception {
        Area mumbai = areaRepository.findByAreaCodeIgnoreCase("AREA-MUM").orElseThrow();
        Election election = electionRepository.findByElectionCodeIgnoreCase("ELEC-2026-MUM-01").orElseThrow();

        // Ensure election is OPEN
        election.setStatus(ElectionStatus.OPEN);
        electionRepository.save(election);

        List<Candidate> candidates = candidateRepository.findByElection(election);
        assertThat(candidates).hasSizeGreaterThanOrEqualTo(2);
        Candidate selectedCandidate = candidates.get(0);

        // Pick a synthetic voter from Mumbai
        List<VoterRecord> mumbaiVoters = voterRecordRepository.findByArea(mumbai);
        VoterRecord citizenVoter = mumbaiVoters.get(15); // Use index 15

        // Register voter
        RegisterRequest register = new RegisterRequest(
                citizenVoter.getVoterId(),
                citizenVoter.getAadhaarLast4(),
                "securePass123"
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)));

        // Login as voter
        LoginRequest login = new LoginRequest(citizenVoter.getVoterId(), "securePass123");
        MvcResult loginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        Map<?, ?> loginMap = objectMapper.readValue(loginRes.getResponse().getContentAsString(), Map.class);
        Map<?, ?> loginData = (Map<?, ?>) loginMap.get("data");
        String voterToken = "Bearer " + loginData.get("token");

        // 1a. Generate secret voting key
        MvcResult keyRes = mockMvc.perform(post("/api/voting/keys/generate/" + election.getId())
                        .header("Authorization", voterToken))
                .andExpect(status().isOk())
                .andReturn();
        String secretKey = (String) ((Map<?, ?>) objectMapper.readValue(keyRes.getResponse().getContentAsString(), Map.class).get("data")).get("rawKey");

        // 1b. Cast Ballot successfully
        CastVoteRequest voteReq = new CastVoteRequest(election.getId(), selectedCandidate.getId(), secretKey);
        MvcResult voteRes = mockMvc.perform(post("/api/voting/cast")
                        .header("Authorization", voterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(voteReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.receiptCode").isNotEmpty())
                .andReturn();

        Map<?, ?> voteMap = objectMapper.readValue(voteRes.getResponse().getContentAsString(), Map.class);
        Map<?, ?> voteData = (Map<?, ?>) voteMap.get("data");
        String receiptCode = (String) voteData.get("receiptCode");
        assertThat(receiptCode).startsWith("RCP-");

        // 2. Double-Vote attempt MUST be rejected with 400 Bad Request
        mockMvc.perform(post("/api/voting/cast")
                        .header("Authorization", voterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(voteReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Duplicate vote rejected")));

        // 3. Voter status check endpoint returns hasVoted: true
        mockMvc.perform(get("/api/voting/has-voted/" + election.getId())
                        .header("Authorization", voterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hasVoted").value(true));

        // 4. Voter can retrieve their own authoritative receipt & 256-bit vote hash across sessions
        mockMvc.perform(get("/api/voting/my-receipt/" + election.getId())
                        .header("Authorization", voterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.receiptCode").value(receiptCode))
                .andExpect(jsonPath("$.data.voteHash").isNotEmpty());

        mockMvc.perform(get("/api/voting/my-receipts")
                        .header("Authorization", voterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].receiptCode").value(receiptCode))
                .andExpect(jsonPath("$.data[0].voteHash").isNotEmpty());

        // 5. Public Receipt Verification endpoint confirms receipt inclusion without choice leakage
        MvcResult verifyRes = mockMvc.perform(get("/api/verify/" + receiptCode))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid").value(true))
                .andExpect(jsonPath("$.data.receiptCode").value(receiptCode))
                .andExpect(jsonPath("$.data.electionCode").value(election.getElectionCode()))
                .andExpect(jsonPath("$.data.resultDeclared").value(false))
                .andExpect(jsonPath("$.data.inclusionStatus").value("STILL COUNTING — RESULT NOT DECLARED"))
                .andReturn();

        String verifyJson = verifyRes.getResponse().getContentAsString();
        assertThat(verifyJson).doesNotContain(selectedCandidate.getFullName());
        assertThat(verifyJson).doesNotContain(selectedCandidate.getPartyName());

        // 6. Security Assertion: Public voter directory strictly sanitizes Aadhaar digits and parent names
        mockMvc.perform(get("/api/voters?search=" + citizenVoter.getVoterId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].voterId").value(citizenVoter.getVoterId()))
                .andExpect(jsonPath("$.data.content[0].aadhaarMasked").value("•••• •••• ••••"))
                .andExpect(jsonPath("$.data.content[0].fatherName").doesNotExist())
                .andExpect(jsonPath("$.data.content[0].motherName").doesNotExist());
    }
}
