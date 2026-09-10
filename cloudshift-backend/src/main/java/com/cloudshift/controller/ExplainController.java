package com.cloudshift.controller;

import com.cloudshift.service.ExplanationService;
import com.cloudshift.service.ExplanationServiceStub;
import jakarta.validation.constraints.NotBlank;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AI Explanation API.
 * Uses ExplanationService (prod) or ExplanationServiceStub (dev) depending on profile.
 */
@RestController
@RequestMapping("/api/explain")
@Slf4j
public class ExplainController {

    // Injected conditionally by Spring profile
    @Autowired(required = false)
    private ExplanationService explanationService;

    @Autowired(required = false)
    private ExplanationServiceStub explanationServiceStub;

    /**
     * POST /api/explain
     * Body: { "questionType": "why_aurora", "context": { ...decision data... } }
     * Returns a plain-language explanation of a migration decision.
     */
    @PostMapping
    public ResponseEntity<ExplanationService.ExplanationResponse> explain(
            @RequestBody ExplainRequest request) {

        ExplanationService.ExplanationResponse response;

        if (explanationService != null) {
            response = explanationService.explain(request.getContext(), request.getQuestionType());
        } else if (explanationServiceStub != null) {
            response = explanationServiceStub.explain(request.getContext(), request.getQuestionType());
        } else {
            response = ExplanationService.ExplanationResponse.builder()
                    .questionType(request.getQuestionType())
                    .explanation("Explanation service not available in current profile")
                    .modelUsed("none")
                    .build();
        }

        return ResponseEntity.ok(response);
    }

    @lombok.Data
    public static class ExplainRequest {
        @NotBlank
        private String questionType;
        private Map<String, Object> context;
    }
}
