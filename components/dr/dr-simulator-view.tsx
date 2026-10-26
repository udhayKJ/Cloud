'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  Server,
  Database,
  Layers,
  Globe,
  CheckCircle2,
  XCircle,
  Timer,
  HardDrive,
  Activity,
  ArrowRight,
  Clock,
  RotateCcw,
  Loader2,
  Zap,
} from 'lucide-react'
import { useAnalysis, useActiveProject, useProjectStore } from '@/lib/store'
import {
  PageHeader,
  Section,
  Pill,
  MetricCard,
  Stagger,
  NextStep,
  Callout,
  TIER_LABEL,
  buttonClass,
} from '@/components/shared/primitives'
import { simulateFailure, SCENARIOS, formatMinutes } from '@/lib/engine'
import type { FailureScenario, Tier } from '@/lib/types'
import { cn } from '@/lib/utils'

type Phase = 'idle' | 'running' | 'done'

const STEP_INTERVAL_MS = 900

const SCENARIO_ICONS: Record<FailureScenario, typeof Server> = {
  ec2: Server,
  database: Database,
  az: Layers,
  application: Activity,
  region: Globe,
}

function formatSeconds(sec: number) {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s ? `${m}m ${s}s` : `${m}m`
}

export function DrSimulatorView() {
  const analysis = useAnalysis()
  const profile = useActiveProject()
  const advanceStatus = useProjectStore((s) => s.advanceStatus)
  const { architectures, recommendedIndex } = analysis
  const [selectedTier, setSelectedTier] = useState<Tier>(architectures[recommendedIndex]?.tier || 'balanced')
  const [selectedScenario, setSelectedScenario] = useState<FailureScenario>('database')
  const [phase, setPhase] = useState<Phase>('idle')
  const [completedSteps, setCompletedSteps] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentArch = architectures.find((a) => a.tier === selectedTier) || architectures[recommendedIndex]
  const simResult = useMemo(() => simulateFailure(profile, currentArch, selectedScenario), [profile, currentArch, selectedScenario])

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
  }

  // Any change to what is being simulated resets the run; also clean up on unmount.
  useEffect(() => {
    stopTimer()
    setPhase('idle')
    setCompletedSteps(0)
  }, [selectedScenario, selectedTier, profile.id])
  useEffect(() => stopTimer, [])

  function runSimulation() {
    stopTimer()
    setPhase('running')
    setCompletedSteps(0)
    const total = simResult.steps.length
    let done = 0
    timer.current = setInterval(() => {
      done++
      setCompletedSteps(done)
      if (done >= total) {
        stopTimer()
        setPhase('done')
        advanceStatus(profile.id, 'simulated')
      }
    }, STEP_INTERVAL_MS)
  }

  const elapsedSec = simResult.steps.slice(0, completedSteps).reduce((a, s) => a + s.durationSec, 0)
  const passed = simResult.meetsRto && simResult.meetsRpo

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Step 05 · Disaster recovery"
        title="Disaster recovery simulator"
        description="Pick a failure and an architecture option, inject the fault, and watch the automated recovery workflow run step by step. Recovery time and data loss are measured against your targets."
        actions={
          <Link href="/security" className={buttonClass('primary')}>
            Security analysis
            <ArrowRight />
          </Link>
        }
      />

      <Section title="1. Choose a failure scenario" bodyClassName="p-4">
        <div role="radiogroup" aria-label="Failure scenario" className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {SCENARIOS.map((sc) => {
            const isSelected = selectedScenario === sc.id
            const Icon = SCENARIO_ICONS[sc.id] || Server
            return (
              <button
                key={sc.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={phase === 'running'}
                onClick={() => setSelectedScenario(sc.id)}
                title={sc.description}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 md:p-4',
                  isSelected
                    ? 'border-destructive/60 bg-destructive/[0.07] shadow-[0_0_0_1px_var(--destructive)_inset]'
                    : 'border-border bg-background/40 hover:border-foreground/20 hover:bg-accent/40',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg transition-colors',
                    isSelected ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="text-xs font-semibold leading-snug md:text-sm">{sc.title}</span>
                <span className="hidden text-[11px] leading-snug text-muted-foreground md:block">{sc.blast}</span>
              </button>
            )
          })}
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="2. Inject the fault" description="Simulate against one of the generated architectures.">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span id="dr-tier-label" className="text-xs font-medium text-foreground/80">
                Architecture option
              </span>
              <div role="radiogroup" aria-labelledby="dr-tier-label" className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-background/40 p-1">
                {architectures.map((a, idx) => (
                  <button
                    key={a.tier}
                    type="button"
                    role="radio"
                    aria-checked={a.tier === selectedTier}
                    disabled={phase === 'running'}
                    onClick={() => setSelectedTier(a.tier)}
                    className={cn(
                      'relative rounded-md px-2 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed',
                      a.tier === selectedTier ? 'bg-card text-foreground shadow ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {TIER_LABEL[a.tier]}
                    {idx === recommendedIndex && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-success" aria-label="recommended" />}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {currentArch.drStrategy} · {currentArch.multiAz ? 'Multi-AZ' : 'Single-AZ'}
                {currentArch.multiRegion ? ' · Multi-region' : ''}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-foreground/80">Components that fail</span>
              <ul className="flex flex-col gap-1.5">
                {simResult.failedComponents.map((fc, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 font-mono text-xs text-destructive">
                    <span className="size-1.5 shrink-0 rounded-full bg-destructive" aria-hidden="true" />
                    {fc}
                  </li>
                ))}
              </ul>
            </div>

            {phase === 'done' ? (
              <button type="button" onClick={runSimulation} className={buttonClass('secondary', 'w-full')}>
                <RotateCcw />
                Run again
              </button>
            ) : (
              <button
                type="button"
                disabled={phase === 'running'}
                onClick={runSimulation}
                className={buttonClass('primary', 'w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-70')}
              >
                {phase === 'running' ? <Loader2 className="animate-spin" /> : <Zap />}
                {phase === 'running' ? 'Recovering…' : 'Inject fault & recover'}
              </button>
            )}
          </div>
        </Section>

        <Section
          title="3. Recovery workflow"
          description="Step Functions runbook executed after the failure is detected."
          className="lg:col-span-2"
          action={
            <span className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-muted-foreground" aria-live="polite">
              <Clock className="size-3.5" />
              {phase === 'idle' ? 'Ready' : `T+${formatSeconds(elapsedSec)}`}
            </span>
          }
        >
          <ol className="relative flex flex-col gap-2.5">
            {simResult.steps.map((step, idx) => {
              const isDone = idx < completedSteps
              const isCurrent = phase === 'running' && idx === completedSteps
              return (
                <motion.li
                  key={`${selectedScenario}-${selectedTier}-${step.id}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                    isCurrent && 'border-primary/60 bg-primary/[0.07]',
                    isDone && 'border-success/25 bg-success/[0.04]',
                    !isCurrent && !isDone && 'border-border bg-background/40',
                    phase === 'running' && !isDone && !isCurrent && 'opacity-50',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold',
                      isDone ? 'bg-success/15 text-success' : isCurrent ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isDone ? <CheckCircle2 className="size-4" /> : isCurrent ? <Loader2 className="size-4 animate-spin" /> : idx + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold">{step.title}</span>
                      <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground">
                        <Timer className="size-3" />
                        {formatSeconds(step.durationSec)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-primary/80">{step.service}</span>
                  </div>
                </motion.li>
              )
            })}
          </ol>
        </Section>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">{phase === 'done' ? 'Measured outcome' : 'Expected outcome'}</h2>
          {phase === 'done' && <Pill tone={passed ? 'success' : 'destructive'}>{passed ? 'Targets met' : 'Targets breached'}</Pill>}
        </div>
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Recovery time (RTO)"
            value={simResult.rtoMinutes}
            format={(n) => formatMinutes(n)}
            hint={`Target ${formatMinutes(profile.rtoMinutes)}`}
            icon={Timer}
            tone={simResult.meetsRto ? 'success' : 'destructive'}
          />
          <MetricCard
            label="Data loss window (RPO)"
            value={simResult.rpoMinutes}
            format={(n) => (Math.round(n * 10) / 10 === 0 ? '0 min' : formatMinutes(n))}
            hint={`Target ${formatMinutes(profile.rpoMinutes)}`}
            icon={Clock}
            tone={simResult.meetsRpo ? 'success' : 'destructive'}
          />
          <MetricCard
            label="Estimated data loss"
            value={simResult.dataLossMb}
            format={(n) => `${Math.round(n).toLocaleString()} MB`}
            hint={simResult.dataLossMb === 0 ? 'No data lost' : 'Writes since last replication'}
            icon={HardDrive}
            tone={simResult.dataLossMb === 0 ? 'success' : 'warning'}
          />
          <MetricCard
            label="Users affected"
            value={simResult.availabilityImpactPct}
            format={(n) => `${Math.round(n)}%`}
            hint={`Recovered by ${simResult.recoveredBy}`}
            icon={Activity}
            tone={simResult.availabilityImpactPct <= 5 ? 'success' : simResult.availabilityImpactPct < 100 ? 'warning' : 'destructive'}
          />
        </Stagger>

        <Callout
          tone={passed ? 'success' : 'warning'}
          icon={passed ? CheckCircle2 : XCircle}
          title={`${simResult.title} on ${currentArch.name}: RTO ${simResult.meetsRto ? 'met' : 'breached'}, RPO ${simResult.meetsRpo ? 'met' : 'breached'}`}
        >
          {simResult.narrative}
        </Callout>
      </div>

      <NextStep
        prev={{ href: '/cost', label: 'Cost analysis' }}
        href="/security"
        label="Review security posture"
        description="Check controls across identity, encryption, network, edge and audit."
      />
    </div>
  )
}
