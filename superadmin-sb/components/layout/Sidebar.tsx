"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  TrendingUp,
  ShieldAlert,
  SlidersHorizontal,
  Server,
  Database,
  ToggleRight,
  LogOut,
  ShieldCheck,
  LifeBuoy,
  UserCog,
} from "lucide-react"
import { useSuperAdminAuth } from "@/lib/auth-context"
import { confirmDialog } from "@/lib/swal"

interface MenuItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface MenuSection {
  section: string
  items: MenuItem[]
}

const MENU_SECTIONS: MenuSection[] = [
  {
    section: "EXECUTIVE",
    items: [
      { title: "Overview Dashboard", href: "/", icon: LayoutDashboard },
      { title: "Financial & Payroll", href: "/financial-insights", icon: TrendingUp },
    ],
  },
  {
    section: "AUDIT & SECURITY",
    items: [
      { title: "Forensic Audit Trail", href: "/audit-trail", icon: ShieldAlert },
      { title: "Kelola User Superadmin", href: "/superadmin-users", icon: UserCog },
      { title: "Laporan Masalah", href: "/issue-reports", icon: LifeBuoy },
      { title: "Emergency Overrides", href: "/emergency-control", icon: SlidersHorizontal },
    ],
  },
  {
    section: "SISTEM & DEVOPS",
    items: [
      { title: "Server Health & Logs", href: "/system-health", icon: Server },
      { title: "Database Backups", href: "/database-backups", icon: Database },
      { title: "Feature Flags & Config", href: "/feature-flags", icon: ToggleRight },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useSuperAdminAuth()

  const handleLogout = async () => {
    const ok = await confirmDialog("Apakah Anda yakin ingin keluar dari panel Super Admin?", {
      title: "Logout Super Admin",
      confirmText: "Ya, Keluar",
      danger: true,
    })
    if (ok) logout()
  }

  return (
    <aside className="w-[var(--sidebar-width)] flex-shrink-0 bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] flex flex-col min-h-screen">
      {/* Brand Header */}
      <div className="h-[var(--topbar-height)] flex items-center gap-3 px-6 border-b border-[var(--border-default)]">
        <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
          SB
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-base tracking-tight leading-none text-[var(--text-primary)]">
            LARAS
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-red-600 uppercase mt-0.5">
            Super Admin
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {MENU_SECTIONS.map((sec) => (
          <div key={sec.section} className="space-y-1.5">
            <p className="px-3 text-[11px] font-bold tracking-wider text-[var(--sidebar-section-label)] uppercase">
              {sec.section}
            </p>
            <div className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold"
                        : "text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-hover-bg)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-red-600 dark:text-red-400" : "text-gray-400"}`} />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-surface-raised)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
              <ShieldCheck className="w-4 h-4 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                {user?.nama || "Super Admin"}
              </p>
              <p className="text-[10px] text-red-600 dark:text-red-400 font-medium truncate">
                Owner / Direksi
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar"
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
