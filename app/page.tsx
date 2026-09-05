import Link from 'next/link'
import { ArrowRight, CloudLightning } from 'lucide-react'
import { Hero } from '@/components/landing/hero'
import { FeatureGrid } from '@/components/landing/feature-grid'
import { PipelineStrip } from '@/components/landing/pipeline-strip'
import { ObjectivesDemo } from '@/components/landing/objectives-demo'

export default function LandingPage() {
  return (
    <div className="relative min-h-svh overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 grid-bg [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />

      <header className="relative z-10 mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground glow-primary">
            <CloudLightning className="size-4" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">CloudShift AI</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Migration · Disaster Recovery
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex" aria-label="Landing">
          <a href="#pipeline" className="transition-colors hover:text-foreground">
            Pipeline
          </a>
          <a href="#features" className="transition-colors hover:text-foreground">
            Capabilities
          </a>
          <a href="#objectives" className="transition-colors hover:text-foreground">
            Multi-objective
          </a>
        </nav>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          Open console
          <ArrowRight className="size-4" />
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-28 px-6 pb-32 pt-10">
        <Hero />
        <PipelineStrip />
        <FeatureGrid />
        <ObjectivesDemo />

        <section className="card-sheen relative overflow-hidden rounded-3xl border border-primary/30 bg-card p-10 text-center md:p-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,var(--primary)_0%,transparent_60%)] opacity-20" />
          <div className="relative flex flex-col items-center gap-6">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
              Final demonstration flow
            </span>
            <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-5xl">
              From legacy rack to resilient AWS architecture in one guided session.
            </h2>
            <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
              Load a sample legacy infrastructure, run the analysis, generate three explainable architectures, break
              them on purpose, and prove RTO/RPO.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground glow-primary transition-transform hover:scale-[1.02]"
            >
              Launch CloudShift AI
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-muted-foreground md:flex-row">
          <span>CloudShift AI — Intelligent Cloud Migration &amp; Disaster Recovery Simulator</span>
          <span className="font-mono">React · TypeScript · Tailwind · React Flow · FastAPI · Boto3 · Terraform</span>
        </div>
      </footer>
    </div>
  )
}
