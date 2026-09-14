'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  ShieldCheck,
  Key,
  Lock,
  Network,
  Globe,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  ShieldAlert
} from 'lucide-react'
import { useAnalysis, useActiveProject } from '@/lib/store'
import { PageHeader, Section, Pill, MetricCard, Stagger } from '@/components/shared/primitives'
import { cn } from '@/lib/utils'

export function SecurityView() {
  const analysis = useAnalysis()
  const profile = useActiveProject()
  const { security, architectures, recommendedIndex } = analysis
  const currentArch = architectures[recommendedIndex]

  const pillarIcons: Record<string, typeof Lock> = {
    identity: Key,
    encryption: Lock,
    network: Network,
    edge: Globe,
    audit: FileCheck,
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Step 06 · Security Posture Evaluation"
        title="AWS Security & Compliance Architecture"
        description="Comprehensive evaluation across IAM least-privilege, KMS encryption, WAF/Shield edge defenses, CloudTrail auditing, and AWS Config compliance."
        actions={
          <Link
            href="/well-architected"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Well-Architected Score
            <ArrowRight className="size-4" />
          </Link>
        }
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Overall Security Score"
          value={security.score}
          format={(n) => `${Math.round(n)}%`}
          hint="CIS AWS Benchmark alignment"
          icon={ShieldCheck}
          tone={security.score >= 85 ? 'success' : 'warning'}
        />
        <MetricCard
          label="Encryption Standard"
          value="KMS CMK + TLS 1.3"
          hint="At-rest & in-transit envelope encryption"
          icon={Lock}
          tone="primary"
        />
        <MetricCard
          label="Edge & WAF Defense"
          value={currentArch.tier in ['balanced', 'enterprise'] ? 'AWS WAF + Shield' : 'Standard Shield'}
          hint="OWASP Top 10 & DDoS protection"
          icon={Globe}
          tone="info"
        />
        <MetricCard
          label="Audit & Compliance"
          value="CloudTrail + Config"
          hint={`${security.findings.length} findings to review`}
          icon={FileCheck}
          tone={security.findings.length === 0 ? 'success' : 'warning'}
        />
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Security Controls Table */}
        <Section
          title="Security Controls Audit (10 Key Controls)"
          description="Status of essential AWS security baseline configurations."
          className="lg:col-span-2"
        >
          <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {security.controls.map((ctrl) => {
              const Icon = pillarIcons[ctrl.pillar] || Lock
              return (
                <div key={ctrl.id} className="flex flex-col gap-2 p-4 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold text-foreground">{ctrl.name}</span>
                      <Pill tone="default" className="text-[10px]">{ctrl.service}</Pill>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{ctrl.description}</p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <Pill tone={ctrl.status === 'enabled' ? 'success' : ctrl.status === 'partial' ? 'warning' : 'danger'}>
                      {ctrl.status.toUpperCase()}
                    </Pill>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        {/* Findings & Remediation */}
        <Section title="Security Findings & Remediation" description="Actionable architectural hardening recommendations.">
          <div className="flex flex-col gap-3">
            {security.findings.map((f, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{f.title}</span>
                  <Pill tone={f.severity === 'critical' || f.severity === 'high' ? 'danger' : 'warning'}>
                    {f.severity.toUpperCase()}
                  </Pill>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.recommendation}</p>
              </div>
            ))}

            <div className="mt-2 flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" />
                <span>Zero Trust Architecture Pattern</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All database subnets are isolated with no internet routing. IAM service roles utilize AWS STS short-lived credentials.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
