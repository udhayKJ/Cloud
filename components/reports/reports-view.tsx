'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Coins,
  Timer,
  Server,
  Database,
  Layers,
  Award,
  ArrowUpRight,
  Route,
  Activity
} from 'lucide-react'
import { useAnalysis, useActiveProject } from '@/lib/store'
import { PageHeader, Section, Pill, MetricCard, Stagger, ScoreRing } from '@/components/shared/primitives'
import { formatUsd, formatMinutes, databaseLabel, SCENARIOS, simulateFailure } from '@/lib/engine'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FailureScenario } from '@/lib/types'

export function ReportsView() {
  const analysis = useAnalysis()
  const profile = useActiveProject()
  const { migration, architectures, recommendedIndex, security } = analysis
  const rec = architectures[recommendedIndex]
  const waf = rec.wellArchitected
  const wafAvg = Math.round((waf.security + waf.reliability + waf.performance + waf.cost + waf.operations) / 5)

  // Precompute DR matrix for all 5 scenarios
  const drScenarios = SCENARIOS.map((s) => ({
    key: s.id,
    title: s.title,
    result: simulateFailure(profile, rec, s.id)
  }))

  function handlePrint() {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  function handleDownloadJson() {
    const reportData = {
      project: profile,
      migrationStrategy: migration,
      recommendedArchitecture: rec,
      allArchitectures: architectures,
      securityAudit: security,
      wellArchitectedScores: waf,
      drMatrix: drScenarios.map((s) => ({
        scenario: s.title,
        rtoMinutes: s.result.rtoMinutes,
        rpoMinutes: s.result.rpoMinutes,
        dataLossMb: s.result.dataLossMb,
        recoveredBy: s.result.recoveredBy,
        narrative: s.result.narrative
      })),
      generatedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cloudshift-report-${profile.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 print:p-0 print:bg-white print:text-black">
      <PageHeader
        eyebrow="Step 08 · Comprehensive Executive Report"
        title="CloudShift AI Architecture & Migration Assessment"
        description="Consolidated report covering workload profile, migration strategy, AWS architecture bill of materials, security audit, DR resilience, and Well-Architected scorecard."
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button type="button" variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="size-4" />
              Print / Save as PDF
            </Button>
            <Button type="button" onClick={handleDownloadJson} className="gap-2 bg-primary text-primary-foreground font-semibold">
              <Download className="size-4" />
              Export JSON
            </Button>
          </div>
        }
      />

      {/* KPI Highlights */}
      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Recommended Strategy"
          value={migration.strategy}
          hint={`${migration.confidence}% algorithm confidence`}
          icon={Route}
          tone="primary"
        />
        <MetricCard
          label="Estimated Monthly Cost"
          value={rec.cost.total}
          format={(n) => formatUsd(n)}
          hint={`${rec.name}`}
          icon={Coins}
          tone="default"
        />
        <MetricCard
          label="Achieved RTO / RPO"
          value={`${formatMinutes(rec.rtoMinutes)} / ${formatMinutes(rec.rpoMinutes)}`}
          hint={`Targets: ${formatMinutes(profile.rtoMinutes)} / ${formatMinutes(profile.rpoMinutes)}`}
          icon={Timer}
          tone={rec.meets.rto && rec.meets.rpo ? 'success' : 'warning'}
        />
        <MetricCard
          label="Well-Architected Rating"
          value={wafAvg}
          format={(n) => `${n}%`}
          hint={`Security score: ${security.score}%`}
          icon={Award}
          tone="info"
        />
      </Stagger>

      {/* Executive Summary Card */}
      <Section title="Executive Summary" description="Overview of final architectural decision.">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <p className="text-sm leading-relaxed text-foreground">
            CloudShift AI analyzed <strong>{profile.name}</strong> ({profile.industry}) consisting of <strong>{profile.servers} {profile.os.toUpperCase()} servers</strong>, a <strong>{databaseLabel(profile.database)} database ({profile.dbSizeGb} GB)</strong>, and <strong>{profile.storageTb} TB</strong> storage.
          </p>
          <p className="text-sm leading-relaxed text-foreground">
            The platform recommends a <strong>{migration.strategy}</strong> migration into <strong>{rec.name}</strong> at an estimated monthly cost of <strong>{formatUsd(rec.cost.total)}</strong>. This satisfies the business availability target of <strong>{profile.availability}%</strong> while achieving an RTO of <strong>{formatMinutes(rec.rtoMinutes)}</strong> and an RPO of <strong>{formatMinutes(rec.rpoMinutes)}</strong>.
          </p>
        </div>
      </Section>

      {/* Disaster Recovery Resilience Matrix */}
      <Section title="Disaster Recovery Resilience Matrix (Project.md Section 13)" description="Comprehensive failure outcome across 5 injection scenarios.">
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-mono uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Failure Scenario</th>
                <th className="p-3">Target RTO / RPO</th>
                <th className="p-3">Achieved RTO</th>
                <th className="p-3">Achieved RPO</th>
                <th className="p-3">Data Loss</th>
                <th className="p-3">Recovery Mechanism</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drScenarios.map((sc) => (
                <tr key={sc.key} className="hover:bg-accent/40">
                  <td className="p-3 font-semibold text-foreground flex items-center gap-1.5">
                    <Activity className="size-3.5 text-danger" />
                    {sc.title}
                  </td>
                  <td className="p-3 font-mono">{formatMinutes(profile.rtoMinutes)} / {formatMinutes(profile.rpoMinutes)}</td>
                  <td className="p-3 font-mono font-semibold text-primary">{formatMinutes(sc.result.rtoMinutes)}</td>
                  <td className="p-3 font-mono font-semibold text-success">{formatMinutes(sc.result.rpoMinutes)}</td>
                  <td className="p-3 font-mono">{sc.result.dataLossMb === 0 ? '0 MB' : `${sc.result.dataLossMb} MB`}</td>
                  <td className="p-3 font-mono text-muted-foreground">{sc.result.recoveredBy}</td>
                  <td className="p-3">
                    <Pill tone={sc.result.meetsRto && sc.result.meetsRpo ? 'success' : 'danger'}>
                      {sc.result.meetsRto && sc.result.meetsRpo ? 'PASSED' : 'DEGRADED'}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Architecture Bill of Materials */}
      <Section title="AWS Architecture Bill of Materials (BoM)" description="Itemized monthly cloud service costs.">
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-mono uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Service / Resource</th>
                <th className="p-3">Category</th>
                <th className="p-3">Technical Specification</th>
                <th className="p-3">Monthly Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rec.components.map((c) => (
                <tr key={c.id} className="hover:bg-accent/40">
                  <td className="p-3 font-semibold text-foreground">{c.service}</td>
                  <td className="p-3"><Pill tone="info">{c.category}</Pill></td>
                  <td className="p-3 text-muted-foreground">{c.detail}</td>
                  <td className="p-3 font-mono font-bold text-primary">{c.monthlyCost > 0 ? formatUsd(c.monthlyCost) : 'Included'}</td>
                </tr>
              ))}
              <tr className="bg-primary/5 font-bold">
                <td className="p-3 text-foreground" colSpan={3}>Total Estimated Monthly Spend</td>
                <td className="p-3 font-mono text-base text-primary">{formatUsd(rec.cost.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}
