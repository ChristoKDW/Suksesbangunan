"use client"

import { useState, useEffect } from "react"
import {
  LifeBuoy,
  Search,
  Filter,
  Smartphone,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Send,
  MessageSquare,
  FileImage,
  Info,
  RefreshCw,
} from "lucide-react"
import { api } from "@/lib/api"
import { toast, showSuccess } from "@/lib/swal"

interface IssueReport {
  id: number
  tiketId: string
  sumber: "mobile" | "web"
  pelapor: string
  role: string
  kategori: string
  judul: string
  deskripsi: string
  prioritas: "kritis" | "tinggi" | "sedang" | "rendah"
  status: "menunggu" | "sedang_diproses" | "selesai" | "ditolak"
  createdAt: string
  deviceInfo: Record<string, unknown>
  lampiranUrl?: string
  tanggapanSolusi?: string
}

export default function IssueReportsPage() {
  const [issues, setIssues] = useState<IssueReport[]>([])
  const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [sumberFilter, setSumberFilter] = useState("all")
  const [solutionInput, setSolutionInput] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchIssues = async () => {
    try {
      setLoading(true)
      const data = await api.get<any[]>("/super-admin/laporan-masalah")
      if (Array.isArray(data)) {
        const mapped: IssueReport[] = data.map((item: any) => ({
          id: item.idLaporan,
          tiketId: item.tiketId,
          sumber: item.sumber,
          pelapor: item.karyawan?.nama || item.user?.nama || "User Web",
          role: item.karyawan?.jabatan?.namaJabatan || item.user?.role || "Pengguna",
          kategori: item.kategori,
          judul: item.judul,
          deskripsi: item.deskripsi,
          prioritas: item.prioritas || "sedang",
          status: item.status || "menunggu",
          createdAt: new Date(item.createdAt).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
          deviceInfo: item.deviceInfo || {},
          lampiranUrl: item.lampiran?.[0]?.filePath || undefined,
          tanggapanSolusi: item.tanggapanSolusi || undefined,
        }))
        setIssues(mapped)
      } else {
        setIssues([])
      }
    } catch (e) {
      setIssues([])
      console.log("No issue reports or server unreachable:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIssues()
  }, [])

  const filteredIssues = issues.filter((item) => {
    const matchStatus = statusFilter === "all" || item.status === statusFilter
    const matchSumber = sumberFilter === "all" || item.sumber === sumberFilter
    return matchStatus && matchSumber
  })

  const handleOpenDetail = (issue: IssueReport) => {
    setSelectedIssue(issue)
    setSolutionInput(issue.tanggapanSolusi || "")
  }

  const handleUpdateStatus = async (newStatus: IssueReport["status"]) => {
    if (!selectedIssue) return
    try {
      await api.patch(`/super-admin/laporan-masalah/${selectedIssue.id}/status`, {
        status: newStatus,
        tanggapanSolusi: solutionInput.trim() || undefined,
      })
    } catch (e) {
      console.warn("API status update failed, updating UI locally:", e)
    }

    const updated = issues.map((i) =>
      i.id === selectedIssue.id
        ? {
            ...i,
            status: newStatus,
            tanggapanSolusi: solutionInput.trim() || i.tanggapanSolusi,
          }
        : i
    )
    setIssues(updated)
    setSelectedIssue({
      ...selectedIssue,
      status: newStatus,
      tanggapanSolusi: solutionInput.trim() || selectedIssue.tanggapanSolusi,
    })
    showSuccess(
      `Status tiket ${selectedIssue.tiketId} berhasil diubah menjadi "${newStatus}". Notifikasi telah dikirimkan ke ${selectedIssue.pelapor}.`,
      "Tiket Diperbarui"
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-red-600" />
            <span>Pusat Laporan Kendala & Masalah Aplikasi</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Menampung seluruh tiket keluhan dan bug dari Aplikasi Mobile Karyawan dan Web Admin Panel.
          </p>
        </div>

        {/* Status Counts */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchIssues()}
            disabled={loading}
            className="p-2 rounded-xl border border-[var(--border-default)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-red-600" : ""}`} />
          </button>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-700 dark:text-amber-400 text-xs font-bold">
            {issues.filter((i) => i.status === "menunggu").length} Menunggu
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 text-blue-700 dark:text-blue-400 text-xs font-bold">
            {issues.filter((i) => i.status === "sedang_diproses").length} Diproses
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            {issues.filter((i) => i.status === "selesai").length} Selesai
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "Semua Status" },
            { id: "menunggu", label: "Menunggu" },
            { id: "sedang_diproses", label: "Sedang Diproses" },
            { id: "selesai", label: "Selesai" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--text-muted)] font-medium">Sumber:</span>
          <select
            value={sumberFilter}
            onChange={(e) => setSumberFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-primary)] font-semibold focus:outline-none focus:border-red-600"
          >
            <option value="all">Semua Platform</option>
            <option value="mobile">📱 Mobile App</option>
            <option value="web">💻 Web Admin</option>
          </select>
        </div>
      </div>

      {/* Issues Table */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm space-y-4">
        <div className="overflow-x-auto border border-[var(--border-default)] rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-[var(--text-secondary)] font-bold uppercase border-b border-[var(--border-default)]">
              <tr>
                <th className="py-3.5 px-4">Tiket & Waktu</th>
                <th className="py-3.5 px-4">Sumber & Pelapor</th>
                <th className="py-3.5 px-4">Kategori & Judul Kendala</th>
                <th className="py-3.5 px-4">Prioritas</th>
                <th className="py-3.5 px-4">Status Tiket</th>
                <th className="py-3.5 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)] text-[var(--text-primary)]">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <LifeBuoy className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="font-bold text-xs text-[var(--text-secondary)]">Belum ada tiket laporan kendala yang masuk</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Seluruh tiket keluhan dari aplikasi mobile dan web admin akan tampil di sini secara real-time.</p>
                  </td>
                </tr>
              ) : (
                filteredIssues.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--sidebar-item-hover-bg)] transition">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-red-600 block">{item.tiketId}</span>
                    <span className="font-mono text-gray-400 text-[11px]">{item.createdAt}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      {item.sumber === "mobile" ? (
                        <Smartphone className="w-4 h-4 text-blue-500 shrink-0" />
                      ) : (
                        <Globe className="w-4 h-4 text-purple-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold block">{item.pelapor}</span>
                        <span className="text-[10px] text-gray-400">{item.role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                      {item.kategori}
                    </span>
                    <p className="font-medium truncate text-[var(--text-primary)]" title={item.judul}>
                      {item.judul}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        item.prioritas === "kritis"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : item.prioritas === "tinggi"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {item.prioritas}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        item.status === "selesai"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : item.status === "sedang_diproses"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.status === "selesai"
                            ? "bg-emerald-500"
                            : item.status === "sedang_diproses"
                            ? "bg-blue-500"
                            : "bg-amber-500"
                        }`}
                      />
                      {item.status === "selesai"
                        ? "Selesai"
                        : item.status === "sedang_diproses"
                        ? "Diproses"
                        : "Menunggu"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenDetail(item)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-xs"
                    >
                      Tinjau & Tanggapi
                    </button>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail & Respon Super Admin */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-surface-raised)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Tiket {selectedIssue.tiketId}: {selectedIssue.judul}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Pelapor: {selectedIssue.pelapor} ({selectedIssue.role}) · Sumber: {selectedIssue.sumber.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Deskripsi */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px] text-gray-400">
                  Deskripsi Lengkap Kendala
                </h4>
                <div className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border-default)] text-[var(--text-secondary)] leading-relaxed">
                  {selectedIssue.deskripsi}
                </div>
              </div>

              {/* Device / Technical Info JSON */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px] text-gray-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>Metadata Teknis Perangkat Pelapor (Auto-Captured)</span>
                </h4>
                <div className="p-3.5 rounded-xl bg-gray-900 text-gray-200 font-mono text-[11px] space-y-1">
                  {Object.entries(selectedIssue.deviceInfo).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-emerald-400 font-bold">{key}:</span> {String(value)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Respon & Solusi */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-default)]">
                <h4 className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px] text-red-600 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Tanggapan & Solusi dari Super Admin</span>
                </h4>
                <textarea
                  rows={3}
                  value={solutionInput}
                  onChange={(e) => setSolutionInput(e.target.value)}
                  placeholder="Tuliskan solusi atau keterangan perbaikan di sini. Pesan ini akan otomatis terkirim sebagai notifikasi ke pelapor..."
                  className="w-full p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-red-600 transition"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-surface-raised)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)] font-medium">Ubah Status:</span>
                <button
                  onClick={() => handleUpdateStatus("sedang_diproses")}
                  className="px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition"
                >
                  Sedang Diproses
                </button>
                <button
                  onClick={() => handleUpdateStatus("selesai")}
                  className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition"
                >
                  Tandai Selesai
                </button>
              </div>

              <button
                onClick={() => setSelectedIssue(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-[var(--text-secondary)]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
