"use client"

import { useState, useEffect } from "react"
import {
  DollarSign,
  CreditCard,
  Server,
  ShieldAlert,
  Database,
  SlidersHorizontal,
  Activity,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Eye,
  CheckCircle2,
} from "lucide-react"
import { useSuperAdminAuth } from "@/lib/auth-context"
import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/ui/skeleton"
import { DiffViewerModal } from "@/components/diff-viewer"
import { toast } from "@/lib/swal"
import { api } from "@/lib/api"

interface AuditItem {
  idAudit: number
  namaUser: string
  role: string
  action: string
  entityName: string
  entityId?: string
  createdAt: string
  ipAddress: string
  dataBefore?: Record<string, unknown> | null
  dataAfter?: Record<string, unknown> | null
}

const MOCK_AUDIT_LOGS: AuditItem[] = [
  {
    idAudit: 104,
    namaUser: "Musrini Muin",
    role: "HRD",
    action: "SETUJU_KASBON",
    entityName: "Kasbon",
    entityId: "12",
    createdAt: "2026-10-28 04:15 WITA",
    ipAddress: "182.253.11.45",
    dataBefore: { status: "menunggu", nominal: "Rp 2.000.000", cicilan: "4 Bulan" },
    dataAfter: { status: "disetujui", nominal: "Rp 2.000.000", tanggalPersetujuan: "2026-10-28" },
  },
  {
    idAudit: 103,
    namaUser: "Christo KDW",
    role: "Owner",
    action: "SINKRON_VPS_GIT",
    entityName: "System",
    entityId: "main",
    createdAt: "2026-10-28 02:21 WITA",
    ipAddress: "103.247.11.91",
    dataBefore: { gitCommit: "12df297", statusSync: "lagging" },
    dataAfter: { gitCommit: "83a63df", statusSync: "up-to-date" },
  },
  {
    idAudit: 102,
    namaUser: "Musrini Muin",
    role: "HRD",
    action: "UPDATE_KEBIJAKAN_LIBUR",
    entityName: "KebijakanLibur",
    entityId: "2026-11-01",
    createdAt: "2026-10-27 18:40 WITA",
    ipAddress: "182.253.11.45",
    dataBefore: { jenis: "Cuti Bersama", statusLibur: true, beriRO: true },
    dataAfter: { jenis: "Cuti Bersama", statusLibur: false, beriRO: false },
  },
  {
    idAudit: 101,
    namaUser: "Hardianto",
    role: "SPV",
    action: "EDIT_JADWAL_STAF",
    entityName: "JadwalKerja",
    entityId: "Karyawan #18",
    createdAt: "2026-10-27 15:10 WITA",
    ipAddress: "180.248.88.12",
    dataBefore: { tanggal: "2026-10-29", shift: "Shift Pagi (08:00 - 16:00)" },
    dataAfter: { tanggal: "2026-10-29", shift: "Shift Middle (11:00 - 19:00)" },
  },
]

export default function DashboardOverviewPage() {
  const { user } = useSuperAdminAuth()
  const [loading, setLoading] = useState(true)
  const [selectedAudit, setSelectedAudit] = useState<AuditItem | null>(null)
  const [stats, setStats] = useState({
    payrollProjection: "Rp 148.500.000",
    payrollChangePct: "+2.4%",
    payrollCutoff: "Cut-off 25 Okt 2026",
    totalKaryawan: 96,
    piutangKasbon: "Rp 24.300.000",
    kasbonLancarPct: "100% cicilan aktif",
    serverHealthStatus: "Optimal (99.98%)",
    serverSpecs: "Ubuntu 24.04 · 8 vCPU / 16GB",
    serverUptime: "Online 36 Jam (PM2)",
    totalIssues: 0,
    waitingIssues: 0,
  })
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>(MOCK_AUDIT_LOGS)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const data = await api.get<any>("/super-admin/dashboard-stats")
      if (data) {
        setStats({
          payrollProjection: data.payrollProjection || "Rp 148.500.000",
          payrollChangePct: data.payrollChangePct || "+2.4%",
          payrollCutoff: data.payrollCutoff || "Cut-off 25 Okt 2026",
          totalKaryawan: data.totalKaryawan || 96,
          piutangKasbon: data.piutangKasbon || "Rp 24.300.000",
          kasbonLancarPct: data.kasbonLancarPct || "100% cicilan aktif",
          serverHealthStatus: data.serverHealthStatus || "Optimal (99.98%)",
          serverSpecs: data.serverSpecs || "Ubuntu 24.04 · 8 vCPU / 16GB",
          serverUptime: data.serverUptime || "Online 36 Jam (PM2)",
          totalIssues: data.totalIssues || 0,
          waitingIssues: data.waitingIssues || 0,
        })
        if (Array.isArray(data.recentAudits) && data.recentAudits.length > 0) {
          setAuditLogs(data.recentAudits)
        }
      }
    } catch (e) {
      console.log("Using fallback dashboard stats:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleRefresh = () => {
    fetchStats().then(() => {
      toast("Data eksekutif berhasil diperbarui", "success")
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
              Executive View
            </span>
            <span className="text-xs text-[var(--text-muted)]">Zona WITA (Makassar)</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            Selamat Datang, {user?.nama || "Christo KDW (Owner)"}
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Seluruh kontrol eksekutif finansial, audit forensik, dan integritas sistem LARAS berada di tangan Anda.
          </p>
        </div>

        {/* Quick God-Mode Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs font-bold text-[var(--text-secondary)] hover:text-red-600 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-600" : ""}`} />
            <span>Refresh</span>
          </button>
          <a
            href="/database-backups"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs font-bold text-[var(--text-secondary)] hover:text-red-600 hover:border-red-300 transition"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Snapshot DB</span>
          </a>
          <a
            href="/emergency-control"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Emergency Control</span>
          </a>
        </div>
      </div>

      {/* 4 Key Executive Stat Cards with Skeleton Loading */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Payroll Estimate */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm space-y-3 hover:border-red-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Proyeksi Payroll
              </span>
              <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--text-primary)]">{stats.payrollProjection}</div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 font-semibold">{stats.payrollChangePct}</span>
                <span>({stats.payrollCutoff})</span>
              </p>
            </div>
          </div>

          {/* Card 2: Active Kasbon */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm space-y-3 hover:border-amber-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Piutang Kasbon & Tim
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--text-primary)]">{stats.piutangKasbon}</div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                <span>{stats.totalKaryawan} Karyawan Aktif · {stats.kasbonLancarPct}</span>
              </p>
            </div>
          </div>

          {/* Card 3: VPS Server Health */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm space-y-3 hover:border-emerald-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                VPS 103.247.11.91
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.serverHealthStatus}</div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                <span>{stats.serverSpecs} · {stats.serverUptime}</span>
              </p>
            </div>
          </div>

          {/* Card 4: Security Audit Alerts */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm space-y-3 hover:border-blue-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Pusat Kendala & Masalah
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--text-primary)]">
                {stats.waitingIssues} Menunggu
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 font-medium">Total {stats.totalIssues} tiket tercatat</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Forensic Activity Log Section */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-600" />
              <span>Aktivitas Mutasi Sensitif Terbaru</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Pemantauan real-time terhadap perubahan master data, nominal gaji, dan persetujuan jadwal.
            </p>
          </div>
          <a
            href="/audit-trail"
            className="text-xs font-bold text-red-600 hover:text-red-700 inline-flex items-center gap-1"
          >
            <span>Buka Seluruh Audit</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Table or Skeleton */}
        {loading ? (
          <SkeletonTable rows={4} />
        ) : (
          <div className="overflow-x-auto border border-[var(--border-default)] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-[var(--text-secondary)] font-bold uppercase border-b border-[var(--border-default)]">
                <tr>
                  <th className="py-3.5 px-4">Waktu (WITA)</th>
                  <th className="py-3.5 px-4">Pelaku</th>
                  <th className="py-3.5 px-4">Aksi / Mutasi</th>
                  <th className="py-3.5 px-4">Entitas Terkait</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)] text-[var(--text-primary)]">
                {auditLogs.map((item) => (
                  <tr key={item.idAudit} className="hover:bg-[var(--sidebar-item-hover-bg)] transition">
                    <td className="py-3.5 px-4 font-mono text-gray-500">{item.createdAt}</td>
                    <td className="py-3.5 px-4 font-semibold">
                      {item.namaUser}{" "}
                      <span className="text-[10px] text-gray-400 font-normal">({item.role})</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900">
                        {item.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                      {item.entityName} {item.entityId ? `(#${item.entityId})` : ""}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px]">{item.ipAddress}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedAudit(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-50 hover:text-red-600 text-gray-600 dark:text-gray-300 font-bold transition text-[11px]"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Diff</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Diff Modal */}
      <DiffViewerModal
        isOpen={!!selectedAudit}
        onClose={() => setSelectedAudit(null)}
        item={selectedAudit}
      />
    </div>
  )
}
