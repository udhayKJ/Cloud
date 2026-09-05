export type Level = 'low' | 'medium' | 'high'
export type DatabaseType =
  | 'mysql'
  | 'postgresql'
  | 'oracle'
  | 'sqlserver'
  | 'mongodb'
  | 'redis'
  | 'none'
export type WorkloadType = 'web' | 'api' | 'batch' | 'analytics' | 'legacy'
export type TrafficPattern = 'steady' | 'spiky' | 'seasonal'
export type AvailabilityTarget = '99' | '99.9' | '99.99' | '99.999'
export type ProjectStatus = 'draft' | 'analysed' | 'simulated'

export interface Priorities {
  cost: number
  availability: number
  security: number
  performance: number
}

export interface InfrastructureProfile {
  id: string
  name: string
  industry: string
  description: string
  createdAt: string
  status: ProjectStatus

  // Compute
  servers: number
  vcpusPerServer: number
  ramGbPerServer: number
  avgCpuUtil: number
  avgMemUtil: number
  os: 'linux' | 'windows'
  containerized: boolean

  // Data
  database: DatabaseType
  dbSizeGb: number
  readHeavy: boolean
  storageTb: number

  // Traffic
  monthlyUsers: number
  peakRps: number
  trafficPattern: TrafficPattern
  workloadType: WorkloadType

  // Environment
  edgeEnvironment: boolean
  lowBandwidth: boolean

  // Business requirements
  budgetUsd: number
  availability: AvailabilityTarget
  rtoMinutes: number
  rpoMinutes: number
  performance: Level
  security: Level
  compliance: string[]

  priorities: Priorities
}

export type MigrationStrategy = 'Rehost' | 'Replatform' | 'Refactor'

export interface ServiceMapping {
  source: string
  target: string
  service: string
  category: ComponentCategory
  reason: string
}

export interface MigrationPlan {
  strategy: MigrationStrategy
  confidence: number
  strategyScores: Record<MigrationStrategy, number>
  reasons: string[]
  mappings: ServiceMapping[]
  dataMigration: { method: string; reason: string; estimatedDays: number }
  dbMigration: { method: string; reason: string }
  serverMigration: { method: string; reason: string }
  connectivity: { method: string; reason: string }
  phases: { title: string; duration: string; tasks: string[] }[]
}

export type ComponentCategory =
  | 'compute'
  | 'database'
  | 'storage'
  | 'network'
  | 'security'
  | 'ops'
  | 'messaging'
  | 'edge'
  | 'migration'

export interface ArchComponent {
  id: string
  service: string
  category: ComponentCategory
  detail: string
  monthlyCost: number
  reason: string
}

export type Tier = 'low-cost' | 'balanced' | 'enterprise'
export type DrStrategy =
  | 'Backup & Restore'
  | 'Pilot Light'
  | 'Warm Standby'
  | 'Multi-Site Active/Active'

export interface CostBreakdown {
  compute: number
  database: number
  storage: number
  network: number
  security: number
  ops: number
  total: number
}

export interface WellArchitectedScores {
  security: number
  reliability: number
  performance: number
  cost: number
  operations: number
}

export interface ArchitectureOption {
  tier: Tier
  name: string
  tagline: string
  components: ArchComponent[]
  cost: CostBreakdown
  multiAz: boolean
  multiRegion: boolean
  autoScaling: boolean
  readReplicas: number
  instanceCount: number
  maxInstances: number
  instanceType: string
  databaseService: string
  drStrategy: DrStrategy
  rtoMinutes: number
  rpoMinutes: number
  availabilityPct: number
  wellArchitected: WellArchitectedScores
  weightedScore: number
  meets: { rto: boolean; rpo: boolean; availability: boolean; budget: boolean }
}

export type ControlStatus = 'enabled' | 'partial' | 'missing'
export type Severity = 'critical' | 'high' | 'medium' | 'low'

export interface SecurityControl {
  id: string
  name: string
  service: string
  pillar: 'identity' | 'encryption' | 'network' | 'edge' | 'audit'
  status: ControlStatus
  severity: Severity
  description: string
}

export interface SecurityReport {
  score: number
  controls: SecurityControl[]
  findings: { title: string; severity: Severity; recommendation: string }[]
}

export type FailureScenario = 'ec2' | 'database' | 'az' | 'application' | 'region'

export interface DrStep {
  id: string
  title: string
  service: string
  durationSec: number
  description: string
}

export interface DrSimulationResult {
  scenario: FailureScenario
  title: string
  steps: DrStep[]
  rtoMinutes: number
  rpoMinutes: number
  dataLossMb: number
  availabilityImpactPct: number
  recovered: boolean
  failedComponents: string[]
  recoveredBy: string
  meetsRto: boolean
  meetsRpo: boolean
  narrative: string
}

export interface Analysis {
  profile: InfrastructureProfile
  migration: MigrationPlan
  architectures: ArchitectureOption[]
  recommendedIndex: number
  security: SecurityReport
}
