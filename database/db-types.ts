/**
 * CloudShift AI: TypeScript Database Interfaces & Converters
 * Bridges PostgreSQL Snake_Case Records with Frontend CamelCase Types
 */

import type {
  InfrastructureProfile,
  MigrationPlan,
  ArchitectureOption,
  ArchComponent,
  DRSimulationResult,
  SecurityReport,
  ProjectStatus,
  DatabaseType,
  TrafficPattern,
  WorkloadType,
  AvailabilityTarget,
  Level,
} from '@/lib/types'

// 1. Raw PostgreSQL Table Row Definitions
export interface DBProjectRow {
  id: string
  user_id: string | null
  name: string
  industry: string
  description: string
  status: ProjectStatus
  servers: number
  vcpus_per_server: number
  ram_gb_per_server: number
  avg_cpu_util: number
  avg_mem_util: number
  os: 'linux' | 'windows'
  containerized: boolean
  database_type: DatabaseType
  db_size_gb: number
  read_heavy: boolean
  storage_tb: number
  monthly_users: number
  peak_rps: number
  traffic_pattern: TrafficPattern
  workload_type: WorkloadType
  edge_environment: boolean
  low_bandwidth: boolean
  budget_usd: number
  availability: AvailabilityTarget
  rto_minutes: number
  rpo_minutes: number
  performance: Level
  security: Level
  compliance: string[]
  priority_cost: number
  priority_availability: number
  priority_security: number
  priority_performance: number
  created_at: string
  updated_at: string
}

// 2. Converters: PostgreSQL Row <--> Frontend InfrastructureProfile
export function mapDBRowToProfile(row: DBProjectRow): InfrastructureProfile {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    description: row.description,
    createdAt: row.created_at,
    status: row.status,
    servers: Number(row.servers),
    vcpusPerServer: Number(row.vcpus_per_server),
    ramGbPerServer: Number(row.ram_gb_per_server),
    avgCpuUtil: Number(row.avg_cpu_util),
    avgMemUtil: Number(row.avg_mem_util),
    os: row.os,
    containerized: Boolean(row.containerized),
    database: row.database_type,
    dbSizeGb: Number(row.db_size_gb),
    readHeavy: Boolean(row.read_heavy),
    storageTb: Number(row.storage_tb),
    monthlyUsers: Number(row.monthly_users),
    peakRps: Number(row.peak_rps),
    trafficPattern: row.traffic_pattern,
    workloadType: row.workload_type,
    edgeEnvironment: Boolean(row.edge_environment),
    lowBandwidth: Boolean(row.low_bandwidth),
    budgetUsd: Number(row.budget_usd),
    availability: row.availability,
    rtoMinutes: Number(row.rto_minutes),
    rpoMinutes: Number(row.rpo_minutes),
    performance: row.performance,
    security: row.security,
    compliance: Array.isArray(row.compliance) ? row.compliance : [],
    priorities: {
      cost: Number(row.priority_cost),
      availability: Number(row.priority_availability),
      security: Number(row.priority_security),
      performance: Number(row.priority_performance),
    },
  }
}

export function mapProfileToDBRow(profile: InfrastructureProfile, userId?: string): Partial<DBProjectRow> {
  return {
    id: profile.id,
    user_id: userId ?? null,
    name: profile.name,
    industry: profile.industry,
    description: profile.description,
    status: profile.status,
    servers: profile.servers,
    vcpus_per_server: profile.vcpusPerServer,
    ram_gb_per_server: profile.ramGbPerServer,
    avg_cpu_util: profile.avgCpuUtil,
    avg_mem_util: profile.avgMemUtil,
    os: profile.os,
    containerized: profile.containerized,
    database_type: profile.database,
    db_size_gb: profile.dbSizeGb,
    read_heavy: profile.readHeavy,
    storage_tb: profile.storageTb,
    monthly_users: profile.monthlyUsers,
    peak_rps: profile.peakRps,
    traffic_pattern: profile.trafficPattern,
    workload_type: profile.workloadType,
    edge_environment: profile.edgeEnvironment,
    low_bandwidth: profile.lowBandwidth,
    budget_usd: profile.budgetUsd,
    availability: profile.availability,
    rto_minutes: profile.rtoMinutes,
    rpo_minutes: profile.rpoMinutes,
    performance: profile.performance,
    security: profile.security,
    compliance: profile.compliance,
    priority_cost: profile.priorities.cost,
    priority_availability: profile.priorities.availability,
    priority_security: profile.priorities.security,
    priority_performance: profile.priorities.performance,
  }
}
