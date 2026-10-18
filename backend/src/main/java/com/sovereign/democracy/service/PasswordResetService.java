package com.sovereign.democracy.service;

import com.sovereign.democracy.dto.ForgotPasswordRequest;
import com.sovereign.democracy.dto.ResetPasswordRequest;
import com.sovereign.democracy.entity.PasswordResetToken;
import com.sovereign.democracy.entity.UserAccount;
import com.sovereign.democracy.exception.BadRequestException;
import com.sovereign.democracy.repository.PasswordResetTokenRepository;
import com.sovereign.democracy.repository.UserAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final String GENERIC_RECOVERY_MESSAGE =
            "If an account matches the information provided and has an eligible recovery method, password reset instructions will be sent.";

    private final UserAccountRepository userAccountRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final FirebaseAuditService firebaseAuditService;
    private final AuditLogService auditLogService;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetService(
            UserAccountRepository userAccountRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            FirebaseAuditService firebaseAuditService,
            AuditLogService auditLogService) {
        this.userAccountRepository = userAccountRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.firebaseAuditService = firebaseAuditService;
        this.auditLogService = auditLogService;
    }

    /**
     * Handles forgot-password requests with strict timing and enumeration defenses.
     * Always returns the same generic confirmation message.
     */
    @Transactional
    public String requestPasswordReset(ForgotPasswordRequest request, String ipAddress) {
        if (request == null || request.getIdentifier() == null || request.getIdentifier().trim().isEmpty()) {
            return GENERIC_RECOVERY_MESSAGE;
        }

        String identifier = request.getIdentifier().trim();
        Optional<UserAccount> accountOpt = userAccountRepository.findByUsernameIgnoreCaseOrRecoveryEmailIgnoreCase(
                identifier, identifier);

        if (accountOpt.isEmpty()) {
            log.info("Password reset requested for unrecognized identifier from IP [{}]", ipAddress);
            firebaseAuditService.recordSecurityEvent(
                    "PASSWORD_RESET_REQUESTED",
                    "UNKNOWN",
                    false,
                    "ACCOUNT_NOT_FOUND",
                    null,
                    "PASSWORD_RESET_SERVICE",
                    Map.of("identifierQuery", maskQuery(identifier)),
                    ipAddress
            );
            return GENERIC_RECOVERY_MESSAGE;
        }

        UserAccount account = accountOpt.get();

        if (account.getRecoveryEmail() == null || account.getRecoveryEmail().trim().isEmpty()) {
            log.warn("Password reset requested for account [{}] with no recovery email configured", account.getUsername());
            firebaseAuditService.recordSecurityEvent(
                    "PASSWORD_RESET_REQUESTED",
                    account.getUsername(),
                    false,
                    "NO_RECOVERY_EMAIL",
                    null,
                    "PASSWORD_RESET_SERVICE",
                    Map.of("username", account.getUsername()),
                    ipAddress
            );
            return GENERIC_RECOVERY_MESSAGE;
        }

        // Invalidate any previously active tokens for this account
        tokenRepository.invalidateAllActiveTokensForUser(account, LocalDateTime.now());

        // Generate 32 bytes (256 bits) secure raw token
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String rawToken = HexFormat.of().formatHex(tokenBytes);

        // Compute SHA-256 hash for database storage
        String tokenHash = sha256Hex(rawToken);

        // Token expires in 15 minutes
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);

        PasswordResetToken resetToken = new PasswordResetToken(account, tokenHash, expiresAt);
        tokenRepository.save(resetToken);

        // Dispatch reset email with URL hash fragment
        emailService.sendPasswordResetEmail(account.getRecoveryEmail(), rawToken);

        // Audit log and Firebase outbox
        auditLogService.logAction(
                account.getUsername(),
                account.getRole().name(),
                "PASSWORD_RESET_REQUESTED",
                "UserAccount:" + account.getUsername(),
                "Password reset token generated with 15-minute validity",
                ipAddress
        );

        firebaseAuditService.recordSecurityEvent(
                "PASSWORD_RESET_REQUESTED",
                account.getUsername(),
                true,
                "TOKEN_ISSUED",
                null,
                "PASSWORD_RESET_SERVICE",
                Map.of("username", account.getUsername(), "expiresAt", expiresAt.toString()),
                ipAddress
        );

        return GENERIC_RECOVERY_MESSAGE;
    }

    /**
     * Resets user password upon providing a valid, unexpired, un-exhausted single-use token.
     * Updates BCrypt password hash and sets password_changed_at to invalidate prior JWTs.
     */
    @Transactional
    public String resetPassword(ResetPasswordRequest request, String ipAddress) {
        if (request == null || request.getToken() == null || request.getToken().trim().isEmpty()) {
            throw new BadRequestException("Invalid or missing password reset token.");
        }
        if (request.getNewPassword() == null || request.getNewPassword().trim().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters long.");
        }

        String rawToken = request.getToken().trim();
        String tokenHash = sha256Hex(rawToken);

        PasswordResetToken token = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> {
                    firebaseAuditService.recordSecurityEvent(
                            "PASSWORD_RESET_FAILED",
                            "UNKNOWN",
                            false,
                            "INVALID_TOKEN_HASH",
                            null,
                            "PASSWORD_RESET_SERVICE",
                            Map.of("reason", "Token hash not found"),
                            ipAddress
                    );
                    return new BadRequestException("Invalid, expired, or previously used password reset token.");
                });

        if (token.getUsedAt() != null) {
            firebaseAuditService.recordSecurityEvent(
                    "PASSWORD_RESET_FAILED",
                    token.getUserAccount().getUsername(),
                    false,
                    "TOKEN_ALREADY_USED",
                    null,
                    "PASSWORD_RESET_SERVICE",
                    Map.of("usedAt", token.getUsedAt().toString()),
                    ipAddress
            );
            throw new BadRequestException("This password reset token has already been used. Please request a new one.");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            firebaseAuditService.recordSecurityEvent(
                    "PASSWORD_RESET_FAILED",
                    token.getUserAccount().getUsername(),
                    false,
                    "TOKEN_EXPIRED",
                    null,
                    "PASSWORD_RESET_SERVICE",
                    Map.of("expiresAt", token.getExpiresAt().toString()),
                    ipAddress
            );
            throw new BadRequestException("This password reset token has expired. Tokens are valid for 20 minutes.");
        }

        if (token.getFailedAttempts() >= 5) {
            firebaseAuditService.recordSecurityEvent(
                    "PASSWORD_RESET_FAILED",
                    token.getUserAccount().getUsername(),
                    false,
                    "BRUTE_FORCE_LOCKOUT",
                    null,
                    "PASSWORD_RESET_SERVICE",
                    Map.of("failedAttempts", token.getFailedAttempts()),
                    ipAddress
            );
            throw new BadRequestException("This reset link has been locked due to too many failed verification attempts.");
        }

        UserAccount account = token.getUserAccount();

        // 1. Update password hash with BCrypt
        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword().trim()));

        // 2. Set password_changed_at timestamp to immediately invalidate all existing active JWTs
        LocalDateTime now = LocalDateTime.now();
        account.setPasswordChangedAt(now);
        userAccountRepository.save(account);

        // 3. Mark token as consumed
        token.setUsedAt(now);
        tokenRepository.save(token);

        // 4. Invalidate any remaining tokens for this user
        tokenRepository.invalidateAllActiveTokensForUser(account, now);

        // 5. Synchronize member metadata to Firebase
        firebaseAuditService.syncMemberMetadata(account);

        // 6. Record audit entries
        auditLogService.logAction(
                account.getUsername(),
                account.getRole().name(),
                "PASSWORD_RESET_SUCCESSFUL",
                "UserAccount:" + account.getUsername(),
                "Password successfully reset. Prior sessions invalidated.",
                ipAddress
        );

        firebaseAuditService.recordSecurityEvent(
                "PASSWORD_RESET_SUCCESSFUL",
                account.getUsername(),
                true,
                "PASSWORD_CHANGED",
                null,
                "PASSWORD_RESET_SERVICE",
                Map.of("username", account.getUsername(), "timestamp", now.toString()),
                ipAddress
        );

        return "Password has been successfully reset. You can now log in with your new password.";
    }

    public static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 message digest algorithm not available", e);
        }
    }

    private String maskQuery(String query) {
        if (query.length() <= 3) return "***";
        return query.charAt(0) + "***" + query.charAt(query.length() - 1);
    }
}
