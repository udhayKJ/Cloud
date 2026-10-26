import type { InfrastructureProfile, MigrationPlan, ArchitectureOption, SecurityReport, DrSimulationResult, FailureScenario } from './types'
import { analyseProject } from './engine'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export async function fetchProjectsFromBackend(): Promise<InfrastructureProfile[] | null> {
  try {
    const res = await fetch(`${API_BASE}/projects`, { method: 'GET', signal: AbortSignal.timeout(3000) })
    if (res.ok) return await res.json()
  } catch (e) {
    // Graceful offline fallback
  }
  return null
}

export async function syncProjectToBackend(profile: InfrastructureProfile): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
      signal: AbortSignal.timeout(3000)
    })
    return res.ok
  } catch (e) {
    return false
  }
}

export async function askAIExplanation(question: string, profile: InfrastructureProfile, tier: string = 'balanced'): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: profile, question, tier }),
      signal: AbortSignal.timeout(4000)
    })
    if (res.ok) {
      const data = await res.json()
      return data.explanation
    }
  } catch (e) {
    // Offline heuristic explanation
  }
  return `CloudShift AI Heuristic: Based on ${profile.servers} servers and ${profile.database.toUpperCase()} with ${profile.trafficPattern} traffic, the deterministic engine recommended this tier to achieve ${profile.availability}% availability and an RTO of ${profile.rtoMinutes} minutes.`
}

export async function runBackendDrSimulation(
  profile: InfrastructureProfile,
  scenario: FailureScenario,
  tier: string = 'balanced'
): Promise<DrSimulationResult | null> {
  try {
    const res = await fetch(`${API_BASE}/dr/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: profile, scenario, tier }),
      signal: AbortSignal.timeout(4000)
    })
    if (res.ok) return await res.json()
  } catch (e) {
    // Fallback handled locally by store/engine
  }
  return null
}
