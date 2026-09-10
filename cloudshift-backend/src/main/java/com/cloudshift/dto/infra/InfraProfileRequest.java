package com.cloudshift.dto.infra;

import com.cloudshift.entity.InfrastructureProfile;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class InfraProfileRequest {

    @NotBlank(message = "Project ID is required")
    private String projectId;

    // Compute
    @Min(value = 1, message = "Server count must be at least 1")
    private Integer serverCount;

    @DecimalMin(value = "0.0") @DecimalMax(value = "100.0")
    private Double averageCpuUtilizationPct;

    @DecimalMin("0.5")
    private Double averageRamGb;

    // Storage
    @Min(1)
    private Long totalStorageGb;

    private String storageType;

    // Database
    private InfrastructureProfile.DbType dbType;

    @Min(0)
    private Long dbSizeGb;

    // Scale
    @Min(1)
    private Long userCount;

    @Min(0)
    private Integer peakRps;

    // Requirements
    @NotNull(message = "Budget tier is required")
    private InfrastructureProfile.BudgetTier budgetTier;

    @DecimalMin("0.0")
    private Double rtoHours;

    @DecimalMin("0.0")
    private Double rpoHours;

    @NotNull(message = "Availability requirement is required")
    private InfrastructureProfile.AvailabilityRequirement availabilityRequirement;

    @DecimalMin("0.0")
    private Double networkBandwidthGbps;

    @Size(max = 500)
    private String complianceRequirements;

    // Current Setup
    @Size(max = 100)
    private String currentOs;

    private Boolean isContainerized;

    private Boolean hasMicroservices;

    @Size(max = 5000)
    private String notes;
}
