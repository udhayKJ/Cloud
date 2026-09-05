'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView, useMotionValue, useSpring, useTransform, animate } from 'motion/react'
import { ArrowRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      <div className="flex flex-col gap-2">
        {eyebrow && (
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-primary">{eyebrow}</span>
        )}
        <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
        {description && <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
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

export const staggerItem = {
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
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'info'
  className?: string
}) {
  const tones = {
    default: 'text-foreground',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
    info: 'text-info',
  }
  return (
    <motion.div
      variants={staggerItem}
      className={cn('card-sheen flex flex-col gap-3 rounded-xl border border-border bg-card p-5', className)}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {Icon && <Icon className={cn('size-4', tones[tone])} />}
      </div>
      <div className="flex items-baseline gap-1">
        {typeof value === 'number' ? (
          <AnimatedNumber value={value} format={format} className={cn('text-3xl font-semibold', tones[tone])} />
        ) : (
          <span className={cn('font-mono text-3xl font-semibold tabular-nums', tones[tone])}>{value}</span>
        )}
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <span className="text-xs leading-relaxed text-muted-foreground">{hint}</span>}
    </motion.div>
  )
}

/* ---------- Score ring ---------- */

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
    const controls = animate(c, c * (1 - value / 100), {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.style.strokeDashoffset = String(v)
      },
    })
    return () => controls.stop()
  }, [inView, value, c])

  return (
    <div className={cn('relative flex flex-col items-center gap-2', className)}>
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
      <span
        className="absolute font-mono font-semibold tabular-nums"
        style={{ top: size / 2 - 14, fontSize: size / 4.2 }}
      >
        <AnimatedNumber value={value} format={(n) => `${Math.round(n)}`} />
      </span>
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
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn('card-sheen flex flex-col rounded-xl border border-border bg-card', className)}>
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className={cn('p-5', bodyClassName)}>{children}</div>
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
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'info'
  className?: string
}) {
  const tones = {
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
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ---------- Next step ---------- */

export function NextStep({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 transition-colors hover:bg-primary/10"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">Next step</span>
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <ArrowRight className="size-5 text-primary transition-transform group-hover:translate-x-1" />
    </Link>
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
