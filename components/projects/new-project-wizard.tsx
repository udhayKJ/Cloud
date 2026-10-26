'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, Building2, Landmark, HeartPulse, FileCode2, AlertCircle } from 'lucide-react'
import type { InfrastructureProfile } from '@/lib/types'
import { DEFAULT_PROFILE, SAMPLE_PROJECTS, INDUSTRIES } from '@/lib/sample-projects'
import { useProjectStore } from '@/lib/store'
import { PageHeader, buttonClass } from '@/components/shared/primitives'
import { Field, TextInput, SelectInput } from '@/components/shared/fields'
import {
  ComputeSection,
  DataSection,
  TrafficSection,
  EnvironmentSection,
  RequirementsSection,
  PrioritiesSection,
} from '@/components/infrastructure/profile-form'
import { cn } from '@/lib/utils'

const STEPS = ['Basics', 'Workload', 'Requirements']
const MIN_NAME = 2

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
  const [industryTouched, setIndustryTouched] = useState(false)
  const [showNameError, setShowNameError] = useState(false)

  const patch = (p: Partial<InfrastructureProfile>) => setDraft((d) => ({ ...d, ...p }))

  const applyTemplate = (id: string) => {
    setTemplate(id)
    const t = TEMPLATES.find((x) => x.id === id)!
    // Keep what the user typed; take the template's industry unless one was explicitly chosen.
    setDraft((d) => ({
      ...t.base,
      id: 'new',
      name: d.name,
      description: d.description,
      industry: industryTouched || id === 'blank' ? d.industry : t.base.industry,
    }))
  }

  const nameValid = draft.name.trim().length >= MIN_NAME

  const goNext = () => {
    if (step === 0 && !nameValid) {
      setShowNameError(true)
      return
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  const create = () => {
    const name = draft.name.trim() || 'Untitled project'
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project'
    addProject({
      ...draft,
      id: `${slug}-${Date.now().toString(36)}`,
      name,
      description: draft.description.trim(),
      createdAt: new Date().toISOString(),
      status: 'draft',
    })
    router.push('/infrastructure')
  }

  return (
    <>
      <PageHeader
        eyebrow="New migration project"
        title="Create a project"
        description="Give the project a name, pick a starting template, then refine the workload and business requirements. Everything can be edited later."
      />

      <ol className="flex flex-wrap items-center gap-2" aria-label="Wizard progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              aria-current={i === step ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                i === step
                  ? 'border-primary bg-primary/10 text-primary'
                  : i < step
                    ? 'border-success/40 bg-success/10 text-success hover:bg-success/20'
                    : 'border-border text-muted-foreground',
              )}
            >
              <span className="flex size-4 items-center justify-center rounded-full bg-current/20 font-mono text-[10px]" aria-hidden="true">
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>
              {s}
            </button>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-6"
        >
          {step === 0 && (
            <>
              <section className="card-sheen rounded-xl border border-border bg-card p-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Field label="Project name *">
                      {(id) => (
                        <TextInput
                          id={id}
                          autoFocus
                          required
                          maxLength={80}
                          value={draft.name}
                          placeholder="e.g. Northwind ERP migration"
                          aria-invalid={showNameError && !nameValid ? true : undefined}
                          aria-describedby={showNameError && !nameValid ? 'name-error' : undefined}
                          onBlur={() => draft.name.length > 0 && setShowNameError(true)}
                          onKeyDown={(e) => e.key === 'Enter' && goNext()}
                          onChange={(e) => patch({ name: e.target.value })}
                        />
                      )}
                    </Field>
                    {showNameError && !nameValid && (
                      <span id="name-error" role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
                        <AlertCircle className="size-3.5" />
                        Enter a project name of at least {MIN_NAME} characters.
                      </span>
                    )}
                  </div>
                  <Field label="Industry">
                    {(id) => (
                      <SelectInput
                        id={id}
                        value={draft.industry}
                        onChange={(e) => {
                          setIndustryTouched(true)
                          patch({ industry: e.target.value })
                        }}
                        options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
                      />
                    )}
                  </Field>
                  <Field label="Description" className="sm:col-span-2">
                    {(id) => (
                      <TextInput
                        id={id}
                        maxLength={240}
                        value={draft.description}
                        placeholder="What runs on this infrastructure today?"
                        onChange={(e) => patch({ description: e.target.value })}
                      />
                    )}
                  </Field>
                </div>
              </section>
              <div className="flex flex-col gap-3">
                <span id="template-label" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Start from a template
                </span>
                <div role="radiogroup" aria-labelledby="template-label" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {TEMPLATES.map((t) => {
                    const active = t.id === template
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => applyTemplate(t.id)}
                        className={cn(
                          'card-sheen relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-all',
                          active
                            ? 'border-primary/70 bg-primary/5 shadow-[0_0_0_1px_var(--primary)_inset]'
                            : 'border-border bg-card hover:border-foreground/20 hover:bg-accent/40',
                        )}
                      >
                        {active && (
                          <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="size-3" strokeWidth={3} />
                          </span>
                        )}
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
              <EnvironmentSection p={draft} onChange={patch} />
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

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-3 border-t border-border bg-background/90 px-4 py-4 backdrop-blur-md md:-mx-8 md:px-8">
        <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className={buttonClass('secondary')}>
          <ArrowLeft />
          Back
        </button>
        <span className="hidden text-xs text-muted-foreground sm:block">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </span>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={goNext} className={buttonClass('primary', 'px-5')}>
            Continue
            <ArrowRight />
          </button>
        ) : (
          <button type="button" onClick={create} className={buttonClass('primary', 'px-5')}>
            <Check />
            Create project
          </button>
        )}
      </div>
    </>
  )
}
