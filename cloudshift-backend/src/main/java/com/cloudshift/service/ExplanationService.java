package com.cloudshift.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * AI Explanation Service — Amazon Bedrock (Claude).
 * <p>
 * Design rule (from guide): The LLM never makes decisions.
 * It only explains decisions already made by the Migration Decision Engine.
 * Always pass structured JSON as context so explanations stay grounded.
 * <p>
 * This class is the prod implementation. Dev uses {@link ExplanationServiceStub}.
 */
@Service
@Profile("prod")
@RequiredArgsConstructor
@Slf4j
public class ExplanationService {

    @Value("${app.aws.bedrock.model-id}")
    private String modelId;

    private final ObjectMapper objectMapper;

    // BedrockRuntimeClient is injected by AwsConfig (prod profile only)
    private final software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient bedrockClient;

    /**
     * Generates a human-readable explanation for a migration decision.
     *
     * @param decisionContext  structured JSON describing what the engine decided and why
     * @param questionType     e.g. "why_aurora", "why_snowball", "why_multiaz", "compare_cost"
     */
    public ExplanationResponse explain(Map<String, Object> decisionContext, String questionType) {
        String prompt = buildPrompt(decisionContext, questionType);
        log.info("Calling Bedrock model {} for explanation: {}", modelId, questionType);

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "anthropic_version", "bedrock-2023-05-31",
                    "max_tokens", 1024,
                    "messages", java.util.List.of(Map.of(
                            "role", "user",
                            "content", prompt
                    ))
            ));

            var response = bedrockClient.invokeModel(req -> req
                    .modelId(modelId)
                    .contentType("application/json")
                    .accept("application/json")
                    .body(software.amazon.awssdk.core.SdkBytes.fromUtf8String(requestBody))
            );

            var responseBody = objectMapper.readTree(response.body().asUtf8String());
            String explanation = responseBody
                    .path("content").get(0)
                    .path("text").asText("Unable to generate explanation");

            return ExplanationResponse.builder()
                    .questionType(questionType)
                    .explanation(explanation)
                    .modelUsed(modelId)
                    .build();

        } catch (Exception e) {
            log.error("Bedrock explanation failed: {}", e.getMessage());
            return ExplanationResponse.builder()
                    .questionType(questionType)
                    .explanation("Explanation service temporarily unavailable: " + e.getMessage())
                    .modelUsed(modelId)
                    .build();
        }
    }

    private String buildPrompt(Map<String, Object> context, String questionType) {
        String contextJson;
        try {
            contextJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(context);
        } catch (Exception e) {
            contextJson = context.toString();
        }

        String question = switch (questionType) {
            case "why_aurora"        -> "Why was Amazon Aurora selected as the database service?";
            case "why_snowball"      -> "Why was AWS Snowball recommended as the migration method?";
            case "why_multiaz"       -> "Why is Multi-AZ configuration required for this architecture?";
            case "compare_cost"      -> "Explain the cost differences between the three architecture variants.";
            case "why_refactor"      -> "Why was REFACTOR (re-architect) chosen over REHOST or REPLATFORM?";
            case "explain_dr"        -> "Explain the disaster recovery strategy and what happens during a region failure.";
            case "well_architected"  -> "Summarise the Well-Architected assessment findings and top priorities.";
            default                  -> "Explain this AWS architecture decision in plain language.";
        };

        return String.format("""
                You are a cloud architecture expert helping a student understand AWS migration decisions.
                The following JSON contains the decision made by an automated rules engine — you did NOT make this decision.
                Your role is ONLY to explain it clearly in plain language.
                
                Decision Context:
                %s
                
                Question: %s
                
                Provide a clear, concise explanation (3-5 sentences) suitable for a technical presentation.
                Focus on the business and technical reasons. Do not suggest alternatives or make new recommendations.
                """, contextJson, question);
    }

    @lombok.Value
    @lombok.Builder
    public static class ExplanationResponse {
        String questionType;
        String explanation;
        String modelUsed;
    }
}
