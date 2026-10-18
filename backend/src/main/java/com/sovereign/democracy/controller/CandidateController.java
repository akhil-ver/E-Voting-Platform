package com.sovereign.democracy.controller;

import com.sovereign.democracy.dto.ApiResponse;
import com.sovereign.democracy.dto.CandidateDto;
import com.sovereign.democracy.service.CandidateService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/candidates")
public class CandidateController {

    private final CandidateService candidateService;

    public CandidateController(CandidateService candidateService) {
        this.candidateService = candidateService;
    }

    @GetMapping("/election/{electionId}")
    public ResponseEntity<ApiResponse<List<CandidateDto>>> getCandidatesByElection(@PathVariable Long electionId) {
        return ResponseEntity.ok(ApiResponse.ok("Candidates retrieved", candidateService.getCandidatesByElection(electionId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CandidateDto>> getCandidateById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Candidate retrieved", candidateService.getCandidateById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CandidateDto>> addCandidate(
            @RequestBody Map<String, Object> payload,
            Authentication authentication,
            HttpServletRequest request) {

        Long electionId = Long.valueOf(payload.get("electionId").toString());
        String candidateCode = (String) payload.get("candidateCode");
        String fullName = (String) payload.get("fullName");
        String partyName = (String) payload.get("partyName");
        String partySymbol = (String) payload.get("partySymbol");
        String symbolImageUrl = (String) payload.get("symbolImageUrl");
        String bio = (String) payload.get("bio");

        String adminUsername = authentication != null ? authentication.getName() : "ADMIN-001";
        CandidateDto created = candidateService.addCandidate(
                electionId, candidateCode, fullName, partyName, partySymbol, symbolImageUrl, bio,
                adminUsername, request.getRemoteAddr()
        );

        return ResponseEntity.ok(ApiResponse.ok("Candidate registered successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CandidateDto>> updateCandidate(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication authentication,
            HttpServletRequest request) {

        String fullName = (String) payload.get("fullName");
        String partyName = (String) payload.get("partyName");
        String partySymbol = (String) payload.get("partySymbol");
        String symbolImageUrl = (String) payload.get("symbolImageUrl");
        String bio = (String) payload.get("bio");

        String adminUsername = authentication != null ? authentication.getName() : "ADMIN-001";
        CandidateDto updated = candidateService.updateCandidate(
                id, fullName, partyName, partySymbol, symbolImageUrl, bio,
                adminUsername, request.getRemoteAddr()
        );

        return ResponseEntity.ok(ApiResponse.ok("Candidate updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCandidate(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest request) {

        String adminUsername = authentication != null ? authentication.getName() : "ADMIN-001";
        candidateService.deleteCandidate(id, adminUsername, request.getRemoteAddr());

        return ResponseEntity.ok(ApiResponse.ok("Candidate deleted successfully", null));
    }
}
