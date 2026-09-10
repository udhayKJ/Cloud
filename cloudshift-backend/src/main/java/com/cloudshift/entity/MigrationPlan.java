package com.cloudshift.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Output of the Migration Decision Engine.
 * Captures the recommended migration strategy, AWS services, and DR approach.
 */
@Entity
@Table(name = "migration_plans")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MigrationPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_migration_plan_project"))
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "infra_profile_id",
                foreignKey = @ForeignKey(name = "fk_migration_plan_infra"))
    private InfrastructureProfile infraProfile;

    // ===== Decision Engine Output =====

    @Enumerated(EnumType.STRING)
    @Column(name = "migration_strategy", nullable = false, length = 50)
    private MigrationStrategy migrationStrategy;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority_profile", length = 50)
    @Builder.Default
    private PriorityProfile priorityProfile = PriorityProfile.BALANCED;

    // ===== Recommended AWS Services =====
    @Column(name = "compute_service", length = 200)
    private String computeService;       // e.g. "EC2 + Auto Scaling + ALB"

    @Column(name = "db_service", length = 200)
    private String dbService;            // e.g. "Amazon Aurora PostgreSQL Multi-AZ"

    @Column(name = "storage_service", length = 200)
    private String storageService;       // e.g. "S3 + EBS gp3"

    @Column(name = "migration_method", length = 200)
    private String migrationMethod;      // e.g. "AWS DMS + Snowball Edge"

    @Column(name = "dr_strategy", length = 200)
    private String drStrategy;           // e.g. "Pilot Light (us-east-1 → us-west-2)"

    @Column(name = "networking_services", length = 300)
    private String networkingServices;   // e.g. "VPC + ALB + CloudFront"

    @Column(name = "security_services", length = 300)
    private String securityServices;     // e.g. "IAM + KMS + WAF + Shield"

    // ===== Cost =====
    @Column(name = "estimated_cost_monthly", precision = 10, scale = 2)
    private BigDecimal estimatedCostMonthly;

    // ===== Architecture JSON (React Flow graph) =====
    @Column(name = "architecture_json", columnDefinition = "TEXT")
    private String architectureJson;     // serialized nodes + edges for React Flow

    // ===== Status =====
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private PlanStatus status = PlanStatus.DRAFT;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===== Enums =====

    public enum MigrationStrategy {
        REHOST,       // Lift-and-shift → EC2
        REPLATFORM,   // Minor optimisations → managed services (RDS, Elastic Beanstalk)
        REFACTOR      // Re-architect → containers, serverless, microservices
    }

    public enum PriorityProfile {
        LOW_COST,       // Minimise monthly spend
        BALANCED,       // Cost / availability / performance trade-off
        HIGH_AVAILABILITY  // Maximise uptime and DR coverage
    }

    public enum PlanStatus {
        DRAFT, GENERATED, REVIEWED, APPROVED
    }
}
