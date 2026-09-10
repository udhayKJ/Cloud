package com.cloudshift.controller;

import com.cloudshift.service.WellArchitectedScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Well-Architected Framework Scoring API.
 */
@RestController
@RequestMapping("/api/well-architected")
@RequiredArgsConstructor
public class WellArchitectedController {

    private final WellArchitectedScoringService scoringService;

    /**
     * GET /api/well-architected/score?planId={planId}
     * Returns the 5-pillar Well-Architected score for a migration plan.
     */
    @GetMapping("/score")
    public ResponseEntity<WellArchitectedScoringService.WellArchitectedReport> score(
            @RequestParam String planId) {
        return ResponseEntity.ok(scoringService.score(planId));
    }
}
