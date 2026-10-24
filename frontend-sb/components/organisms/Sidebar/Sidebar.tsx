"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useSidebar } from "@/lib/sidebar-context"
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
  UserCheck,
  X,
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
      { href: "/users", label: "Pengguna Sistem", icon: UserCog, roles: ["Admin", "HRD"] },
    ],
  },
  {
    label: "Manajemen Kerja",
    items: [
      { href: "/shifts", label: "Daftar Shift", icon: Clock, roles: ["Admin", "HRD", "SPV"] },
      { href: "/supervisor-schedule", label: "Jadwal Supervisor", icon: UserCheck, roles: ["Admin", "HRD"] },
      { href: "/schedule", label: "Jadwal Karyawan", icon: CalendarDays, roles: ["Admin", "HRD", "SPV"] },
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
      { href: "/profile", label: "Profil Saya", icon: UserCog, roles: ["Admin", "HRD", "SPV"] },
      { href: "/geofence", label: "Titik Kantor", icon: MapPin, roles: ["Admin"] },
      { href: "/reports", label: "Laporan", icon: BarChart3 },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const { isMobileOpen, setIsMobileOpen } = useSidebar()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentUserRole = user?.role || "Admin"

  // Dynamic title website & sidebar berdasarkan role pengguna
  const roleDisplay = {
    SPV: { title: "LARAS SuperVisor", subtitle: "SuperVisor Panel", badge: "SPV" },
    HRD: { title: "LARAS Human Resource", subtitle: "Human Resource Panel", badge: "HR" },
    Admin: { title: "LARAS Administrator", subtitle: "Admin Panel", badge: "ADM" },
  }[currentUserRole] || { title: "LARAS", subtitle: "Admin Panel", badge: "L" }

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = roleDisplay.title
    }
  }, [roleDisplay.title])

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || (pathname?.startsWith(`${href}/`) && href !== "/")
  }

  const handleLogout = () => {
    setIsMobileOpen(false)
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
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-[#090D16] border-r border-slate-200 dark:border-white/10 transition-transform duration-300 ease-in-out md:translate-x-0",
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
        style={{
          width: "var(--sidebar-width)",
        }}
      >
        {/* Logo & Header */}
        <div
          className="flex items-center gap-3 px-5 flex-shrink-0 h-16 border-b border-slate-200 dark:border-white/10"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold flex-shrink-0 bg-red-600 dark:bg-red-500"
          >
            {roleDisplay.badge}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold leading-tight truncate text-slate-900 dark:text-slate-50">
              {roleDisplay.title}
            </div>
            <div className="text-xs truncate text-slate-500 dark:text-slate-400">
              {roleDisplay.subtitle}
            </div>
          </div>
          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 focus:outline-none"
            aria-label="Tutup menu navigasi"
          >
            <X className="w-5 h-5" />
          </button>
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
                      onClick={() => setIsMobileOpen(false)}
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

        {/* User Info Footer */}
        <div
          className="flex-shrink-0 px-3 py-3 border-t border-slate-200 dark:border-white/10"
        >
          <Link
            href="/profile"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-2 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group cursor-pointer"
            title="Buka Pengaturan Profil (Username & Password)"
          >
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold bg-red-600 dark:bg-red-500 overflow-hidden"
            >
              {user?.fotoProfil ? (
                <img src={user.fotoProfil} alt="Profil" className="h-full w-full object-cover" />
              ) : user?.nama ? (
                user.nama.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
              ) : (
                "??"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate text-slate-900 dark:text-slate-50 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                {user?.nama || "Unknown"}
              </div>
              <div className="text-xs truncate text-slate-500 dark:text-slate-400">
                {user?.role || "—"} • Edit Profil
              </div>
            </div>
          </Link>
          
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
