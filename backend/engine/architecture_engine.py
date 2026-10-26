"""
CloudShift AI: Architecture Generation Engine
Generates 3 Multi-Tier AWS Architectures (Low-Cost, Balanced, Enterprise)
Adheres strictly to Project.md Section 2, 7, 8, 9, 10, 11, 12, 14, 16, 20 & 25
"""

from typing import List, Tuple
from backend.models import (
    InfrastructureProfile,
    ArchitectureOption,
    ArchComponent,
    CostBreakdown,
    WellArchitectedScores,
    ComponentCategory
)


def generate_architectures(p: InfrastructureProfile) -> Tuple[List[ArchitectureOption], int]:
    # 1. OPTION A: Low Cost Tier
    opt_a_components = [
        ArchComponent(
            id="a-vpc",
            service="Amazon VPC (Single AZ / 2 Subnets)",
            category=ComponentCategory.NETWORK,
            detail="10.0.0.0/16 VPC with 1 Public subnet and 1 Private subnet, Security Groups",
            monthlyCost=0.0,
            reason="VPC itself is free; isolates compute resources securely from public internet."
        ),
        ArchComponent(
            id="a-ec2",
            service=f"Amazon EC2 ({max(1, p.servers)}x t4g.medium ARM Graviton3)",
            category=ComponentCategory.COMPUTE,
            detail=f"{max(1, p.servers)} instance(s), 2 vCPU, 4 GB RAM, Spot/On-Demand blend",
            monthlyCost=round(max(1, p.servers) * 24.50, 2),
            reason="Graviton3 ARM architecture provides up to 40% better price/performance."
        ),
        ArchComponent(
            id="a-db",
            service=f"Amazon RDS {p.database.capitalize()} (db.t4g.small - Single-AZ)",
            category=ComponentCategory.DATABASE,
            detail=f"Single-AZ instance, {p.dbSizeGb} GB gp3 storage, daily automated snapshots",
            monthlyCost=round(32.0 + (p.dbSizeGb * 0.115), 2),
            reason="Managed relational engine with automated patching and scheduled maintenance."
        ),
        ArchComponent(
            id="a-storage",
            service=f"Amazon S3 Standard ({p.storageTb} TB) + Lifecycle to Glacier",
            category=ComponentCategory.STORAGE,
            detail=f"{p.storageTb} TB storage with 30-day lifecycle transition to Glacier Instant Retrieval",
            monthlyCost=round(p.storageTb * 19.50, 2),
            reason="S3 Standard for active objects and automated Glacier transition for cold data."
        ),
        ArchComponent(
            id="a-sec",
            service="AWS IAM & AWS KMS (AWS-Managed Keys)",
            category=ComponentCategory.SECURITY,
            detail="Least-privilege role-based access control with default EBS/S3 encryption",
            monthlyCost=0.0,
            reason="Standard AWS-managed encryption and IAM policies at zero direct license cost."
        ),
        ArchComponent(
            id="a-ops",
            service="Amazon CloudWatch (Basic Metrics & 3 Alarms)",
            category=ComponentCategory.OPS,
            detail="Standard 5-minute metric collection, CPU/Disk alarms, SNS email alerts",
            monthlyCost=12.0,
            reason="Essential infrastructure monitoring and alerting."
        )
    ]

    opt_a_cost = CostBreakdown(
        compute=sum(c.monthlyCost for c in opt_a_components if c.category == ComponentCategory.COMPUTE),
        database=sum(c.monthlyCost for c in opt_a_components if c.category == ComponentCategory.DATABASE),
        storage=sum(c.monthlyCost for c in opt_a_components if c.category == ComponentCategory.STORAGE),
        network=sum(c.monthlyCost for c in opt_a_components if c.category == ComponentCategory.NETWORK),
        security=sum(c.monthlyCost for c in opt_a_components if c.category == ComponentCategory.SECURITY),
        ops=sum(c.monthlyCost for c in opt_a_components if c.category == ComponentCategory.OPS),
        total=round(sum(c.monthlyCost for c in opt_a_components), 2)
    )

    opt_a_waf = WellArchitectedScores(
        security=74.0,
        reliability=71.0,
        performance=76.0,
        cost=96.0,
        operations=72.0
    )

    opt_a = ArchitectureOption(
        tier="low-cost",
        name="Option A: Cost-Optimised Foundation",
        tagline="Budget-centric architecture using single-AZ Graviton EC2 instances, S3 lifecycle, and RDS.",
        components=opt_a_components,
        cost=opt_a_cost,
        multiAz=False,
        multiRegion=False,
        autoScaling=False,
        readReplicas=0,
        instanceCount=max(1, p.servers),
        maxInstances=max(2, p.servers * 2),
        instanceType="t4g.medium",
        databaseService=f"Amazon RDS {p.database.capitalize()} (Single-AZ)",
        drStrategy="Backup & Restore",
        rtoMinutes=240,
        rpoMinutes=60,
        availabilityPct=99.5,
        wellArchitected=opt_a_waf,
        weightedScore=round((p.priorities.cost * 0.96) + (p.priorities.availability * 0.71) + (p.priorities.security * 0.74) + (p.priorities.performance * 0.76), 1),
        meets={
            "rto": 240 <= p.rtoMinutes,
            "rpo": 60 <= p.rpoMinutes,
            "availability": 99.5 >= float(p.availability),
            "budget": opt_a_cost.total <= p.budgetUsd
        }
    )

    # 2. OPTION B: Balanced Production Tier (Recommended Baseline)
    inst_count_b = max(2, p.servers)
    opt_b_components = [
        ArchComponent(
            id="b-vpc",
            service="Amazon VPC (Multi-AZ / 4 Subnets) + NAT Gateway",
            category=ComponentCategory.NETWORK,
            detail="Dual-AZ VPC with Public subnets for ALB and Private isolated subnets for EC2/RDS",
            monthlyCost=32.85,
            reason="High availability across 2 Availability Zones with isolated internal subnets."
        ),
        ArchComponent(
            id="b-alb",
            service="Application Load Balancer (ALB) + AWS WAF Core",
            category=ComponentCategory.NETWORK,
            detail="Layer 7 load balancing with health checks and AWS WAF OWASP Top 10 rule group",
            monthlyCost=42.50,
            reason="Distributes HTTP/HTTPS requests smoothly and mitigates SQLi/XSS malicious traffic."
        ),
        ArchComponent(
            id="b-ec2",
            service=f"Amazon EC2 Auto Scaling Group ({inst_count_b}-{inst_count_b * 3}x c7g.xlarge / m7g.xlarge)",
            category=ComponentCategory.COMPUTE,
            detail=f"Target tracking auto-scaling at 70% CPU, spread across 2 AZs",
            monthlyCost=round(inst_count_b * 98.50, 2),
            reason="Dynamically scales compute capacity to absorb peak RPS spikes and auto-recovers failed instances."
        ),
        ArchComponent(
            id="b-db",
            service="Amazon Aurora / RDS Multi-AZ Cluster with 1 Read Replica",
            category=ComponentCategory.DATABASE,
            detail=f"Multi-AZ synchronous replication, {p.dbSizeGb} GB storage auto-expansion, 1 read replica",
            monthlyCost=round(168.0 + (p.dbSizeGb * 0.22), 2),
            reason="Automatic failover within 60 seconds with zero data loss (RPO = 0) and offloaded read queries."
        ),
        ArchComponent(
            id="b-storage",
            service=f"Amazon S3 Intelligent-Tiering ({p.storageTb} TB) + Amazon EBS gp3",
            category=ComponentCategory.STORAGE,
            detail=f"{p.storageTb} TB with automated access-tier transitions + 3000 IOPS baseline EBS",
            monthlyCost=round((p.storageTb * 23.0) + (inst_count_b * 12.0), 2),
            reason="Eliminates manual lifecycle rules and delivers optimal price/performance for volatile storage."
        ),
        ArchComponent(
            id="b-cdn",
            service="Amazon CloudFront CDN + AWS Shield Standard",
            category=ComponentCategory.EDGE,
            detail="Global edge cache distribution with automatic Layer 3/4 DDoS protection",
            monthlyCost=25.0,
            reason="Caches static assets close to users, reducing backend server load and accelerating response latency."
        ),
        ArchComponent(
            id="b-sec",
            service="AWS KMS (Customer Managed Keys) + AWS CloudTrail + AWS Config",
            category=ComponentCategory.SECURITY,
            detail="Envelope encryption for databases/storage, multi-region API audit trails, and compliance checks",
            monthlyCost=28.0,
            reason="Satisfies enterprise SOC2/ISO27001 compliance standards and provides continuous audit records."
        ),
        ArchComponent(
            id="b-ops",
            service="Amazon CloudWatch Container/Detailed Metrics + Amazon SNS Alerts",
            category=ComponentCategory.OPS,
            detail="1-minute resolution alarms, dynamic Auto Scaling integration, and SNS notifications",
            monthlyCost=35.0,
            reason="Comprehensive observability and real-time incident alerting."
        )
    ]

    opt_b_cost = CostBreakdown(
        compute=sum(c.monthlyCost for c in opt_b_components if c.category == ComponentCategory.COMPUTE),
        database=sum(c.monthlyCost for c in opt_b_components if c.category == ComponentCategory.DATABASE),
        storage=sum(c.monthlyCost for c in opt_b_components if c.category == ComponentCategory.STORAGE),
        network=sum(c.monthlyCost for c in opt_b_components if c.category in [ComponentCategory.NETWORK, ComponentCategory.EDGE]),
        security=sum(c.monthlyCost for c in opt_b_components if c.category == ComponentCategory.SECURITY),
        ops=sum(c.monthlyCost for c in opt_b_components if c.category == ComponentCategory.OPS),
        total=round(sum(c.monthlyCost for c in opt_b_components), 2)
    )

    opt_b_waf = WellArchitectedScores(
        security=91.0,
        reliability=92.0,
        performance=90.0,
        cost=88.0,
        operations=89.0
    )

    opt_b = ArchitectureOption(
        tier="balanced",
        name="Option B: Resilient Multi-AZ Production",
        tagline="Production-grade architecture with Multi-AZ redundancy, Auto Scaling, CloudFront CDN, and Aurora / RDS.",
        components=opt_b_components,
        cost=opt_b_cost,
        multiAz=True,
        multiRegion=False,
        autoScaling=True,
        readReplicas=1,
        instanceCount=inst_count_b,
        maxInstances=inst_count_b * 3,
        instanceType="c7g.xlarge",
        databaseService="Amazon Aurora / RDS Multi-AZ + Read Replica",
        drStrategy="Warm Standby",
        rtoMinutes=15,
        rpoMinutes=1,
        availabilityPct=99.95,
        wellArchitected=opt_b_waf,
        weightedScore=round((p.priorities.cost * 0.88) + (p.priorities.availability * 0.92) + (p.priorities.security * 0.91) + (p.priorities.performance * 0.90), 1),
        meets={
            "rto": 15 <= p.rtoMinutes,
            "rpo": 1 <= p.rpoMinutes,
            "availability": 99.95 >= float(p.availability),
            "budget": opt_b_cost.total <= p.budgetUsd
        }
    )

    # 3. OPTION C: High Availability Enterprise Tier
    inst_count_c = max(4, p.servers * 2)
    opt_c_components = [
        ArchComponent(
            id="c-vpc",
            service="Amazon VPC (Multi-AZ 3 AZs) + Transit Gateway + Direct Connect Gateway",
            category=ComponentCategory.NETWORK,
            detail="Triple-AZ VPC mesh with redundant NAT Gateways, VPC Flow Logs, and Transit Gateway",
            monthlyCost=120.0,
            reason="Zero single point of failure across 3 independent data centers."
        ),
        ArchComponent(
            id="c-alb",
            service="AWS Route 53 Multi-Region Failover + ALB + AWS WAF + Shield Advanced",
            category=ComponentCategory.EDGE,
            detail="Global DNS health checks, DDoS response team (DRT) support, and advanced bot control",
            monthlyCost=180.0,
            reason="Instant DNS failover and proactive DDoS mitigation with 24/7 AWS SIRT escalation."
        ),
        ArchComponent(
            id="c-compute",
            service=f"Amazon EKS / ECS on AWS Fargate + EC2 Graviton3 Auto Scaling ({inst_count_c}-{inst_count_c * 4} nodes)",
            category=ComponentCategory.COMPUTE,
            detail="Multi-AZ containerised pods with predictive auto-scaling and spot-fallback instances",
            monthlyCost=round(inst_count_c * 115.0, 2),
            reason="Sub-second container scaling and isolated microservice execution domains."
        ),
        ArchComponent(
            id="c-db",
            service="Amazon Aurora Global Database (Multi-AZ Primary + Cross-Region Secondary) & DynamoDB Global Tables",
            category=ComponentCategory.DATABASE,
            detail="Storage-based cross-region replication under 1 second latency + active-active DynamoDB",
            monthlyCost=round(380.0 + (p.dbSizeGb * 0.45), 2),
            reason="Cross-region disaster recovery with RPO < 1 second and global local-read latency."
        ),
        ArchComponent(
            id="c-msg",
            service="Amazon SQS + Amazon SNS + AWS Step Functions",
            category=ComponentCategory.MESSAGING,
            detail="Decoupled asynchronous event queues, fanout notifications, and visual DR workflow orchestration",
            monthlyCost=45.0,
            reason="Guarantees zero dropped requests during sudden traffic surges and automates failover tasks."
        ),
        ArchComponent(
            id="c-storage",
            service=f"Amazon S3 Multi-Region Access Points + Cross-Region Replication ({p.storageTb} TB)",
            category=ComponentCategory.STORAGE,
            detail="Automatic bi-directional replication with S3 Object Lock and Glacier Deep Archive backup",
            monthlyCost=round(p.storageTb * 48.0, 2),
            reason="Immutable backup copies for ransomware protection and multi-region disaster readiness."
        ),
        ArchComponent(
            id="c-sec",
            service="AWS KMS (Dedicated HSM / BYOK) + AWS GuardDuty + AWS Security Hub + AWS CloudTrail Lake",
            category=ComponentCategory.SECURITY,
            detail="AI threat detection, centralized compliance dashboard, and tamper-proof immutable audit logs",
            monthlyCost=110.0,
            reason="Continuous automated vulnerability scanning and real-time security posture enforcement."
        ),
        ArchComponent(
            id="c-ops",
            service="Amazon CloudWatch Synthetics + AWS Systems Manager + AWS X-Ray Distributed Tracing",
            category=ComponentCategory.OPS,
            detail="24/7 canary user journey monitoring, automated patch baselines, and microservice tracing",
            monthlyCost=75.0,
            reason="End-to-end request tracing and self-healing automated operational playbooks."
        )
    ]

    opt_c_cost = CostBreakdown(
        compute=sum(c.monthlyCost for c in opt_c_components if c.category == ComponentCategory.COMPUTE),
        database=sum(c.monthlyCost for c in opt_c_components if c.category == ComponentCategory.DATABASE),
        storage=sum(c.monthlyCost for c in opt_c_components if c.category == ComponentCategory.STORAGE),
        network=sum(c.monthlyCost for c in opt_c_components if c.category in [ComponentCategory.NETWORK, ComponentCategory.EDGE]),
        security=sum(c.monthlyCost for c in opt_c_components if c.category == ComponentCategory.SECURITY),
        ops=sum(c.monthlyCost for c in opt_c_components if c.category in [ComponentCategory.OPS, ComponentCategory.MESSAGING]),
        total=round(sum(c.monthlyCost for c in opt_c_components), 2)
    )

    opt_c_waf = WellArchitectedScores(
        security=98.0,
        reliability=99.0,
        performance=97.0,
        cost=76.0,
        operations=96.0
    )

    opt_c = ArchitectureOption(
        tier="enterprise",
        name="Option C: High-Availability Enterprise",
        tagline="Mission-critical active/active architecture with Aurora Global Database, Multi-Region failover, Step Functions, and EKS/ECS.",
        components=opt_c_components,
        cost=opt_c_cost,
        multiAz=True,
        multiRegion=True,
        autoScaling=True,
        readReplicas=2,
        instanceCount=inst_count_c,
        maxInstances=inst_count_c * 4,
        instanceType="m7g.2xlarge",
        databaseService="Amazon Aurora Global Database + DynamoDB Global Tables",
        drStrategy="Multi-Site Active/Active",
        rtoMinutes=1,
        rpoMinutes=0,
        availabilityPct=99.999,
        wellArchitected=opt_c_waf,
        weightedScore=round((p.priorities.cost * 0.76) + (p.priorities.availability * 0.99) + (p.priorities.security * 0.98) + (p.priorities.performance * 0.97), 1),
        meets={
            "rto": 1 <= p.rtoMinutes,
            "rpo": 0 <= p.rpoMinutes,
            "availability": 99.999 >= float(p.availability),
            "budget": opt_c_cost.total <= p.budgetUsd
        }
    )

    architectures = [opt_a, opt_b, opt_c]

    # Select recommended index based on weighted score + budget match
    best_idx = 1
    best_score = -1.0
    for idx, opt in enumerate(architectures):
        score = opt.weightedScore
        if not opt.meets["budget"]:
            score -= 25.0
        if not opt.meets["availability"]:
            score -= 20.0
        if score > best_score:
            best_score = score
            best_idx = idx

    return architectures, best_idx
