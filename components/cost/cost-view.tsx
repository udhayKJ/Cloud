'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Coins, TrendingDown, TrendingUp, Server, Database, HardDrive, Network, ShieldCheck, Zap, ArrowRight, Building2, Wallet } from 'lucide-react'
import { useAnalysis, useActiveProject } from '@/lib/store'
import { PageHeader, Section, Pill, MetricCard, Stagger, TierSwitcher, NextStep, buttonClass } from '@/components/shared/primitives'
import { formatUsd } from '@/lib/engine'
import type { Tier } from '@/lib/types'

const OPTIMISATIONS = [
  {
    icon: Server,
    title: 'Move to AWS Graviton instances',
    badge: 'Up to 40% compute',
    body: 'Graviton (c7g / m7g / t4g) instances deliver better price/performance than x86 for most Linux workloads, usually with no code changes.',
  },
  {
    icon: HardDrive,
    title: 'S3 Intelligent-Tiering & Glacier lifecycle',
    badge: 'Up to 70% storage',
    body: 'Lifecycle policies move objects untouched for 30+ days into cheaper tiers such as Glacier Instant Retrieval automatically.',
  },
  {
    icon: Zap,
    title: 'Scheduled & target-tracking Auto Scaling',
    badge: 'Right-sizing',
    body: 'Target tracking scales compute in during quiet overnight hours so you stop paying for idle instances.',
  },
]

export function CostView() {
  const analysis = useAnalysis()
  const profile = useActiveProject()
  const { architectures, recommendedIndex } = analysis
  const [activeTier, setActiveTier] = useState<Tier>(architectures[recommendedIndex]?.tier || 'balanced')
  const currentArch = architectures.find((a) => a.tier === activeTier) || architectures[recommendedIndex]

  // On-premise baseline estimation (mirrors the backend /api/cost/estimate model)
  const onPremHardware = profile.servers * 180
  const onPremStorage = profile.storageTb * 45
  const onPremPowerCooling = profile.servers * 65
  const onPremMaintenance = profile.servers * 120
  const onPremTotal = onPremHardware + onPremStorage + onPremPowerCooling + onPremMaintenance
  const savingsUsd = Math.max(0, onPremTotal - currentArch.cost.total)
  const savingsPct = onPremTotal > 0 ? Math.round((savingsUsd / onPremTotal) * 100) : 0
  const variance = profile.budgetUsd - currentArch.cost.total

  const categories = [
    { label: 'Compute', sub: 'EC2, Auto Scaling, EBS, EFS', val: currentArch.cost.compute, icon: Server, color: 'var(--chart-1)' },
    { label: 'Database', sub: 'RDS / Aurora / cache', val: currentArch.cost.database, icon: Database, color: 'var(--chart-2)' },
    { label: 'Storage & backup', sub: 'S3, AWS Backup', val: currentArch.cost.storage, icon: HardDrive, color: 'var(--chart-3)' },
    { label: 'Network & edge', sub: 'ALB, NAT, CloudFront, transfer', val: currentArch.cost.network, icon: Network, color: 'var(--chart-5)' },
    { label: 'Security', sub: 'WAF, KMS, CloudTrail, Config', val: currentArch.cost.security, icon: ShieldCheck, color: 'var(--chart-4)' },
    { label: 'Ops & messaging', sub: 'CloudWatch, SNS, SQS', val: currentArch.cost.ops, icon: Zap, color: 'var(--warning)' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Step 04 · Cost analysis"
        title="Monthly cost & TCO"
        description="Estimated AWS spend for each option, how it splits across service domains, and how it compares with running the estate on-premises."
        actions={
          <Link href="/dr-simulator" className={buttonClass('primary')}>
            DR simulator
            <ArrowRight />
          </Link>
        }
      />

      <TierSwitcher architectures={architectures} recommendedIndex={recommendedIndex} value={activeTier} onChange={setActiveTier} showBudget />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="AWS monthly cost" value={currentArch.cost.total} format={(n) => formatUsd(n)} hint={currentArch.name} icon={Coins} tone="primary" />
        <MetricCard
          label="On-premises baseline"
          value={onPremTotal}
          format={(n) => formatUsd(n)}
          hint="Hardware, SAN, power & admin"
          icon={Building2}
          tone="default"
        />
        <MetricCard
          label="Monthly savings"
          value={savingsUsd}
          format={(n) => formatUsd(n)}
          hint={savingsUsd > 0 ? `${savingsPct}% lower than on-premises` : 'No savings vs. the on-premises baseline'}
          icon={TrendingDown}
          tone={savingsUsd > 0 ? 'success' : 'warning'}
        />
        <MetricCard
          label={variance >= 0 ? 'Under budget by' : 'Over budget by'}
          value={Math.abs(variance)}
          format={(n) => formatUsd(n)}
          hint={`Monthly budget ${formatUsd(profile.budgetUsd)}`}
          icon={variance >= 0 ? Wallet : TrendingUp}
          tone={variance >= 0 ? 'success' : 'destructive'}
        />
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-5">
        <Section title="Cost by domain" description={`Breakdown of ${formatUsd(currentArch.cost.total)} per month.`} className="lg:col-span-3">
          <div className="flex flex-col gap-5">
            <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              {categories.map((cat) => (
                <motion.span
                  key={cat.label}
                  className="h-full"
                  style={{ background: cat.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${currentArch.cost.total > 0 ? (cat.val / currentArch.cost.total) * 100 : 0}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              ))}
            </div>
            <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {categories.map((cat) => {
                const pct = currentArch.cost.total > 0 ? Math.round((cat.val / currentArch.cost.total) * 100) : 0
                return (
                  <li key={cat.label} className="flex items-start gap-3">
                    <span className="mt-1 size-2.5 shrink-0 rounded-sm" style={{ background: cat.color }} aria-hidden="true" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium">{cat.label}</span>
                        <span className="font-mono text-sm font-semibold tabular-nums">{formatUsd(cat.val)}</span>
                      </span>
                      <span className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{cat.sub}</span>
                        <span className="font-mono tabular-nums">{pct}%</span>
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </Section>

        <Section title="On-premises comparison" description="Estimated monthly cost of the current estate." className="lg:col-span-2">
          <dl className="flex flex-col divide-y divide-border text-sm">
            {[
              ['Hardware depreciation', onPremHardware],
              ['Storage / SAN', onPremStorage],
              ['Power & cooling', onPremPowerCooling],
              ['Maintenance & admin', onPremMaintenance],
            ].map(([k, v]) => (
              <div key={k as string} className="flex items-center justify-between py-2.5">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-mono tabular-nums">{formatUsd(v as number)}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between py-2.5 font-semibold">
              <dt>On-premises total</dt>
              <dd className="font-mono tabular-nums">{formatUsd(onPremTotal)}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5 font-semibold">
              <dt>{currentArch.name}</dt>
              <dd className="font-mono tabular-nums text-primary">{formatUsd(currentArch.cost.total)}</dd>
            </div>
          </dl>
        </Section>
      </div>

      <Section title="Optimisation opportunities" description="General AWS cost levers that apply to this kind of workload.">
        <ul className="grid gap-3 md:grid-cols-3">
          {OPTIMISATIONS.map((o) => (
            <li key={o.title} className="flex flex-col gap-2 rounded-lg border border-border bg-background/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <o.icon className="size-4" />
                </span>
                <Pill tone="success">{o.badge}</Pill>
              </div>
              <span className="text-sm font-semibold">{o.title}</span>
              <p className="text-xs leading-relaxed text-muted-foreground">{o.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <NextStep
        prev={{ href: '/architecture', label: 'Architecture' }}
        href="/dr-simulator"
        label="Simulate a disaster"
        description="Inject failures and measure real recovery time and data loss."
      />
    </div>
  )
}
