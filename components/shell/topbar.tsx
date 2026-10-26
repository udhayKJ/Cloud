'use client'

import { usePathname } from 'next/navigation'
import { Menu, FolderOpen, ChevronDown } from 'lucide-react'
import { useProjectStore, useActiveProject } from '@/lib/store'
import { NAV_ITEMS, isNavActive } from './nav'
import { cn } from '@/lib/utils'

export const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  analysed: 'bg-info/15 text-info',
  simulated: 'bg-success/15 text-success',
}

export const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  analysed: 'Analysed',
  simulated: 'DR tested',
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname()
  const projects = useProjectStore((s) => s.projects)
  const setActive = useProjectStore((s) => s.setActive)
  const active = useActiveProject()
  const current = NAV_ITEMS.find((n) => isNavActive(pathname, n.href))
  const totalSteps = NAV_ITEMS.filter((n) => n.step).length

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:gap-4 md:px-8 print:hidden">
      <button
        type="button"
        onClick={onMenu}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {current?.step ? `Step ${current.step} of ${totalSteps}` : 'Workspace'}
        </span>
        <span className="truncate text-sm font-semibold md:text-base">{current?.label ?? 'CloudShift AI'}</span>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <label className="relative flex min-w-0 items-center">
          <span className="sr-only">Active project</span>
          <FolderOpen className="pointer-events-none absolute left-3 size-4 text-primary" aria-hidden="true" />
          <select
            value={active?.id}
            onChange={(e) => setActive(e.target.value)}
            className="h-9 w-full max-w-[150px] cursor-pointer appearance-none truncate rounded-lg border border-input bg-card pl-9 pr-8 text-sm font-medium outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[220px] md:max-w-xs"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 size-4 text-muted-foreground" aria-hidden="true" />
        </label>
        {active && (
          <span
            className={cn(
              'hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider lg:inline-flex',
              STATUS_STYLES[active.status],
            )}
            title="Project status"
          >
            {STATUS_LABEL[active.status]}
          </span>
        )}
      </div>
    </header>
  )
}
