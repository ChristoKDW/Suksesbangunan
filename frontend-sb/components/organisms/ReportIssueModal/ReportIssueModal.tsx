"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  LifeBuoy,
  X,
  Send,
  Upload,
  History,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  FileText,
} from "lucide-react"
import { api } from "@/lib/api"
import { showError, showSuccess } from "@/lib/swal"

interface ReportIssueModalProps {
  isOpen: boolean
  onClose: () => void
}

interface MyReportItem {
  idLaporan: number
  tiketId: string
  kategori: string
  judul: string
  deskripsi: string
  status: "menunggu" | "sedang_diproses" | "selesai" | "ditolak"
  prioritas: string
  tanggapanSolusi?: string
  createdAt: string
  lampiran?: { filePath: string; fileName: string }[]
}

const KATEGORI_OPTIONS = [
  { value: "laporan_export", label: "Export Excel & PDF (BNIDirect / Rekap)" },
  { value: "penggajian_slip", label: "Modul Penggajian & Slip Gaji" },
  { value: "jadwal_shift", label: "Modul Jadwal Shift & Tukar Jadwal" },
  { value: "absensi_gps", label: "Data Absensi & Kehadiran" },
  { value: "tampilan_ui", label: "Tampilan Web / UI Glitch" },
  { value: "performa_crash", label: "Sistem Lambat / Error 500" },
  { value: "lainnya", label: "Kendala Lainnya" },
]

export function ReportIssueModal({ isOpen, onClose }: ReportIssueModalProps) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<"form" | "history">("form")
  const [kategori, setKategori] = useState(KATEGORI_OPTIONS[0].value)
  const [judul, setJudul] = useState("")
  const [deskripsi, setDeskripsi] = useState("")
  const [langkah, setLangkah] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [myReports, setMyReports] = useState<MyReportItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Fetch my reports when switching to history tab
  useEffect(() => {
    if (isOpen && activeTab === "history") {
      fetchMyReports()
    }
  }, [isOpen, activeTab])

  const fetchMyReports = async () => {
    setLoadingHistory(true)
    try {
      const data = await api.get<MyReportItem[]>("laporan-masalah/my-web")
      setMyReports(data)
    } catch (err) {
      console.error("Gagal mengambil riwayat laporan:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!judul.trim() || !deskripsi.trim()) {
      showError("Judul dan deskripsi masalah wajib diisi")
      return
    }

    setSubmitting(true)
    try {
      // Auto-capture browser & URL context
      const deviceInfo = {
        platform: "Web Panel",
        currentUrl: pathname,
        browser: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
        screenResolution:
          typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "Unknown",
      }

      const formData = new FormData()
      formData.append("kategori", kategori)
      formData.append("judul", judul.trim())
      formData.append("deskripsi", deskripsi.trim())
      if (langkah.trim()) formData.append("langkahReproduksi", langkah.trim())
      formData.append("deviceInfo", JSON.stringify(deviceInfo))
      if (file) formData.append("file", file)

      await api.post("laporan-masalah/web", formData)
      showSuccess(
        "Laporan kendala Anda telah berhasil dikirim ke Super Admin / Owner. Tiket Anda akan segera ditinjau.",
        "Laporan Terkirim"
      )

      // Reset form
      setJudul("")
      setDeskripsi("")
      setLangkah("")
      setFile(null)
      setActiveTab("history")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim laporan kendala"
      showError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Pusat Bantuan & Lapor Kendala Web
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Laporan diteruskan langsung ke Super Admin / Owner sistem LARAS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-5 pt-3 border-b border-slate-200 dark:border-white/10 flex gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab("form")}
            className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
              activeTab === "form"
                ? "border-red-600 text-red-600 dark:text-red-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Laporan Baru</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
              activeTab === "history"
                ? "border-red-600 text-red-600 dark:text-red-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Tiket Saya</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "form" ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Kategori */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Modul / Fitur yang Mengalami Kendala <span className="text-red-600">*</span>
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-red-600"
                  required
                >
                  {KATEGORI_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Judul */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Judul Ringkas Masalah <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Export BNIDirect sheet BIFAST kode bank kosong"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Deskripsi Lengkap Kendala <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Jelaskan secara detail apa yang terjadi, apa yang Anda harapkan, dan tombol apa yang terakhir Anda klik..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              {/* Upload Screenshot */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Lampiran Bukti Screenshot / Foto (Opsional)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-red-400 bg-slate-50 dark:bg-slate-900/30 transition text-slate-600 dark:text-slate-400">
                    <Upload className="w-4 h-4 text-red-600" />
                    <span>{file ? file.name : "Pilih foto screenshot error (JPG/PNG, max 10MB)"}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {file && (
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-xl"
                      title="Hapus berkas"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Info Auto-Captured */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 text-[11px] text-slate-500 space-y-0.5">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  ℹ️ Konteks Teknis Dikirimkan Otomatis:
                </p>
                <p>Halaman aktif: <code className="font-mono text-red-600">{pathname}</code></p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Laporan ke Super Admin</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-400">Memuat riwayat tiket...</div>
              ) : myReports.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>Belum ada tiket masalah yang pernah Anda kirimkan.</p>
                </div>
              ) : (
                myReports.map((rpt) => (
                  <div
                    key={rpt.idLaporan}
                    className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/30 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-red-600">{rpt.tiketId}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rpt.status === "selesai"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : rpt.status === "sedang_diproses"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {rpt.status === "selesai"
                          ? "Selesai Ditangani"
                          : rpt.status === "sedang_diproses"
                          ? "Sedang Diproses"
                          : "Menunggu Tinjauan"}
                      </span>
                    </div>

                    <p className="font-bold text-slate-900 dark:text-slate-100">{rpt.judul}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      {rpt.deskripsi}
                    </p>

                    {/* Solusi dari Super Admin */}
                    {rpt.tanggapanSolusi && (
                      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] space-y-1">
                        <p className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Tanggapan Super Admin:</span>
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-200">{rpt.tanggapanSolusi}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
