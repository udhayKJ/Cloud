'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import {
  Coins,
  Timer,
  Gauge,
  ShieldCheck,
  ArrowUpRight,
  Plus,
  Server,
  Database,
  HardDrive,
  Users,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { useAnalysis, useProjectStore } from '@/lib/store'
import { formatUsd, formatMinutes, formatNumber, databaseLabel } from '@/lib/engine'
import { NAV_ITEMS } from '@/components/shell/nav'
import { PageHeader, MetricCard, Stagger, Section, Pill, staggerItem, ScoreRing } from '@/components/shared/primitives'
import { cn } from '@/lib/utils'

const STATUS_TONE = { draft: 'default', analysed: 'info', simulated: 'success' } as const

export function DashboardView() {
  const analysis = useAnalysis()
  const projects = useProjectStore((s) => s.projects)
  const setActive = useProjectStore((s) => s.setActive)
  const { profile, architectures, recommendedIndex, migration, security } = analysis
  const rec = architectures[recommendedIndex]
  const waf = rec.wellArchitected
  const wafAvg = Math.round((waf.security + waf.reliability + waf.performance + waf.cost + waf.operations) / 5)
  const steps = NAV_ITEMS.filter((n) => n.step)
  const completed = profile.status === 'simulated' ? 8 : profile.status === 'analysed' ? 4 : 1

  return (
    <>
      <PageHeader
        eyebrow="Workspace overview"
        title={profile.name}
        description={profile.description || 'Active migration project. Follow the eight-step pipeline from infrastructure profile to final report.'}
        actions={
          <>
            <Link
              href="/infrastructure"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-accent"
            >
              Edit profile
            </Link>
            <Link
              href="/projects/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              <Plus className="size-4" />
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
          tone="primary"
        />
        <MetricCard
          label="Achievable RTO / RPO"
          value={`${formatMinutes(rec.rtoMinutes)} / ${formatMinutes(rec.rpoMinutes)}`}
          hint={`Target ${formatMinutes(profile.rtoMinutes)} / ${formatMinutes(profile.rpoMinutes)}`}
          icon={Timer}
          tone={rec.meets.rto && rec.meets.rpo ? 'success' : 'warning'}
        />
        <MetricCard label="Well-Architected" value={wafAvg} format={(n) => `${Math.round(n)}%`} hint="Average of five pillars" icon={Gauge} tone="info" />
        <MetricCard label="Security posture" value={security.score} format={(n) => `${Math.round(n)}%`} hint={`${security.findings.length} open findings`} icon={ShieldCheck} tone={security.score >= 85 ? 'success' : 'warning'} />
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="Pipeline progress"
          description="Guided flow for the active project."
          className="lg:col-span-2"
          bodyClassName="p-0"
        >
          <ol className="grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
            {steps.map((s, i) => {
              const done = i < completed
              const current = i === completed
              const Icon = s.icon
              return (
                <li key={s.href} className={cn('border-border sm:border-b lg:border-b-0', i % 2 === 0 && 'sm:border-r', i < 4 && 'lg:border-b')}>
                  <Link
                    href={s.href}
                    className={cn(
                      'group flex h-full flex-col gap-3 p-4 transition-colors hover:bg-accent/60',
                      current && 'bg-primary/5',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground">STEP 0{s.step}</span>
                      {done ? (
                        <CheckCircle2 className="size-4 text-success" />
                      ) : current ? (
                        <span className="size-2 animate-pulse rounded-full bg-primary" />
                      ) : (
                        <Circle className="size-4 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon className={cn('size-4', done ? 'text-success' : current ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="text-sm font-medium">{s.label}</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ol>
        </Section>

        <Section title="Recommendation" description="Weighted by your priorities.">
          <div className="flex flex-col items-center gap-4 text-center">
            <ScoreRing value={Math.round(rec.weightedScore)} size={120} label="Weighted score" />
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">{rec.name}</span>
              <span className="text-xs text-muted-foreground">{rec.tagline}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Pill tone="primary">{migration.strategy}</Pill>
              <Pill tone="info">{rec.drStrategy}</Pill>
              <Pill tone={rec.multiAz ? 'success' : 'warning'}>{rec.multiAz ? 'Multi-AZ' : 'Single-AZ'}</Pill>
            </div>
            <Link
              href="/architecture"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View architecture
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Legacy infrastructure snapshot" description="Source estate being migrated.">
          <dl className="grid grid-cols-2 gap-4">
            {[
              { icon: Server, l: 'Servers', v: `${profile.servers} × ${profile.vcpusPerServer}vCPU/${profile.ramGbPerServer}GB` },
              { icon: Database, l: 'Database', v: `${databaseLabel(profile.database)} · ${profile.dbSizeGb} GB` },
              { icon: HardDrive, l: 'Storage', v: `${profile.storageTb} TB` },
              { icon: Users, l: 'Monthly users', v: formatNumber(profile.monthlyUsers) },
            ].map((r) => (
              <div key={r.l} className="flex flex-col gap-1">
                <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <r.icon className="size-3.5" />
                  {r.l}
                </dt>
                <dd className="font-mono text-sm font-medium">{r.v}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Projects" description="Switch the active project." className="lg:col-span-2" bodyClassName="p-2">
          <ul className="flex flex-col">
            {projects.map((p) => {
              const active = p.id === profile.id
              return (
                <motion.li key={p.id} variants={staggerItem}>
                  <button
                    type="button"
                    onClick={() => setActive(p.id)}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent/60',
                      active && 'bg-primary/5 ring-1 ring-primary/30',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold',
                        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {p.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{p.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {p.industry} · {databaseLabel(p.database)} · {formatNumber(p.monthlyUsers)} users
                      </span>
                    </span>
                    <Pill tone={STATUS_TONE[p.status]}>{p.status}</Pill>
                  </button>
                </motion.li>
              )
            })}
          </ul>
        </Section>
      </div>
    </>
  )
}
