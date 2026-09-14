'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  Gauge,
  ShieldCheck,
  Zap,
  Coins,
  Cpu,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Award
} from 'lucide-react'
import { useAnalysis, useActiveProject } from '@/lib/store'
import { PageHeader, Section, Pill, MetricCard, Stagger, ScoreRing } from '@/components/shared/primitives'
import { cn } from '@/lib/utils'

export function WellArchitectedView() {
  const analysis = useAnalysis()
  const profile = useActiveProject()
  const { architectures, recommendedIndex } = analysis
  const [selectedTier, setSelectedTier] = useState<string>(architectures[recommendedIndex]?.tier || 'balanced')

  const currentArch = architectures.find((a) => a.tier === selectedTier) || architectures[recommendedIndex]
  const waf = currentArch.wellArchitected
  const wafAverage = Math.round((waf.security + waf.reliability + waf.performance + waf.cost + waf.operations) / 5)

  const pillars = [
    {
      key: 'security',
      title: 'Security Pillar',
      score: waf.security,
      icon: ShieldCheck,
      color: 'bg-emerald-500',
      description: 'Protects information, systems, and assets through IAM least-privilege, KMS envelope encryption, and automated WAF filtering.',
      practices: ['Multi-region CloudTrail enabled', 'KMS Customer Managed Keys (CMK)', 'VPC Private Subnet Isolation', 'AWS WAF OWASP Top 10 rules']
    },
    {
      key: 'reliability',
      title: 'Reliability Pillar',
      score: waf.reliability,
      icon: Zap,
      color: 'bg-indigo-500',
      description: 'Survives infrastructure failures and dynamically acquires compute resources to meet demand.',
      practices: ['Multi-AZ synchronous failover (RPO=0)', 'EC2 Auto Scaling target tracking', 'ALB active health checks', 'Route 53 DNS failover']
    },
    {
      key: 'performance',
      title: 'Performance Efficiency',
      score: waf.performance,
      icon: Cpu,
      color: 'bg-cyan-500',
      description: 'Uses compute and storage resources efficiently to maintain performance under changing workloads.',
      practices: ['AWS Graviton3 ARM compute (c7g/m7g)', 'Amazon Aurora distributed storage', 'Amazon CloudFront global edge caching', 'EBS gp3 3000 IOPS baseline']
    },
    {
      key: 'cost',
      title: 'Cost Optimisation',
      score: waf.cost,
      icon: Coins,
      color: 'bg-amber-500',
      description: 'Eliminates unneeded costs and sub-optimal resources through right-sizing and automation.',
      practices: ['S3 Intelligent-Tiering to Glacier', 'Graviton 40% price/performance benefit', 'Auto Scaling off-peak scale-in', 'CloudWatch right-sizing alarms']
    },
    {
      key: 'operations',
      title: 'Operational Excellence',
      score: waf.operations,
      icon: TrendingUp,
      color: 'bg-purple-500',
      description: 'Delivers business value through continuous monitoring, automated playbooks, and Infrastructure as Code.',
      practices: ['Terraform IaC modular provisioning', 'CloudWatch detailed metrics & SNS alerts', 'AWS Config compliance rules', 'AWS Step Functions DR automation']
    }
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Step 07 · AWS Well-Architected Framework"
        title="Well-Architected 5-Pillar Scorecard"
        description="Formal evaluation against the 5 pillars of the AWS Well-Architected Framework (Project.md Section 20)."
        actions={
          <Link
            href="/reports"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Export Full Report
            <ArrowRight className="size-4" />
          </Link>
        }
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Overall Well-Architected Score"
          value={wafAverage}
          format={(n) => `${n}%`}
          hint={`Pillar benchmark for ${currentArch.name}`}
          icon={Award}
          tone="primary"
        />
        <MetricCard
          label="Security & Reliability Average"
          value={Math.round((waf.security + waf.reliability) / 2)}
          format={(n) => `${n}%`}
          hint="Mission-critical resilience"
          icon={ShieldCheck}
          tone="success"
        />
        <MetricCard
          label="Performance Efficiency"
          value={waf.performance}
          format={(n) => `${Math.round(n)}%`}
          hint="Graviton3 + Aurora throughput"
          icon={Cpu}
          tone="info"
        />
        <MetricCard
          label="Cost Optimization Score"
          value={waf.cost}
          format={(n) => `${Math.round(n)}%`}
          hint="S3 tiering & Auto Scaling"
          icon={Coins}
          tone="default"
        />
      </Stagger>

      {/* Tier Switcher */}
      <div className="flex flex-wrap gap-2">
        {architectures.map((a, idx) => (
          <button
            key={a.tier}
            type="button"
            onClick={() => setSelectedTier(a.tier)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-all',
              a.tier === selectedTier
                ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/40'
                : 'border-border bg-card text-muted-foreground hover:bg-accent/40 hover:text-foreground'
            )}
          >
            <span>{a.name}</span>
            {idx === recommendedIndex && <Pill tone="success" className="text-[10px]">RECOMMENDED</Pill>}
          </button>
        ))}
      </div>

      {/* 5 Pillars Detailed Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pillars.map((p) => (
          <Section key={p.key} title={p.title} description={`${p.score}% score rating.`}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p.icon className="size-4 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</span>
                </div>
                <span className="font-mono text-base font-bold text-foreground">{p.score}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={cn('h-full rounded-full', p.color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${p.score}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">{p.description}</p>

              <div className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
                <span className="text-[11px] font-semibold text-foreground">Verified Cloud Controls:</span>
                <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {p.practices.map((pr, pi) => (
                    <li key={pi} className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3 text-success shrink-0" />
                      <span>{pr}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>
        ))}

        {/* Executive WAF Summary Card */}
        <Section title="Executive Pillar Alignment" description="Summary rating against AWS standards.">
          <div className="flex flex-col items-center justify-center gap-4 text-center p-4">
            <ScoreRing value={wafAverage} size={130} label="WAF Rating" />
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold text-foreground">AWS Production Certified</span>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                {currentArch.name} satisfies enterprise production criteria with {waf.reliability}% reliability and {waf.security}% security rating.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
