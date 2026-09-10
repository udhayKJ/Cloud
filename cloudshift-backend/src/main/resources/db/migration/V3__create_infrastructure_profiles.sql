-- V3__create_infrastructure_profiles.sql
-- CloudShift AI — Infrastructure Profiles table

CREATE TABLE infrastructure_profiles (
    id                          VARCHAR(36)    NOT NULL,
    project_id                  VARCHAR(36)    NOT NULL,

    -- Compute
    server_count                INTEGER,
    average_cpu_utilization_pct DECIMAL(5,2),
    average_ram_gb              DECIMAL(10,2),

    -- Storage
    total_storage_gb            BIGINT,
    storage_type                VARCHAR(100),

    -- Database
    db_type                     VARCHAR(100),
    db_size_gb                  BIGINT,

    -- Scale
    user_count                  BIGINT,
    peak_rps                    INTEGER,

    -- Requirements
    budget_tier                 VARCHAR(50),
    rto_hours                   DECIMAL(8,2),
    rpo_hours                   DECIMAL(8,2),
    availability_requirement    VARCHAR(50),
    network_bandwidth_gbps      DECIMAL(8,2),
    compliance_requirements     VARCHAR(500),

    -- Current Setup
    current_os                  VARCHAR(100),
    is_containerized            BOOLEAN DEFAULT FALSE,
    has_microservices           BOOLEAN DEFAULT FALSE,
    notes                       TEXT,

    created_at                  TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP,

    CONSTRAINT pk_infra_profiles    PRIMARY KEY (id),
    CONSTRAINT fk_infra_project     FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_infra_profiles_project ON infrastructure_profiles(project_id);
