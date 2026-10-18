package com.sovereign.democracy.controller;

import com.sovereign.democracy.dto.ApiResponse;
import com.sovereign.democracy.dto.VoterRecordDto;
import com.sovereign.democracy.service.VoterService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/voters")
public class VoterController {

    private final VoterService voterService;

    public VoterController(VoterService voterService) {
        this.voterService = voterService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<VoterRecordDto>>> getVoters(
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "500") int size,
            @RequestParam(defaultValue = "voterId") String sortBy) {

        Page<VoterRecordDto> result = voterService.getVoters(areaId, search,
                PageRequest.of(page, size, Sort.by(sortBy).ascending()));
        return ResponseEntity.ok(ApiResponse.ok("Voters retrieved successfully", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VoterRecordDto>> getVoterById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Voter record retrieved", voterService.getVoterById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VoterRecordDto>> addVoter(
            @RequestBody Map<String, Object> payload,
            Authentication authentication,
            HttpServletRequest request) {

        String voterId = (String) payload.get("voterId");
        String fullName = (String) payload.get("fullName");
        String fatherName = (String) payload.get("fatherName");
        String motherName = (String) payload.get("motherName");
        String aadhaarLast4 = (String) payload.get("aadhaarLast4");
        Long areaId = Long.valueOf(payload.get("areaId").toString());

        String adminUsername = authentication != null ? authentication.getName() : "ADMIN-001";
        VoterRecordDto created = voterService.addVoterRecord(voterId, fullName, fatherName, motherName,
                aadhaarLast4, areaId, adminUsername, com.sovereign.democracy.util.ClientIpUtil.getClientIp(request));

        return ResponseEntity.ok(ApiResponse.ok("Voter record enrolled successfully", created));
    }

    @PostMapping("/import-csv")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importCsv(
            @RequestParam("file") MultipartFile file,
            Authentication authentication,
            HttpServletRequest request) {

        String adminUsername = authentication != null ? authentication.getName() : "ADMIN-001";
        try {
            int imported = voterService.importVotersFromCsv(file.getInputStream(), adminUsername, com.sovereign.democracy.util.ClientIpUtil.getClientIp(request));
            return ResponseEntity.ok(ApiResponse.ok("CSV import completed successfully",
                    Map.of("importedCount", imported, "fileName", file.getOriginalFilename())));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to import CSV: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteVoter(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest request) {

        String adminUsername = authentication != null ? authentication.getName() : "ADMIN-001";
        voterService.deleteVoterRecord(id, adminUsername, com.sovereign.democracy.util.ClientIpUtil.getClientIp(request));
        return ResponseEntity.ok(ApiResponse.ok("Voter record removed successfully"));
    }
}
