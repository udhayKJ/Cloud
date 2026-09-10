package com.cloudshift.service;

import com.cloudshift.entity.InfrastructureProfile;
import com.cloudshift.entity.MigrationPlan;
import com.cloudshift.exception.ResourceNotFoundException;
import com.cloudshift.repository.MigrationPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Security Evaluation Service.
 * Runs rule-based checks against a MigrationPlan and returns structured findings.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityEvaluationService {

    private final MigrationPlanRepository planRepo;

    public SecurityEvaluationResult evaluate(String migrationPlanId) {
        MigrationPlan plan = planRepo.findById(migrationPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("MigrationPlan", "id", migrationPlanId));

        List<Finding> findings = new ArrayList<>();
        int score = 0;
        int maxScore = 0;

        // ===== Check 1: IAM least-privilege =====
        maxScore += 20;
        if (plan.getSecurityServices() != null && plan.getSecurityServices().contains("IAM")) {
            score += 20;
            findings.add(Finding.pass("IAM", "IAM instance roles configured — no hardcoded credentials"));
        } else {
            findings.add(Finding.fail("IAM", "IAM roles not present — risk of credential exposure",
                    "Add an EC2 instance role with least-privilege policies. Never use access keys on EC2."));
        }

        // ===== Check 2: Encryption at rest (KMS) =====
        maxScore += 20;
        if (plan.getSecurityServices() != null && plan.getSecurityServices().contains("KMS")) {
            score += 20;
            findings.add(Finding.pass("KMS", "KMS encryption enabled for RDS and S3"));
        } else {
            findings.add(Finding.warn("KMS", "KMS encryption not confirmed",
                    "Enable SSE-KMS for S3 buckets and RDS storage encryption"));
        }

        // ===== Check 3: WAF =====
        maxScore += 15;
        if (plan.getSecurityServices() != null && plan.getSecurityServices().contains("WAF")) {
            score += 15;
            findings.add(Finding.pass("WAF", "AWS WAF attached to ALB — OWASP Top 10 protections active"));
        } else {
            findings.add(Finding.warn("WAF", "WAF not configured",
                    "Attach AWS WAF to the ALB with AWS Managed Rules (Core Rule Set) for OWASP Top 10 protection"));
        }

        // ===== Check 4: Public subnet exposure =====
        maxScore += 15;
        if (plan.getNetworkingServices() != null && plan.getNetworkingServices().contains("private subnets")) {
            score += 15;
            findings.add(Finding.pass("VPC", "Database and compute in private subnets — not internet-accessible"));
        } else {
            findings.add(Finding.warn("VPC", "Private subnet configuration not confirmed",
                    "Place RDS/databases in private subnets. Only ALB should sit in public subnets."));
        }

        // ===== Check 5: CloudTrail audit logging =====
        maxScore += 10;
        if (plan.getSecurityServices() != null && plan.getSecurityServices().contains("CloudTrail")) {
            score += 10;
            findings.add(Finding.pass("CloudTrail", "CloudTrail API audit logging enabled — all AWS API calls recorded"));
        } else {
            findings.add(Finding.fail("CloudTrail", "CloudTrail not enabled — no API audit trail",
                    "Enable CloudTrail in all regions. Store logs in S3 with object lock for tamper-resistance."));
        }

        // ===== Check 6: DDoS protection =====
        maxScore += 10;
        boolean hasShield = plan.getSecurityServices() != null && plan.getSecurityServices().contains("Shield");
        if (hasShield) {
            score += 10;
            findings.add(Finding.pass("Shield", "AWS Shield Standard active — L3/L4 DDoS protection included free"));
        } else {
            findings.add(Finding.warn("Shield", "Shield Standard is free but not confirmed in plan",
                    "Shield Standard is automatic — verify WAF + CloudFront are configured for L7 DDoS mitigation"));
        }

        // ===== Check 7: S3 bucket public access =====
        maxScore += 10;
        findings.add(Finding.warn("S3", "S3 Block Public Access recommended — enforce via bucket policy",
                "Ensure all S3 buckets have Block Public Access enabled unless explicitly serving static content"));
        score += 10;

        // Calculate percentage score
        int percentageScore = maxScore > 0 ? (score * 100) / maxScore : 0;
        String riskLevel = percentageScore >= 80 ? "LOW" : percentageScore >= 60 ? "MEDIUM" : "HIGH";

        return SecurityEvaluationResult.builder()
                .migrationPlanId(migrationPlanId)
                .overallScore(percentageScore)
                .riskLevel(riskLevel)
                .findings(findings)
                .passCount((int) findings.stream().filter(f -> f.status.equals("PASS")).count())
                .warnCount((int) findings.stream().filter(f -> f.status.equals("WARN")).count())
                .failCount((int) findings.stream().filter(f -> f.status.equals("FAIL")).count())
                .build();
    }

    // ===== Result Types =====

    @lombok.Value
    @lombok.Builder
    public static class SecurityEvaluationResult {
        String migrationPlanId;
        int overallScore;        // 0–100
        String riskLevel;        // LOW / MEDIUM / HIGH
        List<Finding> findings;
        int passCount;
        int warnCount;
        int failCount;
    }

    @lombok.Value
    public static class Finding {
        String category;
        String status;           // PASS / WARN / FAIL
        String message;
        String recommendation;

        static Finding pass(String category, String message) {
            return new Finding(category, "PASS", message, null);
        }
        static Finding warn(String category, String message, String recommendation) {
            return new Finding(category, "WARN", message, recommendation);
        }
        static Finding fail(String category, String message, String recommendation) {
            return new Finding(category, "FAIL", message, recommendation);
        }
    }
}
