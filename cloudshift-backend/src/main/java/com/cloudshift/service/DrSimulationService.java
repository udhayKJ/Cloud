package com.cloudshift.service;

import com.cloudshift.entity.MigrationPlan;
import com.cloudshift.entity.SimulationResult;
import com.cloudshift.exception.ResourceNotFoundException;
import com.cloudshift.repository.MigrationPlanRepository;
import com.cloudshift.repository.SimulationResultRepository;
import com.cloudshift.service.aws.CloudWatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Disaster Recovery Simulation Service.
 * Models 4 failure scenarios and calculates RTO/RPO/availability impact.
 * Pushes metrics to CloudWatch (stubbed in dev, real in prod).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DrSimulationService {

    private final MigrationPlanRepository planRepo;
    private final SimulationResultRepository simResultRepo;
    private final CloudWatchService cloudWatchService;

    /**
     * Runs a DR simulation for a given failure scenario.
     */
    @Transactional
    public DrSimulationResult simulate(String migrationPlanId, SimulationResult.FailureScenario scenario) {
        MigrationPlan plan = planRepo.findById(migrationPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("MigrationPlan", "id", migrationPlanId));

        log.info("Running DR simulation: plan={}, scenario={}", migrationPlanId, scenario);

        DrSimulationResult result = runScenario(plan, scenario);

        // Persist the simulation result
        SimulationResult entity = SimulationResult.builder()
                .migrationPlan(plan)
                .failureScenario(scenario)
                .actualRtoMinutes(result.getActualRtoMinutes())
                .actualRpoMinutes(result.getActualRpoMinutes())
                .availabilityPct(result.getAvailabilityPct())
                .dataLossGb(result.getDataLossGb())
                .failedComponents(String.join(",", result.getFailedComponents()))
                .recoverySteps(String.join("|", result.getRecoverySteps()))
                .cloudwatchMetricNamespace("CloudShiftAI/DR")
                .status(SimulationResult.SimulationStatus.COMPLETED)
                .build();

        simResultRepo.save(entity);

        // Push metrics to CloudWatch (stubbed in dev)
        cloudWatchService.putMetric("DrRtoMinutes", result.getActualRtoMinutes().doubleValue(),
                "Count", "Scenario=" + scenario.name() + ",Plan=" + migrationPlanId);
        cloudWatchService.putMetric("DrRpoMinutes", result.getActualRpoMinutes().doubleValue(),
                "Count", "Scenario=" + scenario.name() + ",Plan=" + migrationPlanId);
        cloudWatchService.putMetric("DrAvailabilityPct", result.getAvailabilityPct().doubleValue(),
                "Percent", "Scenario=" + scenario.name());

        result.setSimulationId(entity.getId());
        return result;
    }

    /**
     * Retrieves all simulation results for a migration plan.
     */
    @Transactional(readOnly = true)
    public List<SimulationResult> getSimulationHistory(String migrationPlanId) {
        return simResultRepo.findByMigrationPlanIdOrderByCreatedAtDesc(migrationPlanId);
    }

    // =========================================================================
    // Scenario Implementations
    // =========================================================================

    private DrSimulationResult runScenario(MigrationPlan plan, SimulationResult.FailureScenario scenario) {
        MigrationPlan.PriorityProfile profile = plan.getPriorityProfile();
        boolean isHighAvail = profile == MigrationPlan.PriorityProfile.HIGH_AVAILABILITY;
        boolean isBalanced  = profile == MigrationPlan.PriorityProfile.BALANCED;

        return switch (scenario) {
            case EC2_FAILURE      -> simulateEc2Failure(plan, isHighAvail);
            case DATABASE_FAILURE -> simulateDbFailure(plan, isHighAvail, isBalanced);
            case AZ_FAILURE       -> simulateAzFailure(plan, isHighAvail);
            case REGION_FAILURE   -> simulateRegionFailure(plan, isHighAvail);
        };
    }

    private DrSimulationResult simulateEc2Failure(MigrationPlan plan, boolean highAvail) {
        // With Auto Scaling: ASG detects failure and launches replacement in ~3-5 minutes
        // Without: manual intervention needed (~15-30 minutes)
        boolean hasAsg = plan.getComputeService() != null && plan.getComputeService().contains("Auto Scaling");

        BigDecimal rto = hasAsg ? BigDecimal.valueOf(3.0) : BigDecimal.valueOf(20.0);
        BigDecimal rpo = BigDecimal.valueOf(0.0); // stateless compute — no data loss
        BigDecimal avail = hasAsg ? BigDecimal.valueOf(99.95) : BigDecimal.valueOf(99.0);

        List<String> steps = new ArrayList<>();
        steps.add("EC2 instance fails health check");
        if (hasAsg) {
            steps.add("Auto Scaling Group detects unhealthy instance within 2 minutes");
            steps.add("ASG terminates failed instance and launches replacement in same AZ");
            steps.add("ALB health check passes — new instance receives traffic (~1-3 min)");
            steps.add("Recovery complete — RTO: " + rto + " minutes");
        } else {
            steps.add("CloudWatch alarm triggers (5-minute evaluation)");
            steps.add("SNS notification sent to ops team");
            steps.add("Manual intervention: launch new EC2 from AMI (~10 min)");
            steps.add("DNS/EIP update to new instance (~2 min)");
            steps.add("Recovery complete — RTO: " + rto + " minutes");
        }

        return DrSimulationResult.builder()
                .scenario(SimulationResult.FailureScenario.EC2_FAILURE.name())
                .actualRtoMinutes(rto)
                .actualRpoMinutes(rpo)
                .availabilityPct(avail)
                .dataLossGb(BigDecimal.ZERO)
                .failedComponents(List.of("EC2 Instance (1/" + (plan.getInfraProfile() != null
                        && plan.getInfraProfile().getServerCount() != null
                        ? plan.getInfraProfile().getServerCount() : "N") + ")"))
                .recoverySteps(steps)
                .meetsRtoTarget(plan.getInfraProfile() == null || plan.getInfraProfile().getRtoHours() == null
                        || rto.doubleValue() <= plan.getInfraProfile().getRtoHours() * 60)
                .meetsRpoTarget(true)
                .build();
    }

    private DrSimulationResult simulateDbFailure(MigrationPlan plan, boolean highAvail, boolean balanced) {
        boolean multiAz   = plan.getDbService() != null && plan.getDbService().contains("Multi-AZ");
        boolean isAurora  = plan.getDbService() != null && plan.getDbService().contains("Aurora");

        BigDecimal rto, rpo, dataLoss;
        List<String> steps = new ArrayList<>();

        if (isAurora && multiAz) {
            // Aurora Multi-AZ — automatic failover in ~30 seconds
            rto = BigDecimal.valueOf(0.5);
            rpo = BigDecimal.valueOf(0.0);
            dataLoss = BigDecimal.ZERO;
            steps.add("Aurora primary instance becomes unavailable");
            steps.add("Aurora detects failure within seconds via health monitoring");
            steps.add("Automatic failover promotes read replica to primary (~30 seconds)");
            steps.add("Application reconnects via RDS Proxy — connection pooling minimises disruption");
            steps.add("DNS CNAME updated automatically to new primary");
            steps.add("Recovery complete — RTO: 0.5 min, RPO: 0 min");
        } else if (multiAz) {
            // RDS Multi-AZ — failover ~1-2 minutes
            rto = BigDecimal.valueOf(2.0);
            rpo = BigDecimal.valueOf(0.0);
            dataLoss = BigDecimal.ZERO;
            steps.add("RDS primary instance fails");
            steps.add("RDS health monitoring detects failure (<60 seconds)");
            steps.add("Automatic failover to standby replica in separate AZ (~60-120 seconds)");
            steps.add("CNAME updated — application reconnects automatically");
            steps.add("Recovery complete — RTO: 2 min, RPO: 0 min (synchronous replication)");
        } else {
            // Single-AZ — must restore from snapshot
            rto = BigDecimal.valueOf(60.0);
            rpo = BigDecimal.valueOf(5.0);
            dataLoss = BigDecimal.valueOf(0.5);
            steps.add("RDS single-AZ instance fails");
            steps.add("No standby — RDS automatically restores from latest automated backup");
            steps.add("Backup restoration from S3 (~30-90 minutes depending on DB size)");
            steps.add("Apply binlog / WAL replay from backup point to failure");
            steps.add("Update connection strings — application reconnects");
            steps.add("Recovery complete — RTO: ~60 min, RPO: ~5 min (last backup)");
        }

        return DrSimulationResult.builder()
                .scenario(SimulationResult.FailureScenario.DATABASE_FAILURE.name())
                .actualRtoMinutes(rto)
                .actualRpoMinutes(rpo)
                .availabilityPct(multiAz ? BigDecimal.valueOf(99.95) : BigDecimal.valueOf(99.5))
                .dataLossGb(dataLoss)
                .failedComponents(List.of("RDS Primary Instance"))
                .recoverySteps(steps)
                .meetsRtoTarget(plan.getInfraProfile() == null || plan.getInfraProfile().getRtoHours() == null
                        || rto.doubleValue() <= plan.getInfraProfile().getRtoHours() * 60)
                .meetsRpoTarget(plan.getInfraProfile() == null || plan.getInfraProfile().getRpoHours() == null
                        || rpo.doubleValue() <= plan.getInfraProfile().getRpoHours() * 60)
                .build();
    }

    private DrSimulationResult simulateAzFailure(MigrationPlan plan, boolean highAvail) {
        boolean multiAz = plan.getNetworkingServices() != null
                && plan.getNetworkingServices().contains("2 AZs");

        BigDecimal rto = multiAz ? BigDecimal.valueOf(5.0) : BigDecimal.valueOf(120.0);
        BigDecimal rpo = multiAz ? BigDecimal.valueOf(0.0) : BigDecimal.valueOf(15.0);

        List<String> steps = new ArrayList<>();
        steps.add("Availability Zone " + (highAvail ? "us-east-1b" : "us-east-1a") + " becomes unavailable");
        if (multiAz) {
            steps.add("ALB health checks detect instances in failed AZ as unhealthy");
            steps.add("Traffic automatically rerouted to healthy instances in us-east-1a");
            steps.add("Auto Scaling launches replacement instances in healthy AZ");
            steps.add("RDS Multi-AZ standby (in separate AZ) promoted to primary if needed");
            steps.add("Recovery complete — RTO: " + rto + " min, full capacity restored in ~10 min");
        } else {
            steps.add("All instances in single AZ unreachable — full outage");
            steps.add("Manual recovery: launch instances in different AZ");
            steps.add("Restore database from S3 backup if RDS also in failed AZ");
            steps.add("Recovery time highly variable — RTO: ~2 hours minimum");
        }

        return DrSimulationResult.builder()
                .scenario(SimulationResult.FailureScenario.AZ_FAILURE.name())
                .actualRtoMinutes(rto)
                .actualRpoMinutes(rpo)
                .availabilityPct(multiAz ? BigDecimal.valueOf(99.90) : BigDecimal.valueOf(98.0))
                .dataLossGb(rpo.compareTo(BigDecimal.ZERO) > 0 ? BigDecimal.valueOf(0.1) : BigDecimal.ZERO)
                .failedComponents(List.of("EC2 instances in AZ-b", "RDS if Single-AZ"))
                .recoverySteps(steps)
                .meetsRtoTarget(multiAz)
                .meetsRpoTarget(multiAz)
                .build();
    }

    private DrSimulationResult simulateRegionFailure(MigrationPlan plan, boolean highAvail) {
        String drStrategy = plan.getDrStrategy() != null ? plan.getDrStrategy() : "";

        BigDecimal rto, rpo, avail;
        List<String> steps = new ArrayList<>();
        steps.add("AWS Region us-east-1 experiences catastrophic failure");

        if (drStrategy.contains("Active-Active")) {
            rto = BigDecimal.valueOf(1.0);
            rpo = BigDecimal.valueOf(0.0);
            avail = BigDecimal.valueOf(99.999);
            steps.add("Route 53 health checks detect us-east-1 failure (<30 seconds)");
            steps.add("DNS failover routes all traffic to us-west-2 active region");
            steps.add("Global Accelerator re-routes remaining traffic within seconds");
            steps.add("No recovery needed — us-west-2 already serving production traffic");
            steps.add("Recovery: Near-instant — RTO: <1 min, RPO: 0 (synchronous replication)");
        } else if (drStrategy.contains("Warm Standby")) {
            rto = BigDecimal.valueOf(15.0);
            rpo = BigDecimal.valueOf(1.0);
            avail = BigDecimal.valueOf(99.95);
            steps.add("CloudWatch alarm detects region failure");
            steps.add("Scale-up DR region (us-west-2) to full production capacity via Auto Scaling");
            steps.add("Route 53 health-check failover updates DNS to DR region (~60 seconds TTL)");
            steps.add("Verify RDS Cross-Region Read Replica — promote to primary if needed");
            steps.add("Recovery complete — RTO: ~15 min, RPO: ~1 min (async replication lag)");
        } else if (drStrategy.contains("Pilot Light")) {
            rto = BigDecimal.valueOf(60.0);
            rpo = BigDecimal.valueOf(5.0);
            avail = BigDecimal.valueOf(99.5);
            steps.add("Trigger DR runbook — launch EC2 instances from pre-baked AMIs in us-west-2");
            steps.add("Promote RDS Cross-Region Read Replica to standalone primary");
            steps.add("Update Route 53 to point to DR infrastructure");
            steps.add("Verify application health in DR region");
            steps.add("Recovery complete — RTO: ~60 min, RPO: ~5 min");
        } else {
            rto = BigDecimal.valueOf(480.0);
            rpo = BigDecimal.valueOf(60.0);
            avail = BigDecimal.valueOf(99.0);
            steps.add("Retrieve latest S3 backup / snapshot");
            steps.add("Provision new infrastructure in backup region from IaC (Terraform)");
            steps.add("Restore database from S3 backup");
            steps.add("Deploy application and update DNS");
            steps.add("Recovery complete — RTO: ~8 hours, RPO: last backup (~1 hour)");
        }

        return DrSimulationResult.builder()
                .scenario(SimulationResult.FailureScenario.REGION_FAILURE.name())
                .actualRtoMinutes(rto)
                .actualRpoMinutes(rpo)
                .availabilityPct(avail)
                .dataLossGb(rpo.compareTo(BigDecimal.ZERO) > 0 ? BigDecimal.valueOf(rpo.doubleValue() * 0.01) : BigDecimal.ZERO)
                .failedComponents(List.of("All services in us-east-1"))
                .recoverySteps(steps)
                .meetsRtoTarget(plan.getInfraProfile() == null || plan.getInfraProfile().getRtoHours() == null
                        || rto.doubleValue() <= plan.getInfraProfile().getRtoHours() * 60)
                .meetsRpoTarget(plan.getInfraProfile() == null || plan.getInfraProfile().getRpoHours() == null
                        || rpo.doubleValue() <= plan.getInfraProfile().getRpoHours() * 60)
                .build();
    }

    // ===== Result DTO =====

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DrSimulationResult {
        private String simulationId;
        private String scenario;
        private BigDecimal actualRtoMinutes;
        private BigDecimal actualRpoMinutes;
        private BigDecimal availabilityPct;
        private BigDecimal dataLossGb;
        private List<String> failedComponents;
        private List<String> recoverySteps;
        private boolean meetsRtoTarget;
        private boolean meetsRpoTarget;
    }
}
