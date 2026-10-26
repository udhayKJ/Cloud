"""
CloudShift AI: Migration Decision Engine
Deterministic Multi-Objective Logic adhering strictly to Project.md Section 5 & 19
"""

from typing import Dict, Any, List
from backend.models import InfrastructureProfile, MigrationPlan, MigrationStrategy, ServiceMapping, ComponentCategory


def evaluate_migration_strategy(p: InfrastructureProfile) -> MigrationPlan:
    # 1. Strategy Scoring (Rehost vs Replatform vs Refactor)
    rehost_score = 30
    replatform_score = 40
    refactor_score = 30

    # Rules based on containerization, DB type, workload type, traffic, OS
    if p.containerized:
        refactor_score += 25
        replatform_score += 15
        rehost_score -= 10

    if p.workloadType in ['api', 'web']:
        replatform_score += 15
        refactor_score += 10
    elif p.workloadType == 'legacy':
        rehost_score += 35
        refactor_score -= 20

    if p.trafficPattern == 'spiky':
        refactor_score += 15
        replatform_score += 10
    elif p.trafficPattern == 'steady':
        rehost_score += 10

    if p.priorities.cost > 40:
        rehost_score += 15
    if p.priorities.performance > 30 or p.priorities.availability > 30:
        replatform_score += 15
        refactor_score += 15

    # Normalize to 100
    total = rehost_score + replatform_score + refactor_score
    scores = {
        'Rehost': round((rehost_score / total) * 100, 1),
        'Replatform': round((replatform_score / total) * 100, 1),
        'Refactor': round((refactor_score / total) * 100, 1),
    }

    strategy = max(scores, key=scores.get)
    confidence = scores[strategy]

    # Reasons
    reasons: List[str] = []
    if strategy == 'Replatform':
        reasons.append(f"Workload pattern ({p.workloadType}) and database ({p.database}) benefit significantly from managed services (Aurora / RDS / ECS) without requiring full code rewrites.")
        reasons.append("Optimises balance between migration speed, operational maintenance reduction, and high availability targets.")
    elif strategy == 'Refactor':
        reasons.append("High traffic variability, modern workload requirements, and scaling priorities warrant containerization / serverless microservices.")
        reasons.append("Unlocks maximum auto-scaling efficiency, resilience, and cloud-native managed capabilities.")
    else:
        reasons.append("Legacy workload dependencies and budget-first priority favour rapid Lift-and-Shift to EC2.")
        reasons.append("Minimises migration risks and operational friction before modernisation.")

    # 2. Service Mappings (Section 2 & 19)
    mappings: List[ServiceMapping] = []

    # Database mapping
    if p.database == 'mysql':
        db_target = "Amazon Aurora MySQL" if (p.readHeavy or p.peakRps > 300) else "Amazon RDS MySQL (Multi-AZ)"
        mappings.append(ServiceMapping(
            source="On-Premises MySQL",
            target=db_target,
            service="Aurora / RDS",
            category=ComponentCategory.DATABASE,
            reason="Provides automatic replication, 99.99% availability, automated storage auto-expansion, and zero-downtime patching."
        ))
    elif p.database == 'postgresql':
        db_target = "Amazon Aurora PostgreSQL" if (p.readHeavy or p.peakRps > 300) else "Amazon RDS PostgreSQL"
        mappings.append(ServiceMapping(
            source="On-Premises PostgreSQL",
            target=db_target,
            service="Aurora / RDS",
            category=ComponentCategory.DATABASE,
            reason="Fully managed relational engine with read replicas, Multi-AZ failover, and automated backups."
        ))
    elif p.database == 'oracle':
        mappings.append(ServiceMapping(
            source="Oracle Enterprise DB",
            target="Amazon RDS for Oracle / Amazon Aurora",
            service="RDS / Aurora + AWS SCT",
            category=ComponentCategory.DATABASE,
            reason="AWS Schema Conversion Tool (SCT) plus DMS enables smooth homogeneous or heterogeneous database migration."
        ))
    elif p.database == 'mongodb':
        mappings.append(ServiceMapping(
            source="MongoDB Cluster",
            target="Amazon DocumentDB / DynamoDB",
            service="DocumentDB / DynamoDB",
            category=ComponentCategory.DATABASE,
            reason="Managed MongoDB-compatible NoSQL with high throughput, multi-AZ durability, and seamless scaling."
        ))
    else:
        mappings.append(ServiceMapping(
            source="Database Workload",
            target="Amazon DynamoDB + Amazon RDS",
            service="DynamoDB / RDS",
            category=ComponentCategory.DATABASE,
            reason="Optimised NoSQL key-value store for session/events and managed relational storage."
        ))

    # Compute Mapping
    if strategy == 'Refactor' or p.containerized:
        mappings.append(ServiceMapping(
            source=f"{p.servers}x On-Premises Host Servers ({p.os.capitalize()})",
            target="Amazon ECS / EKS with AWS Fargate & EC2 Auto Scaling",
            service="ECS / EC2",
            category=ComponentCategory.COMPUTE,
            reason="Containerised compute with granular auto-scaling, ALB health monitoring, and multi-AZ instance distribution."
        ))
    else:
        mappings.append(ServiceMapping(
            source=f"{p.servers}x On-Premises Physical/VM Servers",
            target="Amazon EC2 (Auto Scaling Group) behind ALB",
            service="EC2 + Auto Scaling",
            category=ComponentCategory.COMPUTE,
            reason="Dynamic capacity allocation based on CPU/RAM metrics with automatic unhealthy node replacement."
        ))

    # Storage Mapping
    mappings.append(ServiceMapping(
        source=f"{p.storageTb} TB Local SAN/NAS Storage",
        target="Amazon S3 (Standard + Intelligent-Tiering + Glacier) & EBS gp3",
        service="S3 / EBS",
        category=ComponentCategory.STORAGE,
        reason="11 9s durability (99.999999999%), lifecycle policies to Glacier for archive cost reduction, and high-IOPS EBS gp3 volumes."
    ))

    # Network / CDN
    mappings.append(ServiceMapping(
        source="On-Prem Edge / Hardware Firewall",
        target="AWS WAF + AWS Shield + CloudFront + VPC Private Subnets",
        service="VPC / WAF / CloudFront",
        category=ComponentCategory.NETWORK,
        reason="Global edge caching, DDoS protection, Web Application Firewall filtering, and isolated private subnet placement."
    ))

    # 3. Migration Method Selection (Section 19 Decision Logic)
    # DMS vs SMS vs Snowball vs Snowball Edge vs Snowmobile
    data_size_tb = p.storageTb + (p.dbSizeGb / 1000.0)

    if data_size_tb > 10000:
        data_method = "AWS Snowmobile"
        data_reason = f"Extreme data scale ({data_size_tb:.1f} TB > 10 PB) necessitates dedicated secure shipping container transfer."
        est_days = 21.0
    elif p.edgeEnvironment or p.lowBandwidth:
        data_method = "AWS Snowball Edge"
        data_reason = "Edge / low-bandwidth constraints require onboard edge compute & pre-processing before secure physical transit."
        est_days = 7.0
    elif data_size_tb > 10:
        data_method = "AWS Snowball (80 TB)"
        data_reason = f"Large dataset ({data_size_tb:.1f} TB) is faster and more cost-effective to migrate offline via encrypted Snowball appliances."
        est_days = 5.0
    else:
        data_method = "AWS DataSync + Direct S3 Multi-part Transfer"
        data_reason = f"Dataset size ({data_size_tb:.1f} TB) can be transferred over network via automated AWS DataSync scheduling."
        est_days = max(0.5, round(data_size_tb * 0.4, 1))

    # DB Migration
    db_method = "AWS Database Migration Service (AWS DMS) with Continuous CDC Replication"
    db_reason = "Enables minimal-downtime homogeneous/heterogeneous migration with ongoing Change Data Capture (CDC)."

    # Server Migration
    server_method = "AWS Application Migration Service (AWS MGN / SMS)"
    server_reason = "Block-level continuous replication of live source servers directly into staging Amazon EC2 instances."

    # Connectivity
    if p.budgetUsd > 3000 or p.priorities.security > 30 or p.availability in ['99.99', '99.999']:
        conn_method = "AWS Direct Connect (Dedicated 1Gbps / 10Gbps) + Backup Site-to-Site VPN"
        conn_reason = "Guarantees dedicated private throughput, ultra-low latency, and SLA-backed hybrid cloud connectivity."
    else:
        conn_method = "AWS Site-to-Site VPN with IPsec encryption"
        conn_reason = "Secure encrypted tunnel over internet suitable for budget-conscious and moderate traffic requirements."

    # 4. Phased Migration Plan
    phases = [
        {
            "title": "Phase 1: Discovery & AWS Foundation Setup",
            "duration": "Weeks 1-2",
            "tasks": [
                "Deploy AWS Application Discovery Agent on on-premises hosts",
                "Provision Multi-AZ AWS VPC with Public/Private subnets & Route Tables",
                "Configure IAM roles, least-privilege policies, and AWS KMS Customer Managed Keys",
                "Establish secure hybrid network connectivity (VPN / Direct Connect)"
            ]
        },
        {
            "title": "Phase 2: Database & Bulk Storage Migration",
            "duration": "Weeks 3-4",
            "tasks": [
                f"Initiate {data_method} for bulk storage payload ({data_size_tb:.1f} TB)",
                "Provision target Amazon RDS / Aurora database instances in private subnets",
                "Configure AWS DMS replication task with CDC (Change Data Capture)",
                "Run schema conversion via AWS SCT and execute test data validation queries"
            ]
        },
        {
            "title": "Phase 3: Application Workload & Compute Cutover",
            "duration": "Weeks 5-6",
            "tasks": [
                "Replicate server images using AWS Application Migration Service (MGN)",
                "Configure Auto Scaling Launch Templates and Application Load Balancer target groups",
                "Set up Amazon CloudWatch alarms, SNS failure alerts, and CloudTrail logging",
                "Execute DR simulation tests and performance load benchmarks"
            ]
        },
        {
            "title": "Phase 4: DNS Cutover & Decommissioning",
            "duration": "Week 7",
            "tasks": [
                "Switch Amazon Route 53 DNS records to ALB / CloudFront distribution",
                "Monitor live traffic through CloudWatch and AWS WAF",
                "Finalise sync, stop AWS DMS replication task, and decommission legacy on-prem hardware"
            ]
        }
    ]

    return MigrationPlan(
        strategy=MigrationStrategy(strategy),
        confidence=confidence,
        strategyScores=scores,
        reasons=reasons,
        mappings=mappings,
        dataMigration={"method": data_method, "reason": data_reason, "estimatedDays": est_days},
        dbMigration={"method": db_method, "reason": db_reason},
        serverMigration={"method": server_method, "reason": server_reason},
        connectivity={"method": conn_method, "reason": conn_reason},
        phases=phases
    )
