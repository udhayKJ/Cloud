'use client'

import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { analyseProject, formatUsd } from '@/lib/engine'
import { SAMPLE_PROJECTS } from '@/lib/sample-projects'
import { RangeInput } from '@/components/shared/fields'
import type { Priorities } from '@/lib/types'

const KEYS: (keyof Priorities)[] = ['cost', 'availability', 'security', 'performance']
const COLORS: Record<keyof Priorities, string> = {
  cost: 'var(--primary)',
  availability: 'var(--success)',
  security: 'var(--destructive)',
  performance: 'var(--info)',
}

export function ObjectivesDemo() {
  const [priorities, setPriorities] = useState<Priorities>({ cost: 40, availability: 20, security: 20, performance: 20 })

  const analysis = useMemo(
    () => analyseProject({ ...SAMPLE_PROJECTS[0], priorities }),
    [priorities],
  )
  const rec = analysis.architectures[analysis.recommendedIndex]

  return (
    <section id="objectives" className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
      <div className="flex flex-col gap-6">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
          Multi-objective recommendation
        </span>
        <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-4xl">
          Change the business priorities. Watch the architecture change.
        </h2>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
          Instead of returning one fixed answer, CloudShift AI weights cost, availability, security and performance
          simultaneously and re-scores Low Cost, Balanced and Enterprise HA options in real time.
        </p>
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          {KEYS.map((k) => (
            <div key={k} className="flex flex-col gap-1.5">
              <label htmlFor={`demo-${k}`} className="flex items-center gap-2 text-xs font-medium capitalize">
                <span className="size-2 rounded-full" style={{ background: COLORS[k] }} />
                {k}
              </label>
              <RangeInput
                id={`demo-${k}`}
                value={priorities[k]}
                onChange={(v) => setPriorities((p) => ({ ...p, [k]: v }))}
                format={(n) => `${n}%`}
                accent={COLORS[k]}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {analysis.architectures.map((a, i) => {
          const active = i === analysis.recommendedIndex
          return (
            <motion.div
              key={a.tier}
              layout
              animate={{ scale: active ? 1.02 : 1, opacity: active ? 1 : 0.75 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className={`card-sheen relative flex flex-col gap-3 rounded-2xl border p-5 ${
                active ? 'border-primary bg-primary/5 glow-primary' : 'border-border bg-card'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">{a.name}</span>
                  <span className="text-xs text-muted-foreground">{a.tagline}</span>
                </div>
                {active && (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                    Recommended
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3 border-t border-border pt-3">
                {[
                  ['Score', a.weightedScore.toFixed(1)],
                  ['Monthly', formatUsd(a.cost.total)],
                  ['RTO', `${a.rtoMinutes} min`],
                  ['Avail.', `${a.availabilityPct}%`],
                ].map(([l, v]) => (
                  <div key={l} className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</span>
                    <span className="font-mono text-sm font-semibold tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.span
                  className="h-full rounded-full"
                  style={{ background: active ? 'var(--primary)' : 'var(--muted-foreground)' }}
                  animate={{ width: `${a.weightedScore}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
            </motion.div>
          )
        })}
        <p className="text-xs text-muted-foreground">
          Recommended: <span className="font-semibold text-foreground">{rec.name}</span> — {rec.drStrategy} DR strategy,{' '}
          {rec.databaseService}.
        </p>
      </div>
    </section>
  )
}
