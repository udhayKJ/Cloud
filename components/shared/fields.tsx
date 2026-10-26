'use client'

import { useEffect, useId, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const base =
  'h-10 w-full rounded-lg border border-input bg-background/60 px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground hover:border-foreground/20 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/40 disabled:cursor-not-allowed disabled:opacity-50'

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: (id: string, labelId: string) => React.ReactNode
  className?: string
}) {
  const id = useId()
  const labelId = `${id}-label`
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label id={labelId} htmlFor={id} className="text-xs font-medium text-foreground/80">
        {label}
      </label>
      {children(id, labelId)}
      {hint && <span className="text-[11px] leading-relaxed text-muted-foreground">{hint}</span>}
    </div>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(base, props.className)} />
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number
  onChange: (n: number) => void
  suffix?: string
}) {
  // Keep the raw text locally so the field can be cleared while typing; only valid,
  // in-range numbers are committed, and the value is clamped when focus leaves.
  const [text, setText] = useState(() => (Number.isFinite(value) ? String(value) : ''))
  const [focused, setFocused] = useState(false)
  const lo = min === undefined ? -Infinity : Number(min)
  const hi = max === undefined ? Infinity : Number(max)

  useEffect(() => {
    if (!focused) setText(Number.isFinite(value) ? String(value) : '')
  }, [value, focused])

  const parsed = text.trim() === '' ? NaN : Number(text)
  const invalid = focused ? false : !Number.isFinite(parsed) || parsed < lo || parsed > hi

  return (
    <div className="relative flex items-center">
      <input
        type="number"
        inputMode="decimal"
        value={text}
        min={min}
        max={max}
        step={step}
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          setText(e.target.value)
          const n = e.target.value.trim() === '' ? NaN : Number(e.target.value)
          if (Number.isFinite(n) && n >= lo && n <= hi) onChange(n)
        }}
        onBlur={() => {
          setFocused(false)
          const n = Number.isFinite(parsed) ? Math.min(hi, Math.max(lo, parsed)) : Number.isFinite(lo) ? lo : value
          setText(String(n))
          if (n !== value) onChange(n)
        }}
        aria-invalid={invalid || undefined}
        {...rest}
        className={cn(base, 'font-mono tabular-nums', suffix && 'pr-14', rest.className)}
      />
      {suffix && <span className="pointer-events-none absolute right-3 text-xs text-muted-foreground">{suffix}</span>}
    </div>
  )
}

export function SelectInput({
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return (
    <div className="relative flex items-center">
      <select {...props} className={cn(base, 'appearance-none pr-9', props.className)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted-foreground" />
    </div>
  )
}

export function RangeInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format = (n) => `${n}`,
  id,
  accent = 'var(--primary)',
  label,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
  format?: (n: number) => string
  id?: string
  accent?: string
  label?: string
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  return (
    <div className="flex items-center gap-3">
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={format(value)}
        aria-label={label}
        style={{
          background: `linear-gradient(to right, ${accent} ${pct}%, var(--muted) ${pct}%)`,
        }}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110 focus-visible:ring-2 focus-visible:ring-ring [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-foreground"
      />
      <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums">{format(value)}</span>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring',
        checked ? 'border-primary/40 bg-primary/5' : 'border-border bg-background/40 hover:border-foreground/20',
      )}
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </span>
      <span
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-4 rounded-full bg-background shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  labelledBy,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  labelledBy?: string
}) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-8 rounded-lg border px-3 text-xs font-medium transition-all',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background/40 text-muted-foreground hover:border-foreground/30 hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function MultiChipGroup({
  options,
  value,
  onChange,
  labelledBy,
}: {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
  labelledBy?: string
}) {
  return (
    <div role="group" aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o)
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? value.filter((v) => v !== o) : [...value, o])}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all',
              active
                ? 'border-info bg-info/15 text-info'
                : 'border-border bg-background/40 text-muted-foreground hover:border-foreground/30 hover:text-foreground',
            )}
          >
            {active && <Check className="size-3" strokeWidth={3} />}
            {o}
          </button>
        )
      })}
    </div>
  )
}
