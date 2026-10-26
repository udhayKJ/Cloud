'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { CloudLightning, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_GROUPS, isNavActive, type NavItem } from './nav'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-lg" aria-label="CloudShift AI home">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <CloudLightning className="size-4" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight">CloudShift AI</span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Migration · DR</span>
        </span>
      )}
    </Link>
  )
}

export function NavLinks({
  collapsed = false,
  onNavigate,
  layoutId = 'sidebar-active',
}: {
  collapsed?: boolean
  onNavigate?: () => void
  layoutId?: string
}) {
  const pathname = usePathname()
  return (
    <>
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {collapsed ? (
            <span className="mx-auto my-2 h-px w-6 bg-sidebar-border" aria-hidden="true" />
          ) : (
            <span className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
              {group.label}
            </span>
          )}
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isNavActive(pathname, item.href)}
              collapsed={collapsed}
              onNavigate={onNavigate}
              layoutId={layoutId}
            />
          ))}
        </div>
      ))}
    </>
  )
}

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
  layoutId,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
  onNavigate?: () => void
  layoutId: string
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground',
        active && 'text-sidebar-foreground',
        collapsed && 'justify-center px-0',
      )}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-lg bg-sidebar-accent ring-1 ring-primary/25"
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        />
      )}
      {active && !collapsed && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" aria-hidden="true" />}
      <Icon className={cn('relative size-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground')} />
      {!collapsed && <span className="relative flex-1 truncate">{item.label}</span>}
      {!collapsed && item.step && (
        <span className={cn('relative font-mono text-[10px] tabular-nums text-muted-foreground/70', active && 'text-primary')}>
          0{item.step}
        </span>
      )}
    </Link>
  )
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out md:flex print:hidden',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-sidebar-border', collapsed ? 'justify-center px-2' : 'px-4')}>
        <Brand compact={collapsed} />
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto px-3 pb-3 scrollbar-thin" aria-label="Primary">
        <NavLinks collapsed={collapsed} />
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
