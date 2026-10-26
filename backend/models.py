"""
CloudShift AI: Pydantic v2 Models & Schemas
Aligned strictly with Project.md and Frontend types
"""

from typing import List, Optional, Dict, Any, Union
from enum import Enum
from pydantic import BaseModel, Field


class Level(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class DatabaseType(str, Enum):
    MYSQL = "mysql"
    POSTGRESQL = "postgresql"
    ORACLE = "oracle"
    SQLSERVER = "sqlserver"
    MONGODB = "mongodb"
    REDIS = "redis"
    NONE = "none"


class WorkloadType(str, Enum):
    WEB = "web"
    API = "api"
    BATCH = "batch"
    ANALYTICS = "analytics"
    LEGACY = "legacy"


class TrafficPattern(str, Enum):
    STEADY = "steady"
    SPIKY = "spiky"
    SEASONAL = "seasonal"


class AvailabilityTarget(str, Enum):
    P99 = "99"
    P99_9 = "99.9"
    P99_99 = "99.99"
    P99_999 = "99.999"


class ProjectStatus(str, Enum):
    DRAFT = "draft"
    ANALYSED = "analysed"
    SIMULATED = "simulated"


class Priorities(BaseModel):
    cost: int = 40
    availability: int = 20
    security: int = 20
    performance: int = 20


class InfrastructureProfile(BaseModel):
    id: str = "project-custom"
    name: str = "Enterprise Migration Target"
    industry: str = "E-Commerce / Enterprise"
    description: str = "Core legacy on-premise infrastructure"
    createdAt: str = "2026-09-13"
    status: ProjectStatus = ProjectStatus.DRAFT

    # Compute
    servers: int = 4
    vcpusPerServer: int = 8
    ramGbPerServer: int = 32
    avgCpuUtil: float = 45.0
    avgMemUtil: float = 55.0
    os: str = "linux"
    containerized: bool = False

    # Data
    database: DatabaseType = DatabaseType.MYSQL
    dbSizeGb: float = 500.0
    readHeavy: bool = True
    storageTb: float = 5.0

    # Traffic
    monthlyUsers: int = 250000
    peakRps: int = 450
    trafficPattern: TrafficPattern = TrafficPattern.SPIKY
    workloadType: WorkloadType = WorkloadType.WEB

    # Environment
    edgeEnvironment: bool = False
    lowBandwidth: bool = False

    # Business requirements
    budgetUsd: float = 5000.0
    availability: AvailabilityTarget = AvailabilityTarget.P99_9
    rtoMinutes: int = 60
    rpoMinutes: int = 15
    performance: Level = Level.HIGH
    security: Level = Level.HIGH
    compliance: List[str] = Field(default_factory=lambda: ["SOC2", "ISO27001"])

    priorities: Priorities = Field(default_factory=Priorities)


class MigrationStrategy(str, Enum):
    REHOST = "Rehost"
    REPLATFORM = "Replatform"
    REFACTOR = "Refactor"


class ComponentCategory(str, Enum):
    COMPUTE = "compute"
    DATABASE = "database"
    STORAGE = "storage"
    NETWORK = "network"
    SECURITY = "security"
    OPS = "ops"
    MESSAGING = "messaging"
    EDGE = "edge"
    MIGRATION = "migration"


class ServiceMapping(BaseModel):
    source: str
    target: str
    service: str
    category: ComponentCategory
    reason: str


class MigrationPlan(BaseModel):
    strategy: MigrationStrategy
    confidence: float
    strategyScores: Dict[str, float]
    reasons: List[str]
    mappings: List[ServiceMapping]
    dataMigration: Dict[str, Any]
    dbMigration: Dict[str, str]
    serverMigration: Dict[str, str]
    connectivity: Dict[str, str]
    phases: List[Dict[str, Any]]


class ArchComponent(BaseModel):
    id: str
    service: str
    category: ComponentCategory
    detail: str
    monthlyCost: float
    reason: str


class CostBreakdown(BaseModel):
    compute: float
    database: float
    storage: float
    network: float
    security: float
    ops: float
    total: float


class WellArchitectedScores(BaseModel):
    security: float
    reliability: float
    performance: float
    cost: float
    operations: float


class ArchitectureOption(BaseModel):
    tier: str  # 'low-cost' | 'balanced' | 'enterprise'
    name: str
    tagline: str
    components: List[ArchComponent]
    cost: CostBreakdown
    multiAz: bool
    multiRegion: bool
    autoScaling: bool
    readReplicas: int
    instanceCount: int
    maxInstances: int
    instanceType: str
    databaseService: str
    drStrategy: str
    rtoMinutes: int
    rpoMinutes: int
    availabilityPct: float
    wellArchitected: WellArchitectedScores
    weightedScore: float
    meets: Dict[str, bool]


class SecurityControl(BaseModel):
    id: str
    name: str
    service: str
    pillar: str  # 'identity' | 'encryption' | 'network' | 'edge' | 'audit'
    status: str  # 'enabled' | 'partial' | 'missing'
    severity: str  # 'critical' | 'high' | 'medium' | 'low'
    description: str


class SecurityReport(BaseModel):
    score: float
    controls: List[SecurityControl]
    findings: List[Dict[str, Any]]


class FailureScenario(str, Enum):
    EC2 = "ec2"
    DATABASE = "database"
    AZ = "az"
    APPLICATION = "application"
    REGION = "region"


class DrStep(BaseModel):
    id: str
    title: str
    service: str
    durationSec: int
    description: str


class DrSimulationResult(BaseModel):
    scenario: FailureScenario
    title: str
    steps: List[DrStep]
    rtoMinutes: float
    rpoMinutes: float
    dataLossMb: float
    availabilityImpactPct: float
    recovered: bool
    failedComponents: List[str]
    recoveredBy: str
    meetsRto: bool
    meetsRpo: bool
    narrative: str


class FullAnalysisResponse(BaseModel):
    profile: InfrastructureProfile
    migration: MigrationPlan
    architectures: List[ArchitectureOption]
    recommendedIndex: int
    security: SecurityReport
