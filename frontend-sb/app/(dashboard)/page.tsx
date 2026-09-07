"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules"
import { Badge } from "@/components/atoms"
import {
  Users,
  UserCheck,
  Clock,
  UserX,
  CalendarOff,
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react"
import { api } from "@/lib/api"
import type { Karyawan, Absensi, PengajuanIzin } from "@/lib/types"

const statusVariantMap: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  success: "success",
  warning: "warning",
  danger: "destructive",
  neutral: "secondary",
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function getStatusBadge(status: string): { label: string; variant: "success" | "warning" | "destructive" | "secondary" } {
  switch (status) {
    case "tepat waktu": return { label: "Tepat Waktu", variant: "success" }
    case "telat": return { label: "Terlambat", variant: "warning" }
    case "tidak hadir": return { label: "Tidak Hadir", variant: "destructive" }
    case "izin": return { label: "Izin", variant: "secondary" }
    case "sakit": return { label: "Sakit", variant: "warning" }
    case "cuti": return { label: "Cuti", variant: "secondary" }
    default: return { label: capitalize(status), variant: "secondary" }
  }
}

function formatTime(isoString: string | null): string {
  if (!isoString) return "—"
  const d = new Date(isoString)
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false })
}

export default function DashboardPage() {
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([])
  const [absensiList, setAbsensiList] = useState<Absensi[]>([])
  const [pendingIzin, setPendingIzin] = useState<PengajuanIzin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [karyawan, absensi, izin] = await Promise.all([
          api.get<Karyawan[]>("karyawan"),
          api.get<Absensi[]>("absensi"),
          api.get<PengajuanIzin[]>("pengajuan-izin?status=menunggu"),
        ])
        setKaryawanList(karyawan)
        setAbsensiList(absensi)
        setPendingIzin(izin)
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Compute stats from real data
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayAbsensi = absensiList.filter(a => {
    if (!a.jamMasukAktual) return false
    const d = new Date(a.jamMasukAktual)
    return d >= today && d < tomorrow
  })

  const presentCount = todayAbsensi.filter(a => a.statusKehadiran === "tepat waktu").length
  const lateCount = todayAbsensi.filter(a => a.statusKehadiran === "telat").length
  const absentCount = todayAbsensi.filter(a => a.statusKehadiran === "tidak hadir").length
  const leaveCount = todayAbsensi.filter(a => ["izin", "sakit", "cuti"].includes(a.statusKehadiran || "")).length

  const totalEmployees = karyawanList.length
  const activeEmployees = karyawanList.filter(k => k.statusAktif === "aktif").length

  const stats = [
    {
      label: "Total Karyawan",
      value: String(totalEmployees),
      change: `${activeEmployees} aktif`,
      trend: "up" as const,
      icon: Users,
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
    },
    {
      label: "Hadir Hari Ini",
      value: String(presentCount + lateCount),
      change: todayAbsensi.length > 0
        ? `${Math.round(((presentCount + lateCount) / Math.max(activeEmployees, 1)) * 100)}%`
        : "0%",
      trend: "up" as const,
      icon: UserCheck,
      iconBg: "#f0fdf4",
      iconColor: "#16a34a",
    },
    {
      label: "Terlambat",
      value: String(lateCount),
      change: "Hari ini",
      trend: lateCount > 0 ? "down" as const : "neutral" as const,
      icon: Clock,
      iconBg: "#fffbeb",
      iconColor: "#d97706",
    },
    {
      label: "Tidak Hadir",
      value: String(absentCount),
      change: "Hari ini",
      trend: "neutral" as const,
      icon: UserX,
      iconBg: "#fef2f2",
      iconColor: "#dc2626",
    },
    {
      label: "Izin/Sakit/Cuti",
      value: String(leaveCount),
      change: "Hari ini",
      trend: "neutral" as const,
      icon: CalendarOff,
      iconBg: "#faf5ff",
      iconColor: "#9333ea",
    },
    {
      label: "Menunggu Approval",
      value: String(pendingIzin.length),
      change: pendingIzin.length > 0 ? "Perlu ditinjau" : "Tidak ada",
      trend: "neutral" as const,
      icon: FileText,
      iconBg: "#f0fdf4",
      iconColor: "#0891b2",
    },
  ]

  // Recent attendance (today, sorted by time desc)
  const recentAttendance = todayAbsensi
    .sort((a, b) => new Date(b.jamMasukAktual!).getTime() - new Date(a.jamMasukAktual!).getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
          style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #dcfce7" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          System Operational
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card group">
            <div className="flex items-start justify-between mb-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: stat.iconBg }}
              >
                <stat.icon
                  style={{ width: "1.125rem", height: "1.125rem", color: stat.iconColor }}
                />
              </div>
              {stat.trend === "up" && (
                <ArrowUpRight
                  style={{ width: "1rem", height: "1rem", color: "#16a34a" }}
                />
              )}
              {stat.trend === "down" && (
                <ArrowDownRight
                  style={{ width: "1rem", height: "1rem", color: "#dc2626" }}
                />
              )}
            </div>
            <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {stat.value}
            </div>
            <div className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {stat.label}
            </div>
            <div className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Recent Attendance */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Absensi Terbaru
              </CardTitle>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Check-in hari ini
              </p>
            </div>
            <TrendingUp style={{ width: "1rem", height: "1rem", color: "var(--text-muted)" }} />
          </CardHeader>
          <CardContent className="pt-4 space-y-1">
            {recentAttendance.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
                Belum ada data absensi hari ini
              </p>
            ) : (
              recentAttendance.map((record) => {
                const badge = getStatusBadge(record.statusKehadiran || "")
                return (
                  <div
                    key={record.idAbsensi}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
                    style={{ borderRadius: "var(--radius-md)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-page)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Avatar */}
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ background: "var(--color-primary)" }}
                    >
                      {record.karyawan?.nama?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {record.karyawan?.nama || "—"}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {record.karyawan?.departemen?.namaDepartemen || "—"}
                      </div>
                    </div>
                    <div className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                      {formatTime(record.jamMasukAktual)}
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Menunggu Approval
              </CardTitle>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Pengajuan izin menunggu persetujuan
              </p>
            </div>
            {pendingIzin.length > 0 && (
              <span
                className="text-xs font-semibold rounded-full px-2 py-0.5"
                style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)", border: "1px solid var(--color-warning-border)" }}
              >
                {pendingIzin.length} pending
              </span>
            )}
          </CardHeader>
          <CardContent className="pt-4 space-y-1">
            {pendingIzin.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
                Tidak ada pengajuan menunggu
              </p>
            ) : (
              pendingIzin.slice(0, 5).map((req) => {
                const startDate = new Date(req.tanggalMulai)
                const endDate = new Date(req.tanggalSelesai)
                const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                const dateStr = days === 1
                  ? startDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                  : `${startDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} – ${endDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`

                return (
                  <div
                    key={req.idIzin}
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-page)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white mt-0.5"
                      style={{ background: "var(--color-neutral)" }}
                    >
                      {req.karyawan?.nama?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {req.karyawan?.nama || "—"}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {capitalize(req.jenisIzin)}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {dateStr} · {days} hari
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
