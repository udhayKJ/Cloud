package com.cloudshift.dto.migration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Full output of the Migration Decision Engine for a single priority profile.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MigrationAnalysisResponse {

    private String migrationPlanId;
    private String projectId;
    private String infraProfileId;

    // ===== Core Decision =====
    private String migrationStrategy;       // REHOST / REPLATFORM / REFACTOR
    private String migrationStrategyReason; // human-readable rationale

    private String priorityProfile;         // LOW_COST / BALANCED / HIGH_AVAILABILITY

    // ===== Recommended AWS Services =====
    private String computeService;
    private String dbService;
    private String storageService;
    private String migrationMethod;         // DMS / Snowball / Snowball Edge / Snowmobile
    private String migrationMethodReason;
    private String drStrategy;
    private String networkingServices;
    private String securityServices;

    // ===== Cost =====
    private BigDecimal estimatedMonthlyUsd;

    // ===== Architecture Graph (React Flow ready) =====
    private ArchitectureGraph architectureGraph;

    // ===== Key Recommendations =====
    private List<String> keyRecommendations;

    // ===== Warnings =====
    private List<String> warnings;
}
