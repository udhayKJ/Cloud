'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, Play, Server, Database, HardDrive, Globe, Shield, Activity } from 'lucide-react'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const LEFT = [
  { icon: Server, label: '6 × rack servers', sub: '4 vCPU / 16 GB' },
  { icon: Database, label: 'MySQL 5.7', sub: '500 GB primary' },
  { icon: HardDrive, label: 'NAS', sub: '5 TB images' },
]
const RIGHT = [
  { icon: Globe, label: 'CloudFront + WAF', sub: 'Edge & L7 protection' },
  { icon: Server, label: 'EC2 Auto Scaling', sub: '2–6 × m5.large, 2 AZ' },
  { icon: Database, label: 'Aurora MySQL', sub: 'Multi-AZ + replica' },
  { icon: HardDrive, label: 'S3 Lifecycle', sub: 'Standard → IA → Glacier' },
]

export function Hero() {
  return (
    <section className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-7">
        <motion.span
          variants={item}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          Explainable · Multi-objective · Deterministic
        </motion.span>
        <motion.h1
          variants={item}
          className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl"
        >
          Migrate to AWS with a plan you can <span className="text-gradient">break on purpose.</span>
        </motion.h1>
        <motion.p variants={item} className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          CloudShift AI analyses your on-premise estate, recommends Rehost / Replatform / Refactor, generates three
          AWS architectures weighted by your priorities, prices them, and simulates EC2, database, AZ and region
          failures to measure real RTO and RPO.
        </motion.p>
        <motion.div variants={item} className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground glow-primary transition-transform hover:scale-[1.02]"
          >
            Open the console
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/dr-simulator"
            className="inline-flex h-12 items-center gap-2 rounded-lg border border-border bg-card px-6 text-sm font-semibold transition-colors hover:bg-accent"
          >
            <Play className="size-4 text-primary" />
            Run a DR simulation
          </Link>
        </motion.div>
        <motion.dl variants={item} className="grid grid-cols-3 gap-6 border-t border-border pt-6">
          {[
            ['5', 'Failure scenarios'],
            ['3', 'Architecture options'],
            ['5', 'Well-Architected pillars'],
          ].map(([v, l]) => (
            <div key={l} className="flex flex-col gap-1">
              <dt className="font-mono text-2xl font-semibold text-foreground">{v}</dt>
              <dd className="text-xs text-muted-foreground">{l}</dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="card-sheen relative rounded-2xl border border-border bg-card p-5 md:p-6"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
          <div className="flex flex-col gap-2">
            <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              On-premise
            </span>
            {LEFT.map((n, i) => (
              <motion.div
                key={n.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.12 }}
                className="flex items-center gap-3 rounded-lg border border-border bg-background/50 px-3 py-2.5"
              >
                <n.icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex flex-col leading-tight">
                  <span className="text-xs font-medium">{n.label}</span>
                  <span className="text-[10px] text-muted-foreground">{n.sub}</span>
                </span>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center gap-2 px-1">
            <svg width="40" height="200" viewBox="0 0 40 200" className="text-primary" aria-hidden="true">
              {[30, 100, 170].map((y, i) => (
                <motion.path
                  key={y}
                  d={`M0 ${y} C 20 ${y}, 20 100, 40 100`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ delay: 1 + i * 0.1, duration: 0.8 }}
                  className="animate-flow"
                />
              ))}
            </svg>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 18 }}
              className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground animate-pulse-ring"
              aria-label="Decision engine"
            >
              <Activity className="size-4" />
            </motion.span>
            <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-primary">Engine</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              AWS target
            </span>
            {RIGHT.map((n, i) => (
              <motion.div
                key={n.label}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 + i * 0.12 }}
                className="flex items-center gap-3 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5"
              >
                <n.icon className="size-4 shrink-0 text-primary" />
                <span className="flex flex-col leading-tight">
                  <span className="text-xs font-medium">{n.label}</span>
                  <span className="text-[10px] text-muted-foreground">{n.sub}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4"
        >
          {[
            ['Strategy', 'Replatform', 'text-primary'],
            ['RTO / RPO', '3 min / 0', 'text-success'],
            ['Monthly', '$4,120', 'text-foreground'],
          ].map(([l, v, c]) => (
            <div key={l} className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</span>
              <span className={`font-mono text-sm font-semibold ${c}`}>{v}</span>
            </div>
          ))}
        </motion.div>
        <Shield className="pointer-events-none absolute -right-4 -top-4 size-24 text-primary/5" aria-hidden="true" />
      </motion.div>
    </section>
  )
}
