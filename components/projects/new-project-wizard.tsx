'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, Building2, Landmark, HeartPulse, FileCode2 } from 'lucide-react'
import type { InfrastructureProfile } from '@/lib/types'
import { DEFAULT_PROFILE, SAMPLE_PROJECTS, INDUSTRIES } from '@/lib/sample-projects'
import { useProjectStore } from '@/lib/store'
import { PageHeader } from '@/components/shared/primitives'
import { Field, TextInput, SelectInput } from '@/components/shared/fields'
import { ComputeSection, DataSection, TrafficSection, RequirementsSection, PrioritiesSection } from '@/components/infrastructure/profile-form'
import { cn } from '@/lib/utils'

const STEPS = ['Basics', 'Workload', 'Requirements']

const TEMPLATES = [
  { id: 'blank', name: 'Blank profile', desc: 'Start from sensible defaults.', icon: FileCode2, base: DEFAULT_PROFILE },
  { id: 'retail', name: 'Retail e-commerce', desc: 'PHP monolith, MySQL, 5 TB media.', icon: Building2, base: SAMPLE_PROJECTS[0] },
  { id: 'finance', name: 'Core banking', desc: 'Oracle, Windows, PCI-DSS, five nines.', icon: Landmark, base: SAMPLE_PROJECTS[1] },
  { id: 'health', name: 'Patient portal', desc: 'Containers, MongoDB, edge clinics.', icon: HeartPulse, base: SAMPLE_PROJECTS[2] },
]

export function NewProjectWizard() {
  const router = useRouter()
  const addProject = useProjectStore((s) => s.addProject)
  const [step, setStep] = useState(0)
  const [template, setTemplate] = useState('blank')
  const [draft, setDraft] = useState<InfrastructureProfile>({ ...DEFAULT_PROFILE, name: '', description: '' })

  const patch = (p: Partial<InfrastructureProfile>) => setDraft((d) => ({ ...d, ...p }))

  const applyTemplate = (id: string) => {
    setTemplate(id)
    const t = TEMPLATES.find((x) => x.id === id)!
    setDraft((d) => ({ ...t.base, id: 'new', name: d.name, description: d.description, industry: d.industry || t.base.industry }))
  }

  const create = () => {
    const id = `${draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'project'}-${Date.now().toString(36)}`
    addProject({ ...draft, id, createdAt: new Date().toISOString(), status: 'draft', name: draft.name || 'Untitled project' })
    router.push('/infrastructure')
  }

  const canNext = step === 0 ? draft.name.trim().length > 1 : true

  return (
    <>
      <PageHeader
        eyebrow="New migration project"
        title="Create a project"
        description="Give the project a name, pick a starting template, then refine the workload and business requirements."
      />

      <ol className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                i === step
                  ? 'border-primary bg-primary/10 text-primary'
                  : i < step
                    ? 'border-success/40 bg-success/10 text-success'
                    : 'border-border text-muted-foreground',
              )}
            >
              <span className="flex size-4 items-center justify-center rounded-full bg-current/20 font-mono text-[10px]">
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>
              {s}
            </button>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-6"
        >
          {step === 0 && (
            <>
              <section className="card-sheen rounded-xl border border-border bg-card p-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Project name">
                    {(id) => (
                      <TextInput
                        id={id}
                        autoFocus
                        value={draft.name}
                        placeholder="e.g. Northwind ERP migration"
                        onChange={(e) => patch({ name: e.target.value })}
                      />
                    )}
                  </Field>
                  <Field label="Industry">
                    {(id) => (
                      <SelectInput
                        id={id}
                        value={draft.industry}
                        onChange={(e) => patch({ industry: e.target.value })}
                        options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
                      />
                    )}
                  </Field>
                  <Field label="Description" className="sm:col-span-2">
                    {(id) => (
                      <TextInput
                        id={id}
                        value={draft.description}
                        placeholder="What runs on this infrastructure today?"
                        onChange={(e) => patch({ description: e.target.value })}
                      />
                    )}
                  </Field>
                </div>
              </section>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Start from a template</span>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {TEMPLATES.map((t) => {
                    const active = t.id === template
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t.id)}
                        className={cn(
                          'card-sheen flex flex-col gap-3 rounded-xl border p-4 text-left transition-all',
                          active ? 'border-primary bg-primary/5 glow-primary' : 'border-border bg-card hover:border-foreground/20',
                        )}
                      >
                        <t.icon className={cn('size-5', active ? 'text-primary' : 'text-muted-foreground')} />
                        <span className="text-sm font-semibold">{t.name}</span>
                        <span className="text-xs leading-relaxed text-muted-foreground">{t.desc}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <ComputeSection p={draft} onChange={patch} />
              <DataSection p={draft} onChange={patch} />
              <TrafficSection p={draft} onChange={patch} />
            </>
          )}
          {step === 2 && (
            <>
              <RequirementsSection p={draft} onChange={patch} />
              <PrioritiesSection p={draft} onChange={patch} />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-40"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
          >
            Continue
            <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={create}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground glow-primary transition-transform hover:scale-[1.02]"
          >
            <Check className="size-4" />
            Create project
          </button>
        )}
      </div>
    </>
  )
}
