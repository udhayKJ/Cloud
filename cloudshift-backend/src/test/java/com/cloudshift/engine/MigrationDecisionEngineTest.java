package com.cloudshift.engine;

import com.cloudshift.entity.InfrastructureProfile;
import com.cloudshift.entity.MigrationPlan;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the Migration Decision Engine.
 * Covers all key scenarios from the project guide:
 * - MySQL 5TB 100k users high availability → Aurora Multi-AZ + Snowball + Warm Standby
 * - Low cost small workload → REHOST + t3.micro
 * - Large containerised microservices → REFACTOR + ECS/EKS
 * - Very large data volumes → Snowball Edge / Snowmobile
 */
class MigrationDecisionEngineTest {

    private MigrationDecisionEngine engine;

    @BeforeEach
    void setUp() {
        engine = new MigrationDecisionEngine();
    }

    // ===== Guide Scenario: MySQL, 5TB, 100k users, high availability, RTO 1h, RPO 15min =====

    @Test
    void guideScenario_mysql_5TB_100kUsers_highAvail() {
        InfrastructureProfile infra = InfrastructureProfile.builder()
                .serverCount(10)
                .totalStorageGb(5_000L)
                .dbType(InfrastructureProfile.DbType.MYSQL)
                .dbSizeGb(5_500L)   // 5TB storage + 5.5TB DB = 10.5TB total → Snowball
                .userCount(100_000L)
                .budgetTier(InfrastructureProfile.BudgetTier.HIGH)
                .rtoHours(1.0)
                .rpoHours(0.25)
                .availabilityRequirement(InfrastructureProfile.AvailabilityRequirement.HIGH)
                .isContainerized(false)
                .hasMicroservices(false)
                .build();

        MigrationDecisionEngine.DecisionResult result = engine.analyse(
                infra, MigrationPlan.PriorityProfile.HIGH_AVAILABILITY);

        // Strategy should be REPLATFORM (managed DB benefit, high availability)
        assertThat(result.getMigrationStrategy()).isEqualTo(MigrationPlan.MigrationStrategy.REPLATFORM);

        // DB should be RDS/Aurora (MySQL→Aurora)
        assertThat(result.getDbService())
                .satisfiesAnyOf(
                        s -> assertThat(s).containsIgnoringCase("Aurora"),
                        s -> assertThat(s).containsIgnoringCase("RDS")
                );

        // Migration method: 5TB DB + 5TB storage = ~10TB → Snowball threshold
        assertThat(result.getMigrationMethod()).containsIgnoringCase("Snowball");

        // DR: RTO 1h and high availability → Warm Standby or better
        assertThat(result.getDrStrategy())
                .satisfiesAnyOf(
                        s -> assertThat(s).containsIgnoringCase("Warm Standby"),
                        s -> assertThat(s).containsIgnoringCase("Active-Active")
                );

        // Security should include IAM and KMS
        assertThat(result.getSecurityServices())
                .contains("IAM")
                .contains("KMS");

        // Should have recommendations
        assertThat(result.getRecommendations()).isNotEmpty();
    }

    // ===== Low Cost Profile =====

    @Test
    void lowCostProfile_smallWorkload_rehost() {
        InfrastructureProfile infra = InfrastructureProfile.builder()
                .serverCount(2)
                .totalStorageGb(100L)
                .dbType(InfrastructureProfile.DbType.MYSQL)
                .dbSizeGb(10L)
                .userCount(5_000L)
                .budgetTier(InfrastructureProfile.BudgetTier.LOW)
                .rtoHours(24.0)
                .rpoHours(4.0)
                .availabilityRequirement(InfrastructureProfile.AvailabilityRequirement.STANDARD)
                .isContainerized(false)
                .hasMicroservices(false)
                .build();

        MigrationDecisionEngine.DecisionResult result = engine.analyse(
                infra, MigrationPlan.PriorityProfile.LOW_COST);

        assertThat(result.getMigrationStrategy()).isEqualTo(MigrationPlan.MigrationStrategy.REHOST);
        assertThat(result.getComputeService())
                .satisfiesAnyOf(
                        s -> assertThat(s).containsIgnoringCase("t3.micro"),
                        s -> assertThat(s).containsIgnoringCase("t3.small")
                );
        assertThat(result.getMigrationMethod())
                .satisfiesAnyOf(
                        s -> assertThat(s).containsIgnoringCase("DMS"),
                        s -> assertThat(s).containsIgnoringCase("DataSync")
                );
        assertThat(result.getEstimatedMonthlyUsd()).isGreaterThan(java.math.BigDecimal.ZERO);

        // DR: long RTO/RPO → Backup & Restore
        assertThat(result.getDrStrategy()).containsIgnoringCase("Backup");
    }

    // ===== Refactor: containerised microservices at very high scale =====

    @Test
    void containerisedMicroservices_veryHighScale_refactor() {
        InfrastructureProfile infra = InfrastructureProfile.builder()
                .serverCount(50)
                .totalStorageGb(2_000L)
                .dbType(InfrastructureProfile.DbType.POSTGRESQL)
                .dbSizeGb(200L)
                .userCount(600_000L)   // > 500k → REFACTOR
                .budgetTier(InfrastructureProfile.BudgetTier.ENTERPRISE)
                .rtoHours(0.25)
                .rpoHours(0.08)
                .availabilityRequirement(InfrastructureProfile.AvailabilityRequirement.CRITICAL)
                .isContainerized(true)
                .hasMicroservices(true)
                .build();

        MigrationDecisionEngine.DecisionResult result = engine.analyse(
                infra, MigrationPlan.PriorityProfile.HIGH_AVAILABILITY);

        assertThat(result.getMigrationStrategy()).isEqualTo(MigrationPlan.MigrationStrategy.REFACTOR);
        assertThat(result.getComputeService())
                .satisfiesAnyOf(
                        s -> assertThat(s).containsIgnoringCase("ECS"),
                        s -> assertThat(s).containsIgnoringCase("EKS")
                );
        // Aurora with very strict RTO/RPO
        assertThat(result.getDbService()).containsIgnoringCase("Aurora");
        // DR: very strict RTO <30min + high avail → Active-Active or Warm Standby
        assertThat(result.getDrStrategy())
                .satisfiesAnyOf(
                        s -> assertThat(s).containsIgnoringCase("Active-Active"),
                        s -> assertThat(s).containsIgnoringCase("Warm Standby")
                );
    }

    // ===== Migration method selection by data volume =====

    @ParameterizedTest(name = "storage={0}GB → method contains {1}")
    @CsvSource({
            "100,     DMS",           //  100 + 10   =   110 GB  → DMS
            "12000,   Snowball",      // 12000 + 1200= 13200 GB  → Snowball (>10TB)
            "80000,   Snowball",      // 80000 + 8000= 88000 GB  → Snowball (>10TB, <100TB)
            "200000,  Snowball Edge", //200000 +20000=220000 GB  → Snowball Edge (>100TB)
            "500000,  Snowball Edge"  //500000 +50000=550000 GB  → Snowball Edge
    })
    void migrationMethod_selectedByDataVolume(long storageGb, String expectedMethodFragment) {
        InfrastructureProfile infra = InfrastructureProfile.builder()
                .serverCount(5)
                .totalStorageGb(storageGb)
                .dbType(InfrastructureProfile.DbType.MYSQL)
                .dbSizeGb(storageGb / 10)
                .userCount(10_000L)
                .budgetTier(InfrastructureProfile.BudgetTier.MEDIUM)
                .rtoHours(4.0)
                .rpoHours(1.0)
                .availabilityRequirement(InfrastructureProfile.AvailabilityRequirement.STANDARD)
                .isContainerized(false)
                .hasMicroservices(false)
                .build();

        MigrationDecisionEngine.DecisionResult result = engine.analyse(
                infra, MigrationPlan.PriorityProfile.BALANCED);

        assertThat(result.getMigrationMethod()).containsIgnoringCase(expectedMethodFragment);
    }

    // ===== Oracle/MSSQL produces a licence warning =====

    @Test
    void oracleDatabase_producesLicenceWarning() {
        InfrastructureProfile infra = InfrastructureProfile.builder()
                .serverCount(3)
                .totalStorageGb(500L)
                .dbType(InfrastructureProfile.DbType.ORACLE)
                .dbSizeGb(100L)
                .userCount(20_000L)
                .budgetTier(InfrastructureProfile.BudgetTier.HIGH)
                .rtoHours(4.0)
                .rpoHours(1.0)
                .availabilityRequirement(InfrastructureProfile.AvailabilityRequirement.HIGH)
                .isContainerized(false)
                .hasMicroservices(false)
                .build();

        MigrationDecisionEngine.DecisionResult result = engine.analyse(
                infra, MigrationPlan.PriorityProfile.BALANCED);

        assertThat(result.getWarnings())
                .anyMatch(w -> w.toLowerCase().contains("oracle") || w.toLowerCase().contains("licence"));
    }

    // ===== All 3 priority profiles produce results =====

    @Test
    void allThreeProfiles_produceDifferentCostEstimates() {
        InfrastructureProfile infra = InfrastructureProfile.builder()
                .serverCount(5)
                .totalStorageGb(1_000L)
                .dbType(InfrastructureProfile.DbType.POSTGRESQL)
                .dbSizeGb(100L)
                .userCount(50_000L)
                .budgetTier(InfrastructureProfile.BudgetTier.MEDIUM)
                .rtoHours(2.0)
                .rpoHours(0.5)
                .availabilityRequirement(InfrastructureProfile.AvailabilityRequirement.HIGH)
                .isContainerized(false)
                .hasMicroservices(false)
                .build();

        var lowCost = engine.analyse(infra, MigrationPlan.PriorityProfile.LOW_COST);
        var balanced = engine.analyse(infra, MigrationPlan.PriorityProfile.BALANCED);
        var highAvail = engine.analyse(infra, MigrationPlan.PriorityProfile.HIGH_AVAILABILITY);

        // HIGH_AVAILABILITY should always cost more than LOW_COST
        assertThat(highAvail.getEstimatedMonthlyUsd())
                .isGreaterThan(lowCost.getEstimatedMonthlyUsd());

        // All should have non-null, positive estimates
        assertThat(lowCost.getEstimatedMonthlyUsd()).isPositive();
        assertThat(balanced.getEstimatedMonthlyUsd()).isPositive();
        assertThat(highAvail.getEstimatedMonthlyUsd()).isPositive();
    }
}
