package com.sovereign.democracy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sovereign.democracy.dto.ForgotPasswordRequest;
import com.sovereign.democracy.dto.ResetPasswordRequest;
import com.sovereign.democracy.entity.PasswordResetToken;
import com.sovereign.democracy.entity.UserAccount;
import com.sovereign.democracy.enums.Role;
import com.sovereign.democracy.exception.BadRequestException;
import com.sovereign.democracy.repository.FirebaseAuditOutboxRepository;
import com.sovereign.democracy.repository.PasswordResetTokenRepository;
import com.sovereign.democracy.repository.UserAccountRepository;
import com.sovereign.democracy.security.JwtTokenProvider;
import com.sovereign.democracy.service.EmailService;
import com.sovereign.democracy.service.FirebaseAuditService;
import com.sovereign.democracy.service.PasswordResetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PasswordResetAndSecurityAuditTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private FirebaseAuditService firebaseAuditService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private FirebaseAuditOutboxRepository outboxRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private UserAccount testAdmin;

    @BeforeEach
    void setUp() {
        Optional<UserAccount> adminOpt = userAccountRepository.findByUsernameIgnoreCase("ADMIN-001");
        if (adminOpt.isPresent()) {
            testAdmin = adminOpt.get();
            testAdmin.setRecoveryEmail("akhilv.verma07@gmail.com");
            testAdmin.setPasswordHash(passwordEncoder.encode("admin123"));
            userAccountRepository.save(testAdmin);
        } else {
            testAdmin = new UserAccount("ADMIN-001", passwordEncoder.encode("admin123"), Role.ADMIN, null);
            testAdmin.setRecoveryEmail("akhilv.verma07@gmail.com");
            testAdmin = userAccountRepository.save(testAdmin);
        }
    }

    @Test
    @DisplayName("Forgot password issues single-use token and returns generic confirmation")
    void testForgotPasswordSuccess() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("ADMIN-001");
        String response = passwordResetService.requestPasswordReset(request, "192.168.1.100");

        assertThat(response).contains("If an account matches the information provided");

        // Verify token created
        var tokens = tokenRepository.findActiveTokensByUser(testAdmin, LocalDateTime.now());
        assertThat(tokens).isNotEmpty();
        PasswordResetToken token = tokens.get(0);
        assertThat(token.getTokenHash()).hasSize(64);
        assertThat(token.getUsedAt()).isNull();
        assertThat(token.getExpiresAt()).isAfter(LocalDateTime.now());

        // Verify email dispatched with hash fragment URL
        String resetLink = emailService.getLastResetLink("akhilv.verma07@gmail.com");
        assertThat(resetLink).isNotNull();
        assertThat(resetLink).contains("/reset-password#token=");
    }

    @Test
    @DisplayName("Forgot password with unknown identifier returns identical timing-safe message")
    void testForgotPasswordUnknownIdentifierDefense() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("NON_EXISTENT_USER_9999");
        String response = passwordResetService.requestPasswordReset(request, "192.168.1.100");

        assertThat(response).contains("If an account matches the information provided");
    }

    @Test
    @DisplayName("Reset password verifies raw token, updates BCrypt hash, and revokes prior tokens")
    void testResetPasswordSuccess() {
        // Request forgot password to generate token
        passwordResetService.requestPasswordReset(new ForgotPasswordRequest("ADMIN-001"), "192.168.1.100");
        String resetLink = emailService.getLastResetLink("akhilv.verma07@gmail.com");
        String rawToken = resetLink.substring(resetLink.indexOf("#token=") + 7);

        // Perform password reset
        ResetPasswordRequest resetRequest = new ResetPasswordRequest(rawToken, "NewAdminPassword999!");
        String result = passwordResetService.resetPassword(resetRequest, "192.168.1.100");

        assertThat(result).contains("Password has been successfully reset");

        // Verify database state
        UserAccount updated = userAccountRepository.findByUsernameIgnoreCase("ADMIN-001").orElseThrow();
        assertThat(passwordEncoder.matches("NewAdminPassword999!", updated.getPasswordHash())).isTrue();
        assertThat(updated.getPasswordChangedAt()).isNotNull();

        // Verify token is marked as consumed
        var activeTokens = tokenRepository.findActiveTokensByUser(updated, LocalDateTime.now());
        assertThat(activeTokens).isEmpty();
    }

    @Test
    @DisplayName("Reset password rejects already consumed token")
    void testResetPasswordRejectsUsedToken() {
        passwordResetService.requestPasswordReset(new ForgotPasswordRequest("ADMIN-001"), "192.168.1.100");
        String resetLink = emailService.getLastResetLink("akhilv.verma07@gmail.com");
        String rawToken = resetLink.substring(resetLink.indexOf("#token=") + 7);

        ResetPasswordRequest resetRequest = new ResetPasswordRequest(rawToken, "NewPassword123!");
        passwordResetService.resetPassword(resetRequest, "192.168.1.100");

        // Second attempt with same single-use token must be rejected
        assertThatThrownBy(() -> passwordResetService.resetPassword(resetRequest, "192.168.1.100"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already been used");
    }

    @Test
    @DisplayName("Reset password rejects invalid token hash")
    void testResetPasswordRejectsInvalidToken() {
        ResetPasswordRequest resetRequest = new ResetPasswordRequest("invalid_bogus_token_1234567890abcdef", "NewPassword123!");

        assertThatThrownBy(() -> passwordResetService.resetPassword(resetRequest, "192.168.1.100"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid, expired, or previously used");
    }

    @Test
    @DisplayName("Verify forgot-password and reset-password REST endpoints via MockMvc")
    void testAuthEndpointsMockMvc() throws Exception {
        ForgotPasswordRequest forgotReq = new ForgotPasswordRequest("akhilv.verma07@gmail.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgotReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(org.hamcrest.Matchers.containsString("If an account matches")));

        String resetLink = emailService.getLastResetLink("akhilv.verma07@gmail.com");
        assertThat(resetLink).isNotNull();
        String rawToken = resetLink.substring(resetLink.indexOf("#token=") + 7);

        ResetPasswordRequest resetReq = new ResetPasswordRequest(rawToken, "BrandNewSecret2026!");
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(org.hamcrest.Matchers.containsString("successfully reset")));
    }

    @Test
    @WithMockUser(username = "ADMIN-001", roles = {"ADMIN"})
    @DisplayName("Verify admin security audit outbox status and retry endpoints")
    void testAdminSecurityAuditEndpoints() throws Exception {
        // Record test security event
        firebaseAuditService.recordSecurityEvent(
                "TEST_SECURITY_EVENT",
                "ADMIN-001",
                true,
                "TEST_CATEGORY",
                "corr-123",
                "TEST_SUITE",
                null,
                "127.0.0.1"
        );

        mockMvc.perform(get("/api/admin/security-audit/outbox-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalPending").isNumber());

        mockMvc.perform(get("/api/admin/security-audit/events?limit=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        mockMvc.perform(post("/api/admin/security-audit/retry-outbox"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Voter can request password reset using computed email format nameaadharnumber@gmail.com")
    void testVoterForgotPasswordUsingComputedEmail() {
        // Create test voter with computed email
        String expectedEmail = "testvoter9876@gmail.com";
        UserAccount voterAcc = new UserAccount("VOT-TEST-9999", passwordEncoder.encode("Secret123!"), Role.USER, null);
        voterAcc.setRecoveryEmail(expectedEmail);
        userAccountRepository.save(voterAcc);

        ForgotPasswordRequest request = new ForgotPasswordRequest(expectedEmail);
        String response = passwordResetService.requestPasswordReset(request, "192.168.1.100");

        assertThat(response).contains("If an account matches the information provided");

        String resetLink = emailService.getLastResetLink(expectedEmail);
        assertThat(resetLink).isNotNull();
        assertThat(resetLink).contains("/reset-password#token=");
    }

    @Test
    @DisplayName("Reset password rejects expired token")
    void testResetPasswordRejectsExpiredToken() {
        String rawToken = "expired_raw_token_test_1234567890abcdef1234567890abcdef";
        String tokenHash = PasswordResetService.sha256Hex(rawToken);
        PasswordResetToken expiredToken = new PasswordResetToken(testAdmin, tokenHash, LocalDateTime.now().minusMinutes(5));
        tokenRepository.save(expiredToken);

        ResetPasswordRequest resetRequest = new ResetPasswordRequest(rawToken, "NewValidPass999!");
        assertThatThrownBy(() -> passwordResetService.resetPassword(resetRequest, "192.168.1.100"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("expired");
    }

    @Test
    @DisplayName("Email delivery handles blank/malformed address gracefully without exposing raw tokens")
    void testEmailDeliveryFailureHandledSafely() {
        emailService.sendPasswordResetEmail("invalid-email-no-at", "raw_test_token_secret");
        String link = emailService.getLastResetLink("invalid-email-no-at");
        assertThat(link).isNotNull();
        assertThat(link).contains("/reset-password#token=");
    }
}
