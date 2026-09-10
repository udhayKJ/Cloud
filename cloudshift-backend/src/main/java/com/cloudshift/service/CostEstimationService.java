package com.cloudshift.service;

import com.cloudshift.entity.InfrastructureProfile;
import com.cloudshift.entity.MigrationPlan;
import com.cloudshift.exception.ResourceNotFoundException;
import com.cloudshift.repository.InfrastructureProfileRepository;
import com.cloudshift.repository.MigrationPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Cost Estimation Service.
 * Uses static pricing tables (US East 1 on-demand pricing, September 2024).
 * Can be extended to call the AWS Pricing API for live figures.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CostEstimationService {

    private final MigrationPlanRepository planRepo;
    private final InfrastructureProfileRepository infraRepo;

    /**
     * Detailed cost breakdown for a single migration plan.
     */
    public CostEstimateResult estimate(String migrationPlanId) {
        MigrationPlan plan = planRepo.findById(migrationPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("MigrationPlan", "id", migrationPlanId));

        InfrastructureProfile infra = plan.getInfraProfile();
        MigrationPlan.PriorityProfile profile = plan.getPriorityProfile();

        Map<String, LineItem> breakdown = new LinkedHashMap<>();

        // ===== Compute =====
        int servers = infra != null && infra.getServerCount() != null ? infra.getServerCount() : 1;
        double computeUnitCost = computeUnitCost(profile);
        breakdown.put("EC2 / Compute", LineItem.of(
                instanceType(profile) + " × " + servers + " instances",
                computeUnitCost * servers, "monthly"));

        // ALB
        if (!profile.equals(MigrationPlan.PriorityProfile.LOW_COST)) {
            breakdown.put("Application Load Balancer", LineItem.of("1 ALB", 16.20, "monthly"));
        }

        // ===== Database =====
        if (plan.getDbService() != null && !plan.getDbService().contains("no relational")) {
            double dbCost = dbCost(profile);
            breakdown.put("Database (RDS/Aurora)", LineItem.of(dbInstanceType(profile, plan), dbCost, "monthly"));

            long dbGb = infra != null && infra.getDbSizeGb() != null ? Math.min(infra.getDbSizeGb(), 10_000L) : 20L;
            breakdown.put("DB Storage (gp3)", LineItem.of(dbGb + " GB × $0.115", dbGb * 0.115, "monthly"));
        }

        // ===== Storage =====
        long storageGb = infra != null && infra.getTotalStorageGb() != null ? Math.min(infra.getTotalStorageGb(), 50_000L) : 10L;
        breakdown.put("Amazon S3", LineItem.of(storageGb + " GB × $0.023", storageGb * 0.023, "monthly"));

        // EBS
        breakdown.put("EBS gp3 (boot volumes)", LineItem.of(servers + " × 30GB × $0.08", servers * 30 * 0.08, "monthly"));

        // ===== Networking =====
        breakdown.put("Data Transfer (out)", LineItem.of("Estimated 100GB × $0.09", 9.0, "monthly"));
        if (plan.getNetworkingServices() != null && plan.getNetworkingServices().contains("CloudFront")) {
            breakdown.put("CloudFront CDN", LineItem.of("10TB/month estimate", 85.0, "monthly"));
        }

        // ===== Monitoring / Misc =====
        breakdown.put("CloudWatch", LineItem.of("Metrics + logs + dashboards", 10.0, "monthly"));
        breakdown.put("Misc (IAM/Config/CloudTrail)", LineItem.of("Flat estimate", 5.0, "monthly"));

        // WAF (high availability)
        if (profile == MigrationPlan.PriorityProfile.HIGH_AVAILABILITY) {
            breakdown.put("AWS WAF", LineItem.of("Demo only — disable after demo", 5.0, "monthly (demo)"));
        }

        // Total
        double totalMonthly = breakdown.values().stream().mapToDouble(l -> l.cost).sum();
        double totalAnnual  = totalMonthly * 12;

        return CostEstimateResult.builder()
                .migrationPlanId(migrationPlanId)
                .priorityProfile(profile.name())
                .lineItems(breakdown)
                .totalMonthlyUsd(BigDecimal.valueOf(totalMonthly).setScale(2, RoundingMode.HALF_UP))
                .totalAnnualUsd(BigDecimal.valueOf(totalAnnual).setScale(2, RoundingMode.HALF_UP))
                .currency("USD")
                .pricingRegion("us-east-1")
                .pricingNote("On-demand pricing, us-east-1. Use Reserved Instances (1-year) to save 30–40%.")
                .build();
    }

    /**
     * Side-by-side cost comparison of multiple migration plans (variants).
     */
    public List<CostEstimateResult> compare(List<String> migrationPlanIds) {
        return migrationPlanIds.stream().map(this::estimate).toList();
    }

    // ===== Pricing helpers (US East 1, on-demand, Sep 2024) =====

    private double computeUnitCost(MigrationPlan.PriorityProfile p) {
        return switch (p) {
            case LOW_COST          -> 8.47;   // t3.micro
            case BALANCED          -> 30.37;  // t3.medium
            case HIGH_AVAILABILITY -> 96.36;  // m6i.large
        };
    }

    private String instanceType(MigrationPlan.PriorityProfile p) {
        return switch (p) {
            case LOW_COST          -> "t3.micro ($0.0116/hr)";
            case BALANCED          -> "t3.medium ($0.0416/hr)";
            case HIGH_AVAILABILITY -> "m6i.large ($0.096/hr)";
        };
    }

    private double dbCost(MigrationPlan.PriorityProfile p) {
        return switch (p) {
            case LOW_COST          -> 12.41;   // db.t3.micro single-AZ
            case BALANCED          -> 48.62;   // db.t3.medium single-AZ
            case HIGH_AVAILABILITY -> 194.48;  // db.t3.medium Multi-AZ
        };
    }

    private String dbInstanceType(MigrationPlan.PriorityProfile p, MigrationPlan plan) {
        String base = switch (p) {
            case LOW_COST          -> "db.t3.micro Single-AZ";
            case BALANCED          -> "db.t3.medium Single-AZ";
            case HIGH_AVAILABILITY -> "db.t3.medium Multi-AZ";
        };
        boolean isAurora = plan.getDbService() != null && plan.getDbService().contains("Aurora");
        return (isAurora ? "Aurora / " : "RDS / ") + base;
    }

    // ===== Result Types =====

    @lombok.Value
    @lombok.Builder
    public static class CostEstimateResult {
        String migrationPlanId;
        String priorityProfile;
        Map<String, LineItem> lineItems;
        BigDecimal totalMonthlyUsd;
        BigDecimal totalAnnualUsd;
        String currency;
        String pricingRegion;
        String pricingNote;
    }

    @lombok.Value
    public static class LineItem {
        String description;
        double cost;
        String unit;

        public static LineItem of(String description, double cost, String unit) {
            return new LineItem(description, cost, unit);
        }
    }
}
