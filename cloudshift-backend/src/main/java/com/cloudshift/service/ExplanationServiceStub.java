package com.cloudshift.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Stub explanation service for local dev — no Bedrock calls.
 * Returns canned explanations so the API contract works without AWS credentials.
 */
@Service
@Profile("dev")
@Slf4j
public class ExplanationServiceStub {

    public ExplanationService.ExplanationResponse explain(Map<String, Object> context, String questionType) {
        log.info("[STUB] Bedrock explanation requested: questionType={}", questionType);

        String explanation = switch (questionType) {
            case "why_aurora" ->
                    "[STUB] Amazon Aurora was selected because the workload requires high availability and low-latency reads. " +
                    "Aurora provides 5× the throughput of standard MySQL/PostgreSQL and automatically replicates data " +
                    "across 3 Availability Zones in 6 copies, meeting the RPO target without manual intervention.";
            case "why_snowball" ->
                    "[STUB] AWS Snowball was recommended because the total data volume exceeds 10TB, making internet " +
                    "transfer impractical (it would take weeks). Snowball physically ships an encrypted appliance, " +
                    "allowing the data to be loaded offline and shipped to AWS — typically completing in 3-5 business days.";
            case "why_multiaz" ->
                    "[STUB] Multi-AZ was required because the RTO target is under 1 hour and the RPO target is under " +
                    "15 minutes. With Multi-AZ, RDS maintains a synchronous standby replica in a separate AZ and " +
                    "automatically fails over within 1-2 minutes with zero data loss.";
            case "compare_cost" ->
                    "[STUB] The HIGH_AVAILABILITY variant costs approximately 3× more than LOW_COST primarily due to " +
                    "RDS Multi-AZ (doubles database cost), larger compute instances, and WAF. The BALANCED variant " +
                    "offers the best value for most production workloads.";
            default ->
                    "[STUB] This is a placeholder explanation. In production (with Bedrock configured), Claude will " +
                    "generate a contextual explanation based on the actual decision data provided.";
        };

        return ExplanationService.ExplanationResponse.builder()
                .questionType(questionType)
                .explanation(explanation)
                .modelUsed("stub-dev-mode")
                .build();
    }
}
