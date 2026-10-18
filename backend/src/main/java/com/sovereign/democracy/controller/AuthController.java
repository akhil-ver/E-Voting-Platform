package com.sovereign.democracy.controller;

import com.sovereign.democracy.dto.*;
import com.sovereign.democracy.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final com.sovereign.democracy.service.PasswordResetService passwordResetService;

    public AuthController(AuthService authService, com.sovereign.democracy.service.PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ipAddress = com.sovereign.democracy.util.ClientIpUtil.getClientIp(httpRequest);
        AuthResponse response = authService.login(request, ipAddress);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = com.sovereign.democracy.util.ClientIpUtil.getClientIp(httpRequest);
        String message = passwordResetService.requestPasswordReset(request, ipAddress);
        return ResponseEntity.ok(ApiResponse.ok(message, message));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = com.sovereign.democracy.util.ClientIpUtil.getClientIp(httpRequest);
        String message = passwordResetService.resetPassword(request, ipAddress);
        return ResponseEntity.ok(ApiResponse.ok(message, message));
    }

    @PostMapping("/verify-record")
    public ResponseEntity<ApiResponse<VoterRecordDto>> verifyVoterRecord(@Valid @RequestBody VerifyRecordRequest request) {
        VoterRecordDto dto = authService.verifyVoterRecord(request);
        return ResponseEntity.ok(ApiResponse.ok("Voter record verified successfully", dto));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        String ipAddress = com.sovereign.democracy.util.ClientIpUtil.getClientIp(httpRequest);
        AuthResponse response = authService.registerVoter(request, ipAddress);
        return ResponseEntity.ok(ApiResponse.ok("Account successfully registered! You are now logged in.", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<String>> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        return ResponseEntity.ok(ApiResponse.ok("Current user: " + authentication.getName(), authentication.getName()));
    }
}
