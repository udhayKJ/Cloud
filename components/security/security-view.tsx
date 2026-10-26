'use client'

import Link from 'next/link'
import { ShieldCheck, Key, Lock, Network, Globe, FileCheck, ArrowRight, ShieldAlert, CheckCircle2, CircleDashed, XCircle, Info } from 'lucide-react'
import { useAnalysis } from '@/lib/store'
import { PageHeader, Section, Pill, MetricCard, Stagger, NextStep, EmptyState, Callout, buttonClass, type Tone } from '@/components/shared/primitives'
import type { ControlStatus, SecurityControl, Severity } from '@/lib/types'
import { cn } from '@/lib/utils'

const PILLARS: { id: SecurityControl['pillar']; label: string; icon: typeof Lock }[] = [
  { id: 'identity', label: 'Identity & access', icon: Key },
  { id: 'encryption', label: 'Encryption', icon: Lock },
  { id: 'network', label: 'Network isolation', icon: Network },
  { id: 'edge', label: 'Edge protection', icon: Globe },
  { id: 'audit', label: 'Audit & detection', icon: FileCheck },
]

const STATUS_META: Record<ControlStatus, { label: string; tone: Tone; icon: typeof CheckCircle2; cls: string }> = {
  enabled: { label: 'Enabled', tone: 'success', icon: CheckCircle2, cls: 'text-success' },
  partial: { label: 'Partial', tone: 'warning', icon: CircleDashed, cls: 'text-warning' },
  missing: { label: 'Missing', tone: 'destructive', icon: XCircle, cls: 'text-destructive' },
}

const SEVERITY_TONE: Record<Severity, Tone> = { critical: 'destructive', high: 'destructive', medium: 'warning', low: 'info' }
const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 }

export function SecurityView() {
  const analysis = useAnalysis()
  const { security, architectures, recommendedIndex } = analysis
  const currentArch = architectures[recommendedIndex]
  const has = (id: string) => currentArch.components.some((c) => c.id === id)

  const counts = security.controls.reduce(
    (acc, c) => ({ ...acc, [c.status]: acc[c.status] + 1 }),
    { enabled: 0, partial: 0, missing: 0 } as Record<ControlStatus, number>,
  )
  const cmk = security.controls.find((c) => c.id === 'kms')?.status === 'enabled'
  const findings = [...security.findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Step 06 · Security"
        title="Security posture"
        description={`Controls evaluated for the recommended architecture (${currentArch.name}) across identity, encryption, network isolation, edge protection and audit.`}
        actions={
          <Link href="/well-architected" className={buttonClass('primary')}>
            Well-Architected score
            <ArrowRight />
          </Link>
        }
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Security score"
          value={security.score}
          format={(n) => `${Math.round(n)}%`}
          hint="Severity-weighted control coverage"
          icon={ShieldCheck}
          tone={security.score >= 85 ? 'success' : security.score >= 70 ? 'warning' : 'destructive'}
        />
        <MetricCard
          label="Controls enabled"
          value={`${counts.enabled} / ${security.controls.length}`}
          hint={`${counts.partial} partial · ${counts.missing} missing`}
          icon={CheckCircle2}
          tone={counts.missing === 0 ? 'success' : 'warning'}
        />
        <MetricCard
          label="Encryption at rest"
          value={cmk ? 'Customer keys' : 'AWS-managed'}
          hint={cmk ? 'KMS CMKs with rotation · TLS in transit' : 'Upgrade to CMKs for audit control'}
          icon={Lock}
          tone={cmk ? 'success' : 'warning'}
        />
        <MetricCard
          label="Edge defence"
          value={has('waf') ? 'WAF + Shield' : 'Shield Standard'}
          hint={has('waf') ? 'OWASP Top 10 & L7 rate limiting' : 'L3/L4 DDoS protection only'}
          icon={Globe}
          tone={has('waf') ? 'success' : 'warning'}
        />
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="Security controls"
          description={`${security.controls.length} baseline controls grouped by domain.`}
          className="lg:col-span-2"
          bodyClassName="p-0"
        >
          <div className="divide-y divide-border">
            {PILLARS.map((pillar) => {
              const controls = security.controls.filter((c) => c.pillar === pillar.id)
              if (controls.length === 0) return null
              return (
                <div key={pillar.id}>
                  <div className="flex items-center gap-2 bg-background/40 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <pillar.icon className="size-3.5" />
                    {pillar.label}
                  </div>
                  <ul className="divide-y divide-border">
                    {controls.map((ctrl) => {
                      const meta = STATUS_META[ctrl.status]
                      return (
                        <li key={ctrl.id} className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-accent/30">
                          <meta.icon className={cn('mt-0.5 size-4 shrink-0', meta.cls)} aria-hidden="true" />
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-sm font-semibold">{ctrl.name}</span>
                              <span className="font-mono text-[10px] text-muted-foreground">{ctrl.service}</span>
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground">{ctrl.description}</p>
                          </div>
                          <Pill tone={meta.tone}>{meta.label}</Pill>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </Section>

        <div className="flex flex-col gap-6">
          <Section
            title="Findings & remediation"
            description="Ordered by severity."
            action={findings.length > 0 ? <Pill tone="warning">{findings.length}</Pill> : undefined}
          >
            {findings.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="No open findings" description="Every baseline control is enabled for this architecture." />
            ) : (
              <ul className="flex flex-col gap-3">
                {findings.map((f, i) => (
                  <li key={i} className="flex flex-col gap-2 rounded-lg border border-border bg-background/40 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex items-start gap-2 text-sm font-medium">
                        <ShieldAlert className={cn('mt-0.5 size-4 shrink-0', f.severity === 'medium' ? 'text-warning' : 'text-destructive')} />
                        {f.title}
                      </span>
                      <Pill tone={SEVERITY_TONE[f.severity]}>{f.severity}</Pill>
                    </div>
                    <p className="pl-6 text-xs leading-relaxed text-muted-foreground">{f.recommendation}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Callout tone="info" icon={Info} title="Zero-trust baseline">
            Database subnets have no internet route, and service roles use short-lived AWS STS credentials instead of static keys.
          </Callout>
        </div>
      </div>

      <NextStep
        prev={{ href: '/dr-simulator', label: 'DR simulator' }}
        href="/well-architected"
        label="Well-Architected scorecard"
        description="See how each option scores across the five AWS pillars."
      />
    </div>
  )
}
