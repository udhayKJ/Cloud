-- =============================================================================
-- CloudShift AI: Performance Indexes & Query Optimizations
-- Target Database: PostgreSQL 14+ / Amazon RDS PostgreSQL
-- =============================================================================

-- 1. Foreign Key and Lookup Indexes on Projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_industry ON projects(industry);
CREATE INDEX IF NOT EXISTS idx_projects_database_type ON projects(database_type);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- GIN Index on Projects JSONB columns
CREATE INDEX IF NOT EXISTS idx_projects_compliance_gin ON projects USING gin(compliance);

-- 2. Indexes on Migration Plans
CREATE INDEX IF NOT EXISTS idx_migration_plans_project_id ON migration_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_migration_plans_strategy ON migration_plans(strategy);
CREATE INDEX IF NOT EXISTS idx_migration_plans_strategy_scores_gin ON migration_plans USING gin(strategy_scores);
CREATE INDEX IF NOT EXISTS idx_migration_plans_service_mappings_gin ON migration_plans USING gin(service_mappings);
CREATE INDEX IF NOT EXISTS idx_migration_plans_phases_gin ON migration_plans USING gin(phases);

-- 3. Indexes on Architecture Options & Components
CREATE INDEX IF NOT EXISTS idx_arch_options_project_id ON architecture_options(project_id);
CREATE INDEX IF NOT EXISTS idx_arch_options_tier ON architecture_options(tier);
CREATE INDEX IF NOT EXISTS idx_arch_options_is_recommended ON architecture_options(is_recommended);
CREATE INDEX IF NOT EXISTS idx_arch_options_cost_total ON architecture_options(cost_total);

CREATE INDEX IF NOT EXISTS idx_arch_components_arch_id ON architecture_components(architecture_id);
CREATE INDEX IF NOT EXISTS idx_arch_components_category ON architecture_components(category);
CREATE INDEX IF NOT EXISTS idx_arch_components_service ON architecture_components(service);

-- 4. Indexes on Disaster Recovery Simulations & Steps
CREATE INDEX IF NOT EXISTS idx_dr_sim_project_id ON dr_simulations(project_id);
CREATE INDEX IF NOT EXISTS idx_dr_sim_scenario ON dr_simulations(scenario);
CREATE INDEX IF NOT EXISTS idx_dr_sim_recovered ON dr_simulations(recovered);
CREATE INDEX IF NOT EXISTS idx_dr_sim_failed_components_gin ON dr_simulations USING gin(failed_components);

CREATE INDEX IF NOT EXISTS idx_dr_steps_simulation_id ON dr_simulation_steps(simulation_id);
CREATE INDEX IF NOT EXISTS idx_dr_steps_step_order ON dr_simulation_steps(simulation_id, step_order);

-- 5. Indexes on Security Reports, Controls, & Findings
CREATE INDEX IF NOT EXISTS idx_sec_reports_project_id ON security_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_sec_controls_report_id ON security_controls(report_id);
CREATE INDEX IF NOT EXISTS idx_sec_controls_pillar ON security_controls(pillar);
CREATE INDEX IF NOT EXISTS idx_sec_controls_status ON security_controls(status);
CREATE INDEX IF NOT EXISTS idx_sec_controls_severity ON security_controls(severity);

CREATE INDEX IF NOT EXISTS idx_sec_findings_report_id ON security_findings(report_id);
CREATE INDEX IF NOT EXISTS idx_sec_findings_severity ON security_findings(severity);

-- 6. Indexes on Reports and Event Streams
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);

CREATE INDEX IF NOT EXISTS idx_sim_events_project_id ON simulation_events(project_id);
CREATE INDEX IF NOT EXISTS idx_sim_events_created_at ON simulation_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sim_events_payload_gin ON simulation_events USING gin(payload);
