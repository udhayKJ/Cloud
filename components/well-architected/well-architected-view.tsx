'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ShieldCheck, Zap, Coins, Cpu, ArrowRight, CheckCircle2, Circle, TrendingUp } from 'lucide-react'
import { useAnalysis } from '@/lib/store'
import {
  PageHeader,
  Section,
  Pill,
  ScoreRing,
  TierSwitcher,
  NextStep,
  TIER_LABEL,
  scoreTone,
  buttonClass,
} from '@/components/shared/primitives'
import { cn } from '@/lib/utils'
import type { ArchitectureOption, Tier, WellArchitectedScores } from '@/lib/types'

type PillarKey = keyof WellArchitectedScores

function pillarPractices(a: ArchitectureOption): Record<PillarKey, { label: string; ok: boolean }[]> {
  const has = (id: string) => a.components.some((c) => c.id === id)
  return {
    security: [
      { label: 'Private subnet isolation', ok: true },
      { label: 'KMS customer-managed keys', ok: a.tier !== 'low-cost' },
      { label: 'AWS WAF managed rules', ok: has('waf') },
      { label: 'CloudTrail audit logging', ok: has('cloudtrail') },
      { label: 'GuardDuty threat detection', ok: has('guardduty') },
    ],
    reliability: [
      { label: 'EC2 Auto Scaling', ok: a.autoScaling },
      { label: 'Multi-AZ failover', ok: a.multiAz },
      { label: 'Database read replicas', ok: a.readReplicas > 0 },
      { label: 'Multi-region DR', ok: a.multiRegion },
    ],
    performance: [
      { label: 'EBS gp3 volumes', ok: has('ebs') },
      { label: 'CloudFront edge caching', ok: has('cloudfront') },
      { label: 'ElastiCache for hot reads', ok: has('cache') },
      { label: 'Aurora / DynamoDB data tier', ok: /Aurora|DynamoDB/.test(a.databaseService) },
    ],
    cost: [
      { label: 'Within monthly budget', ok: a.meets.budget },
      { label: 'S3 lifecycle tiering', ok: has('s3') },
      { label: 'Auto Scaling scale-in', ok: a.autoScaling },
      { label: 'Graviton instances (recommended)', ok: false },
    ],
    operations: [
      { label: 'CloudWatch metrics & alarms', ok: has('cloudwatch') },
      { label: 'Systems Manager patching', ok: has('ssm') },
      { label: 'AWS Config conformance rules', ok: has('config') },
      { label: 'Step Functions DR runbook', ok: has('sfn') },
    ],
  }
}

const PILLARS: { key: PillarKey; title: string; icon: typeof Zap; color: string; description: string }[] = [
  {
    key: 'security',
    title: 'Security',
    icon: ShieldCheck,
    color: 'var(--chart-4)',
    description: 'Protect data and systems with least-privilege IAM, encryption and managed edge filtering.',
  },
  {
    key: 'reliability',
    title: 'Reliability',
    icon: Zap,
    color: 'var(--chart-3)',
    description: 'Survive infrastructure failures and acquire capacity automatically to meet demand.',
  },
  {
    key: 'performance',
    title: 'Performance efficiency',
    icon: Cpu,
    color: 'var(--chart-2)',
    description: 'Use compute, storage and caching efficiently as workloads change.',
  },
  {
    key: 'cost',
    title: 'Cost optimisation',
    icon: Coins,
    color: 'var(--chart-1)',
    description: 'Avoid unnecessary spend through right-sizing, tiering and automation.',
  },
  {
    key: 'operations',
    title: 'Operational excellence',
    icon: TrendingUp,
    color: 'var(--warning)',
    description: 'Run and improve the system with monitoring, automation and infrastructure as code.',
  },
]

const average = (w: WellArchitectedScores) => Math.round((w.security + w.reliability + w.performance + w.cost + w.operations) / 5)

function ratingLabel(score: number) {
  if (score >= 85) return { label: 'Production-ready', tone: 'success' as const }
  if (score >= 70) return { label: 'Solid, with gaps', tone: 'primary' as const }
  return { label: 'Needs improvement', tone: 'destructive' as const }
}

export function WellArchitectedView() {
  const analysis = useAnalysis()
  const { architectures, recommendedIndex } = analysis
  const [selectedTier, setSelectedTier] = useState<Tier>(architectures[recommendedIndex]?.tier || 'balanced')
  const currentArch = architectures.find((a) => a.tier === selectedTier) || architectures[recommendedIndex]
  const waf = currentArch.wellArchitected
  const wafAverage = average(waf)
  const rating = ratingLabel(wafAverage)
  const practices = pillarPractices(currentArch)
  const weakest = PILLARS.reduce((lo, p) => (waf[p.key] < waf[lo.key] ? p : lo), PILLARS[0])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Step 07 · Well-Architected"
        title="Well-Architected scorecard"
        description="Each architecture option scored against the five pillars of the AWS Well-Architected Framework, with the practices that drive each score."
        actions={
          <Link href="/reports" className={buttonClass('primary')}>
            View final report
            <ArrowRight />
          </Link>
        }
      />

      <TierSwitcher architectures={architectures} recommendedIndex={recommendedIndex} value={selectedTier} onChange={setSelectedTier} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Overall rating" description={currentArch.name}>
          <div className="flex flex-col items-center gap-4 text-center">
            <ScoreRing value={wafAverage} size={132} label="Average of five pillars" />
            <Pill tone={rating.tone}>{rating.label}</Pill>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              Strongest in {PILLARS.reduce((hi, p) => (waf[p.key] > waf[hi.key] ? p : hi), PILLARS[0]).title.toLowerCase()} ({Math.max(...PILLARS.map((p) => waf[p.key]))}%).
              Biggest opportunity: {weakest.title.toLowerCase()} ({waf[weakest.key]}%).
            </p>
          </div>
        </Section>

        <Section title="Option comparison" description="Pillar scores for all three options." className="lg:col-span-2" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th scope="col" className="px-5 py-3 font-medium">Pillar</th>
                  {architectures.map((a, idx) => (
                    <th
                      key={a.tier}
                      scope="col"
                      className={cn('px-3 py-3 text-right font-medium', a.tier === selectedTier && 'text-foreground')}
                    >
                      {TIER_LABEL[a.tier]}
                      {idx === recommendedIndex && <span className="ml-1 text-success" aria-label="recommended">★</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PILLARS.map((p) => (
                  <tr key={p.key}>
                    <th scope="row" className="px-5 py-2.5 font-medium">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden="true" />
                        {p.title}
                      </span>
                    </th>
                    {architectures.map((a) => (
                      <td
                        key={a.tier}
                        className={cn(
                          'px-3 py-2.5 text-right font-mono tabular-nums',
                          a.tier === selectedTier ? 'bg-primary/[0.06] font-semibold text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {a.wellArchitected[p.key]}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-border">
                  <th scope="row" className="px-5 py-2.5 font-semibold">Average</th>
                  {architectures.map((a) => (
                    <td
                      key={a.tier}
                      className={cn('px-3 py-2.5 text-right font-mono font-semibold tabular-nums', a.tier === selectedTier && 'bg-primary/[0.06] text-primary')}
                    >
                      {average(a.wellArchitected)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {PILLARS.map((p) => {
          const score = waf[p.key]
          const tone = scoreTone(score)
          return (
            <section key={p.key} className="card-sheen flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg" style={{ background: `color-mix(in oklch, ${p.color} 15%, transparent)`, color: p.color }}>
                  <p.icon className="size-4" />
                </span>
                <span
                  className={cn(
                    'font-mono text-xl font-semibold tabular-nums',
                    tone === 'success' ? 'text-success' : tone === 'primary' ? 'text-foreground' : 'text-destructive',
                  )}
                >
                  {score}
                </span>
              </div>
              <h3 className="text-sm font-semibold">{p.title}</h3>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="meter" aria-label={`${p.title} score`} aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: p.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{p.description}</p>
              <ul className="mt-auto flex flex-col gap-1.5 border-t border-border pt-3 text-xs">
                {practices[p.key].map((pr) => (
                  <li key={pr.label} className={cn('flex items-start gap-1.5', pr.ok ? 'text-foreground/90' : 'text-muted-foreground')}>
                    {pr.ok ? (
                      <CheckCircle2 className="mt-px size-3.5 shrink-0 text-success" aria-label="In place" />
                    ) : (
                      <Circle className="mt-px size-3.5 shrink-0 text-muted-foreground/50" aria-label="Not in place" />
                    )}
                    <span>{pr.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      <NextStep
        prev={{ href: '/security', label: 'Security analysis' }}
        href="/reports"
        label="Generate the final report"
        description="Executive summary, DR matrix and bill of materials — print or export."
      />
    </div>
  )
}
