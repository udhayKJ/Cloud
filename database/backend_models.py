"""
CloudShift AI: SQLAlchemy 2.0 ORM Models & Pydantic v2 Schemas
Ready-to-use for FastAPI / Python Backend Integration
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict

from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, ENUM as PG_ENUM
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


# =============================================================================
# 1. PYTHON ENUMS (MAPPED TO POSTGRESQL ENUMS)
# =============================================================================

class UserRole(str, Enum):
    ADMIN = "admin"
    ARCHITECT = "architect"
    ANALYST = "analyst"
    VIEWER = "viewer"


class ProjectStatus(str, Enum):
    DRAFT = "draft"
    ANALYSED = "analysed"
    SIMULATED = "simulated"


class OSType(str, Enum):
    LINUX = "linux"
    WINDOWS = "windows"


class DatabaseType(str, Enum):
    MYSQL = "mysql"
    POSTGRESQL = "postgresql"
    ORACLE = "oracle"
    SQLSERVER = "sqlserver"
    MONGODB = "mongodb"
    REDIS = "redis"
    NONE = "none"


class TrafficPattern(str, Enum):
    STEADY = "steady"
    SPIKY = "spiky"
    SEASONAL = "seasonal"


class WorkloadType(str, Enum):
    WEB = "web"
    API = "api"
    BATCH = "batch"
    ANALYTICS = "analytics"
    LEGACY = "legacy"


class LevelGrade(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AvailabilityTarget(str, Enum):
    P99 = "99"
    P99_9 = "99.9"
    P99_99 = "99.99"
    P99_999 = "99.999"


class MigrationStrategy(str, Enum):
    REHOST = "Rehost"
    REPLATFORM = "Replatform"
    REFACTOR = "Refactor"


class ArchitectureTier(str, Enum):
    LOW_COST = "low-cost"
    BALANCED = "balanced"
    ENTERPRISE = "enterprise"


class DRStrategy(str, Enum):
    BACKUP_RESTORE = "Backup & Restore"
    PILOT_LIGHT = "Pilot Light"
    WARM_STANDBY = "Warm Standby"
    MULTI_SITE_ACTIVE_ACTIVE = "Multi-Site Active/Active"


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


class FailureScenario(str, Enum):
    EC2 = "ec2"
    DATABASE = "database"
    AZ = "az"
    APPLICATION = "application"
    REGION = "region"


class SecurityPillar(str, Enum):
    IDENTITY = "identity"
    ENCRYPTION = "encryption"
    NETWORK = "network"
    EDGE = "edge"
    AUDIT = "audit"


class ControlStatus(str, Enum):
    ENABLED = "enabled"
    PARTIAL = "partial"
    MISSING = "missing"


class SeverityLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# =============================================================================
# 2. SQLALCHEMY ORM MODELS
# =============================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(PG_ENUM(UserRole, name="user_role", create_type=False), nullable=False, default=UserRole.ARCHITECT)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(100), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    industry = Column(String(100), nullable=False, default="Retail")
    description = Column(Text, nullable=False, default="")
    status = Column(PG_ENUM(ProjectStatus, name="project_status", create_type=False), nullable=False, default=ProjectStatus.DRAFT)

    # Compute
    servers = Column(Integer, nullable=False, default=1)
    vcpus_per_server = Column(Integer, nullable=False, default=4)
    ram_gb_per_server = Column(Integer, nullable=False, default=16)
    avg_cpu_util = Column(Numeric(5, 2), nullable=False, default=40.0)
    avg_mem_util = Column(Numeric(5, 2), nullable=False, default=50.0)
    os = Column(PG_ENUM(OSType, name="os_type", create_type=False), nullable=False, default=OSType.LINUX)
    containerized = Column(Boolean, nullable=False, default=False)

    # Data
    database_type = Column(PG_ENUM(DatabaseType, name="database_type", create_type=False), nullable=False, default=DatabaseType.MYSQL)
    db_size_gb = Column(Numeric(10, 2), nullable=False, default=100.0)
    read_heavy = Column(Boolean, nullable=False, default=True)
    storage_tb = Column(Numeric(10, 2), nullable=False, default=1.0)

    # Traffic
    monthly_users = Column(Integer, nullable=False, default=10000)
    peak_rps = Column(Integer, nullable=False, default=100)
    traffic_pattern = Column(PG_ENUM(TrafficPattern, name="traffic_pattern", create_type=False), nullable=False, default=TrafficPattern.STEADY)
    workload_type = Column(PG_ENUM(WorkloadType, name="workload_type", create_type=False), nullable=False, default=WorkloadType.WEB)

    # Environment
    edge_environment = Column(Boolean, nullable=False, default=False)
    low_bandwidth = Column(Boolean, nullable=False, default=False)

    # Business Requirements
    budget_usd = Column(Numeric(12, 2), nullable=False, default=5000.0)
    availability = Column(PG_ENUM(AvailabilityTarget, name="availability_target", create_type=False), nullable=False, default=AvailabilityTarget.P99_9)
    rto_minutes = Column(Integer, nullable=False, default=60)
    rpo_minutes = Column(Integer, nullable=False, default=15)
    performance = Column(PG_ENUM(LevelGrade, name="level_grade", create_type=False), nullable=False, default=LevelGrade.MEDIUM)
    security = Column(PG_ENUM(LevelGrade, name="level_grade", create_type=False), nullable=False, default=LevelGrade.MEDIUM)
    compliance = Column(JSONB, nullable=False, default=list)

    # Priorities (sum to 100)
    priority_cost = Column(Integer, nullable=False, default=40)
    priority_availability = Column(Integer, nullable=False, default=20)
    priority_security = Column(Integer, nullable=False, default=20)
    priority_performance = Column(Integer, nullable=False, default=20)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="projects")
    migration_plans = relationship("MigrationPlan", back_populates="project", cascade="all, delete-orphan")
    architectures = relationship("ArchitectureOption", back_populates="project", cascade="all, delete-orphan")
    dr_simulations = relationship("DRSimulation", back_populates="project", cascade="all, delete-orphan")
    security_reports = relationship("SecurityReport", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")
    events = relationship("SimulationEvent", back_populates="project", cascade="all, delete-orphan")


class MigrationPlan(Base):
    __tablename__ = "migration_plans"

    id = Column(String(64), primary_key=True)
    project_id = Column(String(100), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    strategy = Column(PG_ENUM(MigrationStrategy, name="migration_strategy", create_type=False), nullable=False)
    confidence = Column(Numeric(5, 2), nullable=False)
    strategy_scores = Column(JSONB, nullable=False, default=dict)
    reasons = Column(JSONB, nullable=False, default=list)
    
    data_migration_method = Column(String(100), nullable=False)
    data_migration_reason = Column(Text, nullable=False)
    data_migration_days = Column(Numeric(6, 2), nullable=False, default=1.0)

    db_migration_method = Column(String(100), nullable=False)
    db_migration_reason = Column(Text, nullable=False)

    server_migration_method = Column(String(100), nullable=False)
    server_migration_reason = Column(Text, nullable=False)

    connectivity_method = Column(String(100), nullable=False)
    connectivity_reason = Column(Text, nullable=False)

    phases = Column(JSONB, nullable=False, default=list)
    service_mappings = Column(JSONB, nullable=False, default=list)
    ai_explanation = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    project = relationship("Project", back_populates="migration_plans")


class ArchitectureOption(Base):
    __tablename__ = "architecture_options"

    id = Column(String(64), primary_key=True)
    project_id = Column(String(100), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    tier = Column(PG_ENUM(ArchitectureTier, name="architecture_tier", create_type=False), nullable=False)
    name = Column(String(255), nullable=False)
    tagline = Column(Text, nullable=False, default="")
    is_recommended = Column(Boolean, nullable=False, default=False)

    multi_az = Column(Boolean, nullable=False, default=False)
    multi_region = Column(Boolean, nullable=False, default=False)
    auto_scaling = Column(Boolean, nullable=False, default=True)
    read_replicas = Column(Integer, nullable=False, default=0)
    instance_count = Column(Integer, nullable=False, default=2)
    max_instances = Column(Integer, nullable=False, default=6)
    instance_type = Column(String(50), nullable=False, default="t4g.xlarge")
    database_service = Column(String(100), nullable=False)
    dr_strategy = Column(PG_ENUM(DRStrategy, name="dr_strategy", create_type=False), nullable=False)

    rto_minutes = Column(Integer, nullable=False, default=15)
    rpo_minutes = Column(Integer, nullable=False, default=5)
    availability_pct = Column(Numeric(6, 3), nullable=False, default=99.95)
    weighted_score = Column(Numeric(5, 2), nullable=False, default=85.0)

    meets_rto = Column(Boolean, nullable=False, default=True)
    meets_rpo = Column(Boolean, nullable=False, default=True)
    meets_availability = Column(Boolean, nullable=False, default=True)
    meets_budget = Column(Boolean, nullable=False, default=True)

    waf_security = Column(Numeric(5, 2), nullable=False, default=85.0)
    waf_reliability = Column(Numeric(5, 2), nullable=False, default=85.0)
    waf_performance = Column(Numeric(5, 2), nullable=False, default=85.0)
    waf_cost = Column(Numeric(5, 2), nullable=False, default=85.0)
    waf_operations = Column(Numeric(5, 2), nullable=False, default=85.0)

    cost_compute = Column(Numeric(12, 2), nullable=False, default=0.0)
    cost_database = Column(Numeric(12, 2), nullable=False, default=0.0)
    cost_storage = Column(Numeric(12, 2), nullable=False, default=0.0)
    cost_network = Column(Numeric(12, 2), nullable=False, default=0.0)
    cost_security = Column(Numeric(12, 2), nullable=False, default=0.0)
    cost_ops = Column(Numeric(12, 2), nullable=False, default=0.0)
    cost_total = Column(Numeric(12, 2), nullable=False, default=0.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    project = relationship("Project", back_populates="architectures")
    components = relationship("ArchitectureComponent", back_populates="architecture", cascade="all, delete-orphan")


class ArchitectureComponent(Base):
    __tablename__ = "architecture_components"

    id = Column(String(64), primary_key=True)
    architecture_id = Column(String(64), ForeignKey("architecture_options.id", ondelete="CASCADE"), nullable=False)
    service = Column(String(100), nullable=False)
    category = Column(PG_ENUM(ComponentCategory, name="component_category", create_type=False), nullable=False)
    detail = Column(Text, nullable=False)
    monthly_cost = Column(Numeric(12, 2), nullable=False, default=0.0)
    reason = Column(Text, nullable=False)
    diagram_node_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    architecture = relationship("ArchitectureOption", back_populates="components")


class DRSimulation(Base):
    __tablename__ = "dr_simulations"

    id = Column(String(64), primary_key=True)
    project_id = Column(String(100), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    architecture_id = Column(String(64), ForeignKey("architecture_options.id", ondelete="SET NULL"), nullable=True)
    scenario = Column(PG_ENUM(FailureScenario, name="failure_scenario", create_type=False), nullable=False)
    title = Column(String(255), nullable=False)

    rto_minutes = Column(Numeric(6, 2), nullable=False, default=0.0)
    rpo_minutes = Column(Numeric(6, 2), nullable=False, default=0.0)
    data_loss_mb = Column(Numeric(12, 2), nullable=False, default=0.0)
    availability_impact_pct = Column(Numeric(5, 2), nullable=False, default=0.0)
    recovered = Column(Boolean, nullable=False, default=True)
    failed_components = Column(JSONB, nullable=False, default=list)
    recovered_by = Column(String(255), nullable=False)
    meets_rto = Column(Boolean, nullable=False, default=True)
    meets_rpo = Column(Boolean, nullable=False, default=True)
    narrative = Column(Text, nullable=False, default="")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="dr_simulations")
    steps = relationship("DRSimulationStep", back_populates="simulation", cascade="all, delete-orphan")


class DRSimulationStep(Base):
    __tablename__ = "dr_simulation_steps"

    id = Column(String(64), primary_key=True)
    simulation_id = Column(String(64), ForeignKey("dr_simulations.id", ondelete="CASCADE"), nullable=False)
    step_order = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    service = Column(String(100), nullable=False)
    duration_sec = Column(Integer, nullable=False, default=0)
    description = Column(Text, nullable=False, default="")
    status = Column(String(50), nullable=False, default="success")

    simulation = relationship("DRSimulation", back_populates="steps")


class SecurityReport(Base):
    __tablename__ = "security_reports"

    id = Column(String(64), primary_key=True)
    project_id = Column(String(100), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    architecture_id = Column(String(64), ForeignKey("architecture_options.id", ondelete="SET NULL"), nullable=True)
    overall_score = Column(Numeric(5, 2), nullable=False, default=85.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    project = relationship("Project", back_populates="security_reports")
    controls = relationship("SecurityControl", back_populates="report", cascade="all, delete-orphan")
    findings = relationship("SecurityFinding", back_populates="report", cascade="all, delete-orphan")


class SecurityControl(Base):
    __tablename__ = "security_controls"

    id = Column(String(64), primary_key=True)
    report_id = Column(String(64), ForeignKey("security_reports.id", ondelete="CASCADE"), nullable=False)
    control_key = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    service = Column(String(100), nullable=False)
    pillar = Column(PG_ENUM(SecurityPillar, name="security_pillar", create_type=False), nullable=False)
    status = Column(PG_ENUM(ControlStatus, name="control_status", create_type=False), nullable=False, default=ControlStatus.ENABLED)
    severity = Column(PG_ENUM(SeverityLevel, name="severity_level", create_type=False), nullable=False, default=SeverityLevel.MEDIUM)
    description = Column(Text, nullable=False, default="")

    report = relationship("SecurityReport", back_populates="controls")


class SecurityFinding(Base):
    __tablename__ = "security_findings"

    id = Column(String(64), primary_key=True)
    report_id = Column(String(64), ForeignKey("security_reports.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    severity = Column(PG_ENUM(SeverityLevel, name="severity_level", create_type=False), nullable=False)
    recommendation = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    report = relationship("SecurityReport", back_populates="findings")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(64), primary_key=True)
    project_id = Column(String(100), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    report_type = Column(String(100), nullable=False, default="architecture_assessment")
    s3_bucket = Column(String(255), nullable=True)
    s3_key = Column(String(500), nullable=True)
    summary = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="reports")


class SimulationEvent(Base):
    __tablename__ = "simulation_events"

    id = Column(String(64), primary_key=True)
    project_id = Column(String(100), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(100), nullable=False)
    source_service = Column(String(100), nullable=False)
    payload = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="events")


# =============================================================================
# 3. PYDANTIC V2 SCHEMAS (FOR FASTAPI REQUEST / RESPONSE SERIALIZATION)
# =============================================================================

class PrioritiesSchema(BaseModel):
    cost: int = Field(default=40, ge=0, le=100)
    availability: int = Field(default=20, ge=0, le=100)
    security: int = Field(default=20, ge=0, le=100)
    performance: int = Field(default=20, ge=0, le=100)


class InfrastructureProfileBase(BaseModel):
    name: str
    industry: str = "Retail"
    description: str = ""
    status: ProjectStatus = ProjectStatus.DRAFT

    servers: int = 1
    vcpus_per_server: int = 4
    ram_gb_per_server: int = 16
    avg_cpu_util: float = 40.0
    avg_mem_util: float = 50.0
    os: OSType = OSType.LINUX
    containerized: bool = False

    database_type: DatabaseType = DatabaseType.MYSQL
    db_size_gb: float = 100.0
    read_heavy: bool = True
    storage_tb: float = 1.0

    monthly_users: int = 10000
    peak_rps: int = 100
    traffic_pattern: TrafficPattern = TrafficPattern.STEADY
    workload_type: WorkloadType = WorkloadType.WEB

    edge_environment: bool = False
    low_bandwidth: bool = False

    budget_usd: float = 5000.0
    availability: AvailabilityTarget = AvailabilityTarget.P99_9
    rto_minutes: int = 60
    rpo_minutes: int = 15
    performance: LevelGrade = LevelGrade.MEDIUM
    security: LevelGrade = LevelGrade.MEDIUM
    compliance: List[str] = Field(default_factory=list)

    priorities: PrioritiesSchema = Field(default_factory=PrioritiesSchema)


class ProjectCreateSchema(InfrastructureProfileBase):
    id: Optional[str] = None


class ProjectResponseSchema(InfrastructureProfileBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
