package com.sovereign.democracy.service;

import com.sovereign.democracy.dto.*;
import com.sovereign.democracy.entity.UserAccount;
import com.sovereign.democracy.entity.VoterRecord;
import com.sovereign.democracy.enums.Role;
import com.sovereign.democracy.exception.BadRequestException;
import com.sovereign.democracy.exception.UnauthorizedException;
import com.sovereign.democracy.repository.UserAccountRepository;
import com.sovereign.democracy.repository.VoterRecordRepository;
import com.sovereign.democracy.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final VoterRecordRepository voterRecordRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditLogService auditLogService;

    public AuthService(UserAccountRepository userAccountRepository,
                       VoterRecordRepository voterRecordRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       AuditLogService auditLogService) {
        this.userAccountRepository = userAccountRepository;
        this.voterRecordRepository = voterRecordRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress) {
        String cleanUsername = request.getUsername().trim().toUpperCase();

        UserAccount account = userAccountRepository.findByUsernameIgnoreCase(cleanUsername)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials. Please verify your Election ID / Username and password."));

        if (!account.isEnabled()) {
            throw new UnauthorizedException("Your account is deactivated. Please contact the election administration.");
        }

        if (!passwordEncoder.matches(request.getPassword(), account.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials. Please verify your Election ID / Username and password.");
        }

        account.setLastLoginAt(LocalDateTime.now());
        userAccountRepository.save(account);

        String token = tokenProvider.generateTokenForUsername(account.getUsername(), account.getRole().name());

        String fullName = account.getRole() == Role.ADMIN ? "Central Election Administrator" : account.getVoterRecord().getFullName();
        String voterId = account.getRole() == Role.ADMIN ? account.getUsername() : account.getVoterRecord().getVoterId();
        String areaName = account.getRole() == Role.ADMIN ? "National Central Command" : account.getVoterRecord().getArea().getName();
        Long areaId = account.getRole() == Role.ADMIN ? null : account.getVoterRecord().getArea().getId();

        auditLogService.logAction(account.getUsername(), account.getRole().name(), "LOGIN_SUCCESS", "Auth",
                "Successful authentication from " + ipAddress, ipAddress);

        return new AuthResponse(token, account.getUsername(), account.getRole(), fullName, voterId, areaName, areaId);
    }

    public VoterRecordDto verifyVoterRecord(VerifyRecordRequest request) {
        String cleanElectionId = request.getElectionId().trim().toUpperCase();
        String cleanAadhaar = request.getAadhaarLast4().trim();

        VoterRecord record = voterRecordRepository.findByVoterIdIgnoreCase(cleanElectionId)
                .orElseThrow(() -> new BadRequestException("Election ID '" + cleanElectionId + "' not found in authorized voter records. Only citizens enrolled by the administrator can register."));

        if (!record.getAadhaarLast4().equals(cleanAadhaar)) {
            throw new BadRequestException("Aadhaar verification failed. The provided 4 digits do not match records on file for this Election ID.");
        }

        if (!record.isEligible()) {
            throw new BadRequestException("This voter record is currently flagged as ineligible to vote. Please contact the election administrator.");
        }

        if (record.isHasRegisteredAccount() || userAccountRepository.existsByVoterRecord(record)) {
            throw new BadRequestException("Duplicate Registration Rejected: An account has already been registered for Election ID '" + cleanElectionId + "'. Please log in directly.");
        }

        return new VoterRecordDto(
                record.getId(),
                record.getVoterId(),
                record.getFullName(),
                record.getFatherName(),
                record.getMotherName(),
                record.getAadhaarLast4(),
                record.getArea().getName(),
                record.getArea().getId(),
                record.isEligible(),
                false
        );
    }

    @Transactional
    public AuthResponse registerVoter(RegisterRequest request, String ipAddress) {
        String cleanElectionId = request.getElectionId().trim().toUpperCase();
        String cleanAadhaar = request.getAadhaarLast4().trim();

        VoterRecord record = voterRecordRepository.findByVoterIdIgnoreCase(cleanElectionId)
                .orElseThrow(() -> new BadRequestException("Election ID '" + cleanElectionId + "' not found in authorized voter records."));

        if (!record.getAadhaarLast4().equals(cleanAadhaar)) {
            throw new BadRequestException("Aadhaar verification failed. Provided digits do not match records on file.");
        }

        if (!record.isEligible()) {
            throw new BadRequestException("This voter record is marked as ineligible to register.");
        }

        if (record.isHasRegisteredAccount() || userAccountRepository.existsByVoterRecord(record) || userAccountRepository.existsByUsernameIgnoreCase(cleanElectionId)) {
            throw new BadRequestException("Duplicate Account Rejected: An account already exists for Election ID '" + cleanElectionId + "'. Please log in.");
        }

        // Secure BCrypt password hashing
        String passwordHash = passwordEncoder.encode(request.getPassword());

        UserAccount userAccount = new UserAccount(cleanElectionId, passwordHash, Role.USER, record);
        userAccountRepository.save(userAccount);

        record.setHasRegisteredAccount(true);
        voterRecordRepository.save(record);

        String token = tokenProvider.generateTokenForUsername(cleanElectionId, Role.USER.name());

        auditLogService.logAction(cleanElectionId, "USER", "REGISTER_ACCOUNT", "Voter:" + cleanElectionId,
                "User account successfully registered and linked to voter record", ipAddress);

        return new AuthResponse(
                token,
                cleanElectionId,
                Role.USER,
                record.getFullName(),
                record.getVoterId(),
                record.getArea().getName(),
                record.getArea().getId()
        );
    }
}
