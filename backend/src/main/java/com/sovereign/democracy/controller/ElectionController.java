package com.sovereign.democracy.controller;

import com.sovereign.democracy.dto.ApiResponse;
import com.sovereign.democracy.dto.ElectionDto;
import com.sovereign.democracy.dto.ElectionResultDto;
import com.sovereign.democracy.dto.VoterParticipationDto;
import com.sovereign.democracy.service.ElectionService;
import com.sovereign.democracy.service.VoterParticipationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/elections")
public class ElectionController {

    private final ElectionService electionService;
    private final VoterParticipationService voterParticipationService;

    public ElectionController(ElectionService electionService,
                              VoterParticipationService voterParticipationService) {
        this.electionService = electionService;
        this.voterParticipationService = voterParticipationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ElectionDto>>> getAllElections(
            @RequestParam(required = false) Long areaId) {
        List<ElectionDto> list = areaId != null
                ? electionService.getElectionsByArea(areaId)
                : electionService.getAllElections();
        return ResponseEntity.ok(ApiResponse.ok("Elections retrieved", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ElectionDto>> getElectionById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Election details retrieved", electionService.getElectionById(id)));
    }

    @GetMapping("/{id}/results")
    public ResponseEntity<ApiResponse<List<ElectionResultDto>>> getResults(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Official election results retrieved", electionService.getResults(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ElectionDto>> createElection(
            @RequestBody Map<String, Object> payload,
            Authentication authentication,
            HttpServletRequest request) {

        String electionCode = (String) payload.get("electionCode");
        String name = (String) payload.get("name");
        String electionType = (String) payload.get("electionType");
        Long areaId = Long.valueOf(payload.get("areaId").toString());
        LocalDateTime startTime = payload.containsKey("startTime") && payload.get("startTime") != null
                ? LocalDateTime.parse(payload.get("startTime").toString())
                : LocalDateTime.now();
        LocalDateTime endTime = payload.containsKey("endTime") && payload.get("endTime") != null
                ? LocalDateTime.parse(payload.get("endTime").toString())
                : LocalDateTime.now().plusDays(7);

        String adminUsername = authentication != null ? authentication.getName() : "ADMIN-001";
        ElectionDto created = electionService.createElection(
                electionCode, name, electionType, areaId, startTime, endTime,
                adminUsername, request.getRemoteAddr()
        );

        return ResponseEntity.ok(ApiResponse.ok("Election configured successfully", created));
    }

    /**
     * Requirement 6: Missing Candidate Validation before opening election
     */
    @PostMapping("/{id}/open")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ElectionDto>> openElection(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest request) {

        String adminUsername = authentication != null ? authentication.getName() : "ADMIN-001";
        ElectionDto updated = electionService.openElection(id, adminUsername, request.getRemoteAddr());

        return ResponseEntity.ok(ApiResponse.ok("Election polls opened successfully. Candidate roster is now locked.", updated));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ElectionDto>> closeElection(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest request) {

        String adminUsername = authentication != null ? authentication.getName() : "ADMIN-001";
        ElectionDto updated = electionService.closeElection(id, adminUsername, request.getRemoteAddr());

        return ResponseEntity.ok(ApiResponse.ok("Election polls closed successfully", updated));
    }

    /**
     * Requirement 4: Election-Wise Results publication
     */
    @PostMapping("/{id}/declare-results")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ElectionResultDto>>> declareResults(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest request) {

        String adminUsername = authentication != null ? authentication.getName() : "ADMIN-001";
        List<ElectionResultDto> results = electionService.tallyAndDeclareResults(id, adminUsername, request.getRemoteAddr());

        return ResponseEntity.ok(ApiResponse.ok("Election results officially tallied and declared", results));
    }

    /**
     * Requirements 2, 3, 5: Area-wise Voter Participation List
     * Strictly shows 'Voted' or 'Not Voted' without revealing ballot choice.
     */
    @GetMapping("/{id}/voter-participation")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<VoterParticipationDto>>> getVoterParticipation(
            @PathVariable String id,
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "ALL") String status) {

        Long electionId = null;
        if (id != null && !id.equalsIgnoreCase("all") && !id.equals("0")) {
            try {
                electionId = Long.valueOf(id);
            } catch (NumberFormatException ignored) {}
        }

        List<VoterParticipationDto> list = voterParticipationService.getParticipationList(electionId, areaId, search, status);
        return ResponseEntity.ok(ApiResponse.ok("Voter participation retrieved", list));
    }

    @GetMapping("/voter-participation")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<VoterParticipationDto>>> getAllVoterParticipation(
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "ALL") String status) {

        List<VoterParticipationDto> list = voterParticipationService.getParticipationList(null, areaId, search, status);
        return ResponseEntity.ok(ApiResponse.ok("All voter participation retrieved", list));
    }

    /**
     * Requirement: Clear Results / Reset Polls
     * Allows administrator to wipe results and ballots, and reset election status to OPEN.
     */
    @PostMapping("/{id}/clear-results")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ElectionDto>> clearResultsAndReset(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest request) {

        String adminUsername = authentication != null ? authentication.getName() : "ADMIN-001";
        ElectionDto updated = electionService.clearResultsAndReset(id, adminUsername, request.getRemoteAddr());

        return ResponseEntity.ok(ApiResponse.ok("Election results cleared and poll reset to OPEN successfully", updated));
    }
}
