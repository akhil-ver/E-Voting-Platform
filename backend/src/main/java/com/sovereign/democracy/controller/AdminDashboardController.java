package com.sovereign.democracy.controller;

import com.sovereign.democracy.dto.ApiResponse;
import com.sovereign.democracy.dto.DashboardStatsDto;
import com.sovereign.democracy.entity.AuditLog;
import com.sovereign.democracy.enums.ElectionStatus;
import com.sovereign.democracy.enums.Role;
import com.sovereign.democracy.repository.*;
import com.sovereign.democracy.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final AreaRepository areaRepository;
    private final VoterRecordRepository voterRecordRepository;
    private final UserAccountRepository userAccountRepository;
    private final ElectionRepository electionRepository;
    private final AuditLogService auditLogService;

    public AdminDashboardController(AreaRepository areaRepository,
                                    VoterRecordRepository voterRecordRepository,
                                    UserAccountRepository userAccountRepository,
                                    ElectionRepository electionRepository,
                                    AuditLogService auditLogService) {
        this.areaRepository = areaRepository;
        this.voterRecordRepository = voterRecordRepository;
        this.userAccountRepository = userAccountRepository;
        this.electionRepository = electionRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getDashboardStats() {
        long totalAreas = areaRepository.count();
        long totalVoters = voterRecordRepository.count();
        long totalAccounts = userAccountRepository.countByRole(Role.USER);
        long totalElections = electionRepository.count();
        long openElections = electionRepository.countByStatus(ElectionStatus.OPEN);
        long closedElections = electionRepository.countByStatus(ElectionStatus.CLOSED);
        long publishedElections = electionRepository.countByStatus(ElectionStatus.RESULT_DECLARED);

        DashboardStatsDto stats = new DashboardStatsDto(
                totalAreas, totalVoters, totalAccounts,
                totalElections, openElections, closedElections, publishedElections
        );

        return ResponseEntity.ok(ApiResponse.ok("Dashboard stats retrieved successfully", stats));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<AuditLog> logs = auditLogService.getAllLogs(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok("Audit logs retrieved successfully", logs));
    }
}
