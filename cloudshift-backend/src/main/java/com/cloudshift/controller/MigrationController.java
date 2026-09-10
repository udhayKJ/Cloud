package com.cloudshift.controller;

import com.cloudshift.dto.migration.MigrationAnalysisRequest;
import com.cloudshift.dto.migration.MigrationAnalysisResponse;
import com.cloudshift.service.MigrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Migration Decision Engine API.
 * All endpoints require a valid JWT.
 */
@RestController
@RequestMapping("/api/migration")
@RequiredArgsConstructor
public class MigrationController {

    private final MigrationService migrationService;

    /**
     * POST /api/migration/analyse
     * Runs the migration decision engine and returns 3 architecture variants
     * (LOW_COST / BALANCED / HIGH_AVAILABILITY).
     */
    @PostMapping("/analyse")
    public ResponseEntity<List<MigrationAnalysisResponse>> analyse(
            @Valid @RequestBody MigrationAnalysisRequest request) {
        return ResponseEntity.ok(migrationService.analyse(request));
    }

    /**
     * GET /api/migration/plans?projectId={projectId}
     * Returns all previously generated migration plans for a project.
     */
    @GetMapping("/plans")
    public ResponseEntity<List<MigrationAnalysisResponse>> getPlans(
            @RequestParam String projectId) {
        return ResponseEntity.ok(migrationService.getPlansForProject(projectId));
    }
}
