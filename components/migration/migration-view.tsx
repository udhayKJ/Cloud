'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Route, ArrowRight, Database, Server, Network, Truck, Sparkles, CheckCircle, Clock, Send, Loader2 } from 'lucide-react'
import { useAnalysis, useActiveProject, useProjectStore } from '@/lib/store'
import {
  PageHeader,
  Section,
  Pill,
  MetricCard,
  Stagger,
  NextStep,
  CategoryBadge,
  buttonClass,
} from '@/components/shared/primitives'
import { askAIExplanation } from '@/lib/api-client'
import { cn } from '@/lib/utils'

const SUGGESTED_QUESTIONS = [
  'Why was this database selected?',
  'Why was this data migration method recommended?',
  'Why is Multi-AZ required?',
  'What drives the monthly cost?',
  'How does Step Functions compare to SWF?',
]

export function MigrationView() {
  const analysis = useAnalysis()
  const profile = useActiveProject()
  const advanceStatus = useProjectStore((s) => s.advanceStatus)
  const { migration, architectures, recommendedIndex } = analysis
  const rec = architectures[recommendedIndex]

  const [draftQuestion, setDraftQuestion] = useState('')
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState<string | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const requestId = useRef(0)

  // Opening this step runs the migration analysis for the active project.
  useEffect(() => {
    advanceStatus(profile.id, 'analysed')
  }, [profile.id, advanceStatus])

  // Answers belong to a specific project; clear them when the project changes.
  useEffect(() => {
    requestId.current++
    setAiAnswer(null)
    setAiQuestion('')
    setLoadingAi(false)
  }, [profile.id])

  async function handleAskAi(q: string) {
    const question = q.trim()
    if (!question) return
    const id = ++requestId.current
    setLoadingAi(true)
    setAiQuestion(question)
    const ans = await askAIExplanation(question, profile, rec.tier)
    // Ignore responses for questions that have since been superseded.
    if (id !== requestId.current) return
    setAiAnswer(ans)
    setLoadingAi(false)
  }

  const totalScore = Object.values(migration.strategyScores).reduce((a, b) => a + b, 0) || 1
  const noDb = migration.dbMigration.method === 'Not required'
  const usesDms = migration.dbMigration.method.includes('DMS')
  const dataTool = migration.dataMigration.method.split(' + ')[0].replace(/^AWS /, '')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Step 02 · Migration analysis"
        title="Migration recommendation"
        description="Rule-based scoring of Rehost, Replatform and Refactor, with a component-by-component mapping from the legacy estate to AWS services."
        actions={
          <Link href="/architecture" className={buttonClass('primary')}>
            Generate architecture
            <ArrowRight />
          </Link>
        }
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Recommended strategy"
          value={migration.strategy}
          hint={`${migration.confidence}% of the total strategy score`}
          icon={Route}
          tone="primary"
        />
        <MetricCard
          label="Data migration"
          value={dataTool}
          hint={`Est. ${migration.dataMigration.estimatedDays} day${migration.dataMigration.estimatedDays === 1 ? '' : 's'} to transfer ${profile.storageTb} TB`}
          icon={Truck}
          tone="info"
        />
        <MetricCard
          label="Database migration"
          value={noDb ? 'Not required' : usesDms ? 'AWS DMS' : 'Online sync'}
          hint={noDb ? 'No database tier in this estate' : usesDms ? 'Continuous change data capture' : migration.dbMigration.method}
          icon={Database}
          tone={noDb ? 'default' : 'success'}
        />
        <MetricCard
          label="Connectivity"
          value={migration.connectivity.method.includes('Direct Connect') ? 'Direct Connect' : 'Site-to-Site VPN'}
          hint={migration.connectivity.method.includes('Direct Connect') ? 'Dedicated link with VPN backup' : 'Encrypted IPsec tunnel'}
          icon={Network}
          tone="default"
        />
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Strategy scoring" description="Share of the total rule score each strategy received.">
          <div className="flex flex-col gap-3">
            {(['Rehost', 'Replatform', 'Refactor'] as const).map((strat) => {
              const raw = migration.strategyScores[strat] || 0
              const share = Math.round((raw / totalScore) * 100)
              const isChosen = strat === migration.strategy
              return (
                <div
                  key={strat}
                  className={cn(
                    'flex flex-col gap-2 rounded-lg border p-3 transition-colors',
                    isChosen ? 'border-primary/50 bg-primary/5' : 'border-border bg-background/40',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {strat}
                      {isChosen && <Pill tone="primary">Selected</Pill>}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {share}% <span className="text-muted-foreground/60">· {raw} pts</span>
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                    role="meter"
                    aria-label={`${strat} score share`}
                    aria-valuenow={share}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <motion.div
                      className={cn('h-full rounded-full', isChosen ? 'bg-primary' : 'bg-muted-foreground/40')}
                      initial={{ width: 0 }}
                      animate={{ width: `${share}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )
            })}

            {migration.reasons.length > 0 && (
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why {migration.strategy}</span>
                <ul className="flex flex-col gap-2 text-xs leading-relaxed text-muted-foreground">
                  {migration.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 size-3.5 shrink-0 text-success" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>

        <Section
          title="Source → AWS service mapping"
          description="How each legacy component moves to AWS."
          className="lg:col-span-2"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {migration.mappings.map((m, i) => (
              <li key={i} className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-accent/30">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono text-xs text-muted-foreground">{m.source}</span>
                  <ArrowRight className="size-3.5 shrink-0 text-primary" aria-label="migrates to" />
                  <span className="text-sm font-semibold text-foreground">{m.target}</span>
                  <span className="ml-auto">
                    <CategoryBadge category={m.category} />
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{m.reason}</p>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Migration tooling" description="AWS services used to move servers, data and databases.">
          <div className="grid gap-3 sm:grid-cols-2">
            <ToolCard icon={Truck} tone="text-primary" title="Bulk data" method={migration.dataMigration.method} reason={migration.dataMigration.reason}>
              Est. {migration.dataMigration.estimatedDays} day{migration.dataMigration.estimatedDays === 1 ? '' : 's'}
            </ToolCard>
            <ToolCard icon={Database} tone="text-success" title="Database" method={migration.dbMigration.method} reason={migration.dbMigration.reason}>
              {noDb ? null : usesDms ? 'Near-zero downtime cutover' : 'Online replication'}
            </ToolCard>
            <ToolCard icon={Server} tone="text-info" title="Servers" method={migration.serverMigration.method} reason={migration.serverMigration.reason} />
            <ToolCard icon={Network} tone="text-warning" title="Hybrid connectivity" method={migration.connectivity.method} reason={migration.connectivity.reason} />
          </div>
        </Section>

        <Section title="Phased roadmap" description="Recommended execution timeline.">
          <ol className="relative flex flex-col gap-4">
            <span className="absolute bottom-3 left-[13px] top-3 w-px bg-border" aria-hidden="true" />
            {migration.phases.map((ph, idx) => (
              <li key={idx} className="relative flex items-start gap-3">
                <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-card font-mono text-xs font-semibold text-primary">
                  {idx + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-lg border border-border bg-background/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{ph.title}</span>
                    <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {ph.duration}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {ph.tasks.map((t, ti) => (
                      <li key={ti} className="flex gap-2">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden="true" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <Section
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Ask about this recommendation
          </span>
        }
        description="Plain-language explanations generated from the decision engine's output. Uses the backend when it is running, otherwise a local summary."
      >
        <div className="flex flex-col gap-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              handleAskAi(draftQuestion)
            }}
          >
            <label htmlFor="ai-question" className="sr-only">
              Your question
            </label>
            <input
              id="ai-question"
              value={draftQuestion}
              onChange={(e) => setDraftQuestion(e.target.value)}
              placeholder="e.g. Why is Aurora better than RDS here?"
              maxLength={300}
              className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background/60 px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground hover:border-foreground/20 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button type="submit" disabled={!draftQuestion.trim() || loadingAi} className={buttonClass('primary')}>
              {loadingAi ? <Loader2 className="animate-spin" /> : <Send />}
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setDraftQuestion(q)
                  handleAskAi(q)
                }}
                disabled={loadingAi}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          <div aria-live="polite">
            {loadingAi && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                Generating explanation…
              </div>
            )}

            {aiAnswer && !loadingAi && (
              <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <span className="text-xs font-semibold text-primary">{aiQuestion}</span>
                <FormattedAnswer text={aiAnswer} />
              </div>
            )}
          </div>
        </div>
      </Section>

      <NextStep
        prev={{ href: '/infrastructure', label: 'Infrastructure profile' }}
        href="/architecture"
        label="Generate architecture options"
        description="Compare Low Cost, Balanced and Enterprise HA designs."
      />
    </div>
  )
}

function ToolCard({
  icon: Icon,
  tone,
  title,
  method,
  reason,
  children,
}: {
  icon: typeof Truck
  tone: string
  title: string
  method: string
  reason: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background/40 p-4">
      <div className={cn('flex items-center gap-2 text-xs font-semibold uppercase tracking-wider', tone)}>
        <Icon className="size-4" />
        {title}
      </div>
      <span className="text-sm font-semibold leading-snug">{method}</span>
      <p className="text-xs leading-relaxed text-muted-foreground">{reason}</p>
      {children && <div className={cn('mt-auto pt-2 font-mono text-[11px] font-semibold', tone)}>{children}</div>}
    </div>
  )
}

/** Renders the backend's lightweight markdown (**bold** and "- " bullets) safely without HTML injection. */
function FormattedAnswer({ text }: { text: string }) {
  const renderInline = (line: string) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    )
  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/90">
      {text
        .split('\n')
        .filter((l) => l.trim())
        .map((line, i) =>
          line.trim().startsWith('- ') ? (
            <div key={i} className="flex gap-2 pl-1">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <span>{renderInline(line.trim().slice(2))}</span>
            </div>
          ) : (
            <p key={i}>{renderInline(line)}</p>
          ),
        )}
    </div>
  )
}
