package com.cloudshift.service;

import com.cloudshift.entity.MigrationPlan;
import com.cloudshift.exception.ResourceNotFoundException;
import com.cloudshift.repository.MigrationPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Well-Architected Scoring Service.
 * Aggregates security, cost, reliability, performance, and operational excellence
 * evaluations into 5-pillar percentage scores.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WellArchitectedScoringService {

    private final MigrationPlanRepository planRepo;
    private final SecurityEvaluationService securityService;
    private final CostEstimationService costService;

    public WellArchitectedReport score(String migrationPlanId) {
        MigrationPlan plan = planRepo.findById(migrationPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("MigrationPlan", "id", migrationPlanId));

        Map<String, PillarScore> pillars = new LinkedHashMap<>();

        // ===== Pillar 1: Security =====
        SecurityEvaluationService.SecurityEvaluationResult secResult = securityService.evaluate(migrationPlanId);
        pillars.put("Security", PillarScore.builder()
                .pillar("Security")
                .score(secResult.getOverallScore())
                .riskLevel(secResult.getRiskLevel())
                .keyFindings(secResult.getFindings().stream()
                        .filter(f -> !f.getStatus().equals("PASS"))
                        .map(f -> f.getCategory() + ": " + f.getMessage())
                        .toList())
                .build());

        // ===== Pillar 2: Reliability =====
        int reliabilityScore = calculateReliabilityScore(plan);
        pillars.put("Reliability", PillarScore.builder()
                .pillar("Reliability")
                .score(reliabilityScore)
                .riskLevel(reliabilityScore >= 80 ? "LOW" : reliabilityScore >= 60 ? "MEDIUM" : "HIGH")
                .keyFindings(getReliabilityFindings(plan))
                .build());

        // ===== Pillar 3: Performance Efficiency =====
        int perfScore = calculatePerformanceScore(plan);
        pillars.put("Performance Efficiency", PillarScore.builder()
                .pillar("Performance Efficiency")
                .score(perfScore)
                .riskLevel(perfScore >= 80 ? "LOW" : perfScore >= 60 ? "MEDIUM" : "HIGH")
                .keyFindings(getPerformanceFindings(plan))
                .build());

        // ===== Pillar 4: Cost Optimisation =====
        int costScore = calculateCostScore(plan);
        pillars.put("Cost Optimisation", PillarScore.builder()
                .pillar("Cost Optimisation")
                .score(costScore)
                .riskLevel(costScore >= 80 ? "LOW" : costScore >= 60 ? "MEDIUM" : "HIGH")
                .keyFindings(getCostFindings(plan))
                .build());

        // ===== Pillar 5: Operational Excellence =====
        int opsScore = calculateOpsScore(plan);
        pillars.put("Operational Excellence", PillarScore.builder()
                .pillar("Operational Excellence")
                .score(opsScore)
                .riskLevel(opsScore >= 80 ? "LOW" : opsScore >= 60 ? "MEDIUM" : "HIGH")
                .keyFindings(getOpsFindings(plan))
                .build());

        // Overall score (weighted average)
        int overall = pillars.values().stream().mapToInt(PillarScore::getScore).sum() / pillars.size();

        return WellArchitectedReport.builder()
                .migrationPlanId(migrationPlanId)
                .priorityProfile(plan.getPriorityProfile().name())
                .overallScore(overall)
                .pillars(pillars)
                .overallRiskLevel(overall >= 80 ? "LOW" : overall >= 60 ? "MEDIUM" : "HIGH")
                .build();
    }

    // ===== Pillar Scoring Logic =====

    private int calculateReliabilityScore(MigrationPlan plan) {
        int score = 0;
        boolean multiAz = plan.getDbService() != null && plan.getDbService().contains("Multi-AZ");
        boolean hasAsg   = plan.getComputeService() != null && plan.getComputeService().contains("Auto Scaling");
        boolean hasAlb   = plan.getComputeService() != null && plan.getComputeService().contains("Load Balancer");
        boolean hasDr    = plan.getDrStrategy() != null && !plan.getDrStrategy().contains("Backup");
        boolean hasBackup = plan.getDrStrategy() != null;

        if (hasAsg)   score += 25;
        if (hasAlb)   score += 20;
        if (multiAz)  score += 25;
        if (hasDr)    score += 20;
        if (hasBackup) score += 10;
        return Math.min(score, 100);
    }

    private List<String> getReliabilityFindings(MigrationPlan plan) {
        List<String> findings = new java.util.ArrayList<>();
        if (plan.getComputeService() == null || !plan.getComputeService().contains("Auto Scaling"))
            findings.add("Auto Scaling not configured — single instance is a reliability risk");
        if (plan.getDbService() == null || !plan.getDbService().contains("Multi-AZ"))
            findings.add("Database is Single-AZ — AZ failure causes downtime");
        if (plan.getDrStrategy() == null || plan.getDrStrategy().contains("Backup"))
            findings.add("Backup & Restore DR has long RTO — consider Pilot Light or Warm Standby");
        return findings;
    }

    private int calculatePerformanceScore(MigrationPlan plan) {
        int score = 40; // baseline
        if (plan.getComputeService() != null && plan.getComputeService().contains("Auto Scaling")) score += 20;
        if (plan.getNetworkingServices() != null && plan.getNetworkingServices().contains("CloudFront")) score += 20;
        if (plan.getDbService() != null && (plan.getDbService().contains("Aurora") || plan.getDbService().contains("Read Replica"))) score += 20;
        return Math.min(score, 100);
    }

    private List<String> getPerformanceFindings(MigrationPlan plan) {
        List<String> findings = new java.util.ArrayList<>();
        if (plan.getNetworkingServices() == null || !plan.getNetworkingServices().contains("CloudFront"))
            findings.add("CloudFront CDN not configured — static content served from origin, increasing latency");
        if (plan.getDbService() == null || (!plan.getDbService().contains("Aurora") && !plan.getDbService().contains("Read Replica")))
            findings.add("No read replicas — all DB reads hit the primary instance");
        return findings;
    }

    private int calculateCostScore(MigrationPlan plan) {
        int score = 50; // baseline
        if (plan.getPriorityProfile() == MigrationPlan.PriorityProfile.LOW_COST) score += 30;
        if (plan.getStorageService() != null && plan.getStorageService().contains("Intelligent-Tiering")) score += 10;
        if (plan.getNetworkingServices() != null && plan.getNetworkingServices().contains("VPC Endpoints")) score += 10;
        return Math.min(score, 100);
    }

    private List<String> getCostFindings(MigrationPlan plan) {
        List<String> findings = new java.util.ArrayList<>();
        findings.add("Use Reserved Instances (1-year) to save 30–40% on EC2 and RDS costs");
        if (plan.getStorageService() == null || !plan.getStorageService().contains("Intelligent-Tiering"))
            findings.add("Enable S3 Intelligent-Tiering to automatically reduce storage costs");
        if (plan.getNetworkingServices() == null || !plan.getNetworkingServices().contains("VPC Endpoints"))
            findings.add("Use VPC Endpoints for S3/DynamoDB to avoid NAT Gateway data charges");
        return findings;
    }

    private int calculateOpsScore(MigrationPlan plan) {
        int score = 30; // baseline for having any plan
        if (plan.getSecurityServices() != null && plan.getSecurityServices().contains("CloudTrail")) score += 20;
        if (plan.getSecurityServices() != null && plan.getSecurityServices().contains("Config")) score += 15;
        if (plan.getComputeService() != null && plan.getComputeService().contains("Auto Scaling")) score += 15;
        score += 20; // assume Terraform IaC and GitHub Actions CI/CD are present
        return Math.min(score, 100);
    }

    private List<String> getOpsFindings(MigrationPlan plan) {
        return List.of(
                "Enable AWS Systems Manager Session Manager for SSH-less instance access",
                "Create CloudWatch dashboards for key metrics (CPU, DB connections, ALB 5xx rate)",
                "Set up SNS alerts for CloudWatch alarms",
                "Use AWS Config Rules to enforce tagging, encryption, and security policies"
        );
    }

    // ===== Result Types =====

    @lombok.Value
    @lombok.Builder
    public static class WellArchitectedReport {
        String migrationPlanId;
        String priorityProfile;
        int overallScore;
        String overallRiskLevel;
        Map<String, PillarScore> pillars;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PillarScore {
        String pillar;
        int score;
        String riskLevel;
        List<String> keyFindings;
    }
}
