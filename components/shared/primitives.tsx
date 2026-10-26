'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView, useMotionValue, useSpring, useTransform, animate, type Variants } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatUsd } from '@/lib/engine'
import type { ArchitectureOption, Tier } from '@/lib/types'

export type Tone = 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'info'

/* ---------- Buttons ---------- */

const BUTTON_BASE =
  'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0'

const BUTTON_VARIANTS = {
  primary: 'bg-primary font-semibold text-primary-foreground hover:bg-primary/90 active:translate-y-px',
  secondary: 'border border-border bg-card text-foreground hover:border-foreground/20 hover:bg-accent',
  ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
  destructive: 'border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20',
} as const

export function buttonClass(variant: keyof typeof BUTTON_VARIANTS = 'primary', className?: string) {
  return cn(BUTTON_BASE, BUTTON_VARIANTS[variant], className)
}

/* ---------- Page header ---------- */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        {eyebrow && (
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-primary">{eyebrow}</span>
        )}
        <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 print:hidden">{actions}</div>}
    </div>
  )
}

/* ---------- Reveal animation ---------- */

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

/* ---------- Animated number ---------- */

export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  className,
}: {
  value: number
  format?: (n: number) => string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 80, damping: 22 })
  const text = useTransform(spring, (v) => format(v))

  useEffect(() => {
    if (inView) mv.set(value)
  }, [inView, value, mv])

  useEffect(() => {
    const unsub = text.on('change', (v) => {
      if (ref.current) ref.current.textContent = v
    })
    return unsub
  }, [text])

  return (
    <span ref={ref} className={cn('font-mono tabular-nums', className)}>
      {format(0)}
    </span>
  )
}

/* ---------- Metric card ---------- */

const TONE_TEXT: Record<Tone, string> = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  info: 'text-info',
}

export function MetricCard({
  label,
  value,
  format,
  suffix,
  hint,
  icon: Icon,
  tone = 'default',
  className,
}: {
  label: string
  value: number | string
  format?: (n: number) => string
  suffix?: string
  hint?: string
  icon?: LucideIcon
  tone?: Tone
  className?: string
}) {
  return (
    <motion.div
      variants={staggerItem}
      className={cn('card-sheen flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-5', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {Icon && (
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg',
              tone === 'default' ? 'bg-muted text-muted-foreground' : 'bg-current/10',
              tone !== 'default' && TONE_TEXT[tone],
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <div className="flex min-w-0 items-baseline gap-1">
        {typeof value === 'number' ? (
          <AnimatedNumber value={value} format={format} className={cn('truncate text-2xl font-semibold xl:text-[1.75rem]', TONE_TEXT[tone])} />
        ) : (
          <span className={cn('truncate text-2xl font-semibold tracking-tight', TONE_TEXT[tone])} title={value}>
            {value}
          </span>
        )}
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <span className="text-xs leading-relaxed text-muted-foreground">{hint}</span>}
    </motion.div>
  )
}

/* ---------- Score ring ---------- */

export function scoreTone(value: number): Tone {
  return value >= 85 ? 'success' : value >= 70 ? 'primary' : 'destructive'
}

export function ScoreRing({
  value,
  size = 96,
  stroke = 8,
  label,
  className,
}: {
  value: number
  size?: number
  stroke?: number
  label?: string
  className?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const ref = useRef<SVGCircleElement>(null)
  const inView = useInView(ref, { once: true })
  const tone = value >= 85 ? 'var(--success)' : value >= 70 ? 'var(--primary)' : 'var(--destructive)'

  useEffect(() => {
    if (!inView || !ref.current) return
    const from = Number(ref.current.style.strokeDashoffset) || c
    const controls = animate(from, c * (1 - Math.min(100, Math.max(0, value)) / 100), {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.style.strokeDashoffset = String(v)
      },
    })
    return () => controls.stop()
  }, [inView, value, c])

  return (
    <div
      className={cn('flex flex-col items-center gap-2', className)}
      role="img"
      aria-label={`${label ?? 'Score'}: ${Math.round(value)} out of 100`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
          <circle
            ref={ref}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={tone}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-semibold" style={{ fontSize: size / 4.2 }}>
          <AnimatedNumber value={value} format={(n) => `${Math.round(n)}`} />
        </span>
      </div>
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
    </div>
  )
}

/* ---------- Section card ---------- */

export function Section({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: React.ReactNode
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn('card-sheen flex min-w-0 flex-col rounded-xl border border-border bg-card', className)}>
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className={cn('flex-1 p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

/* ---------- Pill ---------- */

export function Pill({
  children,
  tone = 'default',
  className,
}: {
  children: React.ReactNode
  tone?: Tone
  className?: string
}) {
  const tones: Record<Tone, string> = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/15 text-primary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    destructive: 'bg-destructive/15 text-destructive',
    info: 'bg-info/15 text-info',
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ---------- Next step ---------- */

export function NextStep({
  href,
  label,
  description,
  prev,
}: {
  href: string
  label: string
  description: string
  prev?: { href: string; label: string }
}) {
  return (
    <nav aria-label="Pipeline navigation" className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-stretch print:hidden">
      {prev && (
        <Link
          href={prev.href}
          className="group flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm transition-colors hover:bg-accent sm:w-64"
        >
          <ArrowLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Previous</span>
            <span className="truncate font-medium">{prev.label}</span>
          </span>
        </Link>
      )}
      <Link
        href={href}
        className="group flex flex-1 items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 transition-colors hover:bg-primary/10"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">Next step</span>
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
        <ArrowRight className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
      </Link>
    </nav>
  )
}

/* ---------- Tier switcher ---------- */

export const TIER_LABEL: Record<Tier, string> = { 'low-cost': 'Low cost', balanced: 'Balanced', enterprise: 'Enterprise HA' }

export function TierSwitcher({
  architectures,
  recommendedIndex,
  value,
  onChange,
  showBudget = false,
  label = 'Architecture option',
}: {
  architectures: ArchitectureOption[]
  recommendedIndex: number
  value: Tier
  onChange: (t: Tier) => void
  showBudget?: boolean
  label?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-3 sm:grid-cols-3">
      {architectures.map((a, idx) => {
        const selected = a.tier === value
        const recommended = idx === recommendedIndex
        return (
          <button
            key={a.tier}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(a.tier)}
            className={cn(
              'relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-all',
              selected
                ? 'border-primary/70 bg-primary/[0.06] shadow-[0_0_0_1px_var(--primary)_inset]'
                : 'border-border bg-card hover:border-foreground/20 hover:bg-accent/40',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-4 items-center justify-center rounded-full border transition-colors',
                    selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
                  )}
                >
                  {selected && <Check className="size-2.5" strokeWidth={3} />}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{TIER_LABEL[a.tier]}</span>
              </span>
              {recommended && <Pill tone="success">Recommended</Pill>}
            </div>
            <span className="text-sm font-semibold leading-snug">{a.name}</span>
            <div className="mt-auto flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-3">
              <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
                {formatUsd(a.cost.total)}
                <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">/mo</span>
              </span>
              {showBudget ? (
                <Pill tone={a.meets.budget ? 'success' : 'destructive'}>{a.meets.budget ? 'Within budget' : 'Over budget'}</Pill>
              ) : (
                <span className="font-mono text-xs text-muted-foreground">{a.availabilityPct}% SLA</span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Empty state & callout ---------- */

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-success/10 text-success">
        <Icon className="size-5" />
      </span>
      <span className="text-sm font-medium">{title}</span>
      {description && <span className="max-w-xs text-xs text-muted-foreground">{description}</span>}
    </div>
  )
}

const CALLOUT_TONES: Record<Exclude<Tone, 'default'>, { box: string; icon: string }> = {
  primary: { box: 'border-primary/30 bg-primary/5', icon: 'text-primary' },
  success: { box: 'border-success/30 bg-success/5', icon: 'text-success' },
  warning: { box: 'border-warning/30 bg-warning/5', icon: 'text-warning' },
  destructive: { box: 'border-destructive/30 bg-destructive/5', icon: 'text-destructive' },
  info: { box: 'border-info/30 bg-info/5', icon: 'text-info' },
}

export function Callout({
  tone = 'info',
  icon: Icon,
  title,
  children,
  className,
}: {
  tone?: Exclude<Tone, 'default'>
  icon?: LucideIcon
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex gap-3 rounded-lg border p-4', CALLOUT_TONES[tone].box, className)}>
      {Icon && <Icon className={cn('mt-0.5 size-4 shrink-0', CALLOUT_TONES[tone].icon)} />}
      <div className="flex min-w-0 flex-col gap-1">
        {title && <span className="text-sm font-semibold">{title}</span>}
        <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}

/* ---------- Category color ---------- */

export const CATEGORY_TONE: Record<string, string> = {
  compute: 'text-primary bg-primary/15 border-primary/30',
  database: 'text-info bg-info/15 border-info/30',
  storage: 'text-success bg-success/15 border-success/30',
  network: 'text-foreground bg-muted border-border',
  security: 'text-destructive bg-destructive/15 border-destructive/30',
  ops: 'text-warning bg-warning/15 border-warning/30',
  messaging: 'text-info bg-info/10 border-info/20',
  edge: 'text-primary bg-primary/10 border-primary/20',
  migration: 'text-warning bg-warning/10 border-warning/20',
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        CATEGORY_TONE[category] ?? CATEGORY_TONE.network,
      )}
    >
      {category}
    </span>
  )
}
