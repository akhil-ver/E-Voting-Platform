package com.sovereign.democracy.controller;

import com.sovereign.democracy.dto.ApiResponse;
import com.sovereign.democracy.dto.AreaDto;
import com.sovereign.democracy.entity.Area;
import com.sovereign.democracy.service.AreaService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/areas")
public class AreaController {

    private final AreaService areaService;

    public AreaController(AreaService areaService) {
        this.areaService = areaService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AreaDto>>> getAllAreas() {
        return ResponseEntity.ok(ApiResponse.ok("Areas retrieved successfully", areaService.getAllAreasWithStats()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<AreaDto>>> getActiveAreas() {
        return ResponseEntity.ok(ApiResponse.ok("Active areas retrieved successfully", areaService.getActiveAreas()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AreaDto>> getAreaById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Area retrieved successfully", areaService.getAreaById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AreaDto>> createArea(@RequestBody Area area,
                                                           Authentication authentication,
                                                           HttpServletRequest request) {
        String adminUsername = authentication != null ? authentication.getName() : "ADMIN-001";
        AreaDto created = areaService.createArea(area, adminUsername, com.sovereign.democracy.util.ClientIpUtil.getClientIp(request));
        return ResponseEntity.ok(ApiResponse.ok("Area created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AreaDto>> updateArea(@PathVariable Long id,
                                                           @RequestBody Area area,
                                                           Authentication authentication,
                                                           HttpServletRequest request) {
        String adminUsername = authentication != null ? authentication.getName() : "ADMIN-001";
        AreaDto updated = areaService.updateArea(id, area, adminUsername, com.sovereign.democracy.util.ClientIpUtil.getClientIp(request));
        return ResponseEntity.ok(ApiResponse.ok("Area updated successfully", updated));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> toggleAreaStatus(@PathVariable Long id,
                                                              @RequestBody Map<String, Boolean> payload,
                                                              Authentication authentication,
                                                              HttpServletRequest request) {
        String adminUsername = authentication != null ? authentication.getName() : "ADMIN-001";
        boolean active = payload.getOrDefault("active", true);
        areaService.toggleAreaStatus(id, active, adminUsername, com.sovereign.democracy.util.ClientIpUtil.getClientIp(request));
        return ResponseEntity.ok(ApiResponse.ok("Area status updated to " + (active ? "active" : "inactive")));
    }
}
