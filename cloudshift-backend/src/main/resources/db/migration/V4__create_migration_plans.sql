-- V4__create_migration_plans.sql
-- CloudShift AI — Migration Plans, Architecture Configs, Simulation Results, Reports

-- ===== Migration Plans =====
CREATE TABLE migration_plans (
    id                       VARCHAR(36)    NOT NULL,
    project_id               VARCHAR(36)    NOT NULL,
    infra_profile_id         VARCHAR(36),
    migration_strategy       VARCHAR(50)    NOT NULL,
    priority_profile         VARCHAR(50)    NOT NULL DEFAULT 'BALANCED',
    compute_service          VARCHAR(200),
    db_service               VARCHAR(200),
    storage_service          VARCHAR(200),
    migration_method         VARCHAR(200),
    dr_strategy              VARCHAR(200),
    networking_services      VARCHAR(300),
    security_services        VARCHAR(300),
    estimated_cost_monthly   DECIMAL(10,2),
    architecture_json        TEXT,
    status                   VARCHAR(50)    NOT NULL DEFAULT 'DRAFT',
    created_at               TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMP,

    CONSTRAINT pk_migration_plans        PRIMARY KEY (id),
    CONSTRAINT fk_migration_plan_project FOREIGN KEY (project_id)      REFERENCES projects(id)               ON DELETE CASCADE,
    CONSTRAINT fk_migration_plan_infra   FOREIGN KEY (infra_profile_id) REFERENCES infrastructure_profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_migration_plans_project ON migration_plans(project_id);

-- ===== Architecture Configs =====
CREATE TABLE architecture_configs (
    id                 VARCHAR(36)  NOT NULL,
    migration_plan_id  VARCHAR(36)  NOT NULL,
    variant            VARCHAR(50)  NOT NULL,
    architecture_json  TEXT         NOT NULL,
    label              VARCHAR(255),
    created_at         TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_architecture_configs  PRIMARY KEY (id),
    CONSTRAINT fk_arch_config_plan      FOREIGN KEY (migration_plan_id) REFERENCES migration_plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_arch_configs_plan ON architecture_configs(migration_plan_id);

-- ===== Simulation Results =====
CREATE TABLE simulation_results (
    id                            VARCHAR(36)    NOT NULL,
    migration_plan_id             VARCHAR(36)    NOT NULL,
    failure_scenario              VARCHAR(100)   NOT NULL,
    actual_rto_minutes            DECIMAL(8,2),
    actual_rpo_minutes            DECIMAL(8,2),
    availability_pct              DECIMAL(6,3),
    data_loss_gb                  DECIMAL(10,3),
    failed_components             VARCHAR(500),
    recovery_steps                TEXT,
    cloudwatch_metric_namespace   VARCHAR(255),
    status                        VARCHAR(50)    NOT NULL DEFAULT 'PENDING',
    created_at                    TIMESTAMP      NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_simulation_results PRIMARY KEY (id),
    CONSTRAINT fk_sim_plan           FOREIGN KEY (migration_plan_id) REFERENCES migration_plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_sim_results_plan ON simulation_results(migration_plan_id);

-- ===== Reports =====
CREATE TABLE reports (
    id              VARCHAR(36)   NOT NULL,
    project_id      VARCHAR(36)   NOT NULL,
    report_type     VARCHAR(50)   NOT NULL,
    s3_key          VARCHAR(500),
    download_url    VARCHAR(2048),
    file_size_bytes BIGINT,
    status          VARCHAR(50)   NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_reports         PRIMARY KEY (id),
    CONSTRAINT fk_report_project  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_reports_project ON reports(project_id);
