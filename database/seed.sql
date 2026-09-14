-- =============================================================================
-- CloudShift AI: Initial Seed Data for PostgreSQL
-- Pre-populates default demo projects matching the React frontend state:
-- 1. RetailCo Legacy E-Commerce (Retail)
-- 2. FinServe Core Banking (Financial Services)
-- 3. MediTrack Patient Portal (Healthcare / Edge)
-- =============================================================================

-- 1. Insert Demo Users
INSERT INTO users (id, email, full_name, role, avatar_url)
VALUES 
    ('usr_lead_architect', 'architect@cloudshift.internal', 'Alex Morgan', 'architect', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'),
    ('usr_cloud_engineer', 'engineer@cloudshift.internal', 'Jordan Lee', 'analyst', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 2. Insert Sample Projects
INSERT INTO projects (
    id, user_id, name, industry, description, status,
    servers, vcpus_per_server, ram_gb_per_server, avg_cpu_util, avg_mem_util, os, containerized,
    database_type, db_size_gb, read_heavy, storage_tb,
    monthly_users, peak_rps, traffic_pattern, workload_type,
    edge_environment, low_bandwidth,
    budget_usd, availability, rto_minutes, rpo_minutes, performance, security, compliance,
    priority_cost, priority_availability, priority_security, priority_performance,
    created_at
) VALUES 
(
    'retailco-erp',
    'usr_lead_architect',
    'RetailCo Legacy E-Commerce',
    'Retail',
    'PHP monolith on 6 rack servers with a 5 TB product-image NAS and MySQL 5.7 primary/replica.',
    'simulated',
    6, 4, 16, 45.00, 55.00, 'linux', false,
    'mysql', 500.00, true, 5.00,
    100000, 800, 'spiky', 'web',
    false, false,
    6000.00, '99.99', 60, 15, 'medium', 'medium', '["PCI-DSS"]'::jsonb,
    40, 20, 20, 20,
    '2026-08-12T09:30:00.000Z'
),
(
    'finserve-core',
    'usr_lead_architect',
    'FinServe Core Banking',
    'Financial Services',
    'Oracle-backed Java core banking platform on Windows Server, PCI-DSS in scope, 24x7 SLA.',
    'analysed',
    14, 16, 128, 38.00, 62.00, 'windows', false,
    'oracle', 4200.00, false, 40.00,
    850000, 4200, 'steady', 'legacy',
    false, false,
    40000.00, '99.999', 5, 1, 'high', 'high', '["PCI-DSS", "SOC 2"]'::jsonb,
    10, 40, 35, 15,
    '2026-08-20T14:10:00.000Z'
),
(
    'meditrack',
    'usr_lead_architect',
    'MediTrack Patient Portal',
    'Healthcare',
    'Containerised Node.js API with MongoDB, serving 12 rural clinics with unreliable connectivity.',
    'draft',
    4, 8, 32, 30.00, 40.00, 'linux', true,
    'mongodb', 120.00, true, 2.00,
    35000, 300, 'seasonal', 'api',
    true, true,
    3500.00, '99.9', 30, 5, 'medium', 'high', '["HIPAA"]'::jsonb,
    30, 20, 40, 10,
    '2026-09-01T11:45:00.000Z'
)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status;

-- 3. Insert Migration Plans
INSERT INTO migration_plans (
    id, project_id, strategy, confidence, strategy_scores, reasons,
    data_migration_method, data_migration_reason, data_migration_days,
    db_migration_method, db_migration_reason,
    server_migration_method, server_migration_reason,
    connectivity_method, connectivity_reason,
    phases, service_mappings, ai_explanation
) VALUES 
(
    'mp_retailco',
    'retailco-erp',
    'Replatform',
    88.50,
    '{"Rehost": 35, "Replatform": 88, "Refactor": 55}'::jsonb,
    '["MySQL 5.7 seamlessly maps to Amazon Aurora MySQL with minimal application code modifications", "Static NAS storage can be offloaded directly to Amazon S3 + CloudFront CDN", "Traffic is spiky, making Auto Scaling with ALB ideal for cost efficiency"]'::jsonb,
    'AWS Snowball Edge',
    '5 TB static assets migrated with AWS Snowball Edge to avoid network congestion.',
    3.5,
    'AWS Database Migration Service (DMS)',
    'Continuous CDC replication from on-premise MySQL 5.7 to Amazon Aurora MySQL with zero-downtime cutover.',
    'AWS Application Migration Service (MGN)',
    'Block-level continuous replication of web server instances to EC2.',
    'AWS Site-to-Site VPN with Transit Gateway',
    'IPsec encrypted tunnel for transition and hybrid testing phase.',
    '[
        {"title": "Phase 1: Discovery & Landing Zone", "duration": "2 weeks", "tasks": ["Deploy AWS Control Tower & Landing Zone", "Configure Transit Gateway & VPN", "Establish IAM least-privilege roles"]},
        {"title": "Phase 2: Data & Database Sync", "duration": "3 weeks", "tasks": ["Deploy AWS DMS replication instance", "Sync MySQL to Aurora Serverless v2", "Seed S3 bucket using Snowball Edge"]},
        {"title": "Phase 3: Compute & Cutover", "duration": "2 weeks", "tasks": ["Replicate application servers with AWS MGN", "Perform load & DR failover testing", "DNS cutover via Route 53"]}
    ]'::jsonb,
    '[
        {"source": "On-Premises Linux Servers", "target": "Amazon EC2 + Auto Scaling", "service": "EC2", "category": "compute", "reason": "Elastic capacity based on spiky traffic."},
        {"source": "MySQL 5.7 Cluster", "target": "Amazon Aurora MySQL Multi-AZ", "service": "Aurora", "category": "database", "reason": "Drop-in compatibility with automated failover and 6-way replication."},
        {"source": "Local NAS Storage (5 TB)", "target": "Amazon S3 Standard + Glacier", "service": "S3", "category": "storage", "reason": "Cost-effective durable object storage with CDN integration."},
        {"source": "Hardware Load Balancer", "target": "Application Load Balancer (ALB)", "service": "ALB", "category": "network", "reason": "Layer 7 routing with AWS WAF integration."}
    ]'::jsonb,
    'Aurora MySQL was chosen because it provides 5x the throughput of standard MySQL with automated 6-way storage replication across 3 AZs. This satisfies the 99.99% availability target while lowering operational burden.'
),
(
    'mp_finserve',
    'finserve-core',
    'Rehost',
    92.00,
    '{"Rehost": 92, "Replatform": 45, "Refactor": 20}'::jsonb,
    '["Strict regulatory PCI-DSS constraints and legacy proprietary Oracle PL/SQL modules dictate minimal initial code change", "High memory requirements (128 GB RAM) require AWS RDS for Oracle Multi-AZ Enterprise", "Extremely strict RTO (<5 min) and RPO (<1 min) demand synchronous multi-AZ storage replication"]'::jsonb,
    'AWS Direct Connect (10 Gbps dedicated)',
    'Dedicated private network connection to transfer 40 TB with line-rate security.',
    1.2,
    'Oracle GoldenGate + AWS DMS',
    'Real-time transaction-safe CDC replication with zero data loss.',
    'AWS Application Migration Service (MGN)',
    'Continuous block-level replication of Windows Server workloads.',
    'AWS Direct Connect + MACsec Encryption',
    'Dedicated low-latency 10 Gbps connection meeting strict financial SLAs.',
    '[
        {"title": "Phase 1: Compliance & Landing Zone", "duration": "4 weeks", "tasks": ["Establish PCI-DSS compliant Landing Zone", "Configure Dedicated Direct Connect 10G", "Setup AWS KMS CloudHSM and audit trails"]},
        {"title": "Phase 2: Oracle GoldenGate Sync", "duration": "4 weeks", "tasks": ["Deploy Oracle GoldenGate hub", "Continuous replication to Amazon RDS Oracle Multi-AZ", "Validate data consistency and checksums"]},
        {"title": "Phase 3: Production Cutover", "duration": "1 week", "tasks": ["Dry-run failover simulation", "Final delta sync and DNS switchover", "Post-migration compliance validation"]}
    ]'::jsonb,
    '[
        {"source": "Windows Server Racks (14 servers)", "target": "Amazon EC2 r6i.4xlarge instances", "service": "EC2", "category": "compute", "reason": "High-memory compute optimized for legacy Java JVM heap."},
        {"source": "Oracle Enterprise DB (4.2 TB)", "target": "Amazon RDS for Oracle Enterprise (Multi-AZ)", "service": "RDS", "category": "database", "reason": "Maintains PL/SQL compatibility with synchronous Multi-AZ standby for <1min RPO."},
        {"source": "SAN Storage (40 TB)", "target": "Amazon EBS io2 Block Express + S3", "service": "EBS", "category": "storage", "reason": "Sub-millisecond IOPS for high-frequency banking transactions."}
    ]'::jsonb,
    'For FinServe, the deterministic decision engine prioritises risk minimization and strict regulatory compliance. Rehosting with AWS MGN and RDS Oracle Multi-AZ maintains binary compatibility while achieving 5-nines availability.'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Architecture Options for RetailCo
INSERT INTO architecture_options (
    id, project_id, tier, name, tagline, is_recommended,
    multi_az, multi_region, auto_scaling, read_replicas, instance_count, max_instances, instance_type,
    database_service, dr_strategy, rto_minutes, rpo_minutes, availability_pct, weighted_score,
    meets_rto, meets_rpo, meets_availability, meets_budget,
    waf_security, waf_reliability, waf_performance, waf_cost, waf_operations,
    cost_compute, cost_database, cost_storage, cost_network, cost_security, cost_ops, cost_total
) VALUES 
(
    'arch_retailco_lowcost',
    'retailco-erp',
    'low-cost',
    'Cost-Optimised Baseline',
    'Single-AZ setup with automated nightly snapshots and burstable Graviton instances.',
    false,
    false, false, true, 0, 2, 4, 't4g.large',
    'Amazon RDS MySQL Single-AZ', 'Backup & Restore',
    180, 60, 99.500, 72.50,
    false, false, false, true,
    75.0, 68.0, 72.0, 95.0, 70.0,
    420.00, 310.00, 140.00, 90.00, 50.00, 80.00, 1090.00
),
(
    'arch_retailco_balanced',
    'retailco-erp',
    'balanced',
    'Production Multi-AZ Architecture',
    'Highly available multi-AZ deployment with Aurora Serverless v2, ALB, and CloudFront caching.',
    true,
    true, false, true, 2, 4, 10, 'c6g.xlarge',
    'Amazon Aurora MySQL Serverless v2', 'Pilot Light',
    15, 5, 99.990, 91.80,
    true, true, true, true,
    92.0, 94.0, 90.0, 88.0, 89.0,
    1450.00, 1680.00, 220.00, 310.00, 280.00, 260.00, 4200.00
),
(
    'arch_retailco_enterprise',
    'retailco-erp',
    'enterprise',
    'Enterprise Multi-Region Active/Active',
    'Aurora Global Database with cross-region replication, CloudFront Anycast DNS, and AWS WAF Shield Advanced.',
    false,
    true, true, true, 4, 8, 24, 'c6g.2xlarge',
    'Amazon Aurora Global Database', 'Multi-Site Active/Active',
    1, 1, 99.999, 87.40,
    true, true, true, false,
    98.0, 99.0, 96.0, 62.0, 95.0,
    3600.00, 3900.00, 450.00, 820.00, 850.00, 580.00, 10200.00
)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Architecture Components for the Recommended Architecture
INSERT INTO architecture_components (
    id, architecture_id, service, category, detail, monthly_cost, reason, diagram_node_id
) VALUES 
    ('comp_1', 'arch_retailco_balanced', 'Amazon EC2 (c6g.xlarge)', 'compute', '4x Graviton3 instances in Auto Scaling Group across 3 AZs', 1150.00, 'Cost-efficient compute with 40% better price-performance.', 'node_ec2'),
    ('comp_2', 'arch_retailco_balanced', 'Application Load Balancer', 'network', 'Dual-AZ public ALB with SSL offloading and health checks', 180.00, 'Evenly balances web traffic across private subnet instances.', 'node_alb'),
    ('comp_3', 'arch_retailco_balanced', 'Amazon Aurora Serverless v2', 'database', 'MySQL-compatible with 1 Primary + 1 Aurora Replica across 2 AZs', 1680.00, 'Sub-second auto-scaling and 15-second automated failover.', 'node_aurora'),
    ('comp_4', 'arch_retailco_balanced', 'Amazon S3 Standard + Lifecycle', 'storage', '5 TB media store with lifecycle policy transitioning to Glacier', 220.00, '99.999999999% durability for e-commerce assets.', 'node_s3'),
    ('comp_5', 'arch_retailco_balanced', 'Amazon CloudFront + AWS WAF', 'security', 'Global CDN edge caching + WAF rate limiting and SQLi protection', 280.00, 'Reduces latency by 65% and protects against web exploits.', 'node_cloudfront'),
    ('comp_6', 'arch_retailco_balanced', 'Amazon CloudWatch + SNS', 'ops', 'Alarms on CPU >75%, synthetic canary probes, and SNS email alerts', 260.00, 'Full observability and automated scaling triggers.', 'node_cloudwatch')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Disaster Recovery Simulations
INSERT INTO dr_simulations (
    id, project_id, architecture_id, scenario, title,
    rto_minutes, rpo_minutes, data_loss_mb, availability_impact_pct, recovered,
    failed_components, recovered_by, meets_rto, meets_rpo, narrative
) VALUES 
(
    'sim_retailco_db_failover',
    'retailco-erp',
    'arch_retailco_balanced',
    'database',
    'Primary Aurora Database Node Failure Simulation',
    1.20,
    0.00,
    0.00,
    1.50,
    true,
    '["Aurora Primary Writer Instance (us-east-1a)"]'::jsonb,
    'Aurora Automated Failover to Read Replica (us-east-1b)',
    true,
    true,
    'Synthetic failure injected into the Primary Aurora writer node. Cluster endpoint automatically detected health check failure at t=18s, promoted reader replica in us-east-1b to writer at t=42s. Total downtime was 72 seconds with 0 data loss.'
),
(
    'sim_retailco_az_failure',
    'retailco-erp',
    'arch_retailco_balanced',
    'az',
    'Availability Zone us-east-1a Complete Outage',
    3.50,
    0.00,
    0.00,
    4.20,
    true,
    '["Availability Zone us-east-1a", "2x EC2 Web Nodes", "NAT Gateway 1a"]'::jsonb,
    'Application Load Balancer + Auto Scaling Group Rebalancing',
    true,
    true,
    'Simulated AZ-level failure in us-east-1a. ALB shifted traffic immediately to remaining healthy targets in us-east-1b and 1c. Auto Scaling launched replacement instances within 3.5 minutes.'
)
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Disaster Recovery Steps
INSERT INTO dr_simulation_steps (
    id, simulation_id, step_order, title, service, duration_sec, description, status
) VALUES 
    ('step_1', 'sim_retailco_db_failover', 1, 'Failure Injected', 'AWS Fault Injection Simulator', 5, 'Synthetic process crash simulated on primary database writer.', 'success'),
    ('step_2', 'sim_retailco_db_failover', 2, 'Health Check Failure Detected', 'Amazon CloudWatch / Route 53', 15, 'Cluster heartbeat misses 3 consecutive probes.', 'success'),
    ('step_3', 'sim_retailco_db_failover', 3, 'Standby Replica Promoted', 'Amazon Aurora Engine', 25, 'Aurora promotes read replica in AZ-1b to primary writer.', 'success'),
    ('step_4', 'sim_retailco_db_failover', 4, 'DNS Endpoint Updated', 'Route 53 CNAME', 10, 'Cluster DNS endpoint points to the newly promoted master.', 'success'),
    ('step_5', 'sim_retailco_db_failover', 5, 'Application Reconnection Verified', 'ALB Health Probe', 17, 'All EC2 backend instances re-establish database connection pool.', 'success')
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Security Report
INSERT INTO security_reports (
    id, project_id, architecture_id, overall_score
) VALUES 
    ('sec_rep_retailco', 'retailco-erp', 'arch_retailco_balanced', 91.50)
ON CONFLICT (id) DO NOTHING;

INSERT INTO security_controls (
    id, report_id, control_key, name, service, pillar, status, severity, description
) VALUES 
    ('ctrl_1', 'sec_rep_retailco', 'IAM_LEAST_PRIVILEGE', 'IAM Roles for EC2 & Service Accounts', 'AWS IAM', 'identity', 'enabled', 'low', 'EC2 instances use temporary IAM credentials via Instance Profile without hardcoded keys.'),
    ('ctrl_2', 'sec_rep_retailco', 'KMS_ENCRYPTION_AT_REST', 'KMS Envelope Encryption for RDS & S3', 'AWS KMS', 'encryption', 'enabled', 'low', 'AES-256 Customer Master Key (CMK) applied to all databases and S3 buckets.'),
    ('ctrl_3', 'sec_rep_retailco', 'WAF_RATE_LIMITING', 'AWS WAF SQLi and Rate-Limiting Rules', 'AWS WAF', 'edge', 'enabled', 'medium', 'WAF inspects requests at CloudFront and blocks >2000 req/5min from single IP.'),
    ('ctrl_4', 'sec_rep_retailco', 'VPC_PRIVATE_ISOLATION', 'Private Subnets without Public IPs', 'Amazon VPC', 'network', 'enabled', 'low', 'Compute and database tiers reside in private subnets with egress via NAT Gateway.'),
    ('ctrl_5', 'sec_rep_retailco', 'AUDIT_CLOUDTRAIL_CONFIG', 'Multi-Region CloudTrail & AWS Config', 'AWS CloudTrail', 'audit', 'partial', 'medium', 'Audit logs enabled in primary region; cross-region S3 bucket log replication pending.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO security_findings (
    id, report_id, title, severity, recommendation
) VALUES 
    ('find_1', 'sec_rep_retailco', 'S3 Bucket Public Access Block Verification', 'medium', 'Ensure S3 Block Public Access is strictly enabled at account-level and bucket-level.'),
    ('find_2', 'sec_rep_retailco', 'AWS GuardDuty Threat Detection Ingestion', 'low', 'Enable GuardDuty for automated ML-based anomaly detection on VPC flow logs.')
ON CONFLICT (id) DO NOTHING;
