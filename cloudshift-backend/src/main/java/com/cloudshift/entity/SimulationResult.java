package com.cloudshift.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Records results of a Disaster Recovery simulation run.
 */
@Entity
@Table(name = "simulation_results")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "migration_plan_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_sim_plan"))
    private MigrationPlan migrationPlan;

    @Enumerated(EnumType.STRING)
    @Column(name = "failure_scenario", nullable = false, length = 100)
    private FailureScenario failureScenario;

    /** Actual recovery time objective achieved (minutes) */
    @Column(name = "actual_rto_minutes", precision = 8, scale = 2)
    private BigDecimal actualRtoMinutes;

    /** Actual recovery point objective achieved (minutes) */
    @Column(name = "actual_rpo_minutes", precision = 8, scale = 2)
    private BigDecimal actualRpoMinutes;

    @Column(name = "availability_pct", precision = 6, scale = 3)
    private BigDecimal availabilityPct;

    @Column(name = "data_loss_gb", precision = 10, scale = 3)
    private BigDecimal dataLossGb;

    @Column(name = "failed_components", length = 500)
    private String failedComponents;     // comma-separated component names

    @Column(name = "recovery_steps", columnDefinition = "TEXT")
    private String recoverySteps;        // JSON array of recovery step descriptions

    @Column(name = "cloudwatch_metric_namespace", length = 255)
    private String cloudwatchMetricNamespace;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private SimulationStatus status = SimulationStatus.PENDING;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum FailureScenario {
        EC2_FAILURE,
        DATABASE_FAILURE,
        AZ_FAILURE,
        REGION_FAILURE
    }

    public enum SimulationStatus {
        PENDING, RUNNING, COMPLETED, FAILED
    }
}
