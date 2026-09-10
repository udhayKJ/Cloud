package com.cloudshift.dto.migration;

import com.cloudshift.entity.InfrastructureProfile;
import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Input to the Migration Decision Engine.
 * Wraps infrastructure facts + business requirements.
 */
@Data
public class MigrationAnalysisRequest {

    @NotBlank(message = "Project ID is required")
    private String projectId;

    @NotBlank(message = "Infrastructure profile ID is required")
    private String infraProfileId;

    // ===== Priority weightings (must sum to ~1.0) =====
    // Leave null to use BALANCED defaults (0.25 each)

    /** How much to weight cost minimisation (0.0–1.0) */
    @DecimalMin("0.0") @DecimalMax("1.0")
    private Double costWeight;

    /** How much to weight availability/uptime (0.0–1.0) */
    @DecimalMin("0.0") @DecimalMax("1.0")
    private Double availabilityWeight;

    /** How much to weight security (0.0–1.0) */
    @DecimalMin("0.0") @DecimalMax("1.0")
    private Double securityWeight;

    /** How much to weight performance (0.0–1.0) */
    @DecimalMin("0.0") @DecimalMax("1.0")
    private Double performanceWeight;

    /**
     * Which priority profile to generate.
     * If null, generates all 3 (LOW_COST / BALANCED / HIGH_AVAILABILITY).
     */
    private InfrastructureProfile.AvailabilityRequirement targetProfile;
}
