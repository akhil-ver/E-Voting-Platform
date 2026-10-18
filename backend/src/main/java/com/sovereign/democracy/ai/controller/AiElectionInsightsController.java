package com.sovereign.democracy.ai.controller;

import com.sovereign.democracy.ai.anomaly.AnomalyDetectionService;
import com.sovereign.democracy.ai.anomaly.dto.AnomalyEvaluationDto;
import com.sovereign.democracy.ai.anomaly.dto.AnomalyReviewRequest;
import com.sovereign.democracy.ai.dto.*;
import com.sovereign.democracy.ai.service.*;
import com.sovereign.democracy.dto.ApiResponse;
import com.sovereign.democracy.enums.AnomalyReviewStatus;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiElectionInsightsController {

    private final ElectionInsightsService electionInsightsService;
    private final VoterAssistantService voterAssistantService;
    private final AiCandidateExtractionService aiCandidateExtractionService;
    private final AiElectionReportService aiElectionReportService;
    private final AnomalyDetectionService anomalyDetectionService;

    public AiElectionInsightsController(ElectionInsightsService electionInsightsService,
                                        VoterAssistantService voterAssistantService,
                                        AiCandidateExtractionService aiCandidateExtractionService,
                                        AiElectionReportService aiElectionReportService,
                                        AnomalyDetectionService anomalyDetectionService) {
        this.electionInsightsService = electionInsightsService;
        this.voterAssistantService = voterAssistantService;
        this.aiCandidateExtractionService = aiCandidateExtractionService;
        this.aiElectionReportService = aiElectionReportService;
        this.anomalyDetectionService = anomalyDetectionService;
    }

    /**
     * Feature 1: Area-wise election insights for Admin Dashboard.
     */
    @GetMapping("/elections/{electionId}/insights")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ElectionInsightsDto>> getAdminInsights(@PathVariable Long electionId) {
        ElectionInsightsDto insights = electionInsightsService.getAdminInsights(electionId);
        return ResponseEntity.ok(ApiResponse.ok("AI Election insights retrieved successfully", insights));
    }

    /**
     * Section 4: Public Turnout Insights (approved aggregates only, no voter PII).
     */
    @GetMapping("/elections/{electionId}/public-insights")
    public ResponseEntity<ApiResponse<PublicElectionInsightsDto>> getPublicInsights(@PathVariable Long electionId) {
        PublicElectionInsightsDto publicInsights = electionInsightsService.getPublicInsights(electionId);
        return ResponseEntity.ok(ApiResponse.ok("Public election turnout insights retrieved", publicInsights));
    }

    /**
     * Feature 2: AI Voter Assistant.
     */
    @PostMapping("/assistant/chat")
    public ResponseEntity<ApiResponse<VoterAssistantChatResponse>> chatAssistant(
            @Valid @RequestBody VoterAssistantChatRequest request,
            Authentication authentication) {

        String username = authentication != null ? authentication.getName() : null;
        VoterAssistantChatResponse response = voterAssistantService.chat(request, username);
        return ResponseEntity.ok(ApiResponse.ok("Voter assistant reply generated", response));
    }

    /**
     * Feature 3: AI-assisted Candidate PDF extraction fallback.
     */
    @PostMapping("/candidates/pdf-assistance")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AiPdfCandidateExtractResponse>> assistPdfExtraction(
            @Valid @RequestBody AiPdfCandidateExtractRequest request) {

        AiPdfCandidateExtractResponse response = aiCandidateExtractionService.extractCandidatesWithAi(request);
        return ResponseEntity.ok(ApiResponse.ok("Candidate extraction processed", response));
    }

    /**
     * Feature 4: Post-election declared summary report.
     */
    @PostMapping("/elections/{electionId}/report")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AiElectionReportDto>> generateReport(@PathVariable Long electionId) {
        AiElectionReportDto report = aiElectionReportService.generatePostElectionReport(electionId);
        return ResponseEntity.ok(ApiResponse.ok("AI Post-election summary report generated", report));
    }

    /**
     * Feature 1: Anomaly Detection — evaluates election operational telemetry using Isolation Forest.
     */
    @GetMapping("/anomalies/elections/{electionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AnomalyEvaluationDto>> evaluateAnomalies(@PathVariable Long electionId) {
        AnomalyEvaluationDto evaluation = anomalyDetectionService.evaluateElection(electionId);
        return ResponseEntity.ok(ApiResponse.ok("Isolation Forest anomaly evaluation complete", evaluation));
    }

    /**
     * Feature 1: Anomaly Alerts Audit Trail — paginated list of anomaly alerts.
     */
    @GetMapping("/anomalies")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<AnomalyEvaluationDto>>> getAnomalyAlerts(
            @RequestParam(required = false) AnomalyReviewStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AnomalyEvaluationDto> alerts = anomalyDetectionService.getAlerts(status, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok("Anomaly alerts retrieved", alerts));
    }

    /**
     * Feature 1: Anomaly Review Action — updates review status and administrator investigation notes.
     */
    @PatchMapping("/anomalies/{alertId}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AnomalyEvaluationDto>> reviewAnomalyAlert(
            @PathVariable Long alertId,
            @Valid @RequestBody AnomalyReviewRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "ADMIN-001";
        AnomalyEvaluationDto updated = anomalyDetectionService.reviewAlert(
                alertId, request.getReviewStatus(), request.getAdminNotes(), username);
        return ResponseEntity.ok(ApiResponse.ok("Anomaly alert review updated", updated));
    }
}
