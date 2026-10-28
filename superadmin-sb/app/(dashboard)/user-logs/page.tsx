"use client"

import { useState, useEffect } from "react"
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Globe,
  Smartphone,
  ShieldCheck,
  PowerOff,
  Clock,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Activity,
} from "lucide-react"
import { api } from "@/lib/api"
import { useSuperAdminAuth } from "@/lib/auth-context"
import { confirmDialog, showSuccess, toast } from "@/lib/swal"
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton"

interface UserLogItem {
  idLog: number
  idUser?: number | null
  idKaryawan?: number | null
  nama: string
  username: string
  role: string
  platform: "web" | "mobile" | "superadmin"
  ipAddress?: string | null
  deviceInfo?: string | null
  isOnline: boolean
  loginAt: string
  lastActiveAt?: string
  logoutAt?: string | null
}

export default function UserLogsPage() {
  const { user } = useSuperAdminAuth()
  const [logs, setLogs] = useState<UserLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState({
    totalToday: 0,
    activeNow: 0,
    totalMobile: 0,
    totalWeb: 0,
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [logsData, statsData] = await Promise.all([
        api.get<UserLogItem[]>("/super-admin/user-logs"),
        api.get<{ totalToday: number; activeNow: number; totalMobile: number; totalWeb: number }>(
          "/super-admin/user-logs/stats"
        ),
      ])

      if (Array.isArray(logsData)) {
        setLogs(logsData)
      } else {
        setLogs([])
      }

      if (statsData) {
        setStats(statsData)
      }
    } catch (err) {
      console.log("No user logs or server unreachable:", err)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleKickSession = async (log: UserLogItem) => {
    const ok = await confirmDialog(
      `Apakah Anda yakin ingin memutuskan sesi aktif untuk "${log.nama}" (@${log.username})? Pengguna akan dipaksa keluar ke halaman login.`,
      {
        title: "Putuskan Sesi Pengguna",
        confirmText: "Ya, Putuskan Sesi",
        danger: true,
      }
    )

    if (ok) {
      try {
        await api.post(`/super-admin/user-logs/${log.idLog}/kick`, {})

        // Jika akun yang di-kick adalah akun yang sedang digunakan saat ini di browser ini
        if (
          user &&
          user.username?.toLowerCase() === log.username.toLowerCase() &&
          log.platform === "superadmin"
        ) {
          localStorage.removeItem("superAdminToken")
          localStorage.removeItem("superAdminUser")
          document.cookie = "superAdminToken=; path=/; max-age=0; SameSite=Strict"
          window.location.href = "/login?kicked=1"
          return
        }

        showSuccess(`Sesi untuk ${log.nama} (@${log.username}) berhasil diputuskan. Pengguna akan dikeluarkan ke halaman login.`, "Sesi Diputus")
        await fetchData()
      } catch (e: any) {
        toast(e.message || "Gagal memutuskan sesi", "error")
      }
    }
  }

  const filteredLogs = logs.filter((item) => {
    const matchSearch =
      search === "" ||
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.username.toLowerCase().includes(search.toLowerCase()) ||
      (item.ipAddress && item.ipAddress.includes(search)) ||
      (item.deviceInfo && item.deviceInfo.toLowerCase().includes(search.toLowerCase()))

    const matchPlatform = platformFilter === "all" || item.platform === platformFilter
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "online" && item.isOnline) ||
      (statusFilter === "offline" && !item.isOnline)

    return matchSearch && matchPlatform && matchStatus
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-6 h-6 text-red-600" />
            <span>User Log & Status Akses</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Pemantauan langsung riwayat login pengguna dan deteksi status sesi aktif (online / offline) di seluruh platform LARAS.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-secondary)] hover:text-red-600 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-600" : ""}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Pengguna Online Sekarang */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Sedang Aktif (Online)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600">{stats.activeNow} Pengguna</p>
            <p className="text-[11px] text-[var(--text-muted)]">Sesi sedang tersambung aktif</p>
          </div>

          {/* Card 2: Total Login Hari Ini */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Total Sesi Hari Ini</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[var(--text-primary)]">{stats.totalToday} Sesi</p>
            <p className="text-[11px] text-[var(--text-muted)]">Aktivitas autentikasi masuk</p>
          </div>

          {/* Card 3: Mobile Sesi */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Sesi Mobile App</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[var(--text-primary)]">{stats.totalMobile}</p>
            <p className="text-[11px] text-[var(--text-muted)]">Aplikasi Android & iOS karyawan</p>
          </div>

          {/* Card 4: Web Admin Sesi */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Sesi Web & Superadmin</span>
              <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[var(--text-primary)]">{stats.totalWeb}</p>
            <p className="text-[11px] text-[var(--text-muted)]">Browser portal admin & eksekutif</p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, username, IP, perangkat..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-primary)] focus:outline-none focus:border-red-600 transition"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Filter:</span>
          </div>

          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-red-600"
          >
            <option value="all">Semua Platform</option>
            <option value="superadmin">🛡️ Super Admin</option>
            <option value="web">💻 Web Admin</option>
            <option value="mobile">📱 Mobile App</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-red-600"
          >
            <option value="all">Semua Status Akses</option>
            <option value="online">🟢 Sedang Aktif (Online)</option>
            <option value="offline">⚪ Selesai (Offline)</option>
          </select>
        </div>
      </div>

      {/* User Logs Table */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm space-y-4">
        {loading ? (
          <SkeletonTable rows={5} />
        ) : (
          <div className="overflow-x-auto border border-[var(--border-default)] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-[var(--text-secondary)] font-bold uppercase border-b border-[var(--border-default)]">
                <tr>
                  <th className="py-3.5 px-4">Pengguna</th>
                  <th className="py-3.5 px-4">Platform & Perangkat</th>
                  <th className="py-3.5 px-4">Alamat IP</th>
                  <th className="py-3.5 px-4">Waktu Login</th>
                  <th className="py-3.5 px-4">Status Akses</th>
                  <th className="py-3.5 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)] text-[var(--text-primary)]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="font-bold text-xs text-[var(--text-secondary)]">Belum ada riwayat aktivitas login</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Setiap kali ada pengguna masuk ke Aplikasi Mobile, Web Admin, atau Superadmin, log dan status aktif akan tercatat di sini secara otomatis.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.idLog} className="hover:bg-[var(--sidebar-item-hover-bg)] transition">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 font-bold flex items-center justify-center text-xs shrink-0">
                            {log.nama ? log.nama[0].toUpperCase() : "U"}
                          </div>
                          <div>
                            <span className="font-bold text-xs block text-[var(--text-primary)]">{log.nama}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-gray-400">@{log.username}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                {log.role}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Platform & Device */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {log.platform === "mobile" ? (
                            <Smartphone className="w-4 h-4 text-purple-500 shrink-0" />
                          ) : log.platform === "superadmin" ? (
                            <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
                          ) : (
                            <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                          )}
                          <div>
                            <span className="font-semibold capitalize text-xs block">
                              {log.platform === "superadmin"
                                ? "Super Admin"
                                : log.platform === "mobile"
                                ? "Mobile App"
                                : "Web Admin"}
                            </span>
                            <span className="text-[10px] text-gray-400 block truncate max-w-xs" title={log.deviceInfo || ""}>
                              {log.deviceInfo || "Perangkat Tidak Dikenal"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* IP Address */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500">
                        {log.ipAddress || "103.247.11.91"}
                      </td>

                      {/* Login Time */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs block text-[var(--text-primary)]">
                          {new Date(log.loginAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                        {log.logoutAt && (
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            Keluar: {new Date(log.logoutAt).toLocaleTimeString("id-ID", { timeStyle: "short" })}
                          </span>
                        )}
                      </td>

                      {/* Access Status (Online / Offline) */}
                      <td className="py-3.5 px-4">
                        {log.isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Aktif / Online</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            <span>Selesai / Offline</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {log.isOnline ? (
                          <button
                            onClick={() => handleKickSession(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 font-bold transition text-xs border border-red-200 dark:border-red-900/50"
                            title="Putuskan sesi aktif paksa"
                          >
                            <PowerOff className="w-3.5 h-3.5" />
                            <span>Putuskan Sesi</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">Sesi Ditutup</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
