package com.sovereign.democracy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sovereign.democracy.dto.LoginRequest;
import com.sovereign.democracy.dto.RegisterRequest;
import com.sovereign.democracy.entity.Area;
import com.sovereign.democracy.entity.UserAccount;
import com.sovereign.democracy.entity.VoterRecord;
import com.sovereign.democracy.enums.Role;
import com.sovereign.democracy.repository.AreaRepository;
import com.sovereign.democracy.repository.UserAccountRepository;
import com.sovereign.democracy.repository.VoterRecordRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class Layer1AcceptanceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AreaRepository areaRepository;

    @Autowired
    private VoterRecordRepository voterRecordRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Test
    @DisplayName("Test 1: Initial dataset contains 10 areas and 50 synthetic records per area (500 total)")
    void testInitialDataset() {
        List<Area> areas = areaRepository.findAll();
        assertThat(areas).hasSize(10);

        long totalVoters = voterRecordRepository.count();
        assertThat(totalVoters).isEqualTo(500);

        for (Area area : areas) {
            long countInArea = voterRecordRepository.countByArea(area);
            assertThat(countInArea).isEqualTo(50);
        }
    }

    @Test
    @DisplayName("Test 2: Administrator can log in with valid credentials")
    void testAdminLogin() throws Exception {
        LoginRequest login = new LoginRequest("ADMIN-001", "admin123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("ADMIN-001"))
                .andExpect(jsonPath("$.data.role").value("ADMIN"))
                .andExpect(jsonPath("$.data.token").isNotEmpty());
    }

    @Test
    @DisplayName("Test 3: Passwords are never stored in plaintext (BCrypt check)")
    void testPasswordHashing() {
        UserAccount admin = userAccountRepository.findByUsernameIgnoreCase("ADMIN-001").orElseThrow();
        assertThat(admin.getPasswordHash()).startsWith("$2a$");
        assertThat(admin.getPasswordHash()).isNotEqualTo("admin123");
    }

    @Test
    @DisplayName("Test 4: User registration against existing eligible voter record")
    void testUserRegistrationAndLogin() throws Exception {
        // Voter VOT-MUM-1005 exists in Mumbai
        VoterRecord record = voterRecordRepository.findByVoterIdIgnoreCase("VOT-MUM-1005").orElseThrow();
        String aadhaar = record.getAadhaarLast4();

        RegisterRequest registerReq = new RegisterRequest("VOT-MUM-1005", aadhaar, "mypassword123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.voterId").value("VOT-MUM-1005"))
                .andExpect(jsonPath("$.data.role").value("USER"));

        // Verify that registered user can log in with Election ID and password
        LoginRequest userLogin = new LoginRequest("VOT-MUM-1005", "mypassword123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andReturn();

        String responseBody = loginResult.getResponse().getContentAsString();
        String userToken = objectMapper.readTree(responseBody).path("data").path("token").asText();

        // Test: Ordinary user cannot access admin endpoints (403 Forbidden)
        mockMvc.perform(get("/api/admin/dashboard-stats")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Test 5: Duplicate registration for already registered voter is rejected")
    void testDuplicateRegistrationRejection() throws Exception {
        // Register VOT-MUM-1006
        VoterRecord record = voterRecordRepository.findByVoterIdIgnoreCase("VOT-MUM-1006").orElseThrow();
        RegisterRequest registerReq = new RegisterRequest("VOT-MUM-1006", record.getAadhaarLast4(), "password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk());

        // Attempt second registration for VOT-MUM-1006
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Test 6: Registration fails if Election ID does not exist in authorized records")
    void testRegistrationNonExistentVoterFails() throws Exception {
        RegisterRequest fakeReq = new RegisterRequest("VOT-FAKE-9999", "9999", "securePass123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(fakeReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Test 7: Admin can view dashboard stats and add areas")
    void testAdminAddArea() throws Exception {
        LoginRequest adminLogin = new LoginRequest("ADMIN-001", "admin123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString()).path("data").path("token").asText();

        // View dashboard stats
        mockMvc.perform(get("/api/admin/dashboard-stats")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalAreas").value(10))
                .andExpect(jsonPath("$.data.totalVoterRecords").value(500));
    }
}
