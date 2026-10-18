package com.sovereign.democracy.controller;

import com.sovereign.democracy.dto.ApiResponse;
import com.sovereign.democracy.dto.CastVoteRequest;
import com.sovereign.democracy.dto.VoteReceiptDto;
import com.sovereign.democracy.service.VotingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/voting")
public class VotingController {

    private final VotingService votingService;
    private final com.sovereign.democracy.service.SecretVotingKeyService secretVotingKeyService;

    public VotingController(VotingService votingService,
                            com.sovereign.democracy.service.SecretVotingKeyService secretVotingKeyService) {
        this.votingService = votingService;
        this.secretVotingKeyService = secretVotingKeyService;
    }

    @PostMapping("/keys/generate/{electionId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<com.sovereign.democracy.dto.SecretVotingKeyDto>> generateKey(
            @PathVariable Long electionId,
            @RequestParam(value = "forceReissue", defaultValue = "false") boolean forceReissue,
            Authentication authentication,
            HttpServletRequest request) {

        String username = authentication.getName();
        com.sovereign.democracy.dto.SecretVotingKeyDto keyDto = secretVotingKeyService.issueOrReissueKey(
                username, electionId, forceReissue, com.sovereign.democracy.util.ClientIpUtil.getClientIp(request)
        );
        return ResponseEntity.ok(ApiResponse.ok("Secret voting key processed successfully", keyDto));
    }

    @GetMapping("/keys/status/{electionId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<com.sovereign.democracy.dto.SecretVotingKeyDto>> getKeyStatus(
            @PathVariable Long electionId,
            Authentication authentication) {

        String username = authentication.getName();
        com.sovereign.democracy.dto.SecretVotingKeyDto statusDto = secretVotingKeyService.getKeyStatus(username, electionId);
        return ResponseEntity.ok(ApiResponse.ok("Secret voting key status retrieved", statusDto));
    }

    @PostMapping("/cast")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<VoteReceiptDto>> castVote(
            @RequestBody CastVoteRequest requestPayload,
            Authentication authentication,
            HttpServletRequest request) {

        String username = authentication.getName();
        VoteReceiptDto receipt = votingService.castBallot(
                username,
                requestPayload.getElectionId(),
                requestPayload.getCandidateId(),
                requestPayload.getSecretVotingKey(),
                com.sovereign.democracy.util.ClientIpUtil.getClientIp(request)
        );

        return ResponseEntity.ok(ApiResponse.ok("Ballot recorded successfully. Your cryptographic receipt is generated.", receipt));
    }

    @GetMapping("/has-voted/{electionId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> hasVoted(
            @PathVariable Long electionId,
            Authentication authentication) {

        String username = authentication.getName();
        boolean voted = votingService.hasUserVoted(username, electionId);

        return ResponseEntity.ok(ApiResponse.ok("Vote status retrieved", Map.of("hasVoted", voted)));
    }

    @GetMapping("/my-receipt/{electionId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<VoteReceiptDto>> getMyReceipt(
            @PathVariable Long electionId,
            Authentication authentication) {

        String username = authentication.getName();
        VoteReceiptDto receipt = votingService.getMyReceipt(username, electionId);

        return ResponseEntity.ok(ApiResponse.ok("Cryptographic ballot receipt retrieved successfully", receipt));
    }

    @GetMapping("/my-receipts")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<java.util.List<VoteReceiptDto>>> getMyReceipts(
            Authentication authentication) {

        String username = authentication.getName();
        java.util.List<VoteReceiptDto> receipts = votingService.getMyReceipts(username);

        return ResponseEntity.ok(ApiResponse.ok("User ballot receipts history retrieved successfully", receipts));
    }

    @GetMapping("/my-participations")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<java.util.List<VoteReceiptDto>>> getMyParticipations(
            Authentication authentication) {

        String username = authentication.getName();
        java.util.List<VoteReceiptDto> receipts = votingService.getMyReceipts(username);

        return ResponseEntity.ok(ApiResponse.ok("User vote participations retrieved successfully", receipts));
    }
}
