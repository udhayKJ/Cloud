'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  Siren,
  Server,
  Database,
  Layers,
  Globe,
  Play,
  CheckCircle2,
  AlertTriangle,
  Timer,
  HardDrive,
  Activity,
  ArrowRight,
  ShieldAlert,
  Clock
} from 'lucide-react'
import { useAnalysis, useActiveProject } from '@/lib/store'
import { PageHeader, Section, Pill, MetricCard, Stagger } from '@/components/shared/primitives'
import { simulateFailure, SCENARIOS } from '@/lib/engine'
import { formatMinutes } from '@/lib/engine'
import type { FailureScenario, DrSimulationResult } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DrSimulatorView() {
  const analysis = useAnalysis()
  const profile = useActiveProject()
  const { architectures, recommendedIndex } = analysis
  const [selectedTier, setSelectedTier] = useState<string>(architectures[recommendedIndex]?.tier || 'balanced')
  const [selectedScenario, setSelectedScenario] = useState<FailureScenario>('database')
  const [simulating, setSimulating] = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  const currentArch = architectures.find((a) => a.tier === selectedTier) || architectures[recommendedIndex]

  const simResult: DrSimulationResult = simulateFailure(profile, currentArch, selectedScenario)

  function runSimulation() {
    setSimulating(true)
    setActiveStepIndex(0)

    let current = 0
    const interval = setInterval(() => {
      current++
      if (current >= simResult.steps.length) {
        clearInterval(interval)
        setSimulating(false)
      }
      setActiveStepIndex(current)
    }, 900)
  }

  const scenarioIcons: Record<FailureScenario, typeof Server> = {
    ec2: Server,
    database: Database,
    az: Layers,
    application: Activity,
    region: Globe,
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Step 05 · Disaster Recovery Simulator"
        title="Fault Injection & DR Simulation Engine"
        description="Simulate real-world infrastructure failures, validate Step Functions recovery workflows, and measure RTO / RPO resilience."
        actions={
          <Link
            href="/security"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Security Analysis
            <ArrowRight className="size-4" />
          </Link>
        }
      />

      {/* Scenario Selector & Tier Selector */}
      <div className="grid gap-4 md:grid-cols-5">
        {SCENARIOS.map((sc) => {
          const isSelected = selectedScenario === sc.id
          const Icon = scenarioIcons[sc.id] || Server
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => {
                setSelectedScenario(sc.id)
                setActiveStepIndex(simResult.steps.length)
              }}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
                isSelected
                  ? 'border-danger bg-danger/10 ring-2 ring-danger/40 shadow-lg shadow-danger/10'
                  : 'border-border bg-card hover:bg-accent/40'
              )}
            >
              <div className={cn('flex size-10 items-center justify-center rounded-lg', isSelected ? 'bg-danger text-danger-foreground' : 'bg-muted text-muted-foreground')}>
                <Icon className="size-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">{sc.title}</span>
            </button>
          )
        })}
      </div>

      {/* Metrics Banner */}
      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Achieved RTO (Recovery Time)"
          value={simResult.rtoMinutes}
          format={(n) => formatMinutes(n)}
          hint={`Target: ${formatMinutes(profile.rtoMinutes)}`}
          icon={Timer}
          tone={simResult.meetsRto ? 'success' : 'danger'}
        />
        <MetricCard
          label="Achieved RPO (Data Loss Window)"
          value={simResult.rpoMinutes}
          format={(n) => formatMinutes(n)}
          hint={`Target: ${formatMinutes(profile.rpoMinutes)}`}
          icon={Clock}
          tone={simResult.meetsRpo ? 'success' : 'danger'}
        />
        <MetricCard
          label="Estimated Data Loss"
          value={simResult.dataLossMb}
          format={(n) => (n === 0 ? '0 MB (Zero Loss)' : `${n} MB`)}
          hint="Replication delta at crash"
          icon={HardDrive}
          tone={simResult.dataLossMb === 0 ? 'success' : 'warning'}
        />
        <MetricCard
          label="Availability Impact"
          value={simResult.availabilityImpactPct}
          format={(n) => `${n}%`}
          hint={`Recovered by ${simResult.recoveredBy.split(' ')[0]}`}
          icon={Activity}
          tone={simResult.availabilityImpactPct <= 5 ? 'success' : 'warning'}
        />
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Simulation Control & Failed Components */}
        <Section title="Failure Injection Control" description="Trigger live scenario failure.">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 rounded-lg border border-danger/30 bg-danger/5 p-3.5">
              <div className="flex items-center gap-2 text-danger font-semibold text-xs uppercase tracking-wider">
                <ShieldAlert className="size-4" />
                <span>Simulated Target</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{simResult.title}</span>
              <span className="text-xs text-muted-foreground mt-1">Tier: {currentArch.name} ({currentArch.drStrategy})</span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Affected Components</span>
              <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                {simResult.failedComponents.map((fc, i) => (
                  <li key={i} className="flex items-center gap-2 rounded bg-muted/40 px-2.5 py-1.5 font-mono text-danger">
                    <span className="size-1.5 rounded-full bg-danger" />
                    {fc}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              type="button"
              disabled={simulating}
              onClick={runSimulation}
              className="mt-2 w-full gap-2 bg-danger text-danger-foreground hover:bg-danger/90 font-semibold"
            >
              <Play className={cn('size-4', simulating && 'animate-spin')} />
              {simulating ? 'Simulating Recovery Workflow...' : 'Inject Fault & Run Recovery'}
            </Button>
          </div>
        </Section>

        {/* Step Functions Recovery Workflow Timeline */}
        <Section
          title="AWS Step Functions Recovery Workflow"
          description="Automated orchestration state machine execution sequence."
          className="lg:col-span-2"
        >
          <div className="flex flex-col gap-3">
            {simResult.steps.map((step, idx) => {
              const isDone = idx <= activeStepIndex || !simulating
              const isCurrent = idx === activeStepIndex && simulating
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3.5 transition-all',
                    isCurrent
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
                      : isDone
                      ? 'border-border bg-card'
                      : 'border-border/40 bg-muted/20 opacity-40'
                  )}
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-mono text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{step.title}</span>
                      <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        {step.durationSec}s
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                    <span className="font-mono text-[10px] text-primary/80 uppercase tracking-wider">{step.service}</span>
                  </div>
                  {isDone && <CheckCircle2 className="size-4 shrink-0 text-success" />}
                </motion.div>
              )
            })}
          </div>
        </Section>
      </div>

      {/* Operational Narrative */}
      <Section title="Resilience & Recovery Evaluation Narrative" description="Architectural analysis of disaster recovery performance.">
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <CheckCircle2 className="size-4 text-success" />
            <span>Resilience Assessment Outcome</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
            {simResult.narrative}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 pt-2 border-t border-border text-xs text-muted-foreground">
            <span>Recovery Mechanism: <strong className="text-foreground">{simResult.recoveredBy}</strong></span>
            <span>•</span>
            <span>RTO Compliance: <strong className={simResult.meetsRto ? 'text-success' : 'text-danger'}>{simResult.meetsRto ? 'MET' : 'BREACHED'}</strong></span>
            <span>•</span>
            <span>RPO Compliance: <strong className={simResult.meetsRpo ? 'text-success' : 'text-danger'}>{simResult.meetsRpo ? 'MET' : 'BREACHED'}</strong></span>
          </div>
        </div>
      </Section>
    </div>
  )
}
