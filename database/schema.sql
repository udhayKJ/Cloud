-- =============================================================================
-- CloudShift AI: Intelligent Cloud Migration & Disaster Recovery Simulator
-- Primary PostgreSQL Database Schema
-- Database Target: PostgreSQL 14+ / Amazon RDS PostgreSQL
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. ENUMS AND CUSTOM DOMAIN TYPES
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'architect', 'analyst', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('draft', 'analysed', 'simulated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE os_type AS ENUM ('linux', 'windows');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE database_type AS ENUM (
        'mysql',
        'postgresql',
        'oracle',
        'sqlserver',
        'mongodb',
        'redis',
        'none'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE traffic_pattern AS ENUM ('steady', 'spiky', 'seasonal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workload_type AS ENUM ('web', 'api', 'batch', 'analytics', 'legacy');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE level_grade AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE availability_target AS ENUM ('99', '99.9', '99.99', '99.999');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE migration_strategy AS ENUM ('Rehost', 'Replatform', 'Refactor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE architecture_tier AS ENUM ('low-cost', 'balanced', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dr_strategy AS ENUM (
        'Backup & Restore',
        'Pilot Light',
        'Warm Standby',
        'Multi-Site Active/Active'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE component_category AS ENUM (
        'compute',
        'database',
        'storage',
        'network',
        'security',
        'ops',
        'messaging',
        'edge',
        'migration'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE failure_scenario AS ENUM ('ec2', 'database', 'az', 'application', 'region');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE security_pillar AS ENUM ('identity', 'encryption', 'network', 'edge', 'audit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE control_status AS ENUM ('enabled', 'partial', 'missing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE severity_level AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 2. CORE SYSTEM TABLES
-- =============================================================================

-- Users / System Actors
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'architect',
    avatar_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects & Infrastructure Profiles
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL DEFAULT 'Retail',
    description TEXT NOT NULL DEFAULT '',
    status project_status NOT NULL DEFAULT 'draft',
    
    -- Compute Profile
    servers INT NOT NULL DEFAULT 1 CHECK (servers > 0),
    vcpus_per_server INT NOT NULL DEFAULT 4 CHECK (vcpus_per_server > 0),
    ram_gb_per_server INT NOT NULL DEFAULT 16 CHECK (ram_gb_per_server > 0),
    avg_cpu_util NUMERIC(5,2) NOT NULL DEFAULT 40.00 CHECK (avg_cpu_util >= 0 AND avg_cpu_util <= 100),
    avg_mem_util NUMERIC(5,2) NOT NULL DEFAULT 50.00 CHECK (avg_mem_util >= 0 AND avg_mem_util <= 100),
    os os_type NOT NULL DEFAULT 'linux',
    containerized BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Data Profile
    database_type database_type NOT NULL DEFAULT 'mysql',
    db_size_gb NUMERIC(10,2) NOT NULL DEFAULT 100.00 CHECK (db_size_gb >= 0),
    read_heavy BOOLEAN NOT NULL DEFAULT TRUE,
    storage_tb NUMERIC(10,2) NOT NULL DEFAULT 1.00 CHECK (storage_tb >= 0),
    
    -- Traffic & Workload Profile
    monthly_users BIGINT NOT NULL DEFAULT 10000 CHECK (monthly_users >= 0),
    peak_rps INT NOT NULL DEFAULT 100 CHECK (peak_rps >= 0),
    traffic_pattern traffic_pattern NOT NULL DEFAULT 'steady',
    workload_type workload_type NOT NULL DEFAULT 'web',
    
    -- Environment Profile
    edge_environment BOOLEAN NOT NULL DEFAULT FALSE,
    low_bandwidth BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Business Requirements & SLA Constraints
    budget_usd NUMERIC(12,2) NOT NULL DEFAULT 5000.00 CHECK (budget_usd >= 0),
    availability availability_target NOT NULL DEFAULT '99.9',
    rto_minutes INT NOT NULL DEFAULT 60 CHECK (rto_minutes >= 0),
    rpo_minutes INT NOT NULL DEFAULT 15 CHECK (rpo_minutes >= 0),
    performance level_grade NOT NULL DEFAULT 'medium',
    security level_grade NOT NULL DEFAULT 'medium',
    compliance JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Multi-Objective Optimization Weights (Sum = 100)
    priority_cost INT NOT NULL DEFAULT 40 CHECK (priority_cost >= 0 AND priority_cost <= 100),
    priority_availability INT NOT NULL DEFAULT 20 CHECK (priority_availability >= 0 AND priority_availability <= 100),
    priority_security INT NOT NULL DEFAULT 20 CHECK (priority_security >= 0 AND priority_security <= 100),
    priority_performance INT NOT NULL DEFAULT 20 CHECK (priority_performance >= 0 AND priority_performance <= 100),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_priorities_sum CHECK (
        priority_cost + priority_availability + priority_security + priority_performance = 100
    )
);

-- =============================================================================
-- 3. MIGRATION DECISION ENGINE & ANALYSIS RESULTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS migration_plans (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    strategy migration_strategy NOT NULL,
    confidence NUMERIC(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    strategy_scores JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"Rehost": 25, "Replatform": 85, "Refactor": 40}
    reasons JSONB NOT NULL DEFAULT '[]'::jsonb,        -- Array of human-readable rationale strings
    
    -- AWS Specialized Migration Tools Mapping
    data_migration_method VARCHAR(100) NOT NULL,       -- e.g. 'AWS Snowball', 'AWS DMS', 'AWS DataSync'
    data_migration_reason TEXT NOT NULL,
    data_migration_days NUMERIC(6,2) NOT NULL DEFAULT 1.0,
    
    db_migration_method VARCHAR(100) NOT NULL,         -- e.g. 'AWS DMS + Native Backup'
    db_migration_reason TEXT NOT NULL,
    
    server_migration_method VARCHAR(100) NOT NULL,     -- e.g. 'AWS Application Migration Service (MGN)'
    server_migration_reason TEXT NOT NULL,
    
    connectivity_method VARCHAR(100) NOT NULL,         -- e.g. 'AWS Direct Connect + Transit Gateway'
    connectivity_reason TEXT NOT NULL,
    
    phases JSONB NOT NULL DEFAULT '[]'::jsonb,          -- Array of {title, duration, tasks[]}
    service_mappings JSONB NOT NULL DEFAULT '[]'::jsonb,-- Array of {source, target, service, category, reason}
    ai_explanation TEXT,                                -- Optional GenAI natural language reasoning
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 4. AWS ARCHITECTURE GENERATION & OPTIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS architecture_options (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tier architecture_tier NOT NULL,
    name VARCHAR(255) NOT NULL,
    tagline TEXT NOT NULL DEFAULT '',
    is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Architectural Parameters
    multi_az BOOLEAN NOT NULL DEFAULT FALSE,
    multi_region BOOLEAN NOT NULL DEFAULT FALSE,
    auto_scaling BOOLEAN NOT NULL DEFAULT TRUE,
    read_replicas INT NOT NULL DEFAULT 0 CHECK (read_replicas >= 0),
    instance_count INT NOT NULL DEFAULT 2 CHECK (instance_count > 0),
    max_instances INT NOT NULL DEFAULT 6 CHECK (max_instances >= instance_count),
    instance_type VARCHAR(50) NOT NULL DEFAULT 't4g.xlarge',
    database_service VARCHAR(100) NOT NULL DEFAULT 'Amazon RDS PostgreSQL',
    dr_strategy dr_strategy NOT NULL DEFAULT 'Pilot Light',
    
    -- Performance & Resiliency Targets Achieved
    rto_minutes INT NOT NULL DEFAULT 15,
    rpo_minutes INT NOT NULL DEFAULT 5,
    availability_pct NUMERIC(6,3) NOT NULL DEFAULT 99.950,
    weighted_score NUMERIC(5,2) NOT NULL DEFAULT 85.00,
    
    -- SLA Compliance Booleans
    meets_rto BOOLEAN NOT NULL DEFAULT TRUE,
    meets_rpo BOOLEAN NOT NULL DEFAULT TRUE,
    meets_availability BOOLEAN NOT NULL DEFAULT TRUE,
    meets_budget BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- AWS Well-Architected Framework Pillar Scores (0 - 100)
    waf_security NUMERIC(5,2) NOT NULL DEFAULT 85.00,
    waf_reliability NUMERIC(5,2) NOT NULL DEFAULT 85.00,
    waf_performance NUMERIC(5,2) NOT NULL DEFAULT 85.00,
    waf_cost NUMERIC(5,2) NOT NULL DEFAULT 85.00,
    waf_operations NUMERIC(5,2) NOT NULL DEFAULT 85.00,
    
    -- Monthly Cost Breakdown in USD
    cost_compute NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cost_database NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cost_storage NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cost_network NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cost_security NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cost_ops NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cost_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Granular Components within each Architecture Option
CREATE TABLE IF NOT EXISTS architecture_components (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    architecture_id VARCHAR(64) NOT NULL REFERENCES architecture_options(id) ON DELETE CASCADE,
    service VARCHAR(100) NOT NULL,
    category component_category NOT NULL,
    detail TEXT NOT NULL,
    monthly_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    reason TEXT NOT NULL,
    diagram_node_id VARCHAR(100),                       -- Reference for React Flow canvas integration
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 5. DISASTER RECOVERY SIMULATOR & METRICS
-- =============================================================================

CREATE TABLE IF NOT EXISTS dr_simulations (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    architecture_id VARCHAR(64) REFERENCES architecture_options(id) ON DELETE SET NULL,
    scenario failure_scenario NOT NULL,
    title VARCHAR(255) NOT NULL,
    
    -- Simulation Outcomes
    rto_minutes NUMERIC(6,2) NOT NULL DEFAULT 0.0,
    rpo_minutes NUMERIC(6,2) NOT NULL DEFAULT 0.0,
    data_loss_mb NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    availability_impact_pct NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    recovered BOOLEAN NOT NULL DEFAULT TRUE,
    failed_components JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g. ["Primary RDS Instance", "AZ-1"]
    recovered_by VARCHAR(255) NOT NULL,                  -- e.g. "RDS Multi-AZ Automated Failover + Route 53"
    meets_rto BOOLEAN NOT NULL DEFAULT TRUE,
    meets_rpo BOOLEAN NOT NULL DEFAULT TRUE,
    narrative TEXT NOT NULL DEFAULT '',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step-by-Step Recovery Timeline Events (Step Functions simulation)
CREATE TABLE IF NOT EXISTS dr_simulation_steps (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    simulation_id VARCHAR(64) NOT NULL REFERENCES dr_simulations(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    service VARCHAR(100) NOT NULL,
    duration_sec INT NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'success',
    
    CONSTRAINT uq_simulation_step_order UNIQUE (simulation_id, step_order)
);

-- =============================================================================
-- 6. SECURITY & COMPLIANCE EVALUATION
-- =============================================================================

CREATE TABLE IF NOT EXISTS security_reports (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    architecture_id VARCHAR(64) REFERENCES architecture_options(id) ON DELETE SET NULL,
    overall_score NUMERIC(5,2) NOT NULL DEFAULT 85.00 CHECK (overall_score >= 0 AND overall_score <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Security Controls Audited (IAM, KMS, WAF, Shield, CloudTrail, etc.)
CREATE TABLE IF NOT EXISTS security_controls (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    report_id VARCHAR(64) NOT NULL REFERENCES security_reports(id) ON DELETE CASCADE,
    control_key VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    service VARCHAR(100) NOT NULL,
    pillar security_pillar NOT NULL,
    status control_status NOT NULL DEFAULT 'enabled',
    severity severity_level NOT NULL DEFAULT 'medium',
    description TEXT NOT NULL DEFAULT ''
);

-- Security Vulnerabilities / Compliance Findings
CREATE TABLE IF NOT EXISTS security_findings (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    report_id VARCHAR(64) NOT NULL REFERENCES security_reports(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    severity severity_level NOT NULL,
    recommendation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 7. GENERATED ARTIFACTS, REPORTS & AUDIT LOGS
-- =============================================================================

-- Exported Architecture & Executive Reports
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL DEFAULT 'architecture_assessment',
    s3_bucket VARCHAR(255),
    s3_key VARCHAR(500),
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event Logs / Real-time Simulation Logs (Mirrors DynamoDB event streams)
CREATE TABLE IF NOT EXISTS simulation_events (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,                  -- e.g. 'FAILURE_INJECTED', 'FAILOVER_TRIGGERED', 'TRAFFIC_REROUTED'
    source_service VARCHAR(100) NOT NULL,              -- e.g. 'AWS CloudWatch', 'AWS Step Functions'
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 8. AUTOMATIC TIMESTAMP TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_migration_plans_updated_at ON migration_plans;
CREATE TRIGGER trg_migration_plans_updated_at
BEFORE UPDATE ON migration_plans
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_architecture_options_updated_at ON architecture_options;
CREATE TRIGGER trg_architecture_options_updated_at
BEFORE UPDATE ON architecture_options
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_security_reports_updated_at ON security_reports;
CREATE TRIGGER trg_security_reports_updated_at
BEFORE UPDATE ON security_reports
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
