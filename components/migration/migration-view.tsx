'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  Route,
  ArrowRight,
  Database,
  Server,
  Network,
  Truck,
  Layers,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react'
import { useAnalysis, useActiveProject } from '@/lib/store'
import { PageHeader, Section, Pill, MetricCard, Stagger, staggerItem } from '@/components/shared/primitives'
import { askAIExplanation } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function MigrationView() {
  const analysis = useAnalysis()
  const profile = useActiveProject()
  const { migration, architectures, recommendedIndex } = analysis
  const rec = architectures[recommendedIndex]

  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState<string | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)

  async function handleAskAi(q: string) {
    setLoadingAi(true)
    setAiQuestion(q)
    const ans = await askAIExplanation(q, profile, rec.tier)
    setAiAnswer(ans)
    setLoadingAi(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Step 02 · Migration Analysis"
        title="Intelligent Migration Recommendation"
        description="Deterministic multi-objective evaluation mapping legacy servers, databases, and data to target AWS services."
        actions={
          <Link
            href="/architecture"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Generate Architecture
            <ArrowRight className="size-4" />
          </Link>
        }
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Recommended Strategy"
          value={migration.strategy}
          hint={`${migration.confidence}% algorithm confidence`}
          icon={Route}
          tone="primary"
        />
        <MetricCard
          label="Data Migration Tool"
          value={migration.dataMigration.method.split(' ')[0] + ' ' + (migration.dataMigration.method.split(' ')[1] || '')}
          hint={`Est. ${migration.dataMigration.estimatedDays} days transfer`}
          icon={Truck}
          tone="info"
        />
        <MetricCard
          label="Database Migration"
          value={migration.dbMigration.method.includes('DMS') ? 'AWS DMS' : 'Online Sync'}
          hint="Continuous CDC replication"
          icon={Database}
          tone="success"
        />
        <MetricCard
          label="Connectivity"
          value={migration.connectivity.method.includes('Direct Connect') ? 'Direct Connect' : 'Site-to-Site VPN'}
          hint="Encrypted hybrid tunnel"
          icon={Network}
          tone="default"
        />
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Strategy Breakdown */}
        <Section title="Strategy Scoring (6Rs Framework)" description="Multi-objective deterministic weights based on workload & constraints.">
          <div className="flex flex-col gap-4">
            {(['Rehost', 'Replatform', 'Refactor'] as const).map((strat) => {
              const score = migration.strategyScores[strat] || 0
              const isChosen = strat === migration.strategy
              return (
                <div key={strat} className={cn('flex flex-col gap-2 rounded-lg border p-3 transition-colors', isChosen ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30' : 'border-border bg-card')}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{strat}</span>
                    <Pill tone={isChosen ? 'primary' : 'default'}>{score}%</Pill>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className={cn('h-full rounded-full', isChosen ? 'bg-primary' : 'bg-muted-foreground/40')}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )
            })}

            <div className="mt-2 flex flex-col gap-2 rounded-lg border border-border bg-accent/30 p-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Strategy Rationale</span>
              <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                {migration.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="size-3.5 shrink-0 text-success mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* Mappings */}
        <Section title="Source to Target AWS Mappings" description="Component-level transformation mapping." className="lg:col-span-2">
          <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {migration.mappings.map((m, i) => (
              <div key={i} className="flex flex-col gap-2 p-4 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{m.source}</span>
                    <ArrowRight className="size-3.5 text-primary shrink-0" />
                    <span className="text-sm font-semibold text-foreground truncate">{m.target}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{m.reason}</p>
                </div>
                <Pill tone="info" className="self-start sm:self-center shrink-0">{m.category}</Pill>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Migration Tools & Phased Plan */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Migration Execution Methodologies" description="Dedicated AWS data transfer & replication services.">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-primary font-medium text-sm">
                <Truck className="size-4" />
                <span>Bulk Data Migration</span>
              </div>
              <span className="text-base font-semibold">{migration.dataMigration.method}</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{migration.dataMigration.reason}</p>
              <div className="mt-auto pt-2 text-[11px] font-mono text-primary font-semibold">
                Est. Duration: {migration.dataMigration.estimatedDays} days
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-success font-medium text-sm">
                <Database className="size-4" />
                <span>Database Migration</span>
              </div>
              <span className="text-base font-semibold">{migration.dbMigration.method}</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{migration.dbMigration.reason}</p>
              <div className="mt-auto pt-2 text-[11px] font-mono text-success font-semibold">
                Zero Downtime CDC
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-info font-medium text-sm">
                <Server className="size-4" />
                <span>Server Migration</span>
              </div>
              <span className="text-base font-semibold">{migration.serverMigration.method}</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{migration.serverMigration.reason}</p>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-warning font-medium text-sm">
                <Network className="size-4" />
                <span>Hybrid Connectivity</span>
              </div>
              <span className="text-base font-semibold">{migration.connectivity.method}</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{migration.connectivity.reason}</p>
            </div>
          </div>
        </Section>

        {/* Phased Roadmap */}
        <Section title="Phased Migration Roadmap" description="Structured multi-phase execution timeline.">
          <div className="flex flex-col gap-3">
            {migration.phases.map((ph, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-mono text-xs font-semibold">
                  0{idx + 1}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{ph.title}</span>
                    <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />
                      {ph.duration}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {ph.tasks.map((t, ti) => (
                      <li key={ti}>• {t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* AI Explanation Layer (Project.md Section 6) */}
      <Section
        title="AI Architecture Explanation Layer"
        description="Explainable cloud reasoning powered by the deterministic decision engine (Project.md Section 6)."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              'Why was Aurora selected?',
              'Why was Snowball recommended?',
              'Why is Multi-AZ required?',
              'Why is Architecture B more expensive?',
              'How does Step Functions compare to SWF?',
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleAskAi(q)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                <Sparkles className="size-3 text-primary" />
                {q}
              </button>
            ))}
          </div>

          {loadingAi && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground animate-pulse">
              <Sparkles className="size-4 text-primary animate-spin" />
              Generating deterministic architectural rationale...
            </div>
          )}

          {aiAnswer && !loadingAi && (
            <div className="flex flex-col gap-2 rounded-lg border border-primary/40 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Sparkles className="size-4" />
                <span>CloudShift AI Explanation: {aiQuestion}</span>
              </div>
              <div className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                {aiAnswer}
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}
