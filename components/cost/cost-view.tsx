'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  Coins,
  TrendingDown,
  Server,
  Database,
  HardDrive,
  Network,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle,
  Lightbulb,
  DollarSign
} from 'lucide-react'
import { useAnalysis, useActiveProject } from '@/lib/store'
import { PageHeader, Section, Pill, MetricCard, Stagger } from '@/components/shared/primitives'
import { formatUsd } from '@/lib/engine'
import { cn } from '@/lib/utils'

export function CostView() {
  const analysis = useAnalysis()
  const profile = useActiveProject()
  const { architectures, recommendedIndex } = analysis
  const [activeTier, setActiveTier] = useState<string>(architectures[recommendedIndex]?.tier || 'balanced')

  const currentArch = architectures.find((a) => a.tier === activeTier) || architectures[recommendedIndex]

  // On-premise baseline estimation
  const onPremHardware = profile.servers * 180
  const onPremStorage = profile.storageTb * 45
  const onPremPowerCooling = profile.servers * 65
  const onPremMaintenance = profile.servers * 120
  const onPremTotal = onPremHardware + onPremStorage + onPremPowerCooling + onPremMaintenance
  const savingsUsd = Math.max(0, onPremTotal - currentArch.cost.total)
  const savingsPct = onPremTotal > 0 ? Math.round((savingsUsd / onPremTotal) * 100) : 0

  const categories = [
    { label: 'Compute (EC2 / ASG)', val: currentArch.cost.compute, icon: Server, color: 'bg-indigo-500' },
    { label: 'Database (RDS / Aurora)', val: currentArch.cost.database, icon: Database, color: 'bg-emerald-500' },
    { label: 'Storage (S3 / EBS / EFS)', val: currentArch.cost.storage, icon: HardDrive, color: 'bg-cyan-500' },
    { label: 'Network & Edge (ALB / CloudFront)', val: currentArch.cost.network, icon: Network, color: 'bg-purple-500' },
    { label: 'Security (KMS / WAF / Shield)', val: currentArch.cost.security, icon: ShieldCheck, color: 'bg-rose-500' },
    { label: 'Ops & Monitoring (CloudWatch)', val: currentArch.cost.ops, icon: Zap, color: 'bg-amber-500' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Step 04 · Cost Management & TCO Analysis"
        title="AWS Infrastructure Cost Analysis"
        description="Detailed monthly cost estimation, multi-tier comparison, on-prem TCO savings, and Trusted Advisor optimizations."
        actions={
          <Link
            href="/dr-simulator"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            DR Simulator
            <ArrowRight className="size-4" />
          </Link>
        }
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Estimated Monthly Cloud Cost"
          value={currentArch.cost.total}
          format={(n) => formatUsd(n)}
          hint={`${currentArch.name}`}
          icon={Coins}
          tone="primary"
        />
        <MetricCard
          label="On-Premises Baseline TCO"
          value={onPremTotal}
          format={(n) => formatUsd(n)}
          hint="Hardware, SAN, power & facilities"
          icon={DollarSign}
          tone="default"
        />
        <MetricCard
          label="Estimated Monthly Savings"
          value={savingsUsd}
          format={(n) => `${formatUsd(n)} (${savingsPct}%)`}
          hint="Compared to legacy on-prem ops"
          icon={TrendingDown}
          tone="success"
        />
        <MetricCard
          label="Budget Variance"
          value={profile.budgetUsd - currentArch.cost.total}
          format={(n) => (n >= 0 ? `+${formatUsd(n)} Under` : `-${formatUsd(Math.abs(n))} Over`)}
          hint={`Monthly budget: ${formatUsd(profile.budgetUsd)}`}
          icon={Coins}
          tone={currentArch.meets.budget ? 'success' : 'danger'}
        />
      </Stagger>

      {/* Tier Comparison Tabs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {architectures.map((a, idx) => {
          const isSelected = a.tier === activeTier
          return (
            <button
              key={a.tier}
              type="button"
              onClick={() => setActiveTier(a.tier)}
              className={cn(
                'flex flex-col gap-3 rounded-xl border p-4 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/40 shadow-lg'
                  : 'border-border bg-card hover:bg-accent/40'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  {a.tier}
                </span>
                {idx === recommendedIndex && <Pill tone="success">RECOMMENDED</Pill>}
              </div>
              <span className="text-base font-semibold">{a.name}</span>
              <div className="mt-auto flex items-baseline justify-between pt-2 border-t border-border">
                <span className="text-xl font-bold font-mono text-primary">{formatUsd(a.cost.total)}</span>
                <Pill tone={a.meets.budget ? 'success' : 'danger'}>
                  {a.meets.budget ? 'Under Budget' : 'Exceeds Budget'}
                </Pill>
              </div>
            </button>
          )
        })}
      </div>

      {/* Breakdown by Category */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Cost Distribution by Domain" description="Percentage distribution across cloud resources.">
          <div className="flex flex-col gap-4">
            {categories.map((cat) => {
              const pct = currentArch.cost.total > 0 ? Math.round((cat.val / currentArch.cost.total) * 100) : 0
              return (
                <div key={cat.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <cat.icon className="size-3.5 text-muted-foreground" />
                      {cat.label}
                    </span>
                    <span className="font-mono font-semibold text-primary">{formatUsd(cat.val)} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className={cn('h-full rounded-full', cat.color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        {/* AWS Cost Optimization Recommendations */}
        <Section title="AWS Cost Optimization Recommendations (Trusted Advisor)" description="Actionable architectural cost reductions." className="lg:col-span-2">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <Server className="size-4" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">AWS Graviton3 ARM Migration</span>
                  <Pill tone="success">Up to 40% Savings</Pill>
                </div>
                <p className="text-xs text-muted-foreground">
                  Using Graviton3 c7g/m7g/t4g EC2 instances delivers superior price/performance compared to x86 instances with zero application rewrite.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <HardDrive className="size-4" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">S3 Intelligent-Tiering & Glacier Lifecycle</span>
                  <Pill tone="success">Up to 70% Storage Cut</Pill>
                </div>
                <p className="text-xs text-muted-foreground">
                  Automated lifecycle policies transition objects untouched for 30+ days into Glacier Instant Retrieval, dramatically cutting monthly storage bills.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Zap className="size-4" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Auto Scaling Scheduled & Target Tracking Policies</span>
                  <Pill tone="info">Elastic Right-Sizing</Pill>
                </div>
                <p className="text-xs text-muted-foreground">
                  Target tracking scaling dynamically scales in compute capacity during low-traffic overnight hours, avoiding paying for idle virtual machines.
                </p>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
