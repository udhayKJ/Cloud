package com.cloudshift.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Describes a company's existing (on-premise) infrastructure.
 * This is the primary input to the Migration Decision Engine.
 */
@Entity
@Table(name = "infrastructure_profiles")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InfrastructureProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_infra_project"))
    private Project project;

    // ===== Compute =====
    @Column(name = "server_count")
    private Integer serverCount;

    @Column(name = "average_cpu_utilization_pct")
    private Double averageCpuUtilizationPct;

    @Column(name = "average_ram_gb")
    private Double averageRamGb;

    // ===== Storage =====
    @Column(name = "total_storage_gb")
    private Long totalStorageGb;

    @Column(name = "storage_type", length = 100)
    private String storageType;       // e.g. SAN, NAS, local disk

    // ===== Database =====
    @Enumerated(EnumType.STRING)
    @Column(name = "db_type", length = 100)
    private DbType dbType;

    @Column(name = "db_size_gb")
    private Long dbSizeGb;

    // ===== Scale =====
    @Column(name = "user_count")
    private Long userCount;

    @Column(name = "peak_rps")
    private Integer peakRps;          // requests per second at peak

    // ===== Requirements =====
    @Enumerated(EnumType.STRING)
    @Column(name = "budget_tier", length = 50)
    private BudgetTier budgetTier;

    @Column(name = "rto_hours")
    private Double rtoHours;           // Recovery Time Objective

    @Column(name = "rpo_hours")
    private Double rpoHours;           // Recovery Point Objective

    @Enumerated(EnumType.STRING)
    @Column(name = "availability_requirement", length = 50)
    private AvailabilityRequirement availabilityRequirement;

    @Column(name = "network_bandwidth_gbps")
    private Double networkBandwidthGbps;

    @Column(name = "compliance_requirements", length = 500)
    private String complianceRequirements;   // e.g. "PCI-DSS, HIPAA"

    // ===== Current Setup =====
    @Column(name = "current_os", length = 100)
    private String currentOs;

    @Column(name = "is_containerized")
    @Builder.Default
    private Boolean isContainerized = false;

    @Column(name = "has_microservices")
    @Builder.Default
    private Boolean hasMicroservices = false;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===== Enums =====

    public enum DbType {
        MYSQL, POSTGRESQL, ORACLE, MSSQL, MONGODB, CASSANDRA, REDIS, OTHER
    }

    public enum BudgetTier {
        LOW, MEDIUM, HIGH, ENTERPRISE
    }

    public enum AvailabilityRequirement {
        STANDARD,       // 99.9%
        HIGH,           // 99.95%
        VERY_HIGH,      // 99.99%
        CRITICAL        // 99.999%
    }
}
