'use client'

import { motion } from 'motion/react'
import { Server, Search, Route, Network, Coins, Siren, Gauge, Award } from 'lucide-react'

const STEPS = [
  { icon: Server, label: 'Existing infrastructure' },
  { icon: Search, label: 'Infrastructure analysis' },
  { icon: Route, label: 'Migration strategy' },
  { icon: Network, label: 'AWS architecture' },
  { icon: Coins, label: 'Cost · security · perf' },
  { icon: Siren, label: 'DR simulation' },
  { icon: Gauge, label: 'Well-Architected' },
  { icon: Award, label: 'Final recommendation' },
]

export function PipelineStrip() {
  return (
    <section id="pipeline" className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-primary">Core pipeline</span>
        <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
          Eight deterministic stages. One explainable result.
        </h2>
      </div>
      <ol className="relative grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        <motion.span
          aria-hidden="true"
          className="absolute left-0 top-7 hidden h-px w-full origin-left bg-gradient-to-r from-primary via-primary/60 to-primary/10 lg:block"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
        {STEPS.map((s, i) => (
          <motion.li
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="relative flex flex-col items-start gap-3"
          >
            <span className="relative z-10 flex size-14 items-center justify-center rounded-xl border border-border bg-card text-primary card-sheen">
              <s.icon className="size-5" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
              <span className="text-xs font-medium leading-snug">{s.label}</span>
            </span>
          </motion.li>
        ))}
      </ol>
    </section>
  )
}
