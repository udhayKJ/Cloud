'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, X, MousePointerClick } from 'lucide-react'
import { useAnalysis, useActiveProject } from '@/lib/store'
import {
  PageHeader,
  Section,
  Pill,
  TierSwitcher,
  NextStep,
  CategoryBadge,
  buttonClass,
} from '@/components/shared/primitives'
import { formatUsd, formatMinutes } from '@/lib/engine'
import { cn } from '@/lib/utils'
import type { Tier } from '@/lib/types'
import { ArchitectureDiagram } from './architecture-diagram'

const LEGEND = [
  { label: 'Edge / compute', cls: 'bg-primary' },
  { label: 'Data', cls: 'bg-info' },
  { label: 'Storage', cls: 'bg-success' },
  { label: 'Operations', cls: 'bg-warning' },
  { label: 'Security', cls: 'bg-destructive' },
]

export function ArchitectureView() {
  const analysis = useAnalysis()
  const profile = useActiveProject()
  const { architectures, recommendedIndex } = analysis
  const [selectedTier, setSelectedTier] = useState<Tier>(architectures[recommendedIndex]?.tier || 'balanced')
  const currentArch = architectures.find((a) => a.tier === selectedTier) || architectures[recommendedIndex]

  const checks = [
    { label: 'RTO', ok: currentArch.meets.rto, detail: `${formatMinutes(currentArch.rtoMinutes)} vs ${formatMinutes(profile.rtoMinutes)} target` },
    { label: 'RPO', ok: currentArch.meets.rpo, detail: `${formatMinutes(currentArch.rpoMinutes)} vs ${formatMinutes(profile.rpoMinutes)} target` },
    { label: 'Availability', ok: currentArch.meets.availability, detail: `${currentArch.availabilityPct}% vs ${profile.availability}% target` },
    { label: 'Budget', ok: currentArch.meets.budget, detail: `${formatUsd(currentArch.cost.total)} vs ${formatUsd(profile.budgetUsd)}` },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Step 03 · Architecture"
        title="AWS architecture options"
        description="Three candidate designs generated from your profile. Select one to see its topology, how it meets your requirements, and every component it uses."
        actions={
          <Link href="/cost" className={buttonClass('primary')}>
            Cost analysis
            <ArrowRight />
          </Link>
        }
      />

      <TierSwitcher architectures={architectures} recommendedIndex={recommendedIndex} value={selectedTier} onChange={setSelectedTier} />

      <Section
        title={`Topology — ${currentArch.name}`}
        description={currentArch.tagline}
        bodyClassName="p-0"
        action={
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <MousePointerClick className="size-3.5" />
            Drag to pan · use controls to zoom
          </span>
        }
      >
        <div className="h-[380px] w-full overflow-hidden rounded-b-xl bg-background/60 md:h-[480px]">
          <ArchitectureDiagram arch={currentArch} profile={profile} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border px-5 py-3">
          {LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn('size-2 rounded-full', l.cls)} aria-hidden="true" />
              {l.label}
            </span>
          ))}
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6">
          <Section title="Requirement fit" description="How this option compares with your targets.">
            <ul className="flex flex-col gap-3">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full',
                      c.ok ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive',
                    )}
                  >
                    {c.ok ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium">
                      {c.label} <span className="sr-only">{c.ok ? 'met' : 'not met'}</span>
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{c.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Deployment profile">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              {[
                ['DR strategy', currentArch.drStrategy],
                ['Availability zones', currentArch.multiAz ? 'Multi-AZ' : 'Single-AZ'],
                ['Regions', currentArch.multiRegion ? 'Multi-region' : 'Single region'],
                ['EC2 fleet', `${currentArch.instanceCount}–${currentArch.maxInstances} instances`],
                ['Instance type', currentArch.instanceType],
                ['Read replicas', String(currentArch.readReplicas)],
              ].map(([k, v]) => (
                <div key={k} className="flex min-w-0 flex-col gap-1">
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
                  <dd className="text-sm font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Section>
        </div>

        <Section
          title="Components"
          description={`${currentArch.components.length} services in this design.`}
          className="lg:col-span-2"
          bodyClassName="p-0"
          action={<Pill tone="primary">{formatUsd(currentArch.cost.total)}/mo</Pill>}
        >
          <ul className="divide-y divide-border">
            {currentArch.components.map((comp) => (
              <li key={comp.id} className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-accent/30">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{comp.service}</span>
                    <CategoryBadge category={comp.category} />
                  </div>
                  <p className="text-xs text-muted-foreground">{comp.detail}</p>
                  <p className="text-xs text-muted-foreground/80">{comp.reason}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 font-mono text-sm tabular-nums',
                    comp.monthlyCost > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {comp.monthlyCost > 0 ? formatUsd(comp.monthlyCost) : 'Included'}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <NextStep
        prev={{ href: '/migration', label: 'Migration analysis' }}
        href="/cost"
        label="Review cost analysis"
        description="Break down monthly spend and compare with the on-premises baseline."
      />
    </div>
  )
}
