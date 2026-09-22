"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Clock,
  CalendarDays,
  CalendarCheck,
  ClipboardCheck,
  Coffee,
  FileText,
  DollarSign,
  BarChart3,
  MapPin,
  ChevronRight,
  LogOut,
  UserCog,
  type LucideIcon,
} from "lucide-react"

type Role = "Admin" | "HRD" | "SPV"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  roles?: Role[] // Optional, if empty means all roles
}

interface NavGroup {
  label: string | null
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { href: "/", label: "Beranda", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Manajemen Karyawan",
    items: [
      { href: "/employees", label: "Karyawan", icon: Users, roles: ["Admin", "HRD"] },
      { href: "/departments", label: "Departemen", icon: Building2, roles: ["Admin", "HRD"] },
      { href: "/positions", label: "Jabatan", icon: Briefcase, roles: ["Admin", "HRD"] },
      { href: "/users", label: "Pengguna Sistem", icon: UserCog, roles: ["Admin"] },
    ],
  },
  {
    label: "Manajemen Kerja",
    items: [
      { href: "/shifts", label: "Daftar Shift", icon: Clock, roles: ["Admin", "HRD", "SPV"] },
      { href: "/schedule", label: "Jadwal Kerja", icon: CalendarDays, roles: ["Admin", "HRD", "SPV"] },
      { href: "/holidays", label: "Hari Penting", icon: CalendarCheck, roles: ["Admin", "HRD"] },
    ],
  },
  {
    label: "Kehadiran & Absensi",
    items: [
      { href: "/attendance", label: "Data Absensi", icon: ClipboardCheck },
      { href: "/breaks", label: "Waktu Istirahat", icon: Coffee },
    ],
  },
  {
    label: "Pengajuan",
    items: [
      { href: "/leave-requests", label: "Pengajuan", icon: FileText, roles: ["Admin", "HRD", "SPV"] },
    ],
  },
  {
    label: "Keuangan",
    items: [
      { href: "/payroll", label: "Penggajian", icon: DollarSign, roles: ["Admin", "HRD"] },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      { href: "/geofence", label: "Titik Kantor", icon: MapPin, roles: ["Admin"] },
      { href: "/reports", label: "Laporan", icon: BarChart3 },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentUserRole = user?.role || "Admin"

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || (pathname?.startsWith(`${href}/`) && href !== "/")
  }

  const handleLogout = () => {
    logout()
  }

  if (!mounted || isLoading) return null // Prevent hydration mismatch

  // Filter groups based on currentUserRole
  const filteredNavGroups = navGroups.map(group => {
    return {
      ...group,
      items: group.items.filter(item => !item.roles || item.roles.includes(currentUserRole))
    }
  }).filter(group => group.items.length > 0)

  return (
    <aside
      className="fixed inset-y-0 left-0 z-20 flex flex-col bg-white dark:bg-[#090D16] border-r border-slate-200 dark:border-white/10"
      style={{
        width: "var(--sidebar-width)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 flex-shrink-0 h-16 border-b border-slate-200 dark:border-white/10"
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold flex-shrink-0 bg-red-600 dark:bg-red-500"
        >
          HR
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold leading-tight truncate text-slate-900 dark:text-slate-50">Core Enterprise</div>
          <div className="text-xs truncate text-slate-500 dark:text-slate-400">
            Admin Panel
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {filteredNavGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <div className="sidebar-section-label">{group.label}</div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("sidebar-nav-item", active && "active")}
                  >
                    <item.icon
                      className="flex-shrink-0"
                      style={{ width: "1rem", height: "1rem" }}
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && (
                      <ChevronRight
                        style={{ width: "0.875rem", height: "0.875rem", opacity: 0.6 }}
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className="flex-shrink-0 px-3 py-3 border-t border-slate-200 dark:border-white/10"
      >
        <div
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-2 bg-slate-50 dark:bg-white/5"
        >
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold bg-red-600 dark:bg-red-500"
          >
            {user?.nama
              ? user.nama.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
              : "??"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium truncate text-slate-900 dark:text-slate-50">{user?.nama || "Unknown"}</div>
            <div className="text-xs truncate text-slate-500 dark:text-slate-400">
              {user?.role || "—"}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
