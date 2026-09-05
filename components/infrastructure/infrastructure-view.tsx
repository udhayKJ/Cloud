'use client'

import { motion, AnimatePresence } from 'motion/react'
import { Sparkles, Route, Database, Truck, Coins, Timer } from 'lucide-react'
import { useActiveProject, useAnalysis, useProjectStore } from '@/lib/store'
import { formatUsd, formatMinutes } from '@/lib/engine'
import { PageHeader, NextStep, Pill } from '@/components/shared/primitives'
import { Field, TextInput, SelectInput } from '@/components/shared/fields'
import { INDUSTRIES } from '@/lib/sample-projects'
import {
  ComputeSection,
  DataSection,
  TrafficSection,
  EnvironmentSection,
  RequirementsSection,
  PrioritiesSection,
} from './profile-form'

export function InfrastructureView() {
  const profile = useActiveProject()
  const update = useProjectStore((s) => s.updateActive)
  const analysis = useAnalysis()
  const rec = analysis.architectures[analysis.recommendedIndex]

  return (
    <>
      <PageHeader
        eyebrow="Step 01 · Infrastructure profile"
        title="Describe the existing estate"
        description="Every field feeds the deterministic decision engine. The live panel updates as you type so you can see how each input shifts the recommendation."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <section className="card-sheen rounded-xl border border-border bg-card p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Project name">
                {(id) => <TextInput id={id} value={profile.name} onChange={(e) => update({ name: e.target.value })} />}
              </Field>
              <Field label="Industry">
                {(id) => (
                  <SelectInput
                    id={id}
                    value={profile.industry}
                    onChange={(e) => update({ industry: e.target.value })}
                    options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
                  />
                )}
              </Field>
              <Field label="Description" className="sm:col-span-2">
                {(id) => (
                  <TextInput
                    id={id}
                    value={profile.description}
                    placeholder="Short summary of the legacy workload"
                    onChange={(e) => update({ description: e.target.value })}
                  />
                )}
              </Field>
            </div>
          </section>
          <ComputeSection p={profile} onChange={update} />
          <DataSection p={profile} onChange={update} />
          <TrafficSection p={profile} onChange={update} />
          <EnvironmentSection p={profile} onChange={update} />
          <RequirementsSection p={profile} onChange={update} />
          <PrioritiesSection p={profile} onChange={update} />
          <NextStep href="/migration" label="Run migration analysis" description="Score Rehost / Replatform / Refactor and map services." />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-sheen relative overflow-hidden rounded-xl border border-primary/30 bg-card p-5">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-semibold">Live engine preview</span>
            </div>
            <ul className="flex flex-col divide-y divide-border">
              <PreviewRow icon={Route} label="Strategy">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={analysis.migration.strategy}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    <Pill tone="primary">{analysis.migration.strategy}</Pill>
                  </motion.span>
                </AnimatePresence>
              </PreviewRow>
              <PreviewRow icon={Database} label="Database target">
                <span className="text-right text-xs font-medium">{rec.databaseService}</span>
              </PreviewRow>
              <PreviewRow icon={Truck} label="Data migration">
                <span className="text-right text-xs font-medium">{analysis.migration.dataMigration.method}</span>
              </PreviewRow>
              <PreviewRow icon={Coins} label="Recommended cost">
                <span className={`font-mono text-sm font-semibold ${rec.meets.budget ? 'text-success' : 'text-destructive'}`}>
                  {formatUsd(rec.cost.total)}
                </span>
              </PreviewRow>
              <PreviewRow icon={Timer} label="RTO / RPO">
                <span className={`font-mono text-sm font-semibold ${rec.meets.rto && rec.meets.rpo ? 'text-success' : 'text-warning'}`}>
                  {formatMinutes(rec.rtoMinutes)} / {formatMinutes(rec.rpoMinutes)}
                </span>
              </PreviewRow>
            </ul>
            <div className="mt-4 flex flex-col gap-2 rounded-lg bg-background/50 p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recommended option</span>
              <span className="text-sm font-semibold">{rec.name}</span>
              <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.span
                  className="h-full rounded-full bg-primary"
                  animate={{ width: `${rec.weightedScore}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
              <span className="font-mono text-xs text-muted-foreground">score {rec.weightedScore.toFixed(1)} / 100</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

function PreviewRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      {children}
    </li>
  )
}
