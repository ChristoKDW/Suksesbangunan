"use client"

import { useTheme } from "next-themes"
import { Sun, Moon, ShieldCheck, Activity } from "lucide-react"
import { useSuperAdminAuth } from "@/lib/auth-context"

export function Topbar() {
  const { theme, setTheme } = useTheme()
  const { user } = useSuperAdminAuth()

  return (
    <header className="h-[var(--topbar-height)] bg-[var(--bg-topbar)] backdrop-blur border-b border-[var(--border-default)] px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Server Status Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Activity className="w-3.5 h-3.5" />
          <span>Server VPS: 103.247.11.91 (Online)</span>
        </div>
      </div>

      {/* Right: Theme Toggle & Role Badge */}
      <div className="flex items-center gap-4">
        {/* Dark/Light toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-hover-bg)] transition-colors"
          title="Toggle tema"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Role Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-[var(--border-default)]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            SUPER ADMIN / OWNER
          </span>
          <span className="text-xs font-medium text-[var(--text-secondary)] hidden sm:inline">
            {user?.nama || "Direksi"}
          </span>
        </div>
      </div>
    </header>
  )
}
