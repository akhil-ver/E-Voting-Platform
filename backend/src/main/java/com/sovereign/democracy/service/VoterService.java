package com.sovereign.democracy.service;

import com.sovereign.democracy.dto.VoterRecordDto;
import com.sovereign.democracy.entity.Area;
import com.sovereign.democracy.entity.VoterRecord;
import com.sovereign.democracy.exception.BadRequestException;
import com.sovereign.democracy.exception.ResourceNotFoundException;
import com.sovereign.democracy.repository.AreaRepository;
import com.sovereign.democracy.repository.UserAccountRepository;
import com.sovereign.democracy.repository.VoterRecordRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class VoterService {

    private final VoterRecordRepository voterRecordRepository;
    private final AreaRepository areaRepository;
    private final UserAccountRepository userAccountRepository;
    private final AuditLogService auditLogService;

    public VoterService(VoterRecordRepository voterRecordRepository,
                        AreaRepository areaRepository,
                        UserAccountRepository userAccountRepository,
                        AuditLogService auditLogService) {
        this.voterRecordRepository = voterRecordRepository;
        this.areaRepository = areaRepository;
        this.userAccountRepository = userAccountRepository;
        this.auditLogService = auditLogService;
    }

    public Page<VoterRecordDto> getVoters(Long areaId, String search, Pageable pageable) {
        boolean isAdmin = isCurrentUserAdmin();
        return voterRecordRepository.findFiltered(areaId, search, pageable).map(r -> mapToDto(r, isAdmin));
    }

    public VoterRecordDto getVoterById(Long id) {
        VoterRecord record = voterRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voter record not found with id: " + id));
        return mapToDto(record, isCurrentUserAdmin());
    }

    private boolean isCurrentUserAdmin() {
        try {
            org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            return auth != null && auth.isAuthenticated() &&
                    auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional
    public VoterRecordDto addVoterRecord(String voterId, String fullName, String fatherName,
                                         String motherName, String aadhaarLast4, Long areaId,
                                         String email,
                                         String adminUsername, String ipAddress) {
        if (voterRecordRepository.existsByVoterIdIgnoreCase(voterId)) {
            throw new BadRequestException("Duplicate Voter Record: Election ID '" + voterId + "' is already enrolled in the system.");
        }

        if (aadhaarLast4 == null || !aadhaarLast4.matches("^[0-9]{4}$")) {
            throw new BadRequestException("Aadhaar last 4 digits must be exactly 4 numerical digits.");
        }

        Area area = areaRepository.findById(areaId)
                .orElseThrow(() -> new ResourceNotFoundException("Specified Area ID " + areaId + " does not exist."));

        String cleanEmail = (email != null && !email.trim().isEmpty())
                ? email.trim().toLowerCase().replaceAll("\\s+", "")
                : (fullName.toLowerCase().replaceAll("[^a-z0-9]", "") + aadhaarLast4.trim() + "@gmail.com");

        VoterRecord record = new VoterRecord(voterId.toUpperCase().trim(), fullName.trim(),
                fatherName != null ? fatherName.trim() : null,
                motherName != null ? motherName.trim() : null,
                aadhaarLast4.trim(), area, cleanEmail);

        VoterRecord saved = voterRecordRepository.save(record);
        auditLogService.logAction(adminUsername, "ADMIN", "ADD_VOTER_RECORD", "Voter:" + saved.getVoterId(),
                "Added voter " + saved.getFullName() + " (" + cleanEmail + ") to area " + area.getName(), ipAddress);

        return mapToDto(saved);
    }

    @Transactional
    public int importVotersFromCsv(InputStream inputStream, String adminUsername, String ipAddress) {
        int importedCount = 0;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            boolean isHeader = true;
            List<VoterRecord> recordsToSave = new ArrayList<>();

            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                if (isHeader) {
                    isHeader = false;
                    continue;
                }

                String[] parts = line.split(",");
                if (parts.length >= 6) {
                    String voterId = parts[0].trim().toUpperCase();
                    String fullName = parts[1].trim();
                    String fatherName = parts[2].trim();
                    String motherName = parts[3].trim();
                    String aadhaarLast4 = parts[4].trim();
                    String areaName = parts[5].trim();
                    String csvEmail = (parts.length >= 7 && parts[6].contains("@"))
                            ? parts[6].trim().toLowerCase().replaceAll("\\s+", "")
                            : (fullName.toLowerCase().replaceAll("[^a-z0-9]", "") + aadhaarLast4 + "@gmail.com");

                    if (!voterRecordRepository.existsByVoterIdIgnoreCase(voterId) && aadhaarLast4.length() == 4) {
                        areaRepository.findByNameIgnoreCase(areaName).ifPresent(area -> {
                            recordsToSave.add(new VoterRecord(voterId, fullName, fatherName, motherName, aadhaarLast4, area, csvEmail));
                        });
                    }
                }
            }

            if (!recordsToSave.isEmpty()) {
                voterRecordRepository.saveAll(recordsToSave);
                importedCount = recordsToSave.size();
                auditLogService.logAction(adminUsername, "ADMIN", "IMPORT_VOTERS_CSV", "VoterRecords",
                        "Imported " + importedCount + " voter records via CSV", ipAddress);
            }
        } catch (Exception e) {
            throw new BadRequestException("Failed to parse CSV file: " + e.getMessage());
        }
        return importedCount;
    }

    @Transactional
    public void deleteVoterRecord(Long id, String adminUsername, String ipAddress) {
        VoterRecord record = voterRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voter record not found with id: " + id));

        voterRecordRepository.delete(record);
        auditLogService.logAction(adminUsername, "ADMIN", "DELETE_VOTER_RECORD", "Voter:" + record.getVoterId(),
                "Deleted voter " + record.getFullName() + " (" + record.getVoterId() + ")", ipAddress);
    }

    public VoterRecordDto mapToDto(VoterRecord record) {
        return mapToDto(record, isCurrentUserAdmin());
    }

    public VoterRecordDto mapToDto(VoterRecord record, boolean includeAdminDetails) {
        VoterRecordDto dto;
        if (includeAdminDetails) {
            dto = new VoterRecordDto(
                    record.getId(),
                    record.getVoterId(),
                    record.getFullName(),
                    record.getFatherName(),
                    record.getMotherName(),
                    record.getAadhaarLast4(),
                    record.getArea().getName(),
                    record.getArea().getId(),
                    record.isEligible(),
                    record.isHasRegisteredAccount()
            );
            dto.setEmail(record.getComputedEmail());
            dto.setAadhaarLast4(record.getAadhaarLast4());
        } else {
            dto = new VoterRecordDto(
                    record.getId(),
                    record.getVoterId(),
                    record.getFullName(),
                    null,
                    null,
                    "0000",
                    record.getArea().getName(),
                    record.getArea().getId(),
                    record.isEligible(),
                    record.isHasRegisteredAccount()
            );
            dto.setAadhaarLast4("0000");
            String standardEmail = record.getComputedEmail();
            if (standardEmail != null && record.getAadhaarLast4() != null) {
                dto.setEmail(standardEmail.replace(record.getAadhaarLast4(), "0000"));
            } else {
                dto.setEmail(standardEmail);
            }
        }

        if (record.isHasRegisteredAccount()) {
            userAccountRepository.findByUsernameIgnoreCase(record.getVoterId()).ifPresent(acc -> {
                dto.setUserAccountId(acc.getId());
                dto.setAccountEnabled(acc.isEnabled());
                if (includeAdminDetails && acc.getRecoveryEmail() != null) {
                    dto.setEmail(acc.getRecoveryEmail());
                }
            });
        }

        return dto;
    }
}
