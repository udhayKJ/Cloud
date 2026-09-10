package com.cloudshift.engine;

import com.cloudshift.entity.InfrastructureProfile;
import com.cloudshift.entity.MigrationPlan;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * CloudShift AI — Migration Decision Engine
 * <p>
 * Pure, deterministic, rules-based engine. No ML, no LLM, no AWS calls.
 * Takes an {@link InfrastructureProfile} and priority weightings and returns a
 * {@link DecisionResult} containing the full recommended AWS architecture.
 * <p>
 * The LLM (Bedrock) later explains the decisions made here — it never makes them.
 */
@Component
@Slf4j
public class MigrationDecisionEngine {

    // ===== Data size thresholds (GB) for migration method selection =====
    private static final long SNOWBALL_THRESHOLD_GB        = 10_000L;   // 10 TB → Snowball
    private static final long SNOWBALL_EDGE_THRESHOLD_GB   = 100_000L;  // 100 TB → Snowball Edge
    private static final long SNOWMOBILE_THRESHOLD_GB      = 10_000_000L; // 10 PB → Snowmobile

    // ===== User count thresholds =====
    private static final long HIGH_SCALE_USERS = 100_000L;
    private static final long VERY_HIGH_SCALE_USERS = 500_000L;

    // ===== RTO/RPO thresholds (hours) =====
    private static final double STRICT_RTO_HOURS = 1.0;
    private static final double STRICT_RPO_HOURS = 0.25; // 15 minutes

    /**
     * Runs the decision engine for a specific priority profile.
     *
     * @param infra   the source infrastructure profile
     * @param profile the priority profile to optimise for
     * @return a complete {@link DecisionResult}
     */
    public DecisionResult analyse(InfrastructureProfile infra, MigrationPlan.PriorityProfile profile) {
        log.info("Running migration analysis: profile={}, storage={}GB, users={}, db={}",
                profile, infra.getTotalStorageGb(), infra.getUserCount(), infra.getDbType());

        List<String> recommendations = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        // 1. Determine migration strategy
        MigrationPlan.MigrationStrategy strategy = determineMigrationStrategy(infra, profile, recommendations);

        // 2. Determine compute services
        String computeService = determineComputeService(infra, strategy, profile, recommendations);

        // 3. Determine database service
        String dbService = determineDbService(infra, strategy, profile, recommendations);

        // 4. Determine storage services
        String storageService = determineStorageService(infra, profile, recommendations);

        // 5. Determine migration method
        String migrationMethod = determineMigrationMethod(infra, recommendations, warnings);
        String migrationMethodReason = buildMigrationMethodReason(infra);

        // 6. Determine DR strategy
        String drStrategy = determineDrStrategy(infra, profile, recommendations);

        // 7. Determine networking
        String networkingServices = determineNetworkingServices(infra, profile);

        // 8. Determine security services
        String securityServices = determineSecurityServices(infra, profile, recommendations);

        // 9. Estimate monthly cost
        BigDecimal estimatedCost = estimateMonthlyCost(infra, strategy, profile);

        // 10. Build strategy rationale
        String strategyReason = buildStrategyReason(strategy, infra, profile);

        // Warnings for edge cases
        addWarnings(infra, profile, warnings);

        return DecisionResult.builder()
                .migrationStrategy(strategy)
                .migrationStrategyReason(strategyReason)
                .priorityProfile(profile)
                .computeService(computeService)
                .dbService(dbService)
                .storageService(storageService)
                .migrationMethod(migrationMethod)
                .migrationMethodReason(migrationMethodReason)
                .drStrategy(drStrategy)
                .networkingServices(networkingServices)
                .securityServices(securityServices)
                .estimatedMonthlyUsd(estimatedCost)
                .recommendations(recommendations)
                .warnings(warnings)
                .build();
    }

    // =========================================================================
    // RULE 1: Migration Strategy
    // =========================================================================

    private MigrationPlan.MigrationStrategy determineMigrationStrategy(
            InfrastructureProfile infra,
            MigrationPlan.PriorityProfile profile,
            List<String> recs) {

        // REFACTOR conditions — fully re-architect
        boolean containerized      = Boolean.TRUE.equals(infra.getIsContainerized());
        boolean hasMicroservices   = Boolean.TRUE.equals(infra.getHasMicroservices());
        boolean highScale          = infra.getUserCount() != null && infra.getUserCount() >= VERY_HIGH_SCALE_USERS;
        boolean highAvailProfile   = profile == MigrationPlan.PriorityProfile.HIGH_AVAILABILITY;
        boolean strictRto          = infra.getRtoHours() != null && infra.getRtoHours() <= STRICT_RTO_HOURS;
        boolean strictRpo          = infra.getRpoHours() != null && infra.getRpoHours() <= STRICT_RPO_HOURS;

        if ((containerized || hasMicroservices) && highScale) {
            recs.add("REFACTOR: App is already containerised/microservices at very high scale → ECS/EKS + Aurora Serverless");
            return MigrationPlan.MigrationStrategy.REFACTOR;
        }

        // REPLATFORM — swap DB / managed services but keep app architecture
        boolean managedDbBenefit = infra.getDbType() != null &&
                (infra.getDbType() == InfrastructureProfile.DbType.MYSQL ||
                 infra.getDbType() == InfrastructureProfile.DbType.POSTGRESQL ||
                 infra.getDbType() == InfrastructureProfile.DbType.ORACLE ||
                 infra.getDbType() == InfrastructureProfile.DbType.MSSQL);
        boolean complexRequirements = (strictRto || strictRpo) && highAvailProfile;

        if (managedDbBenefit && !highScale && (complexRequirements || profile != MigrationPlan.PriorityProfile.LOW_COST)) {
            recs.add("REPLATFORM: Move relational DB to Amazon RDS/Aurora for managed backups, patching, and Multi-AZ");
            return MigrationPlan.MigrationStrategy.REPLATFORM;
        }

        // REHOST — pure lift and shift
        recs.add("REHOST: Fastest and lowest-risk migration → EC2 instances match existing server topology");
        return MigrationPlan.MigrationStrategy.REHOST;
    }

    // =========================================================================
    // RULE 2: Compute Services
    // =========================================================================

    private String determineComputeService(InfrastructureProfile infra,
                                           MigrationPlan.MigrationStrategy strategy,
                                           MigrationPlan.PriorityProfile profile,
                                           List<String> recs) {
        boolean highScale = infra.getUserCount() != null && infra.getUserCount() >= HIGH_SCALE_USERS;
        boolean containerized = Boolean.TRUE.equals(infra.getIsContainerized());

        if (strategy == MigrationPlan.MigrationStrategy.REFACTOR && containerized) {
            recs.add("Use Amazon ECS (Fargate) for serverless containers — no EC2 management overhead");
            return "Amazon ECS (Fargate) + Application Load Balancer + Auto Scaling";
        }

        if (strategy == MigrationPlan.MigrationStrategy.REFACTOR) {
            recs.add("EKS recommended for microservices orchestration at scale");
            return "Amazon EKS + Node Groups + Application Load Balancer + Cluster Auto Scaler";
        }

        if (highScale || profile == MigrationPlan.PriorityProfile.HIGH_AVAILABILITY) {
            recs.add("EC2 Auto Scaling Group with ALB distributes load and replaces failed instances automatically");
            return "Amazon EC2 (t3.medium/m6i) + Auto Scaling Group + Application Load Balancer";
        }

        if (profile == MigrationPlan.PriorityProfile.LOW_COST) {
            recs.add("t3.micro/small instances stay within free tier for low-traffic workloads");
            return "Amazon EC2 (t3.micro/t3.small) + Elastic IP";
        }

        return "Amazon EC2 (t3.medium) + Auto Scaling Group + Application Load Balancer";
    }

    // =========================================================================
    // RULE 3: Database Services
    // =========================================================================

    private String determineDbService(InfrastructureProfile infra,
                                      MigrationPlan.MigrationStrategy strategy,
                                      MigrationPlan.PriorityProfile profile,
                                      List<String> recs) {
        if (infra.getDbType() == null) {
            return "Amazon S3 (object storage, no relational DB detected)";
        }

        boolean highAvail  = profile == MigrationPlan.PriorityProfile.HIGH_AVAILABILITY;
        boolean strictRpo  = infra.getRpoHours() != null && infra.getRpoHours() <= STRICT_RPO_HOURS;
        boolean lowCost    = profile == MigrationPlan.PriorityProfile.LOW_COST;

        switch (infra.getDbType()) {
            case MYSQL:
            case POSTGRESQL:
                if (strategy == MigrationPlan.MigrationStrategy.REFACTOR || (highAvail && strictRpo)) {
                    recs.add("Aurora PostgreSQL-compatible offers 5× throughput vs RDS and automatic Multi-AZ with 6 copies of data");
                    return highAvail
                            ? "Amazon Aurora PostgreSQL (Multi-AZ, 2 read replicas) + RDS Proxy"
                            : "Amazon Aurora PostgreSQL (Single-AZ) + automated backups";
                }
                if (lowCost) {
                    recs.add("RDS PostgreSQL db.t3.micro keeps you in free tier for dev/small workloads");
                    return "Amazon RDS PostgreSQL (db.t3.micro, Single-AZ)";
                }
                return highAvail
                        ? "Amazon RDS PostgreSQL (db.t3.medium, Multi-AZ) + Read Replica"
                        : "Amazon RDS PostgreSQL (db.t3.medium, Single-AZ)";

            case ORACLE:
            case MSSQL:
                recs.add("Oracle/MSSQL licences are expensive on RDS — consider schema conversion to Aurora/PostgreSQL via AWS SCT");
                return highAvail
                        ? "Amazon RDS " + infra.getDbType() + " (Multi-AZ) — or migrate to Aurora PostgreSQL via AWS SCT"
                        : "Amazon RDS " + infra.getDbType() + " (Single-AZ) — or migrate to Aurora PostgreSQL via AWS SCT";

            case MONGODB:
                recs.add("Amazon DocumentDB is MongoDB-compatible and fully managed");
                return "Amazon DocumentDB (MongoDB-compatible, 3 replicas across AZs)";

            case REDIS:
                return "Amazon ElastiCache for Redis (cluster mode " + (highAvail ? "enabled" : "disabled") + ")";

            case CASSANDRA:
                return "Amazon Keyspaces (Cassandra-compatible, serverless)";

            default:
                return "Amazon RDS (db.t3.medium) — verify schema compatibility";
        }
    }

    // =========================================================================
    // RULE 4: Storage
    // =========================================================================

    private String determineStorageService(InfrastructureProfile infra,
                                           MigrationPlan.PriorityProfile profile,
                                           List<String> recs) {
        long storageGb = infra.getTotalStorageGb() != null ? infra.getTotalStorageGb() : 0L;
        boolean lowCost = profile == MigrationPlan.PriorityProfile.LOW_COST;

        StringBuilder storage = new StringBuilder("Amazon S3 (Standard");
        if (lowCost) {
            storage.append(", lifecycle → S3 Intelligent-Tiering for infrequent data");
            recs.add("S3 Intelligent-Tiering automatically moves cold data to cheaper storage classes");
        }
        storage.append(") + Amazon EBS gp3");

        if (storageGb > 1_000) {
            storage.append(" + Amazon EFS (shared file system for multi-instance access)");
            recs.add("EFS provides shared NFS storage for stateful multi-instance workloads");
        }
        if (storageGb > 50_000) {
            storage.append(" + S3 Glacier Instant Retrieval (archival)");
            recs.add("Archive data older than 90 days to Glacier for >90% storage cost reduction");
        }
        return storage.toString();
    }

    // =========================================================================
    // RULE 5: Migration Method (based on data volume)
    // =========================================================================

    private String determineMigrationMethod(InfrastructureProfile infra,
                                            List<String> recs,
                                            List<String> warnings) {
        long totalGb = infra.getTotalStorageGb() != null ? infra.getTotalStorageGb() : 0L;
        long dbGb    = infra.getDbSizeGb() != null ? infra.getDbSizeGb() : 0L;
        long totalDataGb = totalGb + dbGb;

        if (totalDataGb >= SNOWMOBILE_THRESHOLD_GB) {
            warnings.add("Data volume >10 PB — AWS Snowmobile (truck) is the only viable offline transfer option");
            return "AWS Snowmobile (exabyte-scale physical transfer)";
        }
        if (totalDataGb >= SNOWBALL_EDGE_THRESHOLD_GB) {
            recs.add("Data volume >100 TB — Snowball Edge with compute capacity allows on-site pre-processing before transfer");
            return "AWS Snowball Edge (100 TB+ offline transfer with on-site compute)";
        }
        if (totalDataGb >= SNOWBALL_THRESHOLD_GB) {
            recs.add("Data volume >10 TB — Snowball physical transfer is faster and cheaper than internet upload");
            return "AWS Snowball (10–80 TB offline transfer device)";
        }

        // Online migration
        if (dbGb > 0) {
            recs.add("AWS DMS replicates the database with minimal downtime using change data capture (CDC)");
            return "AWS Database Migration Service (DMS) with CDC for near-zero downtime";
        }
        return "AWS DataSync (online transfer over AWS Direct Connect or internet)";
    }

    private String buildMigrationMethodReason(InfrastructureProfile infra) {
        long totalGb = (infra.getTotalStorageGb() != null ? infra.getTotalStorageGb() : 0L)
                     + (infra.getDbSizeGb() != null ? infra.getDbSizeGb() : 0L);
        if (totalGb >= SNOWMOBILE_THRESHOLD_GB) return "Data volume exceeds 10 PB — internet transfer would take years";
        if (totalGb >= SNOWBALL_EDGE_THRESHOLD_GB) return "Data volume exceeds 100 TB — physical transfer is faster and cheaper";
        if (totalGb >= SNOWBALL_THRESHOLD_GB) return "Data volume exceeds 10 TB — Snowball transfer takes days vs weeks over internet";
        return "Data volume fits within online transfer window with acceptable downtime using DMS CDC";
    }

    // =========================================================================
    // RULE 6: Disaster Recovery Strategy
    // =========================================================================

    private String determineDrStrategy(InfrastructureProfile infra,
                                       MigrationPlan.PriorityProfile profile,
                                       List<String> recs) {
        double rtoHours = infra.getRtoHours() != null ? infra.getRtoHours() : 24.0;
        double rpoHours = infra.getRpoHours() != null ? infra.getRpoHours() : 24.0;
        boolean highAvail = profile == MigrationPlan.PriorityProfile.HIGH_AVAILABILITY;

        // Active-Active (multi-region, RTO/RPO near-zero)
        if (highAvail && rtoHours < 0.5 && rpoHours < 0.25) {
            recs.add("Active-Active multi-region: traffic simultaneously served from 2 regions, instant failover");
            return "Active-Active (us-east-1 ↔ us-west-2) with Route 53 latency routing + Global Accelerator";
        }

        // Warm Standby (scaled-down replica running in DR region)
        if (highAvail || (rtoHours <= 1.0 && rpoHours <= 0.25)) {
            recs.add("Warm Standby: scaled-down replica in DR region recovers in minutes");
            return "Warm Standby (us-east-1 → us-west-2): scaled-down EC2+RDS always running, Route 53 health-check failover";
        }

        // Pilot Light (minimal DR infrastructure, scale up on failure)
        if (rtoHours <= 4.0) {
            recs.add("Pilot Light: core DB replicates to DR region, compute scales up on failure (RTO ~1-4h)");
            return "Pilot Light (us-east-1 → us-west-2): RDS Cross-Region Read Replica + pre-baked AMIs";
        }

        // Backup & Restore (cheapest, slowest)
        recs.add("Backup & Restore: S3 cross-region replication + automated snapshots. Lowest cost but longest RTO");
        return "Backup & Restore: AWS Backup + S3 Cross-Region Replication (RTO " + (int) rtoHours + "h)";
    }

    // =========================================================================
    // RULE 7: Networking
    // =========================================================================

    private String determineNetworkingServices(InfrastructureProfile infra,
                                               MigrationPlan.PriorityProfile profile) {
        boolean highAvail = profile == MigrationPlan.PriorityProfile.HIGH_AVAILABILITY;
        boolean highScale = infra.getUserCount() != null && infra.getUserCount() >= HIGH_SCALE_USERS;

        StringBuilder net = new StringBuilder("Amazon VPC (public + private subnets across 2 AZs)");
        net.append(" + Application Load Balancer");
        if (highScale || highAvail) {
            net.append(" + Amazon CloudFront (CDN)");
        }
        net.append(" + VPC Endpoints for S3/DynamoDB (avoid NAT Gateway costs)");
        if (highAvail) {
            net.append(" + AWS Global Accelerator");
        }
        return net.toString();
    }

    // =========================================================================
    // RULE 8: Security Services
    // =========================================================================

    private String determineSecurityServices(InfrastructureProfile infra,
                                             MigrationPlan.PriorityProfile profile,
                                             List<String> recs) {
        boolean highAvail = profile == MigrationPlan.PriorityProfile.HIGH_AVAILABILITY;
        String compliance = infra.getComplianceRequirements();
        boolean hasCompliance = compliance != null && !compliance.isBlank();

        StringBuilder sec = new StringBuilder("IAM (least-privilege roles + instance profiles)");
        sec.append(" + AWS KMS (encryption at rest for RDS + S3)");
        sec.append(" + CloudTrail (API audit logging)");
        sec.append(" + AWS Config (compliance rules)");

        if (highAvail || hasCompliance) {
            sec.append(" + AWS WAF (attached to ALB)");
            sec.append(" + AWS Shield Standard (DDoS — always free)");
            recs.add("WAF protects against OWASP Top 10 attacks. Enable WAF before demos, disable after to save cost");
        }

        if (hasCompliance) {
            sec.append(" + AWS Security Hub + Amazon GuardDuty");
            recs.add("Compliance requirement detected (" + compliance + ") — Security Hub + GuardDuty provide continuous assessment");
        }

        return sec.toString();
    }

    // =========================================================================
    // RULE 9: Cost Estimation (static pricing, US East 1)
    // =========================================================================

    private BigDecimal estimateMonthlyCost(InfrastructureProfile infra,
                                           MigrationPlan.MigrationStrategy strategy,
                                           MigrationPlan.PriorityProfile profile) {
        double cost = 0.0;

        // Compute
        int servers = infra.getServerCount() != null ? infra.getServerCount() : 1;
        switch (profile) {
            case LOW_COST          -> cost += servers * 8.50;   // t3.micro ~$8.50/mo
            case BALANCED          -> cost += servers * 30.37;  // t3.medium ~$30.37/mo
            case HIGH_AVAILABILITY -> cost += servers * 60.74 * 1.5; // m6i.large + redundancy
        }

        // ALB
        if (profile != MigrationPlan.PriorityProfile.LOW_COST) cost += 16.20;

        // RDS
        if (infra.getDbType() != null) {
            switch (profile) {
                case LOW_COST          -> cost += 12.41;  // db.t3.micro
                case BALANCED          -> cost += 48.62;  // db.t3.medium
                case HIGH_AVAILABILITY -> cost += 194.48; // db.t3.medium Multi-AZ
            }
            // Storage cost
            long dbGb = infra.getDbSizeGb() != null ? Math.min(infra.getDbSizeGb(), 1000L) : 20L;
            cost += dbGb * 0.115; // $0.115/GB-month for gp2
        }

        // S3
        long storageGb = infra.getTotalStorageGb() != null ? Math.min(infra.getTotalStorageGb(), 10_000L) : 10L;
        cost += storageGb * 0.023;

        // CloudFront (high availability)
        if (profile == MigrationPlan.PriorityProfile.HIGH_AVAILABILITY) cost += 25.0;

        // Bedrock / CloudWatch / misc
        cost += 15.0;

        return BigDecimal.valueOf(Math.round(cost * 100.0) / 100.0);
    }

    // =========================================================================
    // Rationale & Warnings
    // =========================================================================

    private String buildStrategyReason(MigrationPlan.MigrationStrategy strategy,
                                        InfrastructureProfile infra,
                                        MigrationPlan.PriorityProfile profile) {
        return switch (strategy) {
            case REHOST -> String.format(
                    "REHOST (Lift & Shift): The infrastructure (%d servers, %s DB) has no containerisation " +
                    "and the %s priority profile favours speed and cost over re-architecture. " +
                    "EC2 matches the existing server topology with minimal risk.",
                    infra.getServerCount() != null ? infra.getServerCount() : 0,
                    infra.getDbType(), profile);
            case REPLATFORM -> String.format(
                    "REPLATFORM (Lift, Tinker & Shift): Moving the %s database to Amazon RDS/Aurora " +
                    "provides managed backups, automated patching, and Multi-AZ failover without " +
                    "re-writing application code. Compute remains on EC2.",
                    infra.getDbType());
            case REFACTOR -> String.format(
                    "REFACTOR (Re-architect): The application is %s and serves %s users. " +
                    "Container orchestration (ECS/EKS) + Aurora Serverless enables horizontal auto-scaling, " +
                    "higher availability, and better cost efficiency at this scale.",
                    Boolean.TRUE.equals(infra.getIsContainerized()) ? "already containerised" : "microservices-based",
                    infra.getUserCount() != null ? infra.getUserCount().toString() : "high volume");
        };
    }

    private void addWarnings(InfrastructureProfile infra,
                              MigrationPlan.PriorityProfile profile,
                              List<String> warnings) {
        // Warn about NAT Gateway cost if not using VPC endpoints
        if (profile == MigrationPlan.PriorityProfile.LOW_COST) {
            warnings.add("Avoid NAT Gateway ($0.045/hr + $0.045/GB) — use VPC Endpoints for S3 and DynamoDB instead");
        }

        // RDS Multi-AZ cost warning
        if (profile == MigrationPlan.PriorityProfile.HIGH_AVAILABILITY) {
            warnings.add("RDS Multi-AZ doubles database cost — enable only for demos, disable afterward to preserve student credit");
            warnings.add("WAF has per-request charges — turn on before the security demo, off after");
        }

        // Oracle/MSSQL licence warning
        if (infra.getDbType() == InfrastructureProfile.DbType.ORACLE ||
            infra.getDbType() == InfrastructureProfile.DbType.MSSQL) {
            warnings.add("Oracle/MSSQL on RDS carries licence costs — consider migrating to Aurora PostgreSQL to eliminate licences");
        }
    }

    // =========================================================================
    // Result DTO
    // =========================================================================

    @lombok.Value
    @lombok.Builder
    public static class DecisionResult {
        MigrationPlan.MigrationStrategy migrationStrategy;
        String migrationStrategyReason;
        MigrationPlan.PriorityProfile priorityProfile;

        String computeService;
        String dbService;
        String storageService;
        String migrationMethod;
        String migrationMethodReason;
        String drStrategy;
        String networkingServices;
        String securityServices;

        BigDecimal estimatedMonthlyUsd;
        List<String> recommendations;
        List<String> warnings;
    }
}
