'use client'

import { useMemo } from 'react'
import { Download, Printer, Coins, Timer, Award, Route, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useAnalysis, useActiveProject } from '@/lib/store'
import { PageHeader, Section, Pill, MetricCard, Stagger, Callout, CategoryBadge, buttonClass } from '@/components/shared/primitives'
import { formatUsd, formatMinutes, databaseLabel, SCENARIOS, simulateFailure } from '@/lib/engine'
import { cn } from '@/lib/utils'

export function ReportsView() {
  const analysis = useAnalysis()
  const profile = useActiveProject()
  const { migration, architectures, recommendedIndex, security } = analysis
  const rec = architectures[recommendedIndex]
  const waf = rec.wellArchitected
  const wafAvg = Math.round((waf.security + waf.reliability + waf.performance + waf.cost + waf.operations) / 5)

  // Precompute DR matrix for all 5 scenarios
  const drScenarios = useMemo(
    () => SCENARIOS.map((s) => ({ key: s.id, title: s.title, result: simulateFailure(profile, rec, s.id) })),
    [profile, rec],
  )
  const drPassed = drScenarios.filter((s) => s.result.meetsRto && s.result.meetsRpo).length
  const unmet = (
    [
      ['availability', `${profile.availability}% availability`],
      ['rto', `${formatMinutes(profile.rtoMinutes)} RTO`],
      ['rpo', `${formatMinutes(profile.rpoMinutes)} RPO`],
      ['budget', `${formatUsd(profile.budgetUsd)} budget`],
    ] as const
  ).filter(([k]) => !rec.meets[k])

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
        narrative: s.result.narrative,
      })),
      generatedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cloudshift-report-${profile.id}.json`
    // Some browsers (Firefox) only honour clicks on attached anchors and need the URL alive briefly.
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Step 08 · Final report"
        title={`Migration assessment — ${profile.name}`}
        description="Consolidated summary of the workload, migration strategy, recommended architecture, disaster-recovery results and bill of materials."
        actions={
          <>
            <button type="button" onClick={() => window.print()} className={buttonClass('secondary')}>
              <Printer />
              Print / Save PDF
            </button>
            <button type="button" onClick={handleDownloadJson} className={buttonClass('primary')}>
              <Download />
              Export JSON
            </button>
          </>
        }
      />

      <p className="hidden text-xs text-muted-foreground print:block" suppressHydrationWarning>
        Generated {new Date().toLocaleString()} · CloudShift AI
      </p>

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Strategy" value={migration.strategy} hint={`${migration.confidence}% of strategy score`} icon={Route} tone="primary" />
        <MetricCard
          label="Monthly cost"
          value={rec.cost.total}
          format={(n) => formatUsd(n)}
          hint={rec.name}
          icon={Coins}
          tone={rec.meets.budget ? 'default' : 'warning'}
        />
        <MetricCard
          label="RTO / RPO"
          value={`${formatMinutes(rec.rtoMinutes)} / ${formatMinutes(rec.rpoMinutes)}`}
          hint={`Targets ${formatMinutes(profile.rtoMinutes)} / ${formatMinutes(profile.rpoMinutes)}`}
          icon={Timer}
          tone={rec.meets.rto && rec.meets.rpo ? 'success' : 'warning'}
        />
        <MetricCard label="Well-Architected" value={wafAvg} format={(n) => `${Math.round(n)}%`} hint={`Security score ${security.score}%`} icon={Award} tone="info" />
      </Stagger>

      <Section title="Executive summary">
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-foreground/90">
            CloudShift AI analysed <strong>{profile.name}</strong> ({profile.industry}): {profile.servers}{' '}
            {profile.os === 'windows' ? 'Windows' : 'Linux'} server{profile.servers === 1 ? '' : 's'},{' '}
            {profile.database === 'none' ? (
              'no database tier'
            ) : (
              <>
                a {databaseLabel(profile.database)} database ({profile.dbSizeGb} GB)
              </>
            )}{' '}
            and {profile.storageTb} TB of file storage.
          </p>
          <p className="text-sm leading-relaxed text-foreground/90">
            The recommended path is a <strong>{migration.strategy}</strong> migration to <strong>{rec.name}</strong> at an estimated{' '}
            <strong>{formatUsd(rec.cost.total)}</strong> per month, with {rec.drStrategy.toLowerCase()} disaster recovery, an achievable RTO of{' '}
            <strong>{formatMinutes(rec.rtoMinutes)}</strong> and an RPO of <strong>{formatMinutes(rec.rpoMinutes)}</strong>.
          </p>
          {unmet.length === 0 ? (
            <Callout tone="success" icon={CheckCircle2}>
              This option meets every stated target: {profile.availability}% availability, RTO, RPO and budget.
            </Callout>
          ) : (
            <Callout tone="warning" icon={AlertTriangle} title="Trade-offs to review">
              Best overall option for the weighted priorities, but it does not meet the {unmet.map(([, l]) => l).join(', ')} target
              {unmet.length > 1 ? 's' : ''}. Adjust priorities or requirements in the infrastructure profile to explore alternatives.
            </Callout>
          )}
        </div>
      </Section>

      <Section
        title="Disaster recovery matrix"
        description={`Recommended architecture tested against all five failure scenarios — ${drPassed} of ${drScenarios.length} meet both RTO and RPO.`}
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="border-b border-border bg-background/40 text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Scenario</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">RTO</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">RPO</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Data loss</th>
                <th scope="col" className="px-3 py-3 font-medium">Recovered by</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drScenarios.map((sc) => {
                const ok = sc.result.meetsRto && sc.result.meetsRpo
                return (
                  <tr key={sc.key} className="hover:bg-accent/30">
                    <th scope="row" className="px-5 py-3 text-sm font-medium">{sc.title}</th>
                    <td className={cn('px-3 py-3 text-right font-mono tabular-nums', sc.result.meetsRto ? 'text-foreground' : 'text-destructive')}>
                      {formatMinutes(sc.result.rtoMinutes)}
                    </td>
                    <td className={cn('px-3 py-3 text-right font-mono tabular-nums', sc.result.meetsRpo ? 'text-foreground' : 'text-destructive')}>
                      {sc.result.rpoMinutes === 0 ? '0 min' : formatMinutes(sc.result.rpoMinutes)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums">{sc.result.dataLossMb.toLocaleString()} MB</td>
                    <td className="px-3 py-3 text-muted-foreground">{sc.result.recoveredBy}</td>
                    <td className="px-5 py-3 text-right">
                      <Pill tone={ok ? 'success' : 'destructive'}>{ok ? 'Met' : 'Breached'}</Pill>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border text-muted-foreground">
                <td colSpan={6} className="px-5 py-2.5">
                  Targets: RTO {formatMinutes(profile.rtoMinutes)} · RPO {formatMinutes(profile.rpoMinutes)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>

      <Section title="Bill of materials" description={`${rec.components.length} services in ${rec.name}.`} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="border-b border-border bg-background/40 text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Service</th>
                <th scope="col" className="px-3 py-3 font-medium">Category</th>
                <th scope="col" className="px-3 py-3 font-medium">Specification</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Monthly</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rec.components.map((c) => (
                <tr key={c.id} className="hover:bg-accent/30">
                  <th scope="row" className="px-5 py-2.5 text-sm font-medium">{c.service}</th>
                  <td className="px-3 py-2.5">
                    <CategoryBadge category={c.category} />
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{c.detail}</td>
                  <td className={cn('px-5 py-2.5 text-right font-mono tabular-nums', c.monthlyCost > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                    {c.monthlyCost > 0 ? formatUsd(c.monthlyCost) : 'Included'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-primary/5">
                <th scope="row" colSpan={3} className="px-5 py-3 text-sm font-semibold">
                  Total estimated monthly spend
                </th>
                <td className="px-5 py-3 text-right font-mono text-sm font-semibold tabular-nums text-primary">{formatUsd(rec.cost.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>
    </div>
  )
}
