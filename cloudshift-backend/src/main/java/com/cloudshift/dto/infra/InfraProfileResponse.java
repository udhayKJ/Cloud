package com.cloudshift.dto.infra;

import com.cloudshift.entity.InfrastructureProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InfraProfileResponse {

    private String id;
    private String projectId;

    // Compute
    private Integer serverCount;
    private Double averageCpuUtilizationPct;
    private Double averageRamGb;

    // Storage
    private Long totalStorageGb;
    private String storageType;

    // Database
    private String dbType;
    private Long dbSizeGb;

    // Scale
    private Long userCount;
    private Integer peakRps;

    // Requirements
    private String budgetTier;
    private Double rtoHours;
    private Double rpoHours;
    private String availabilityRequirement;
    private Double networkBandwidthGbps;
    private String complianceRequirements;

    // Current Setup
    private String currentOs;
    private Boolean isContainerized;
    private Boolean hasMicroservices;
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static InfraProfileResponse from(InfrastructureProfile p) {
        return InfraProfileResponse.builder()
                .id(p.getId())
                .projectId(p.getProject().getId())
                .serverCount(p.getServerCount())
                .averageCpuUtilizationPct(p.getAverageCpuUtilizationPct())
                .averageRamGb(p.getAverageRamGb())
                .totalStorageGb(p.getTotalStorageGb())
                .storageType(p.getStorageType())
                .dbType(p.getDbType() != null ? p.getDbType().name() : null)
                .dbSizeGb(p.getDbSizeGb())
                .userCount(p.getUserCount())
                .peakRps(p.getPeakRps())
                .budgetTier(p.getBudgetTier() != null ? p.getBudgetTier().name() : null)
                .rtoHours(p.getRtoHours())
                .rpoHours(p.getRpoHours())
                .availabilityRequirement(p.getAvailabilityRequirement() != null
                        ? p.getAvailabilityRequirement().name() : null)
                .networkBandwidthGbps(p.getNetworkBandwidthGbps())
                .complianceRequirements(p.getComplianceRequirements())
                .currentOs(p.getCurrentOs())
                .isContainerized(p.getIsContainerized())
                .hasMicroservices(p.getHasMicroservices())
                .notes(p.getNotes())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
