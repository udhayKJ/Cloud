package com.cloudshift.controller;

import com.cloudshift.entity.SimulationResult;
import com.cloudshift.service.DrSimulationService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * DR Simulation API.
 */
@RestController
@RequestMapping("/api/dr")
@RequiredArgsConstructor
public class DrController {

    private final DrSimulationService drService;

    /**
     * POST /api/dr/simulate?planId={planId}&scenario={SCENARIO}
     * Runs a DR failure simulation and returns RTO/RPO metrics.
     * Scenarios: EC2_FAILURE, DATABASE_FAILURE, AZ_FAILURE, REGION_FAILURE
     */
    @PostMapping("/simulate")
    public ResponseEntity<DrSimulationService.DrSimulationResult> simulate(
            @RequestParam @NotBlank String planId,
            @RequestParam SimulationResult.FailureScenario scenario) {
        return ResponseEntity.ok(drService.simulate(planId, scenario));
    }

    /**
     * GET /api/dr/history?planId={planId}
     * Returns all past simulation results for a migration plan.
     */
    @GetMapping("/history")
    public ResponseEntity<List<SimulationResult>> getHistory(@RequestParam String planId) {
        return ResponseEntity.ok(drService.getSimulationHistory(planId));
    }
}
