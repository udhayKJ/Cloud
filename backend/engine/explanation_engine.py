"""
CloudShift AI: AI & Heuristic Explanation Engine
Provides transparent architectural rationale strictly adhering to Project.md Section 6 & 12
Rule: Deterministic Engine -> Architecture Decision -> Explanation Engine -> Human-readable Explanation
"""

from typing import Dict, Any
from backend.models import InfrastructureProfile, ArchitectureOption, MigrationPlan, DatabaseType


def generate_architecture_explanation(
    question: str,
    p: InfrastructureProfile,
    migration: MigrationPlan,
    arch: ArchitectureOption
) -> Dict[str, str]:
    q_lower = question.lower()
    
    if ("aurora" in q_lower or "database" in q_lower) and p.database == DatabaseType.NONE:
        explanation = (
            f"{p.name} has no database tier, so no managed database service was selected. "
            f"**{arch.name}** focuses on stateless compute behind a load balancer, with Amazon S3 for file storage."
        )
    elif "aurora" in q_lower or "database" in q_lower:
        # Describe the service the engine actually chose for this tier rather than assuming Aurora.
        explanation = (
            f"**{arch.databaseService}** was selected for {p.name} because the workload uses a {p.database.value.upper()} engine "
            f"with {p.peakRps} peak RPS and {'read-heavy' if p.readHeavy else 'balanced read/write'} traffic. "
        )
        if "aurora" in arch.databaseService.lower():
            explanation += (
                "Aurora delivers up to 5x the throughput of standard MySQL/PostgreSQL by offloading the logging layer to a "
                "distributed 6-way replicated storage subsystem across 3 Availability Zones. It provides fast automated "
                "failover and storage auto-scaling up to 128 TB without downtime."
            )
        else:
            explanation += (
                "A managed RDS engine keeps application compatibility while AWS handles patching, automated backups and "
                f"{'Multi-AZ failover' if arch.multiAz else 'point-in-time recovery'}, minimising migration risk."
            )
    elif "snowball" in q_lower or "snowmobile" in q_lower or "migration method" in q_lower or "dms" in q_lower:
        explanation = (
            f"**{migration.dataMigration['method']}** was recommended because the total migration dataset is "
            f"{p.storageTb + (p.dbSizeGb / 1000.0):.1f} TB. {migration.dataMigration['reason']} "
            "For continuous live database sync, **AWS Database Migration Service (AWS DMS)** with Change Data Capture (CDC) "
            "is paired to ensure minimal cutover window and zero transaction data loss."
        )
    elif "multi-az" in q_lower or "availability" in q_lower:
        explanation = (
            f"**Multi-AZ Architecture** is required to satisfy your {p.availability}% availability target and {p.rtoMinutes} "
            f"minute RTO constraint. In a Single-AZ deployment, hardware or datacenter outages require manual snapshot restoration "
            f"(taking 20-60+ minutes). Multi-AZ provisions synchronous standby replicas and cross-zone Application Load Balancers "
            "that execute automated zero-data-loss failover in under 60 seconds."
        )
    elif "cost" in q_lower or "price" in q_lower or "expensive" in q_lower:
        explanation = (
            f"**{arch.name}** totals ${arch.cost.total:,.2f}/month. The primary cost drivers are compute "
            f"(${arch.cost.compute:,.2f}) and database (${arch.cost.database:,.2f}). "
            "AWS Graviton3 ARM processors (c7g/m7g/t4g) provide up to 40% price/performance savings over legacy x86. "
            "Enabling S3 Intelligent-Tiering and Auto Scaling ensures compute nodes automatically terminate during off-peak hours, "
            "preventing unnecessary idle capacity spend."
        )
    elif "swf" in q_lower or "step functions" in q_lower or "workflow" in q_lower:
        explanation = (
            "**AWS Step Functions vs AWS SWF Comparison (Project.md Section 12):**\n\n"
            "- **AWS Step Functions** is the modern, cloud-native visual state machine orchestration service that supports declarative JSON/ASL workflows, native AWS SDK service integrations (Lambda, ECS, SQS, SNS, Aurora), automatic retries, and comprehensive visual execution tracing.\n"
            "- **AWS Simple Workflow Service (SWF)** is the legacy predecessor that requires maintaining custom worker daemons (deciders and activity workers) polling on EC2.\n"
            "- **Decision:** CloudShift AI standardizes on **AWS Step Functions** for automated Disaster Recovery failover and migration orchestration while documenting SWF architectural contrast for complete syllabus coverage."
        )
    else:
        explanation = (
            f"Based on your requirements ({p.servers} servers, {p.database.value.upper()}, {p.monthlyUsers:,} monthly users, "
            f"and budget of ${p.budgetUsd:,.2f}), the deterministic engine mapped your workload to **{arch.name}** with a "
            f"**{migration.strategy.value}** migration strategy. This meets your RTO ({p.rtoMinutes}m) and RPO ({p.rpoMinutes}m) goals."
        )

    return {
        "question": question,
        "explanation": explanation,
        "project": p.name,
        "strategy": migration.strategy.value,
        "selectedTier": arch.tier
    }
