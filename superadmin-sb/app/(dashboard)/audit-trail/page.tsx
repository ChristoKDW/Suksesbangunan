"use client"

import { useState, useEffect } from "react"
import { ShieldAlert, Search, Filter, Download, Eye, ArrowUpDown, RefreshCw } from "lucide-react"
import { SkeletonTable } from "@/components/ui/skeleton"
import { DiffViewerModal } from "@/components/diff-viewer"
import { toast } from "@/lib/swal"
import { api } from "@/lib/api"

const AUDIT_DATA = [
  {
    idAudit: 104,
    namaUser: "Musrini Muin",
    role: "HRD",
    action: "SETUJU_KASBON",
    entityName: "Kasbon",
    entityId: "12",
    createdAt: "2026-10-28 04:15 WITA",
    ipAddress: "182.253.11.45",
    category: "KASBON",
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
    category: "SECURITY",
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
    category: "KEBIJAKAN",
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
    category: "JADWAL",
    dataBefore: { tanggal: "2026-10-29", shift: "Shift Pagi (08:00 - 16:00)" },
    dataAfter: { tanggal: "2026-10-29", shift: "Shift Middle (11:00 - 19:00)" },
  },
  {
    idAudit: 100,
    namaUser: "Musrini Muin",
    role: "HRD",
    action: "RECALCULATE_PAYROLL",
    entityName: "Penggajian",
    entityId: "Periode Okt 2026",
    createdAt: "2026-10-27 11:20 WITA",
    ipAddress: "182.253.11.45",
    category: "PAYROLL",
    dataBefore: { totalKaryawan: 94, totalGaji: "Rp 144.200.000" },
    dataAfter: { totalKaryawan: 96, totalGaji: "Rp 148.500.000" },
  },
]

const CATEGORIES = ["ALL", "PAYROLL", "KASBON", "JADWAL", "KEBIJAKAN", "SECURITY"]

export default function AuditTrailPage() {
  const [activeCategory, setActiveCategory] = useState("ALL")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [auditLogs, setAuditLogs] = useState<typeof AUDIT_DATA>(AUDIT_DATA)
  const [selectedAudit, setSelectedAudit] = useState<typeof AUDIT_DATA[0] | null>(null)

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const data = await api.get<any[]>("/super-admin/audit-logs")
      if (Array.isArray(data) && data.length > 0) {
        setAuditLogs(data)
      }
    } catch (e) {
      console.log("Using fallback audit data or offline:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat)
  }

  const filtered = auditLogs.filter((item) => {
    const matchCat = activeCategory === "ALL" || item.category === activeCategory
    const matchSearch =
      search === "" ||
      item.namaUser.toLowerCase().includes(search.toLowerCase()) ||
      item.action.toLowerCase().includes(search.toLowerCase()) ||
      item.ipAddress.includes(search)
    return matchCat && matchSearch
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            <span>Forensic Audit Trail</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Pelacakan komprehensif mutasi data, audit trail perizinan, dan deteksi anomali.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAuditLogs}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-secondary)] hover:text-red-600 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-600" : ""}`} />
            <span>Segarkan</span>
          </button>
          <button
            onClick={() => toast("Export audit log sedang disiapkan...", "info")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-secondary)] hover:text-red-600 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari user, aksi, IP..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-primary)] focus:outline-none focus:border-red-600 transition"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm space-y-4">
        {loading ? (
          <SkeletonTable rows={5} />
        ) : (
          <div className="overflow-x-auto border border-[var(--border-default)] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-[var(--text-secondary)] font-bold uppercase border-b border-[var(--border-default)]">
                <tr>
                  <th className="py-3.5 px-4">ID & Waktu</th>
                  <th className="py-3.5 px-4">Pengguna</th>
                  <th className="py-3.5 px-4">Aksi Audit</th>
                  <th className="py-3.5 px-4">Entitas Terdampak</th>
                  <th className="py-3.5 px-4">Alamat IP</th>
                  <th className="py-3.5 px-4 text-right">Side-by-Side Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)] text-[var(--text-primary)]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Tidak ada entri audit yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.idAudit} className="hover:bg-[var(--sidebar-item-hover-bg)] transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-red-600 block">#{item.idAudit}</span>
                        <span className="font-mono text-gray-400 text-[11px]">{item.createdAt}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold block">{item.namaUser}</span>
                        <span className="text-[10px] text-gray-400 font-mono">Role: {item.role}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900">
                          {item.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                        {item.entityName} <span className="font-mono text-[11px]">({item.entityId})</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-500 text-[11px]">{item.ipAddress}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedAudit(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-50 hover:text-red-600 font-bold transition text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspeksi Diff</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
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
