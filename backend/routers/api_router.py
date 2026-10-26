"""
CloudShift AI: FastAPI Unified Router
Implements all 10 API endpoints strictly as specified in Project.md Section 4
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from backend.models import (
    InfrastructureProfile,
    MigrationPlan,
    ArchitectureOption,
    CostBreakdown,
    SecurityReport,
    DrSimulationResult,
    FailureScenario,
    FullAnalysisResponse
)
from backend.engine.migration_engine import evaluate_migration_strategy
from backend.engine.architecture_engine import generate_architectures
from backend.engine.dr_engine import simulate_disaster_recovery
from backend.engine.security_engine import evaluate_security
from backend.engine.explanation_engine import generate_architecture_explanation

router = APIRouter(prefix="/api")

# In-memory store initialized with the 3 official demo projects from frontend/seed
PROJECTS_STORE: Dict[str, InfrastructureProfile] = {
    "retailco-erp": InfrastructureProfile(
        id="retailco-erp",
        name="RetailCo Core ERP & E-Commerce",
        industry="Retail / E-Commerce",
        description="Legacy monolith on 6 VMware servers running MySQL and NFS shared storage with spiky holiday traffic.",
        createdAt="2026-09-10",
        status="analysed",
        servers=6,
        vcpusPerServer=8,
        ramGbPerServer=32,
        avgCpuUtil=52.0,
        avgMemUtil=68.0,
        os="linux",
        containerized=False,
        database="mysql",
        dbSizeGb=850.0,
        readHeavy=True,
        storageTb=8.5,
        monthlyUsers=450000,
        peakRps=850,
        trafficPattern="spiky",
        workloadType="web",
        budgetUsd=4500.0,
        availability="99.9",
        rtoMinutes=60,
        rpoMinutes=15,
        performance="high",
        security="high",
        compliance=["PCI-DSS", "SOC2"]
    ),
    "finserve-core": InfrastructureProfile(
        id="finserve-core",
        name="FinServe Payment Gateway",
        industry="Financial Services",
        description="High-throughput payment gateway requiring stringent sub-second RPO, Oracle DB, and PCI-DSS compliance.",
        createdAt="2026-09-08",
        status="simulated",
        servers=12,
        vcpusPerServer=16,
        ramGbPerServer=64,
        avgCpuUtil=40.0,
        avgMemUtil=55.0,
        os="linux",
        containerized=True,
        database="oracle",
        dbSizeGb=2400.0,
        readHeavy=False,
        storageTb=18.0,
        monthlyUsers=1800000,
        peakRps=3200,
        trafficPattern="steady",
        workloadType="api",
        budgetUsd=12000.0,
        availability="99.99",
        rtoMinutes=15,
        rpoMinutes=1,
        performance="high",
        security="high",
        compliance=["PCI-DSS", "SOC2", "ISO27001"]
    ),
    "meditrack-ehr": InfrastructureProfile(
        id="meditrack-ehr",
        name="MediTrack Electronic Health Records",
        industry="Healthcare",
        description="Healthcare record system with edge clinic syncing, HIPAA data encryption requirements, and steady clinical access.",
        createdAt="2026-09-05",
        status="analysed",
        servers=4,
        vcpusPerServer=4,
        ramGbPerServer=16,
        avgCpuUtil=35.0,
        avgMemUtil=45.0,
        os="windows",
        containerized=False,
        database="sqlserver",
        dbSizeGb=450.0,
        readHeavy=True,
        storageTb=4.2,
        monthlyUsers=85000,
        peakRps=120,
        trafficPattern="steady",
        workloadType="legacy",
        edgeEnvironment=True,
        budgetUsd=3200.0,
        availability="99.9",
        rtoMinutes=120,
        rpoMinutes=30,
        performance="medium",
        security="high",
        compliance=["HIPAA", "SOC2"]
    )
}


# 1. /api/projects
@router.get("/projects", response_model=List[InfrastructureProfile])
def list_projects():
    return list(PROJECTS_STORE.values())


@router.post("/projects", response_model=InfrastructureProfile)
def create_or_update_project(p: InfrastructureProfile):
    PROJECTS_STORE[p.id] = p
    return p


@router.get("/projects/{project_id}", response_model=InfrastructureProfile)
def get_project(project_id: str):
    if project_id not in PROJECTS_STORE:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return PROJECTS_STORE[project_id]


@router.delete("/projects/{project_id}")
def delete_project(project_id: str):
    if project_id in PROJECTS_STORE:
        del PROJECTS_STORE[project_id]
        return {"success": True, "message": f"Project {project_id} deleted"}
    raise HTTPException(status_code=404, detail="Project not found")


# 2. /api/infrastructure
@router.get("/infrastructure/{project_id}", response_model=InfrastructureProfile)
def get_infrastructure(project_id: str):
    return get_project(project_id)


@router.put("/infrastructure/{project_id}", response_model=InfrastructureProfile)
def update_infrastructure(project_id: str, p: InfrastructureProfile):
    PROJECTS_STORE[project_id] = p
    return p


# 3. /api/migration/analyse
@router.post("/migration/analyse", response_model=MigrationPlan)
def analyse_migration(p: InfrastructureProfile):
    return evaluate_migration_strategy(p)


# 4. /api/architecture/generate
@router.post("/architecture/generate", response_model=Dict[str, Any])
def generate_arch(p: InfrastructureProfile):
    archs, recommended_idx = generate_architectures(p)
    return {
        "architectures": archs,
        "recommendedIndex": recommended_idx,
        "recommendedTier": archs[recommended_idx].tier
    }


# 5. /api/architecture/compare
@router.post("/architecture/compare", response_model=List[ArchitectureOption])
def compare_architectures(p: InfrastructureProfile):
    archs, _ = generate_architectures(p)
    return archs


# 6. /api/cost/estimate
@router.post("/cost/estimate", response_model=Dict[str, Any])
def estimate_cost(p: InfrastructureProfile):
    archs, recommended_idx = generate_architectures(p)
    rec = archs[recommended_idx]
    
    # Estimate baseline on-prem monthly operational costs
    on_prem_hardware = p.servers * 180.0
    on_prem_storage = p.storageTb * 45.0
    on_prem_power_cooling = p.servers * 65.0
    on_prem_admin_maintenance = p.servers * 120.0
    on_prem_total = round(on_prem_hardware + on_prem_storage + on_prem_power_cooling + on_prem_admin_maintenance, 2)
    
    savings_usd = round(max(0.0, on_prem_total - rec.cost.total), 2)
    savings_pct = round((savings_usd / on_prem_total) * 100.0, 1) if on_prem_total > 0 else 0.0

    return {
        "recommendedMonthlyCost": rec.cost.total,
        "breakdown": rec.cost,
        "onPremEstimate": {
            "hardwareDepreciation": on_prem_hardware,
            "storageSan": on_prem_storage,
            "powerCoolingDatacenter": on_prem_power_cooling,
            "maintenanceAdmin": on_prem_admin_maintenance,
            "total": on_prem_total
        },
        "estimatedSavingsUsd": savings_usd,
        "estimatedSavingsPct": savings_pct,
        "tierComparison": [
            {"tier": a.tier, "name": a.name, "monthlyCost": a.cost.total, "meetsBudget": a.meets["budget"]}
            for a in archs
        ]
    }


# 7. /api/security/evaluate
@router.post("/security/evaluate", response_model=SecurityReport)
def evaluate_sec(p: InfrastructureProfile, tier: str = "balanced"):
    archs, _ = generate_architectures(p)
    selected_arch = next((a for a in archs if a.tier == tier), archs[1])
    return evaluate_security(p, selected_arch)


# 8. /api/dr/simulate
@router.post("/dr/simulate", response_model=DrSimulationResult)
def run_dr_simulation(
    p: InfrastructureProfile,
    scenario: FailureScenario = Body(..., embed=True),
    tier: str = Body("balanced", embed=True)
):
    archs, _ = generate_architectures(p)
    selected_arch = next((a for a in archs if a.tier == tier), archs[1])
    return simulate_disaster_recovery(p, scenario, selected_arch)


# 9. /api/well-architected/score
@router.post("/well-architected/score", response_model=Dict[str, Any])
def score_well_architected(p: InfrastructureProfile, tier: str = "balanced"):
    archs, recommended_idx = generate_architectures(p)
    selected_arch = next((a for a in archs if a.tier == tier), archs[recommended_idx])
    
    avg_score = round(
        (selected_arch.wellArchitected.security +
         selected_arch.wellArchitected.reliability +
         selected_arch.wellArchitected.performance +
         selected_arch.wellArchitected.cost +
         selected_arch.wellArchitected.operations) / 5.0, 1
    )

    return {
        "tier": selected_arch.tier,
        "name": selected_arch.name,
        "averageScore": avg_score,
        "scores": selected_arch.wellArchitected,
        "prioritiesWeightedScore": selected_arch.weightedScore,
        "recommendations": [
            "Enable S3 Intelligent-Tiering to automate storage lifecycle cost reduction without performance degradation.",
            "Enforce AWS KMS Customer Managed Keys (CMK) across all RDS and EBS volumes with annual rotation.",
            "Deploy Multi-AZ Application Load Balancer with target tracking auto-scaling policy set at 70% CPU threshold.",
            "Implement AWS Step Functions to automate multi-step disaster recovery failover workflows."
        ]
    }


# 10. /api/reports
@router.post("/reports/generate")
def generate_full_report(p: InfrastructureProfile):
    migration = evaluate_migration_strategy(p)
    archs, recommended_idx = generate_architectures(p)
    rec_arch = archs[recommended_idx]
    security = evaluate_security(p, rec_arch)
    
    # Run all 5 DR scenarios for the resilience matrix
    dr_matrix = {
        sc.value: simulate_disaster_recovery(p, sc, rec_arch)
        for sc in FailureScenario
    }

    return {
        "projectId": p.id,
        "projectName": p.name,
        "industry": p.industry,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "executiveSummary": {
            "recommendedStrategy": migration.strategy.value,
            "strategyConfidencePct": migration.confidence,
            "recommendedTier": rec_arch.tier,
            "recommendedTierName": rec_arch.name,
            "monthlyCostUsd": rec_arch.cost.total,
            "availabilityPct": rec_arch.availabilityPct,
            "achievedRtoMinutes": rec_arch.rtoMinutes,
            "achievedRpoMinutes": rec_arch.rpoMinutes,
            "securityScore": security.score,
            "wafAverage": round(sum(dict(rec_arch.wellArchitected).values()) / 5.0, 1)
        },
        "profile": p,
        "migrationPlan": migration,
        "architecture": rec_arch,
        "allArchitectures": archs,
        "securityReport": security,
        "drResilienceMatrix": dr_matrix
    }


# 11. /api/explain (AI Explanation Layer)
@router.post("/explain")
def get_explanation(
    p: InfrastructureProfile,
    question: str = Body(..., embed=True),
    tier: str = Body("balanced", embed=True)
):
    migration = evaluate_migration_strategy(p)
    archs, _ = generate_architectures(p)
    selected_arch = next((a for a in archs if a.tier == tier), archs[1])
    return generate_architecture_explanation(question, p, migration, selected_arch)


# Full composite analysis endpoint
@router.post("/analysis/full", response_model=FullAnalysisResponse)
def get_full_analysis(p: InfrastructureProfile):
    migration = evaluate_migration_strategy(p)
    archs, recommended_idx = generate_architectures(p)
    sec = evaluate_security(p, archs[recommended_idx])
    return FullAnalysisResponse(
        profile=p,
        migration=migration,
        architectures=archs,
        recommendedIndex=recommended_idx,
        security=sec
    )
