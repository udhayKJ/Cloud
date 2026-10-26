'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  Coins,
  Timer,
  Gauge,
  ShieldCheck,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Server,
  Database,
  HardDrive,
  Users,
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
} from 'lucide-react'
import { useAnalysis, useProjectStore } from '@/lib/store'
import { formatUsd, formatMinutes, formatNumber, databaseLabel } from '@/lib/engine'
import { NAV_ITEMS } from '@/components/shell/nav'
import { STATUS_LABEL } from '@/components/shell/topbar'
import {
  PageHeader,
  MetricCard,
  Stagger,
  Section,
  Pill,
  staggerItem,
  ScoreRing,
  buttonClass,
} from '@/components/shared/primitives'
import { cn } from '@/lib/utils'

const STATUS_TONE = { draft: 'default', analysed: 'info', simulated: 'success' } as const

export function DashboardView() {
  const analysis = useAnalysis()
  const projects = useProjectStore((s) => s.projects)
  const setActive = useProjectStore((s) => s.setActive)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const { profile, architectures, recommendedIndex, migration, security } = analysis
  const rec = architectures[recommendedIndex]
  const waf = rec.wellArchitected
  const wafAvg = Math.round((waf.security + waf.reliability + waf.performance + waf.cost + waf.operations) / 5)
  const steps = NAV_ITEMS.filter((n) => n.step)
  const completed = profile.status === 'simulated' ? 8 : profile.status === 'analysed' ? 4 : 1
  const nextStep = steps[Math.min(completed, steps.length - 1)]

  return (
    <>
      <PageHeader
        eyebrow="Workspace overview"
        title={profile.name}
        description={profile.description || 'Active migration project. Follow the eight-step pipeline from infrastructure profile to final report.'}
        actions={
          <>
            <Link href="/infrastructure" className={buttonClass('secondary')}>
              <Pencil />
              Edit profile
            </Link>
            <Link href="/projects/new" className={buttonClass('primary')}>
              <Plus />
              New project
            </Link>
          </>
        }
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Recommended monthly cost"
          value={rec.cost.total}
          format={(n) => formatUsd(n)}
          hint={`${rec.name} · budget ${formatUsd(profile.budgetUsd)}`}
          icon={Coins}
          tone={rec.meets.budget ? 'primary' : 'warning'}
        />
        <MetricCard
          label="Achievable RTO / RPO"
          value={`${formatMinutes(rec.rtoMinutes)} / ${formatMinutes(rec.rpoMinutes)}`}
          hint={`Target ${formatMinutes(profile.rtoMinutes)} / ${formatMinutes(profile.rpoMinutes)}`}
          icon={Timer}
          tone={rec.meets.rto && rec.meets.rpo ? 'success' : 'warning'}
        />
        <MetricCard label="Well-Architected" value={wafAvg} format={(n) => `${Math.round(n)}%`} hint="Average of five pillars" icon={Gauge} tone="info" />
        <MetricCard
          label="Security posture"
          value={security.score}
          format={(n) => `${Math.round(n)}%`}
          hint={`${security.findings.length} open finding${security.findings.length === 1 ? '' : 's'}`}
          icon={ShieldCheck}
          tone={security.score >= 85 ? 'success' : 'warning'}
        />
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="Pipeline progress"
          description={`${completed} of ${steps.length} steps complete for this project.`}
          className="lg:col-span-2"
          bodyClassName="flex flex-col gap-4"
          action={
            completed < steps.length ? (
              <Link href={nextStep.href} className={buttonClass('primary', 'h-8 px-3 text-xs')}>
                Continue
                <ArrowRight />
              </Link>
            ) : (
              <Pill tone="success">Complete</Pill>
            )
          }
        >
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Pipeline progress"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={completed}
          >
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(completed / steps.length) * 100}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => {
              const done = i < completed
              const current = i === completed
              const Icon = s.icon
              return (
                <li key={s.href} className="bg-card">
                  <Link
                    href={s.href}
                    aria-current={current ? 'step' : undefined}
                    className={cn(
                      'group flex h-full flex-col gap-3 p-4 transition-colors hover:bg-accent/60',
                      current && 'bg-primary/[0.06]',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground">STEP 0{s.step}</span>
                      {done ? (
                        <CheckCircle2 className="size-4 text-success" aria-label="Complete" />
                      ) : current ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                          Up next
                        </span>
                      ) : (
                        <Circle className="size-4 text-muted-foreground/40" aria-label="Not started" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon className={cn('size-4 shrink-0', done ? 'text-success' : current ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="text-sm font-medium">{s.label}</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ol>
        </Section>

        <Section title="Recommendation" description="Best option for your weighted priorities.">
          <div className="flex h-full flex-col items-center gap-4 text-center">
            <ScoreRing value={Math.round(rec.weightedScore)} size={116} label="Weighted score" />
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">{rec.name}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">{rec.tagline}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Pill tone="primary">{migration.strategy}</Pill>
              <Pill tone="info">{rec.drStrategy}</Pill>
              <Pill tone={rec.multiAz ? 'success' : 'warning'}>{rec.multiAz ? 'Multi-AZ' : 'Single-AZ'}</Pill>
            </div>
            <Link href="/architecture" className={buttonClass('secondary', 'mt-auto w-full')}>
              View architecture
              <ArrowUpRight />
            </Link>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Legacy infrastructure" description="Source estate being migrated.">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
            {[
              { icon: Server, l: 'Servers', v: `${profile.servers} × ${profile.vcpusPerServer} vCPU / ${profile.ramGbPerServer} GB` },
              { icon: Database, l: 'Database', v: profile.database === 'none' ? 'None' : `${databaseLabel(profile.database)} · ${profile.dbSizeGb} GB` },
              { icon: HardDrive, l: 'Storage', v: `${profile.storageTb} TB` },
              { icon: Users, l: 'Monthly users', v: formatNumber(profile.monthlyUsers) },
            ].map((r) => (
              <div key={r.l} className="flex min-w-0 flex-col gap-1">
                <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <r.icon className="size-3.5" />
                  {r.l}
                </dt>
                <dd className="font-mono text-sm font-medium break-words">{r.v}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section
          title="Projects"
          description="Select a project to make it active across every step."
          className="lg:col-span-2"
          bodyClassName="p-2"
          action={<span className="font-mono text-xs text-muted-foreground">{projects.length} total</span>}
        >
          <Stagger className="flex flex-col">
            {projects.map((p) => {
              const active = p.id === profile.id
              const confirming = confirmId === p.id
              return (
                <motion.div key={p.id} variants={staggerItem} className="group relative flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActive(p.id)}
                    aria-pressed={active}
                    className={cn(
                      'flex min-w-0 flex-1 items-center gap-4 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent/60',
                      active && 'bg-primary/5 ring-1 ring-primary/30',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold',
                        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                      )}
                      aria-hidden="true"
                    >
                      {p.name.slice(0, 2).toUpperCase() || '??'}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{p.name}</span>
                        {active && <span className="sr-only">(active)</span>}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {p.industry} · {databaseLabel(p.database)} · {formatNumber(p.monthlyUsers)} users
                      </span>
                    </span>
                    <Pill tone={STATUS_TONE[p.status]} className="hidden sm:inline-flex">
                      {STATUS_LABEL[p.status]}
                    </Pill>
                  </button>
                  {confirming ? (
                    <div className="flex shrink-0 items-center gap-1 pr-1" role="group" aria-label={`Confirm deleting ${p.name}`}>
                      <button
                        type="button"
                        autoFocus
                        onClick={() => {
                          deleteProject(p.id)
                          setConfirmId(null)
                        }}
                        className={buttonClass('destructive', 'h-8 px-3 text-xs')}
                      >
                        Delete
                      </button>
                      <button type="button" onClick={() => setConfirmId(null)} className={buttonClass('ghost', 'h-8 px-3 text-xs')}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(p.id)}
                      disabled={projects.length <= 1}
                      title={projects.length <= 1 ? 'At least one project is required' : `Delete ${p.name}`}
                      aria-label={`Delete ${p.name}`}
                      className="mr-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </motion.div>
              )
            })}
          </Stagger>
        </Section>
      </div>
    </>
  )
}
