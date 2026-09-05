import type {
  InfrastructureProfile,
  MigrationPlan,
  MigrationStrategy,
  ServiceMapping,
} from '@/lib/types'

const DB_LABEL: Record<InfrastructureProfile['database'], string> = {
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  oracle: 'Oracle Database',
  sqlserver: 'Microsoft SQL Server',
  mongodb: 'MongoDB',
  redis: 'Redis',
  none: 'No database',
}

export function databaseLabel(db: InfrastructureProfile['database']) {
  return DB_LABEL[db]
}

export function selectDatabaseTarget(p: InfrastructureProfile, strategy: MigrationStrategy) {
  const highAvail = p.availability === '99.99' || p.availability === '99.999'
  const heavy = p.monthlyUsers >= 50_000 || p.performance === 'high' || highAvail

  switch (p.database) {
    case 'none':
      return { service: 'No database', reason: 'Workload is stateless — no database tier required.' }
    case 'redis':
      return {
        service: 'Amazon ElastiCache (Redis)',
        reason: 'Fully managed in-memory cache with Multi-AZ replication and automatic failover.',
      }
    case 'mongodb':
      return strategy === 'Refactor'
        ? {
            service: 'Amazon DynamoDB',
            reason:
              'Key-value / document access patterns map to DynamoDB with single-digit millisecond latency, on-demand scaling and Streams for event-driven processing.',
          }
        : {
            service: 'Amazon DocumentDB',
            reason: 'MongoDB-compatible managed service that keeps the existing driver and query model.',
          }
    case 'oracle':
    case 'sqlserver':
      return strategy === 'Refactor'
        ? {
            service: 'Amazon Aurora PostgreSQL',
            reason: `Refactor removes ${DB_LABEL[p.database]} licensing cost. AWS Schema Conversion Tool plus DMS migrate schema and data.`,
          }
        : {
            service: `Amazon RDS for ${p.database === 'oracle' ? 'Oracle' : 'SQL Server'}`,
            reason: 'Managed engine keeps application compatibility while offloading patching, backups and Multi-AZ failover.',
          }
    default:
      return heavy
        ? {
            service: `Amazon Aurora ${p.database === 'mysql' ? 'MySQL' : 'PostgreSQL'}`,
            reason: `${p.monthlyUsers.toLocaleString()} users, ${p.performance} performance and ${p.availability}% availability targets favour Aurora: up to 5x MySQL throughput, 6-way storage replication across 3 AZs and sub-30s failover.`,
          }
        : {
            service: `Amazon RDS for ${DB_LABEL[p.database]}`,
            reason: 'Traffic and availability targets are met by RDS at a lower price point than Aurora. Multi-AZ can be enabled when required.',
          }
  }
}

function scoreStrategies(p: InfrastructureProfile): Record<MigrationStrategy, number> {
  const s: Record<MigrationStrategy, number> = { Rehost: 1, Replatform: 1, Refactor: 1 }
  const highAvail = p.availability === '99.99' || p.availability === '99.999'

  if (p.workloadType === 'legacy') s.Rehost += 3
  if (p.database === 'oracle' || p.database === 'sqlserver') s.Rehost += 2
  if (p.budgetUsd < 5000) s.Rehost += 2
  if (p.os === 'windows') s.Rehost += 1

  if (p.database === 'mysql' || p.database === 'postgresql') s.Replatform += 3
  if (p.trafficPattern !== 'steady') {
    s.Replatform += 1
    s.Refactor += 1
  }
  if (p.workloadType === 'analytics' || p.workloadType === 'batch') s.Replatform += 2
  if (p.storageTb > 2) s.Replatform += 1

  if (p.containerized) s.Refactor += 3
  if (p.database === 'mongodb') s.Refactor += 2
  if (highAvail) {
    s.Refactor += 2
    s.Replatform += 1
  }
  if (p.performance === 'high') s.Refactor += 1
  if (p.workloadType === 'api' || p.workloadType === 'web') s.Refactor += 1
  if (p.budgetUsd > 25_000) s.Refactor += 1

  return s
}

function selectDataMigration(p: InfrastructureProfile) {
  const tb = p.storageTb
  if (p.edgeEnvironment)
    return {
      method: 'AWS Snowball Edge',
      reason:
        'Edge / disconnected environment: Snowball Edge provides local compute and storage and ships data offline, avoiding dependence on a reliable WAN link.',
      estimatedDays: 10,
    }
  if (tb >= 500)
    return {
      method: 'AWS Snowmobile',
      reason: `${tb} TB is exabyte-class. Snowmobile moves up to 100 PB per shipping-container appliance; online transfer would take years.`,
      estimatedDays: 45,
    }
  if (tb >= 10 || (p.lowBandwidth && tb >= 1))
    return {
      method: 'AWS Snowball',
      reason: `${tb} TB over ${p.lowBandwidth ? 'a constrained link' : 'the internet'} would take ${Math.ceil((tb * 1024 * 8) / (p.lowBandwidth ? 100 : 1000) / 3600 / 24 / 0.7)} days. Snowball ships 80 TB per device in about a week.`,
      estimatedDays: 8,
    }
  const gbps = p.lowBandwidth ? 0.1 : 1
  const days = Math.max(1, Math.ceil((tb * 1024 * 8) / gbps / 3600 / 24 / 0.7))
  return {
    method: 'AWS DataSync + S3 Transfer Acceleration',
    reason: `${tb} TB transfers online in ~${days} day${days > 1 ? 's' : ''} at ${gbps} Gbps with DataSync handling verification, scheduling and incremental sync.`,
    estimatedDays: days,
  }
}

export function analyseMigration(p: InfrastructureProfile): MigrationPlan {
  const scores = scoreStrategies(p)
  const strategy = (Object.keys(scores) as MigrationStrategy[]).reduce((a, b) =>
    scores[b] > scores[a] ? b : a,
  )
  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  const confidence = Math.round((scores[strategy] / total) * 100)

  const reasons: string[] = []
  if (strategy === 'Rehost') {
    reasons.push('Legacy workload with tight coupling — lift-and-shift minimises change risk.')
    if (p.database === 'oracle' || p.database === 'sqlserver')
      reasons.push(`${DB_LABEL[p.database]} moves to RDS keeping full engine compatibility.`)
    if (p.budgetUsd < 5000) reasons.push('Constrained budget favours minimal re-engineering effort.')
  }
  if (strategy === 'Replatform') {
    reasons.push('Managed services (RDS/Aurora, ALB, Auto Scaling) deliver most cloud benefit without rewriting code.')
    if (p.database === 'mysql' || p.database === 'postgresql')
      reasons.push(`Open-source ${DB_LABEL[p.database]} is a direct fit for Amazon Aurora / RDS.`)
    if (p.trafficPattern !== 'steady')
      reasons.push(`${p.trafficPattern[0].toUpperCase() + p.trafficPattern.slice(1)} traffic benefits from elastic Auto Scaling.`)
  }
  if (strategy === 'Refactor') {
    if (p.containerized) reasons.push('Already containerised — ECS on Fargate removes host management entirely.')
    if (p.database === 'mongodb') reasons.push('Document workload maps naturally to DynamoDB with Streams for events.')
    if (p.availability === '99.99' || p.availability === '99.999')
      reasons.push(`${p.availability}% availability is most economical with cloud-native, multi-AZ services.`)
  }

  const db = selectDatabaseTarget(p, strategy)

  const compute =
    strategy === 'Refactor' && p.containerized
      ? {
          service: 'Amazon ECS on AWS Fargate',
          reason: 'Serverless containers with per-task scaling; no EC2 fleet to patch.',
        }
      : {
          service: 'Amazon EC2 + Auto Scaling',
          reason: `${p.servers} servers at ${p.avgCpuUtil}% CPU right-size to fewer, elastic instances behind an ALB.`,
        }

  const mappings: ServiceMapping[] = [
    {
      source: `${p.servers} × ${p.os === 'windows' ? 'Windows' : 'Linux'} servers (${p.vcpusPerServer} vCPU / ${p.ramGbPerServer} GB)`,
      target: compute.service,
      service: compute.service,
      category: 'compute',
      reason: compute.reason,
    },
  ]
  if (p.database !== 'none') {
    mappings.push({
      source: `${DB_LABEL[p.database]} (${p.dbSizeGb >= 1024 ? `${(p.dbSizeGb / 1024).toFixed(1)} TB` : `${p.dbSizeGb} GB`})`,
      target: db.service,
      service: db.service,
      category: 'database',
      reason: db.reason,
    })
  }
  mappings.push({
    source: `${p.storageTb} TB file / object storage`,
    target: 'Amazon S3 with Lifecycle → S3-IA → Glacier',
    service: 'Amazon S3',
    category: 'storage',
    reason: 'Eleven-nines durability. Lifecycle rules tier infrequently accessed data to cut storage cost by up to 70%.',
  })
  if (p.servers > 1) {
    mappings.push({
      source: 'Shared NFS / SAN volumes',
      target: 'Amazon EFS + EBS gp3',
      service: 'Amazon EFS',
      category: 'storage',
      reason: 'EFS gives shared POSIX storage across instances; EBS gp3 provides per-instance block volumes.',
    })
  }
  mappings.push({
    source: 'Hardware load balancer / reverse proxy',
    target: 'Application Load Balancer + CloudFront',
    service: 'Elastic Load Balancing',
    category: 'network',
    reason: 'ALB handles L7 routing and health checks; CloudFront caches static content at 400+ edge locations.',
  })
  mappings.push({
    source: 'Perimeter firewall / VLANs',
    target: 'VPC, Security Groups, WAF + Shield',
    service: 'Amazon VPC',
    category: 'security',
    reason: 'Public/private subnet isolation, stateful security groups and managed WAF rules replace appliance firewalls.',
  })
  if (p.workloadType === 'batch' || p.workloadType === 'analytics') {
    mappings.push({
      source: 'Cron jobs / batch schedulers',
      target: 'Amazon SQS + Step Functions',
      service: 'AWS Step Functions',
      category: 'messaging',
      reason: 'Decoupled queues and durable state machines replace fragile cron chains.',
    })
  }
  mappings.push({
    source: 'Nagios / manual log review',
    target: 'CloudWatch + CloudTrail + AWS Config',
    service: 'Amazon CloudWatch',
    category: 'ops',
    reason: 'Unified metrics, alarms, audit trail and compliance drift detection.',
  })

  const dataMigration = selectDataMigration(p)
  const dbMigration =
    p.database === 'none'
      ? { method: 'Not required', reason: 'No database tier present.' }
      : p.database === 'redis'
        ? {
            method: 'ElastiCache Online Migration',
            reason: 'Replicates from the self-hosted Redis primary with minimal downtime.',
          }
        : {
            method:
              strategy === 'Refactor' && (p.database === 'oracle' || p.database === 'sqlserver')
                ? 'AWS SCT + AWS DMS (CDC)'
                : 'AWS DMS with Change Data Capture',
            reason: `Continuous replication keeps source and target in sync so cutover downtime fits inside the ${p.rtoMinutes}-minute RTO window.`,
          }

  const serverMigration = p.containerized
    ? {
        method: 'Container image push → Amazon ECR → ECS',
        reason: 'Existing images are re-tagged and deployed; no OS-level migration needed.',
      }
    : {
        method: 'AWS Application Migration Service (MGN)',
        reason:
          'Successor to AWS Server Migration Service. Block-level replication of live servers into AWS with test/cutover launch templates.',
      }

  const connectivity =
    p.dbSizeGb > 1024 || p.storageTb > 5 || p.security === 'high'
      ? {
          method: 'AWS Direct Connect (1 Gbps) + VPN backup',
          reason: 'Dedicated private link for hybrid operation during phased migration and ongoing replication.',
        }
      : {
          method: 'AWS Site-to-Site VPN',
          reason: 'Encrypted IPsec tunnel is sufficient for the data volume and provides hybrid connectivity during cutover.',
        }

  const phases = [
    {
      title: 'Assess',
      duration: '2 weeks',
      tasks: ['Discovery with AWS Application Discovery Service', 'Dependency mapping', 'TCO baseline'],
    },
    {
      title: 'Mobilise',
      duration: '3 weeks',
      tasks: ['Landing zone (VPC, IAM, KMS)', `${connectivity.method.split(' (')[0]} setup`, 'Terraform modules'],
    },
    {
      title: 'Migrate — Pilot',
      duration: '4 weeks',
      tasks: [`${dbMigration.method} continuous replication`, `${dataMigration.method}`, `${serverMigration.method.split(' →')[0]} test launch`],
    },
    {
      title: 'Cutover',
      duration: '1 week',
      tasks: ['Route 53 weighted shift', 'DMS final sync', 'Rollback plan on standby'],
    },
    {
      title: 'Optimise',
      duration: 'Ongoing',
      tasks: ['Right-size with Compute Optimizer', 'S3 lifecycle tuning', 'Well-Architected review'],
    },
  ]

  return {
    strategy,
    confidence,
    strategyScores: scores,
    reasons,
    mappings,
    dataMigration,
    dbMigration,
    serverMigration,
    connectivity,
    phases,
  }
}
