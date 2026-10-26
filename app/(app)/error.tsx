'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { buttonClass } from '@/components/shared/primitives'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="text-xl font-semibold">Something went wrong on this page</h1>
      <p className="text-sm text-muted-foreground">
        The analysis could not be displayed. Try again, or go back to the dashboard. If a saved project is causing the problem,
        editing its profile usually fixes it.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={reset} className={buttonClass('primary')}>
          <RotateCcw />
          Try again
        </button>
        <Link href="/dashboard" className={buttonClass('secondary')}>
          Dashboard
        </Link>
      </div>
    </div>
  )
}
