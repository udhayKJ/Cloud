import type {
  ArchComponent,
  ArchitectureOption,
  CostBreakdown,
  DrStrategy,
  InfrastructureProfile,
  MigrationPlan,
  Tier,
  WellArchitectedScores,
} from '@/lib/types'
import { selectDatabaseTarget } from './migration'

const INSTANCE_PRICES: Record<string, number> = {
  't3.medium': 30,
  'm5.large': 70,
  'm5.xlarge': 140,
  'm5.2xlarge': 280,
  'm5.4xlarge': 560,
  'c5.large': 62,
  'c5.xlarge': 124,
  'c5.2xlarge': 248,
  'c5.4xlarge': 496,
  'r5.large': 92,
  'r5.xlarge': 184,
  'r5.2xlarge': 368,
  'r5.4xlarge': 736,
}

const AVAIL_TARGET: Record<InfrastructureProfile['availability'], number> = {
  '99': 99,
  '99.9': 99.9,
  '99.99': 99.99,
  '99.999': 99.999,
}

const round = (n: number) => Math.round(n)

function selectInstanceType(p: InfrastructureProfile, tier: Tier) {
  const ratio = p.ramGbPerServer / Math.max(1, p.vcpusPerServer)
  const family = ratio >= 6 ? 'r5' : ratio <= 2 ? 'c5' : 'm5'
  const effectiveVcpu = Math.max(1, p.vcpusPerServer * (Math.max(p.avgCpuUtil, p.avgMemUtil) / 70))
  let size: string
  if (tier === 'low-cost' && effectiveVcpu <= 2) return 't3.medium'
  if (effectiveVcpu <= 2) size = 'large'
  else if (effectiveVcpu <= 4) size = 'xlarge'
  else if (effectiveVcpu <= 8) size = '2xlarge'
  else size = '4xlarge'
  return `${family}.${size}`
}

function instanceCounts(p: InfrastructureProfile, tier: Tier) {
  const utilisation = Math.max(p.avgCpuUtil, p.avgMemUtil) / 100
  const rightSized = Math.max(1, Math.ceil(p.servers * utilisation * 1.15))
  const minByTier: Record<Tier, number> = { 'low-cost': 1, balanced: 2, enterprise: 4 }
  const base = Math.max(minByTier[tier], tier === 'low-cost' ? Math.ceil(rightSized * 0.8) : rightSized)
  const burst = p.trafficPattern === 'steady' ? 1.5 : p.trafficPattern === 'seasonal' ? 2.5 : 3
  return { base, max: Math.ceil(base * burst) }
}

function dbCost(p: InfrastructureProfile, service: string, multiAz: boolean, replicas: number, multiRegion: boolean) {
  if (p.database === 'none') return 0
  const storageGb = p.dbSizeGb
  if (service.includes('DynamoDB')) {
    const requestsM = (p.monthlyUsers * 40) / 1e6
    return round(requestsM * 1.25 + storageGb * 0.25 + (multiRegion ? requestsM * 1.9 : 0))
  }
  if (service.includes('DocumentDB')) return round(200 * (multiAz ? 2 : 1) + storageGb * 0.1)
  if (service.includes('ElastiCache')) return round(110 * (multiAz ? 2 : 1))
  const heavyEngine = service.includes('Oracle') || service.includes('SQL Server')
  const aurora = service.includes('Aurora')
  const instance = aurora ? 210 : heavyEngine ? 380 : storageGb > 500 ? 175 : 125
  const nodes = (multiAz ? 2 : 1) + replicas
  const storage = storageGb * (aurora ? 0.1 : 0.115)
  const global = multiRegion ? (aurora ? instance + storageGb * 0.1 : instance * 2) : 0
  return round(instance * nodes + storage + global)
}

function buildTier(p: InfrastructureProfile, migration: MigrationPlan, tier: Tier): ArchitectureOption {
  const highAvailRequired = p.availability === '99.99' || p.availability === '99.999'
  const multiAz = tier !== 'low-cost'
  const multiRegion = tier === 'enterprise'
  const autoScaling = true
  const readReplicas = tier === 'low-cost' ? 0 : p.readHeavy ? (tier === 'enterprise' ? 2 : 1) : tier === 'enterprise' ? 1 : 0
  const instanceType = selectInstanceType(p, tier)
  const { base, max } = instanceCounts(p, tier)

  const dbTarget = selectDatabaseTarget(p, migration.strategy)
  let databaseService = dbTarget.service
  if (tier === 'enterprise' && databaseService.includes('Aurora')) databaseService = databaseService + ' Global Database'
  if (tier === 'enterprise' && databaseService.includes('DynamoDB')) databaseService = 'Amazon DynamoDB Global Tables'
  if (tier === 'low-cost' && databaseService.includes('Aurora') && p.monthlyUsers < 200_000)
    databaseService = databaseService.replace('Amazon Aurora', 'Amazon RDS for')

  const components: ArchComponent[] = []
  const add = (c: Omit<ArchComponent, 'monthlyCost'> & { monthlyCost?: number }) =>
    components.push({ ...c, monthlyCost: round(c.monthlyCost ?? 0) })

  // Compute
  const computeCost = INSTANCE_PRICES[instanceType] * base * (multiRegion ? 1.5 : 1)
  add({
    id: 'ec2',
    service: 'Amazon EC2',
    category: 'compute',
    detail: `${base}× ${instanceType}${multiRegion ? ' + warm standby fleet' : ''}`,
    monthlyCost: computeCost,
    reason: `Right-sized from ${p.servers} servers at ${p.avgCpuUtil}% CPU utilisation.`,
  })
  add({
    id: 'asg',
    service: 'Auto Scaling',
    category: 'compute',
    detail: `min ${base} / max ${max} across ${multiAz ? 2 : 1} AZ${multiAz ? 's' : ''}`,
    reason: `${p.trafficPattern} traffic — scale on CPU > 70% and ALB request count.`,
  })
  add({
    id: 'ebs',
    service: 'Amazon EBS gp3',
    category: 'storage',
    detail: `${base}× 100 GB root volumes`,
    monthlyCost: base * 8,
    reason: 'Block storage for OS and application binaries.',
  })
  if (p.servers > 1 && tier !== 'low-cost')
    add({
      id: 'efs',
      service: 'Amazon EFS',
      category: 'storage',
      detail: '100 GB shared, Infrequent Access lifecycle',
      monthlyCost: 30,
      reason: 'Shared file system for uploads and session data across instances.',
    })

  // Database
  if (p.database !== 'none') {
    add({
      id: 'db',
      service: databaseService,
      category: 'database',
      detail: `${multiAz ? 'Multi-AZ' : 'Single-AZ'}${readReplicas ? ` + ${readReplicas} read replica${readReplicas > 1 ? 's' : ''}` : ''}${multiRegion ? ' + cross-region' : ''}`,
      monthlyCost: dbCost(p, databaseService, multiAz, readReplicas, multiRegion),
      reason: dbTarget.reason,
    })
    if (databaseService.includes('DynamoDB'))
      add({
        id: 'ddb-streams',
        service: 'DynamoDB Streams',
        category: 'messaging',
        detail: 'Change events → Lambda',
        reason: 'Event-driven processing of item changes.',
      })
  }
  if (tier !== 'low-cost' && (p.workloadType === 'web' || p.workloadType === 'api') && p.database !== 'redis')
    add({
      id: 'cache',
      service: 'Amazon ElastiCache (Redis)',
      category: 'database',
      detail: multiAz ? 'cache.t3.medium × 2, Multi-AZ' : 'cache.t3.medium',
      monthlyCost: multiAz ? 100 : 50,
      reason: 'Offloads read traffic and session state from the database.',
    })

  // Storage
  const gb = p.storageTb * 1024
  const tiering = tier === 'low-cost' ? [0.35, 0.35, 0.3] : tier === 'balanced' ? [0.5, 0.3, 0.2] : [0.6, 0.3, 0.1]
  const s3Cost = gb * (tiering[0] * 0.023 + tiering[1] * 0.0125 + tiering[2] * 0.004) * (multiRegion ? 1.6 : 1)
  add({
    id: 's3',
    service: 'Amazon S3',
    category: 'storage',
    detail: `${p.storageTb} TB · Standard ${tiering[0] * 100}% / IA ${tiering[1] * 100}% / Glacier ${tiering[2] * 100}%${multiRegion ? ' · CRR' : ''}`,
    monthlyCost: s3Cost,
    reason: 'Lifecycle policies move cold data to cheaper tiers automatically.',
  })
  add({
    id: 'backup',
    service: 'AWS Backup',
    category: 'ops',
    detail: multiRegion ? 'Hourly, cross-region copies' : multiAz ? 'Daily + 5-min PITR' : 'Daily snapshots',
    monthlyCost: (p.dbSizeGb + base * 100) * 0.05 * (multiRegion ? 2 : 1),
    reason: 'Centralised backup policy for RDS, EBS and EFS.',
  })

  // Network & edge
  add({
    id: 'vpc',
    service: 'Amazon VPC',
    category: 'network',
    detail: `${multiAz ? 2 : 1} public + ${multiAz ? 2 : 1} private subnets${multiRegion ? ' × 2 regions' : ''}`,
    reason: 'Private subnets isolate compute and data from the internet.',
  })
  add({
    id: 'nat',
    service: 'NAT Gateway',
    category: 'network',
    detail: `${multiAz ? 2 : 1} gateway${multiAz ? 's' : ''}`,
    monthlyCost: 35 * (multiAz ? 2 : 1) * (multiRegion ? 2 : 1),
    reason: 'Outbound internet for patching from private subnets.',
  })
  add({
    id: 'alb',
    service: 'Application Load Balancer',
    category: 'network',
    detail: multiRegion ? '2 regions' : 'Cross-zone enabled',
    monthlyCost: (25 + p.peakRps * 0.02) * (multiRegion ? 2 : 1),
    reason: 'L7 routing, health checks and TLS termination.',
  })
  const cdnCost = tier === 'low-cost' ? 0 : (p.monthlyUsers * 0.25 * 0.085) / 10
  if (tier !== 'low-cost')
    add({
      id: 'cloudfront',
      service: 'Amazon CloudFront',
      category: 'edge',
      detail: 'Global edge cache',
      monthlyCost: cdnCost,
      reason: 'Reduces origin load and latency for static assets.',
    })
  add({
    id: 'route53',
    service: 'Amazon Route 53',
    category: 'network',
    detail: multiRegion ? 'Health-checked failover routing' : 'Hosted zone',
    monthlyCost: multiRegion ? 6 : 1,
    reason: multiRegion ? 'DNS failover to DR region.' : 'Authoritative DNS.',
  })
  if (tier === 'enterprise' || migration.connectivity.method.includes('Direct Connect'))
    add({
      id: 'dx',
      service: tier === 'enterprise' ? 'AWS Direct Connect' : 'Site-to-Site VPN',
      category: 'migration',
      detail: tier === 'enterprise' ? '1 Gbps dedicated' : 'IPsec tunnel',
      monthlyCost: tier === 'enterprise' ? 220 : 36,
      reason: 'Hybrid connectivity to on-premise during and after migration.',
    })
  const dataTransfer = ((p.monthlyUsers * 0.3) / 1000) * 0.09 * 10
  add({
    id: 'dto',
    service: 'Data Transfer Out',
    category: 'network',
    detail: `~${Math.round((p.monthlyUsers * 0.3) / 1000)} GB / month`,
    monthlyCost: dataTransfer,
    reason: 'Estimated at 300 MB per active user.',
  })

  // Security
  add({
    id: 'iam',
    service: 'AWS IAM',
    category: 'security',
    detail: 'Least-privilege roles, MFA',
    reason: 'Instance profiles and service roles replace static credentials.',
  })
  add({
    id: 'sg',
    service: 'Security Groups',
    category: 'security',
    detail: 'ALB → EC2 → DB chain',
    reason: 'Stateful, tier-to-tier allow rules only.',
  })
  if (tier !== 'low-cost' || p.security === 'high')
    add({
      id: 'waf',
      service: 'AWS WAF + Shield',
      category: 'security',
      detail: 'Managed rule groups, rate limiting',
      monthlyCost: 5 + 5 + (p.monthlyUsers * 40) / 1e6 * 0.6,
      reason: 'Blocks OWASP Top-10 attacks and absorbs L3/L4 DDoS.',
    })
  add({
    id: 'kms',
    service: 'AWS KMS',
    category: 'security',
    detail: tier === 'low-cost' ? 'AWS-managed keys' : 'Customer-managed keys, rotation',
    monthlyCost: tier === 'low-cost' ? 0 : 4,
    reason: 'Encryption at rest for EBS, RDS, S3 and EFS.',
  })
  if (tier !== 'low-cost' || p.compliance.length > 0) {
    add({
      id: 'cloudtrail',
      service: 'AWS CloudTrail',
      category: 'security',
      detail: 'Org trail → S3, 7-year retention',
      monthlyCost: 8,
      reason: 'Immutable API audit log.',
    })
    add({
      id: 'config',
      service: 'AWS Config',
      category: 'security',
      detail: `${tier === 'enterprise' ? 25 : 12} conformance rules`,
      monthlyCost: tier === 'enterprise' ? 45 : 22,
      reason: 'Detects public S3 buckets, open security groups and drift.',
    })
  }
  if (tier === 'enterprise')
    add({
      id: 'guardduty',
      service: 'Amazon GuardDuty',
      category: 'security',
      detail: 'Threat detection',
      monthlyCost: 40,
      reason: 'ML-based anomaly detection on CloudTrail, VPC Flow Logs and DNS.',
    })

  // Ops & messaging
  add({
    id: 'cloudwatch',
    service: 'Amazon CloudWatch',
    category: 'ops',
    detail: `${tier === 'low-cost' ? 'Basic' : 'Detailed'} metrics, ${tier === 'enterprise' ? 30 : tier === 'balanced' ? 15 : 6} alarms`,
    monthlyCost: tier === 'enterprise' ? 75 : tier === 'balanced' ? 35 : 12,
    reason: 'CPU > 80% alarm drives Auto Scaling; DR events trigger SNS.',
  })
  add({
    id: 'ssm',
    service: 'AWS Systems Manager',
    category: 'ops',
    detail: 'Patch Manager, Session Manager',
    reason: 'Agentless patching and shell access without SSH keys.',
  })
  if (tier !== 'low-cost') {
    add({
      id: 'sns',
      service: 'Amazon SNS',
      category: 'messaging',
      detail: 'Alerts → email, Slack, dashboard',
      monthlyCost: 1,
      reason: 'Fan-out notifications for alarms and DR events.',
    })
    add({
      id: 'sqs',
      service: 'Amazon SQS',
      category: 'messaging',
      detail: 'Async job queue',
      monthlyCost: 2,
      reason: 'Decouples migration and batch tasks from web tier.',
    })
    add({
      id: 'sfn',
      service: 'AWS Step Functions',
      category: 'messaging',
      detail: 'DR runbook state machine',
      monthlyCost: 3,
      reason: 'Orchestrates failover: verify → promote → restore → redirect.',
    })
  }

  // Cost aggregation
  const sum = (cats: ArchComponent['category'][]) =>
    components.filter((c) => cats.includes(c.category)).reduce((a, c) => a + c.monthlyCost, 0)
  const cost: CostBreakdown = {
    compute: sum(['compute']) + components.filter((c) => c.id === 'ebs' || c.id === 'efs').reduce((a, c) => a + c.monthlyCost, 0),
    database: sum(['database']),
    storage: components.filter((c) => c.id === 's3' || c.id === 'backup').reduce((a, c) => a + c.monthlyCost, 0),
    network: sum(['network', 'edge', 'migration']),
    security: sum(['security']),
    ops: sum(['ops', 'messaging']) - components.filter((c) => c.id === 'backup').reduce((a, c) => a + c.monthlyCost, 0),
    total: 0,
  }
  cost.total = round(cost.compute + cost.database + cost.storage + cost.network + cost.security + cost.ops)

  // DR profile
  let drStrategy: DrStrategy
  let rto: number
  let rpo: number
  let availabilityPct: number
  if (tier === 'low-cost') {
    drStrategy = 'Backup & Restore'
    rto = 240
    rpo = 60
    availabilityPct = 99.5
  } else if (tier === 'balanced') {
    drStrategy = 'Pilot Light'
    rto = 30
    rpo = 5
    availabilityPct = 99.95
  } else {
    drStrategy = p.availability === '99.999' || p.rtoMinutes <= 5 ? 'Multi-Site Active/Active' : 'Warm Standby'
    rto = drStrategy === 'Multi-Site Active/Active' ? 2 : 10
    rpo = 1
    availabilityPct = drStrategy === 'Multi-Site Active/Active' ? 99.999 : 99.99
  }

  // Well-Architected
  const has = (id: string) => components.some((c) => c.id === id)
  const security = Math.min(
    100,
    50 + (has('waf') ? 12 : 0) + (has('kms') && tier !== 'low-cost' ? 8 : 4) + (has('cloudtrail') ? 8 : 0) + (has('config') ? 7 : 0) + (has('guardduty') ? 6 : 0) + 6,
  )
  const reliability = Math.min(100, 38 + (multiAz ? 22 : 0) + (multiRegion ? 15 : 0) + (autoScaling ? 10 : 0) + (readReplicas ? 5 : 0) + 8)
  const performance = Math.min(
    100,
    48 + (has('cloudfront') ? 14 : 0) + (databaseService.includes('Aurora') || databaseService.includes('DynamoDB') ? 12 : 4) + (has('cache') ? 10 : 0) + (readReplicas ? 6 : 0) + 6,
  )
  const budgetRatio = cost.total / Math.max(1, p.budgetUsd)
  const costScore = Math.max(35, Math.min(98, Math.round(100 - (budgetRatio - 0.5) * 55 + (tier === 'low-cost' ? 8 : 0))))
  const operations = Math.min(100, 45 + (has('cloudwatch') ? 18 : 0) + (has('config') ? 8 : 0) + (has('ssm') ? 8 : 0) + (has('sfn') ? 8 : 0) + 10)
  const wellArchitected: WellArchitectedScores = { security, reliability, performance, cost: costScore, operations }

  const w = p.priorities
  let weightedScore =
    (w.cost * costScore + w.availability * reliability + w.security * security + w.performance * performance) /
    Math.max(1, w.cost + w.availability + w.security + w.performance)
  const meets = {
    rto: rto <= p.rtoMinutes,
    rpo: rpo <= p.rpoMinutes,
    availability: availabilityPct >= AVAIL_TARGET[p.availability] - 0.0001,
    budget: cost.total <= p.budgetUsd,
  }
  if (!meets.rto) weightedScore -= 10
  if (!meets.rpo) weightedScore -= 8
  if (!meets.availability) weightedScore -= 10
  if (!meets.budget) weightedScore -= 6 + Math.min(12, (budgetRatio - 1) * 20)
  if (highAvailRequired && !multiAz) weightedScore -= 6

  const names: Record<Tier, { name: string; tagline: string }> = {
    'low-cost': { name: 'Option A · Low Cost', tagline: 'Single-AZ, aggressive lifecycle, minimal managed add-ons.' },
    balanced: { name: 'Option B · Balanced', tagline: 'Multi-AZ, CloudFront, WAF, pilot-light DR region.' },
    enterprise: { name: 'Option C · Enterprise HA', tagline: 'Multi-region, global database, active DR, full compliance stack.' },
  }

  return {
    tier,
    ...names[tier],
    components,
    cost,
    multiAz,
    multiRegion,
    autoScaling,
    readReplicas,
    instanceCount: base,
    maxInstances: max,
    instanceType,
    databaseService,
    drStrategy,
    rtoMinutes: rto,
    rpoMinutes: rpo,
    availabilityPct,
    wellArchitected,
    weightedScore: Math.round(Math.max(0, weightedScore) * 10) / 10,
    meets,
  }
}

export function generateArchitectures(p: InfrastructureProfile, migration: MigrationPlan) {
  const tiers: Tier[] = ['low-cost', 'balanced', 'enterprise']
  const architectures = tiers.map((t) => buildTier(p, migration, t))
  const recommendedIndex = architectures.reduce(
    (best, a, i) => (a.weightedScore > architectures[best].weightedScore ? i : best),
    0,
  )
  return { architectures, recommendedIndex }
}
