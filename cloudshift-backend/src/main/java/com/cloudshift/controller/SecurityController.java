package com.cloudshift.controller;

import com.cloudshift.service.SecurityEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Security Evaluation API.
 */
@RestController
@RequestMapping("/api/security")
@RequiredArgsConstructor
public class SecurityController {

    private final SecurityEvaluationService securityService;

    /**
     * GET /api/security/evaluate?planId={migrationPlanId}
     * Runs security rule checks on the migration plan and returns findings.
     */
    @GetMapping("/evaluate")
    public ResponseEntity<SecurityEvaluationService.SecurityEvaluationResult> evaluate(
            @RequestParam String planId) {
        return ResponseEntity.ok(securityService.evaluate(planId));
    }
}
