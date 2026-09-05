'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, FolderOpen, ChevronDown, Bell } from 'lucide-react'
import { useProjectStore, useActiveProject } from '@/lib/store'
import { NAV_ITEMS } from './nav'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  analysed: 'bg-info/15 text-info',
  simulated: 'bg-success/15 text-success',
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname()
  const projects = useProjectStore((s) => s.projects)
  const setActive = useProjectStore((s) => s.setActive)
  const active = useActiveProject()
  const current = NAV_ITEMS.find((n) => pathname.startsWith(n.href))

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-8">
      <button
        type="button"
        onClick={onMenu}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {current?.step ? `Step 0${current.step}` : 'Workspace'}
        </span>
        <h1 className="truncate text-sm font-semibold md:text-base">{current?.label ?? 'CloudShift AI'}</h1>
      </div>

      <div className="flex items-center gap-2">
        <label className="relative flex items-center">
          <span className="sr-only">Active project</span>
          <FolderOpen className="pointer-events-none absolute left-3 size-4 text-primary" />
          <select
            value={active?.id}
            onChange={(e) => setActive(e.target.value)}
            className="h-9 max-w-[180px] appearance-none rounded-lg border border-input bg-card pl-9 pr-8 text-sm font-medium outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring md:max-w-xs"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 size-4 text-muted-foreground" />
        </label>
        {active && (
          <span
            className={cn(
              'hidden rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider sm:inline-flex',
              STATUS_STYLES[active.status],
            )}
          >
            {active.status}
          </span>
        )}
        <Link
          href="/dr-simulator"
          className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Alerts"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
        </Link>
      </div>
    </header>
  )
}
