package com.sovereign.democracy.controller;

import com.sovereign.democracy.dto.ApiResponse;
import com.sovereign.democracy.dto.BlockchainHealthDto;
import com.sovereign.democracy.service.BlockchainService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/blockchain")
public class BlockchainController {

    private final BlockchainService blockchainService;

    public BlockchainController(BlockchainService blockchainService) {
        this.blockchainService = blockchainService;
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<BlockchainHealthDto>> getHealth() {
        BlockchainHealthDto health = blockchainService.getHealth();
        return ResponseEntity.ok(ApiResponse.ok("Blockchain node health status", health));
    }

    @PostMapping("/reconcile")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reconcileTransactions() {
        int reconciledCount = blockchainService.reconcilePendingTransactions();
        return ResponseEntity.ok(ApiResponse.ok("Blockchain reconciliation complete",
                Map.of("reconciledCount", reconciledCount)));
    }

    @PostMapping("/reset")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resetBlockchain(
            @RequestParam(value = "redeploy", defaultValue = "false") boolean redeploy,
            @RequestParam(value = "clearHistory", defaultValue = "true") boolean clearHistory,
            Authentication authentication,
            HttpServletRequest request) {

        String username = authentication != null ? authentication.getName() : "ADMIN-001";
        Map<String, Object> result = blockchainService.resetBlockchainToGenesis(
                redeploy, clearHistory, username, request.getRemoteAddr()
        );
        return ResponseEntity.ok(ApiResponse.ok("Blockchain block height reset successfully", result));
    }
}
