'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className={`grid h-9 w-9 place-items-center rounded-full text-foreground transition-colors hover:bg-surface ${className ?? ''}`}
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-[18px] w-[18px]" strokeWidth={1.5} />
        ) : (
          <Moon className="h-[18px] w-[18px]" strokeWidth={1.5} />
        )
      ) : (
        <div className="h-[18px] w-[18px]" />
      )}
    </button>
  )
}
