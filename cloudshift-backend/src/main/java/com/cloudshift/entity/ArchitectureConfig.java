package com.cloudshift.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Stores generated architecture configurations (Low Cost / Balanced / High Availability variants).
 * The architecture_json field is the React Flow–ready graph.
 */
@Entity
@Table(name = "architecture_configs")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArchitectureConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "migration_plan_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_arch_config_plan"))
    private MigrationPlan migrationPlan;

    @Enumerated(EnumType.STRING)
    @Column(name = "variant", nullable = false, length = 50)
    private MigrationPlan.PriorityProfile variant;

    /** React Flow JSON: { nodes: [...], edges: [...] } */
    @Column(name = "architecture_json", nullable = false, columnDefinition = "TEXT")
    private String architectureJson;

    @Column(name = "label", length = 255)
    private String label;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
