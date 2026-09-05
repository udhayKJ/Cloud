'use client'

import { motion } from 'motion/react'
import { Route, Network, Coins, Siren, ShieldCheck, Gauge, GitCompare, Sparkles } from 'lucide-react'

const FEATURES = [
  {
    icon: Route,
    title: 'Migration decision engine',
    body: 'Rule-based Rehost / Replatform / Refactor scoring with service mapping: MySQL → Aurora, NAS → S3, cron → Step Functions. DMS, Snowball, Snowball Edge and Snowmobile chosen by data volume and connectivity.',
    span: 'lg:col-span-2',
  },
  {
    icon: Network,
    title: 'Architecture generation',
    body: 'Interactive React Flow diagrams with VPC, subnets, ALB, Auto Scaling, RDS/Aurora, S3, CloudFront and the security stack.',
  },
  {
    icon: Coins,
    title: 'Cost analysis',
    body: 'Compute, database, storage, network, security and ops broken out per option, benchmarked against budget.',
  },
  {
    icon: Siren,
    title: 'Disaster recovery simulator',
    body: 'Inject EC2, database, AZ, application and region failures. Watch the Step Functions runbook execute and measure RTO, RPO, data loss and availability impact.',
    span: 'lg:col-span-2',
  },
  {
    icon: ShieldCheck,
    title: 'Security analysis',
    body: 'IAM, KMS, VPC isolation, WAF + Shield, CloudTrail, Config and GuardDuty scored by severity.',
  },
  {
    icon: Gauge,
    title: 'Well-Architected scoring',
    body: 'Five pillars quantified for every option so trade-offs are explicit.',
  },
  {
    icon: GitCompare,
    title: 'Option comparison',
    body: 'Low Cost vs Balanced vs Enterprise HA — side by side on cost, RTO, RPO, availability and pillar scores.',
  },
  {
    icon: Sparkles,
    title: 'Explainable, not magic',
    body: 'Every recommendation carries a plain-language reason. An LLM layer can narrate decisions, never make them.',
  },
]

export function FeatureGrid() {
  return (
    <section id="features" className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-primary">Capabilities</span>
        <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
          Everything the demonstration flow needs, in one console.
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <motion.article
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: (i % 4) * 0.08, duration: 0.5 }}
            whileHover={{ y: -4 }}
            className={`card-sheen group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40 ${f.span ?? ''}`}
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <f.icon className="size-5" />
            </span>
            <h3 className="text-base font-semibold">{f.title}</h3>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
