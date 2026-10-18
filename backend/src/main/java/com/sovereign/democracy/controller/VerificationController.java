package com.sovereign.democracy.controller;

import com.sovereign.democracy.dto.ApiResponse;
import com.sovereign.democracy.dto.VoteReceiptDto;
import com.sovereign.democracy.service.VotingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/verify")
public class VerificationController {

    private final VotingService votingService;

    public VerificationController(VotingService votingService) {
        this.votingService = votingService;
    }

    @GetMapping("/{receiptCode}")
    public ResponseEntity<ApiResponse<VoteReceiptDto>> verifyReceipt(@PathVariable String receiptCode) {
        VoteReceiptDto receipt = votingService.verifyReceipt(receiptCode);
        return ResponseEntity.ok(ApiResponse.ok("Ballot receipt verified successfully. It has been recorded in the certified tally.", receipt));
    }
}
