import type { Analysis, InfrastructureProfile } from '@/lib/types'
import { analyseMigration } from './migration'
import { generateArchitectures } from './architecture'
import { evaluateSecurity } from './security'

export { analyseMigration, databaseLabel } from './migration'
export { generateArchitectures } from './architecture'
export { evaluateSecurity } from './security'
export { simulateFailure, SCENARIOS } from './dr'

export function analyseProject(profile: InfrastructureProfile): Analysis {
  const migration = analyseMigration(profile)
  const { architectures, recommendedIndex } = generateArchitectures(profile, migration)
  const security = evaluateSecurity(profile, architectures[recommendedIndex])
  return { profile, migration, architectures, recommendedIndex, security }
}

export function formatUsd(n: number, compact = false) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(n)
}

export function formatMinutes(min: number) {
  if (min < 1) return `${Math.round(min * 60)}s`
  if (min < 60) return `${Math.round(min * 10) / 10} min`
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return m ? `${h}h ${m}m` : `${h}h`
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}
