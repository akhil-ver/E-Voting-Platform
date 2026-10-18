package com.sovereign.democracy.service;

import com.sovereign.democracy.dto.UserAccountDto;
import com.sovereign.democracy.entity.UserAccount;
import com.sovereign.democracy.entity.VoterRecord;
import com.sovereign.democracy.enums.Role;
import com.sovereign.democracy.exception.BadRequestException;
import com.sovereign.democracy.exception.ResourceNotFoundException;
import com.sovereign.democracy.repository.UserAccountRepository;
import com.sovereign.democracy.repository.VoterRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserAccountService {

    private final UserAccountRepository userAccountRepository;
    private final VoterRecordRepository voterRecordRepository;
    private final AuditLogService auditLogService;

    public UserAccountService(UserAccountRepository userAccountRepository,
                              VoterRecordRepository voterRecordRepository,
                              AuditLogService auditLogService) {
        this.userAccountRepository = userAccountRepository;
        this.voterRecordRepository = voterRecordRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<UserAccountDto> getAllUsers(String search) {
        List<UserAccount> accounts = userAccountRepository.findAll();

        return accounts.stream()
                .filter(a -> {
                    if (search == null || search.trim().isEmpty()) return true;
                    String s = search.trim().toLowerCase();
                    boolean matchUser = a.getUsername().toLowerCase().contains(s);
                    boolean matchName = a.getVoterRecord() != null && a.getVoterRecord().getFullName().toLowerCase().contains(s);
                    boolean matchArea = a.getVoterRecord() != null && a.getVoterRecord().getArea().getName().toLowerCase().contains(s);
                    return matchUser || matchName || matchArea;
                })
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserAccountDto toggleUserStatus(Long userId, String adminUsername, String ipAddress) {
        UserAccount account = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found with id: " + userId));

        if (account.getRole() == Role.ADMIN || "ADMIN-001".equalsIgnoreCase(account.getUsername())) {
            throw new BadRequestException("The primary administrator account cannot be blocked or deactivated.");
        }

        boolean newStatus = !account.isEnabled();
        account.setEnabled(newStatus);
        UserAccount updated = userAccountRepository.save(account);

        String action = newStatus ? "USER_UNBLOCKED" : "USER_BLOCKED";
        String message = (newStatus ? "Activated and unblocked" : "Blocked and deactivated") +
                " user account " + updated.getUsername() + " (" +
                (updated.getVoterRecord() != null ? updated.getVoterRecord().getFullName() : "N/A") + ")";

        auditLogService.logAction(
                action,
                "UserAccount",
                updated.getId().toString(),
                adminUsername,
                message,
                ipAddress
        );

        return mapToDto(updated);
    }

    @Transactional
    public void deleteUserAccount(Long userId, String adminUsername, String ipAddress) {
        UserAccount account = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found with id: " + userId));

        if (account.getRole() == Role.ADMIN || "ADMIN-001".equalsIgnoreCase(account.getUsername())) {
            throw new BadRequestException("The primary administrator account cannot be deleted.");
        }

        String username = account.getUsername();
        String citizenName = account.getVoterRecord() != null ? account.getVoterRecord().getFullName() : "N/A";

        // Reset voter record registered status so citizen can re-register in future if permitted
        if (account.getVoterRecord() != null) {
            VoterRecord voter = account.getVoterRecord();
            voter.setHasRegisteredAccount(false);
            voterRecordRepository.save(voter);
        }

        userAccountRepository.delete(account);

        auditLogService.logAction(
                "USER_ACCOUNT_DELETED",
                "UserAccount",
                userId.toString(),
                adminUsername,
                "Permanently deleted user account " + username + " (" + citizenName + "). Subsequent logins will fail.",
                ipAddress
        );
    }

    @Transactional
    public UserAccountDto toggleUserStatusByVoterId(String voterId, String adminUsername, String ipAddress) {
        UserAccount account = userAccountRepository.findByUsernameIgnoreCase(voterId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("No registered account found for Voter ID: " + voterId));
        return toggleUserStatus(account.getId(), adminUsername, ipAddress);
    }

    @Transactional
    public void deleteUserAccountByVoterId(String voterId, String adminUsername, String ipAddress) {
        UserAccount account = userAccountRepository.findByUsernameIgnoreCase(voterId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("No registered account found for Voter ID: " + voterId));
        deleteUserAccount(account.getId(), adminUsername, ipAddress);
    }

    public UserAccountDto mapToDto(UserAccount account) {
        String fullName = account.getRole() == Role.ADMIN
                ? "Central Election Administrator"
                : (account.getVoterRecord() != null ? account.getVoterRecord().getFullName() : account.getUsername());

        String voterId = account.getVoterRecord() != null
                ? account.getVoterRecord().getVoterId()
                : account.getUsername();

        String areaName = account.getVoterRecord() != null
                ? account.getVoterRecord().getArea().getName()
                : "National";

        Long areaId = account.getVoterRecord() != null
                ? account.getVoterRecord().getArea().getId()
                : null;

        return new UserAccountDto(
                account.getId(),
                account.getUsername(),
                fullName,
                account.getRole(),
                voterId,
                areaName,
                areaId,
                account.isEnabled(),
                account.getCreatedAt(),
                account.getLastLoginAt()
        );
    }
}
