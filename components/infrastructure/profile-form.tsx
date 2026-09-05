'use client'

import { Cpu, Database, Activity, Globe, Target, SlidersHorizontal } from 'lucide-react'
import type { InfrastructureProfile, Priorities } from '@/lib/types'
import { COMPLIANCE_OPTIONS } from '@/lib/sample-projects'
import { Field, NumberInput, SelectInput, RangeInput, Toggle, ChipGroup, MultiChipGroup } from '@/components/shared/fields'
import { Section } from '@/components/shared/primitives'
import { formatNumber } from '@/lib/engine'

type Patch = (patch: Partial<InfrastructureProfile>) => void

const PRIORITY_COLORS: Record<keyof Priorities, string> = {
  cost: 'var(--primary)',
  availability: 'var(--success)',
  security: 'var(--destructive)',
  performance: 'var(--info)',
}

export function ComputeSection({ p, onChange }: { p: InfrastructureProfile; onChange: Patch }) {
  return (
    <Section title="Compute" description="Existing server estate." action={<Cpu className="size-4 text-primary" />}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Number of servers">
          {(id) => <NumberInput id={id} value={p.servers} min={1} onChange={(v) => onChange({ servers: v })} />}
        </Field>
        <Field label="Operating system">
          {(id) => (
            <SelectInput
              id={id}
              value={p.os}
              onChange={(e) => onChange({ os: e.target.value as InfrastructureProfile['os'] })}
              options={[
                { value: 'linux', label: 'Linux' },
                { value: 'windows', label: 'Windows Server' },
              ]}
            />
          )}
        </Field>
        <Field label="vCPUs per server">
          {(id) => <NumberInput id={id} value={p.vcpusPerServer} min={1} onChange={(v) => onChange({ vcpusPerServer: v })} />}
        </Field>
        <Field label="RAM per server">
          {(id) => <NumberInput id={id} value={p.ramGbPerServer} min={1} suffix="GB" onChange={(v) => onChange({ ramGbPerServer: v })} />}
        </Field>
        <Field label="Average CPU utilisation">
          {(id) => <RangeInput id={id} value={p.avgCpuUtil} min={5} max={100} format={(n) => `${n}%`} onChange={(v) => onChange({ avgCpuUtil: v })} />}
        </Field>
        <Field label="Average memory utilisation">
          {(id) => <RangeInput id={id} value={p.avgMemUtil} min={5} max={100} format={(n) => `${n}%`} onChange={(v) => onChange({ avgMemUtil: v })} />}
        </Field>
        <Toggle
          checked={p.containerized}
          onChange={(v) => onChange({ containerized: v })}
          label="Already containerised"
          description="Docker images exist for the application"
        />
      </div>
    </Section>
  )
}

export function DataSection({ p, onChange }: { p: InfrastructureProfile; onChange: Patch }) {
  return (
    <Section title="Data & storage" description="Databases and file storage." action={<Database className="size-4 text-info" />}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Database engine">
          {(id) => (
            <SelectInput
              id={id}
              value={p.database}
              onChange={(e) => onChange({ database: e.target.value as InfrastructureProfile['database'] })}
              options={[
                { value: 'mysql', label: 'MySQL / MariaDB' },
                { value: 'postgresql', label: 'PostgreSQL' },
                { value: 'oracle', label: 'Oracle Database' },
                { value: 'sqlserver', label: 'Microsoft SQL Server' },
                { value: 'mongodb', label: 'MongoDB' },
                { value: 'redis', label: 'Redis' },
                { value: 'none', label: 'No database' },
              ]}
            />
          )}
        </Field>
        <Field label="Database size">
          {(id) => <NumberInput id={id} value={p.dbSizeGb} min={0} suffix="GB" onChange={(v) => onChange({ dbSizeGb: v })} />}
        </Field>
        <Field label="Total file / object storage" hint="Drives Snowball vs online transfer decisions.">
          {(id) => <NumberInput id={id} value={p.storageTb} min={0} step={0.5} suffix="TB" onChange={(v) => onChange({ storageTb: v })} />}
        </Field>
        <Toggle
          checked={p.readHeavy}
          onChange={(v) => onChange({ readHeavy: v })}
          label="Read-heavy workload"
          description="Adds read replicas where appropriate"
        />
      </div>
    </Section>
  )
}

export function TrafficSection({ p, onChange }: { p: InfrastructureProfile; onChange: Patch }) {
  return (
    <Section title="Traffic & workload" description="Usage characteristics." action={<Activity className="size-4 text-success" />}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Monthly active users">
          {(id) => (
            <RangeInput
              id={id}
              value={p.monthlyUsers}
              min={1000}
              max={2_000_000}
              step={1000}
              format={formatNumber}
              onChange={(v) => onChange({ monthlyUsers: v })}
            />
          )}
        </Field>
        <Field label="Peak requests / second">
          {(id) => <NumberInput id={id} value={p.peakRps} min={1} onChange={(v) => onChange({ peakRps: v })} />}
        </Field>
        <Field label="Traffic pattern" className="sm:col-span-2">
          {() => (
            <ChipGroup
              value={p.trafficPattern}
              onChange={(v) => onChange({ trafficPattern: v })}
              options={[
                { value: 'steady', label: 'Steady' },
                { value: 'spiky', label: 'Spiky' },
                { value: 'seasonal', label: 'Seasonal' },
              ]}
            />
          )}
        </Field>
        <Field label="Workload type" className="sm:col-span-2">
          {() => (
            <ChipGroup
              value={p.workloadType}
              onChange={(v) => onChange({ workloadType: v })}
              options={[
                { value: 'web', label: 'Web application' },
                { value: 'api', label: 'API / microservices' },
                { value: 'batch', label: 'Batch processing' },
                { value: 'analytics', label: 'Analytics' },
                { value: 'legacy', label: 'Legacy monolith' },
              ]}
            />
          )}
        </Field>
      </div>
    </Section>
  )
}

export function EnvironmentSection({ p, onChange }: { p: InfrastructureProfile; onChange: Patch }) {
  return (
    <Section title="Environment" description="Connectivity constraints." action={<Globe className="size-4 text-warning" />}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          checked={p.lowBandwidth}
          onChange={(v) => onChange({ lowBandwidth: v })}
          label="Constrained WAN bandwidth"
          description="< 100 Mbps uplink to the internet"
        />
        <Toggle
          checked={p.edgeEnvironment}
          onChange={(v) => onChange({ edgeEnvironment: v })}
          label="Edge / disconnected sites"
          description="Remote locations with intermittent connectivity"
        />
      </div>
    </Section>
  )
}

export function RequirementsSection({ p, onChange }: { p: InfrastructureProfile; onChange: Patch }) {
  return (
    <Section title="Business requirements" description="Hard constraints the architecture must meet." action={<Target className="size-4 text-destructive" />}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Monthly budget">
          {(id) => <NumberInput id={id} value={p.budgetUsd} min={0} step={100} suffix="USD" onChange={(v) => onChange({ budgetUsd: v })} />}
        </Field>
        <Field label="Availability target">
          {(id) => (
            <SelectInput
              id={id}
              value={p.availability}
              onChange={(e) => onChange({ availability: e.target.value as InfrastructureProfile['availability'] })}
              options={[
                { value: '99', label: '99% — 3.65 days/yr downtime' },
                { value: '99.9', label: '99.9% — 8.7 hours/yr' },
                { value: '99.99', label: '99.99% — 52 minutes/yr' },
                { value: '99.999', label: '99.999% — 5 minutes/yr' },
              ]}
            />
          )}
        </Field>
        <Field label="RTO — Recovery Time Objective" hint="Maximum tolerable downtime.">
          {(id) => <NumberInput id={id} value={p.rtoMinutes} min={1} suffix="min" onChange={(v) => onChange({ rtoMinutes: v })} />}
        </Field>
        <Field label="RPO — Recovery Point Objective" hint="Maximum tolerable data loss window.">
          {(id) => <NumberInput id={id} value={p.rpoMinutes} min={0} suffix="min" onChange={(v) => onChange({ rpoMinutes: v })} />}
        </Field>
        <Field label="Performance requirement">
          {() => (
            <ChipGroup
              value={p.performance}
              onChange={(v) => onChange({ performance: v })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
            />
          )}
        </Field>
        <Field label="Security requirement">
          {() => (
            <ChipGroup
              value={p.security}
              onChange={(v) => onChange({ security: v })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
            />
          )}
        </Field>
        <Field label="Compliance frameworks" className="sm:col-span-2">
          {() => <MultiChipGroup options={COMPLIANCE_OPTIONS} value={p.compliance} onChange={(v) => onChange({ compliance: v })} />}
        </Field>
      </div>
    </Section>
  )
}

export function PrioritiesSection({ p, onChange }: { p: InfrastructureProfile; onChange: Patch }) {
  const total = Object.values(p.priorities).reduce((a, b) => a + b, 0)
  const keys = Object.keys(p.priorities) as (keyof Priorities)[]
  return (
    <Section
      title="Business priorities"
      description="Weights used by the multi-objective recommender."
      action={<SlidersHorizontal className="size-4 text-primary" />}
    >
      <div className="flex flex-col gap-5">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
          {keys.map((k) => (
            <span
              key={k}
              className="h-full transition-[width] duration-300"
              style={{ width: `${(p.priorities[k] / Math.max(1, total)) * 100}%`, background: PRIORITY_COLORS[k] }}
            />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {keys.map((k) => (
            <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
              {(id) => (
                <RangeInput
                  id={id}
                  value={p.priorities[k]}
                  format={(n) => `${n}%`}
                  accent={PRIORITY_COLORS[k]}
                  onChange={(v) => onChange({ priorities: { ...p.priorities, [k]: v } })}
                />
              )}
            </Field>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Weights are normalised automatically — total {total}%.
        </p>
      </div>
    </Section>
  )
}
