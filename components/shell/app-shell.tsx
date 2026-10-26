'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { Sidebar, Brand, NavLinks } from './sidebar'
import { Topbar } from './topbar'
import { useProjectStore } from '@/lib/store'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Load saved projects after mount so the server render and first client render match.
  useEffect(() => {
    useProjectStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false)
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [mobileOpen])

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="flex min-h-svh bg-background">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                aria-hidden="true"
                className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Navigation"
                className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar md:hidden"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              >
                <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
                  <Brand />
                  <button
                    type="button"
                    autoFocus
                    onClick={() => setMobileOpen(false)}
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                    aria-label="Close navigation"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <nav className="flex flex-1 flex-col overflow-y-auto px-3 pb-4 scrollbar-thin" aria-label="Mobile">
                  <NavLinks onNavigate={() => setMobileOpen(false)} layoutId="mobile-active" />
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setMobileOpen(true)} />
          <main id="main-content" tabIndex={-1} className="relative flex-1 px-4 py-6 outline-none md:px-8 md:py-8 print:p-0">
            <div className="pointer-events-none absolute inset-0 dot-bg opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_40%)]" />
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto flex w-full max-w-7xl flex-col gap-8"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </>
  )
}
