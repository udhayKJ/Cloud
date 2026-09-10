package com.cloudshift.controller;

import com.cloudshift.service.CostEstimationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Cost Estimation API.
 */
@RestController
@RequestMapping("/api/cost")
@RequiredArgsConstructor
public class CostController {

    private final CostEstimationService costService;

    /**
     * GET /api/cost/estimate?planId={migrationPlanId}
     * Returns a detailed cost breakdown for a migration plan.
     */
    @GetMapping("/estimate")
    public ResponseEntity<CostEstimationService.CostEstimateResult> estimate(
            @RequestParam String planId) {
        return ResponseEntity.ok(costService.estimate(planId));
    }

    /**
     * POST /api/cost/compare
     * Side-by-side cost comparison of multiple migration plan variants.
     * Body: ["planId1", "planId2", "planId3"]
     */
    @PostMapping("/compare")
    public ResponseEntity<List<CostEstimationService.CostEstimateResult>> compare(
            @RequestBody List<String> planIds) {
        return ResponseEntity.ok(costService.compare(planIds));
    }
}
