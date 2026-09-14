-- =============================================================================
-- CloudShift AI: Analytical Views & Aggregated Dashboards
-- Target Database: PostgreSQL 14+ / Amazon RDS PostgreSQL
-- =============================================================================

-- 1. Unified Project Summary View (Combines Infrastructure, Migration, and Recommended Architecture)
CREATE OR REPLACE VIEW v_project_summary AS
SELECT 
    p.id AS project_id,
    p.name AS project_name,
    p.industry,
    p.status AS project_status,
    p.budget_usd,
    p.availability AS target_availability,
    p.rto_minutes AS target_rto_min,
    p.rpo_minutes AS target_rpo_min,
    p.database_type,
    p.storage_tb,
    p.servers,
    p.created_at,
    
    -- Recommended Migration Strategy
    mp.strategy AS recommended_strategy,
    mp.confidence AS strategy_confidence,
    
    -- Recommended Architecture Metrics
    ao.id AS recommended_arch_id,
    ao.name AS recommended_arch_name,
    ao.tier AS recommended_tier,
    ao.cost_total AS estimated_monthly_cost,
    ao.availability_pct AS achieved_availability,
    ao.rto_minutes AS achieved_rto_min,
    ao.rpo_minutes AS achieved_rpo_min,
    ao.weighted_score,
    ROUND((ao.waf_security + ao.waf_reliability + ao.waf_performance + ao.waf_cost + ao.waf_operations) / 5.0, 2) AS waf_average_score,
    
    -- Security Posture
    sr.overall_score AS security_score
FROM projects p
LEFT JOIN migration_plans mp ON mp.project_id = p.id
LEFT JOIN architecture_options ao ON ao.project_id = p.id AND ao.is_recommended = TRUE
LEFT JOIN security_reports sr ON sr.project_id = p.id;

-- 2. Architecture Comparison View (Compares Low-Cost, Balanced, Enterprise tiers per Project)
CREATE OR REPLACE VIEW v_architecture_comparison AS
SELECT 
    p.id AS project_id,
    p.name AS project_name,
    ao.id AS architecture_id,
    ao.tier,
    ao.name AS tier_name,
    ao.is_recommended,
    ao.instance_type,
    ao.instance_count,
    ao.max_instances,
    ao.database_service,
    ao.multi_az,
    ao.multi_region,
    ao.dr_strategy,
    ao.rto_minutes,
    ao.rpo_minutes,
    ao.availability_pct,
    ao.cost_compute,
    ao.cost_database,
    ao.cost_storage,
    ao.cost_network,
    ao.cost_security,
    ao.cost_ops,
    ao.cost_total,
    ao.waf_security,
    ao.waf_reliability,
    ao.waf_performance,
    ao.waf_cost,
    ao.waf_operations,
    ROUND((ao.waf_security + ao.waf_reliability + ao.waf_performance + ao.waf_cost + ao.waf_operations) / 5.0, 2) AS waf_average,
    ao.weighted_score,
    ao.meets_rto,
    ao.meets_rpo,
    ao.meets_availability,
    ao.meets_budget
FROM architecture_options ao
JOIN projects p ON p.id = ao.project_id
ORDER BY p.id, ao.cost_total ASC;

-- 3. Disaster Recovery Resilience Summary View
CREATE OR REPLACE VIEW v_dr_resilience_matrix AS
SELECT 
    ds.project_id,
    p.name AS project_name,
    ds.id AS simulation_id,
    ds.scenario,
    ds.title AS scenario_title,
    ds.rto_minutes AS achieved_rto_min,
    p.rto_minutes AS target_rto_min,
    ds.rpo_minutes AS achieved_rpo_min,
    p.rpo_minutes AS target_rpo_min,
    ds.data_loss_mb,
    ds.availability_impact_pct,
    ds.recovered,
    ds.recovered_by,
    ds.meets_rto,
    ds.meets_rpo,
    COUNT(dss.id) AS total_recovery_steps,
    COALESCE(SUM(dss.duration_sec), 0) AS total_recovery_duration_sec
FROM dr_simulations ds
JOIN projects p ON p.id = ds.project_id
LEFT JOIN dr_simulation_steps dss ON dss.simulation_id = ds.id
GROUP BY ds.id, ds.project_id, p.name, ds.scenario, ds.title, ds.rto_minutes, p.rto_minutes, 
         ds.rpo_minutes, p.rpo_minutes, ds.data_loss_mb, ds.availability_impact_pct, 
         ds.recovered, ds.recovered_by, ds.meets_rto, ds.meets_rpo;
