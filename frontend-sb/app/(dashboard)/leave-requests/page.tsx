"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Badge } from "@/components/atoms"
import { Check, X, FileText, Search, Paperclip, Loader2, ArrowLeftRight, CheckCircle2, Clock, AlertCircle, Info } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { PengajuanIzin, PengajuanPertukaran } from "@/lib/types"

const jenisIzinLabelMap: Record<string, string> = {
  izin: "Izin",
  sakit: "Izin Sakit",
  cuti: "Cuti Tahunan",
  "dinas luar": "Dinas Luar",
}

const typeColors: Record<string, { bg: string; color: string }> = {
  sakit: { bg: "#fef2f2", color: "#dc2626" },
  cuti: { bg: "#eff6ff", color: "#2563eb" },
  izin: { bg: "#faf5ff", color: "#9333ea" },
  "dinas luar": { bg: "#fffbeb", color: "#d97706" },
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://alfiyah.my.id"

function getAttachmentUrl(path: string): string {
  const cleanPath = path.replace(/\\/g, "/")
  if (/^https?:\/\//i.test(cleanPath)) {
    const url = new URL(cleanPath)
    if (url.origin !== new URL(BASE_URL).origin) return cleanPath
    return `/attachment-files/${url.pathname.replace(/^\/uploads\//, "")}`
  }
  return `/attachment-files/${cleanPath.replace(/^\/?uploads\//, "")}`
}

function getAttachmentType(path: string): "image" | "pdf" | "other" {
  const extension = path.split(/[?#]/)[0].split(".").pop()?.toLowerCase()
  if (["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(extension || "")) return "image"
  if (extension === "pdf") return "pdf"
  return "other"
}

function getStatusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  switch (status) {
    case "disetujui": return "success"
    case "menunggu":
    case "menunggu_rekan":
    case "menunggu_spv":
    case "menunggu_hrd":
      return "warning"
    case "ditolak":
    case "ditolak_rekan":
    case "ditolak_spv":
    case "ditolak_hrd":
      return "destructive"
    default: return "secondary"
  }
}

function getIzinStatusLabel(status: string): string {
  switch (status) {
    case "menunggu_spv": return "Menunggu SPV"
    case "menunggu_hrd": return "Menunggu HRD"
    case "menunggu": return "Menunggu SPV"
    case "disetujui": return "Disetujui"
    case "ditolak_spv": return "Ditolak SPV"
    case "ditolak_hrd": return "Ditolak HRD"
    case "ditolak": return "Ditolak"
    default: return capitalize(status)
  }
}

function getPertukaranStatusLabel(status: string): string {
  switch (status) {
    case "menunggu_rekan": return "Menunggu Rekan"
    case "menunggu_spv": return "Menunggu SPV"
    case "menunggu_hrd": return "Menunggu HRD"
    case "disetujui": return "Disetujui (Jadwal Diubah)"
    case "ditolak_rekan": return "Ditolak Rekan"
    case "ditolak_spv": return "Ditolak SPV"
    case "ditolak_hrd": return "Ditolak HRD"
    default: return status
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

export default function LeaveRequestsPage() {
  const { user } = useAuth()
  const isSpv = user?.role === "SPV"
  const isHrdOrAdmin = user?.role === "HRD" || user?.role === "Admin"

  // Main Mode: "izin" | "pertukaran"
  const [mainMode, setMainMode] = useState<"izin" | "pertukaran">("izin")

  // Izin State
  const [requests, setRequests] = useState<PengajuanIzin[]>([])
  const [loadingIzin, setLoadingIzin] = useState(true)
  const [activeTabIzin, setActiveTabIzin] = useState("Semua")
  const [selectedRequest, setSelectedRequest] = useState<PengajuanIzin | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Pertukaran State
  const [swaps, setSwaps] = useState<PengajuanPertukaran[]>([])
  const [loadingSwaps, setLoadingSwaps] = useState(true)
  const [activeTabSwap, setActiveTabSwap] = useState("Semua")
  const [selectedSwap, setSelectedSwap] = useState<PengajuanPertukaran | null>(null)
  const [isSwapPreviewOpen, setIsSwapPreviewOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchIzinData = async () => {
    try {
      const data = await api.get<PengajuanIzin[]>("pengajuan-izin")
      setRequests(data)
    } catch (err) {
      console.error("Failed to fetch pengajuan izin:", err)
    } finally {
      setLoadingIzin(false)
    }
  }

  const fetchSwapData = async () => {
    try {
      const data = await api.get<PengajuanPertukaran[]>("pengajuan-pertukaran")
      setSwaps(data)
    } catch (err) {
      console.error("Failed to fetch pengajuan pertukaran:", err)
    } finally {
      setLoadingSwaps(false)
    }
  }

  useEffect(() => {
    fetchIzinData()
    fetchSwapData()
  }, [])

  // Counts
  const pendingIzinCount = requests.filter((r) => {
    if (isSpv) return r.status === "menunggu_spv" || r.status === "menunggu"
    if (isHrdOrAdmin) return r.status === "menunggu_hrd" || r.status === "menunggu_spv" || r.status === "menunggu"
    return r.status.startsWith("menunggu")
  }).length
  const pendingSwapCount = swaps.filter((s) => {
    if (isSpv) return s.status === "menunggu_spv"
    if (isHrdOrAdmin) return s.status === "menunggu_hrd" || s.status === "menunggu_spv"
    return s.status.startsWith("menunggu")
  }).length

  // -- Izin Handlers (SPV & HRD) --
  const handleApproveIzinSpv = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSubmitting(true)
    try {
      await api.patch(`pengajuan-izin/${id}/approval-spv`, { setuju: true, status: "disetujui" })
      await fetchIzinData()
      if (selectedRequest?.idIzin === id) {
        setSelectedRequest(prev => prev ? { ...prev, status: "menunggu_hrd" } : null)
      }
      alert("Persetujuan SPV berhasil. Pengajuan izin diteruskan ke HRD untuk persetujuan akhir.")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyetujui")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRejectIzinSpv = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const catatan = prompt("Catatan penolakan SPV (opsional):")
    setSubmitting(true)
    try {
      await api.patch(`pengajuan-izin/${id}/approval-spv`, { setuju: false, status: "ditolak", catatan: catatan || "" })
      await fetchIzinData()
      if (selectedRequest?.idIzin === id) {
        setSelectedRequest(prev => prev ? { ...prev, status: "ditolak_spv", catatanSpv: catatan } : null)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menolak")
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveIzinHrd = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!confirm("Setujui pengajuan izin ini? Sistem akan otomatis mencatat status kehadiran karyawan.")) {
      return
    }
    setSubmitting(true)
    try {
      await api.patch(`pengajuan-izin/${id}/approval-hrd`, { setuju: true, status: "disetujui" })
      await fetchIzinData()
      if (selectedRequest?.idIzin === id) {
        setSelectedRequest(prev => prev ? { ...prev, status: "disetujui" } : null)
      }
      alert("Pengajuan izin disetujui! Status kehadiran karyawan telah otomatis diperbarui.")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyetujui")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRejectIzinHrd = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const catatan = prompt("Catatan penolakan HRD (opsional):")
    setSubmitting(true)
    try {
      await api.patch(`pengajuan-izin/${id}/approval-hrd`, { setuju: false, status: "ditolak", catatan: catatan || "" })
      await fetchIzinData()
      if (selectedRequest?.idIzin === id) {
        setSelectedRequest(prev => prev ? { ...prev, status: "ditolak_hrd", catatanHrd: catatan } : null)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menolak")
    } finally {
      setSubmitting(false)
    }
  }

  // -- Pertukaran Handlers --
  const handleApproveSwapSpv = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSubmitting(true)
    try {
      await api.patch(`pengajuan-pertukaran/${id}/approval-spv`, { setuju: true, status: "disetujui" })
      await fetchSwapData()
      if (selectedSwap?.idPertukaran === id) {
        setSelectedSwap(prev => prev ? { ...prev, status: "menunggu_hrd" } : null)
      }
      alert("Persetujuan SPV berhasil. Pengajuan diteruskan ke HRD untuk persetujuan akhir.")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyetujui")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRejectSwapSpv = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const catatan = prompt("Catatan penolakan SPV (opsional):")
    setSubmitting(true)
    try {
      await api.patch(`pengajuan-pertukaran/${id}/approval-spv`, { setuju: false, status: "ditolak", catatan: catatan || "" })
      await fetchSwapData()
      if (selectedSwap?.idPertukaran === id) {
        setSelectedSwap(prev => prev ? { ...prev, status: "ditolak_spv", catatanSpv: catatan } : null)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menolak")
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveSwapHrd = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!confirm("Setujui pertukaran ini? Jadwal kerja kedua karyawan akan otomatis diperbarui di sistem.")) {
      return
    }
    setSubmitting(true)
    try {
      await api.patch(`pengajuan-pertukaran/${id}/approval-hrd`, { setuju: true, status: "disetujui" })
      await fetchSwapData()
      if (selectedSwap?.idPertukaran === id) {
        setSelectedSwap(prev => prev ? { ...prev, status: "disetujui" } : null)
      }
      alert("Pertukaran disetujui! Jadwal kerja telah otomatis diperbarui di database.")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyetujui")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRejectSwapHrd = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const catatan = prompt("Catatan penolakan HRD (opsional):")
    setSubmitting(true)
    try {
      await api.patch(`pengajuan-pertukaran/${id}/approval-hrd`, { setuju: false, status: "ditolak", catatan: catatan || "" })
      await fetchSwapData()
      if (selectedSwap?.idPertukaran === id) {
        setSelectedSwap(prev => prev ? { ...prev, status: "ditolak_hrd", catatanHrd: catatan } : null)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menolak")
    } finally {
      setSubmitting(false)
    }
  }

  // Filter Izin
  const tabsIzin = ["Semua", "Menunggu SPV", "Menunggu HRD", "Disetujui", "Ditolak"]
  const filteredRequests = requests.filter(r => {
    if (activeTabIzin === "Menunggu SPV" && r.status !== "menunggu_spv" && r.status !== "menunggu") return false
    if (activeTabIzin === "Menunggu HRD" && r.status !== "menunggu_hrd") return false
    if (activeTabIzin === "Disetujui" && r.status !== "disetujui") return false
    if (activeTabIzin === "Ditolak" && !r.status.startsWith("ditolak")) return false
    if (searchQuery) {
      return (r.karyawan?.nama || "").toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  // Filter Pertukaran
  const tabsSwap = ["Semua", "Menunggu SPV", "Menunggu HRD", "Disetujui", "Ditolak"]
  const filteredSwaps = swaps.filter(s => {
    if (activeTabSwap === "Menunggu SPV" && s.status !== "menunggu_spv") return false
    if (activeTabSwap === "Menunggu HRD" && s.status !== "menunggu_hrd") return false
    if (activeTabSwap === "Disetujui" && s.status !== "disetujui") return false
    if (activeTabSwap === "Ditolak" && !s.status.startsWith("ditolak")) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const pNama = (s.karyawanPemohon?.nama || "").toLowerCase()
      const tNama = (s.karyawanTarget?.nama || "").toLowerCase()
      return pNama.includes(q) || tNama.includes(q)
    }
    return true
  })

  if (loadingIzin && loadingSwaps) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Pengajuan
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Kelola pengajuan izin, cuti sakit, dan persetujuan pertukaran jadwal (shift / off) karyawan.
          </p>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-[var(--border-default)]">
          <button
            onClick={() => { setMainMode("izin"); setSearchQuery("") }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              mainMode === "izin"
                ? "bg-white dark:bg-slate-800 text-red-600 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Izin & Cuti</span>
            {pendingIzinCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-bold">
                {pendingIzinCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { setMainMode("pertukaran"); setSearchQuery("") }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              mainMode === "pertukaran"
                ? "bg-white dark:bg-slate-800 text-red-600 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Pertukaran Shift & Off</span>
            {pendingSwapCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-bold">
                {pendingSwapCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: IZIN & CUTI                                                       */}
      {/* ========================================================================= */}
      {mainMode === "izin" && (
        <>
          {/* Info Callout Ketentuan Izin & Sakit */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-3">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
            <div className="space-y-1">
              <p className="font-semibold">Ketentuan Pengajuan Izin & Sakit (Alur: Supervisor &rarr; HRD Final):</p>
              <ul className="list-disc pl-4 space-y-0.5 text-blue-800 dark:text-blue-400">
                <li><strong>Izin:</strong> Maksimal 1 hari kerja. Unggah dokumen pendukung opsional. Tidak mendapatkan tunjangan makan dan tidak mendapatkan gaji di hari tersebut.</li>
                <li><strong>Sakit:</strong> Durasi sesuai surat keterangan dokter. Unggah dokumen pendukung (surat dokter) <strong>WAJIB</strong>. Karyawan tetap digaji pokok harian, namun tidak mendapatkan tunjangan makan.</li>
              </ul>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--bg-page)", border: "1px solid var(--border-default)" }}>
            {tabsIzin.map(tab => {
              let count = 0
              if (tab === "Menunggu SPV") count = requests.filter(r => r.status === "menunggu_spv" || r.status === "menunggu").length
              if (tab === "Menunggu HRD") count = requests.filter(r => r.status === "menunggu_hrd").length
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTabIzin(tab)}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{
                    background: activeTabIzin === tab ? "var(--bg-surface)" : "transparent",
                    color: activeTabIzin === tab ? "var(--text-primary)" : "var(--text-muted)",
                    boxShadow: activeTabIzin === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {tab}
                  {count > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-bold">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-default)" }}>
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-full sm:max-w-xs" style={{ background: "var(--bg-page)", border: "1px solid var(--border-default)" }}>
                <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <input type="search" placeholder="Cari karyawan..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-primary)" }} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Jenis Izin</TableHead>
                    <TableHead>Tanggal Mulai</TableHead>
                    <TableHead>Tanggal Selesai</TableHead>
                    <TableHead>Hari</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-28 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
                        Tidak ada pengajuan izin
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((req) => {
                      const days = daysBetween(req.tanggalMulai, req.tanggalSelesai)
                      const tc = typeColors[req.jenisIzin] || { bg: "#f3f4f6", color: "#6b7280" }
                      const canSpvAction = (isSpv || isHrdOrAdmin) && (req.status === "menunggu_spv" || req.status === "menunggu")
                      const canHrdAction = isHrdOrAdmin && req.status === "menunggu_hrd"

                      return (
                        <TableRow
                          key={req.idIzin}
                          className="cursor-pointer"
                          onClick={() => { setSelectedRequest(req); setIsPreviewOpen(true) }}
                        >
                          <TableCell>
                            <div>
                              <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{req.karyawan?.nama || "—"}</div>
                              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{req.karyawan?.departemen?.namaDepartemen || "—"}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: tc.bg, color: tc.color }}>
                              {jenisIzinLabelMap[req.jenisIzin] || capitalize(req.jenisIzin)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            {formatDate(req.tanggalMulai)}
                          </TableCell>
                          <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            {formatDate(req.tanggalSelesai)}
                          </TableCell>
                          <TableCell className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{days}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate" style={{ color: "var(--text-muted)" }}>{req.alasan}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(req.status)}>{getIzinStatusLabel(req.status)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {/* SPV Action */}
                              {canSpvAction && (
                                <>
                                  <button
                                    onClick={(e) => handleApproveIzinSpv(req.idIzin, e)}
                                    disabled={submitting}
                                    title="Setujui (SPV)"
                                    className="flex h-7 px-2 items-center justify-center gap-1 rounded-md transition-colors bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold"
                                  >
                                    <Check className="w-3.5 h-3.5" /> SPV
                                  </button>
                                  <button
                                    onClick={(e) => handleRejectIzinSpv(req.idIzin, e)}
                                    disabled={submitting}
                                    title="Tolak (SPV)"
                                    className="flex h-7 w-7 items-center justify-center rounded-md transition-colors bg-red-50 text-red-700 hover:bg-red-100"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {/* HRD Action */}
                              {canHrdAction && (
                                <>
                                  <button
                                    onClick={(e) => handleApproveIzinHrd(req.idIzin, e)}
                                    disabled={submitting}
                                    title="Setujui (HRD Final)"
                                    className="flex h-7 px-2 items-center justify-center gap-1 rounded-md transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Final
                                  </button>
                                  <button
                                    onClick={(e) => handleRejectIzinHrd(req.idIzin, e)}
                                    disabled={submitting}
                                    title="Tolak (HRD)"
                                    className="flex h-7 w-7 items-center justify-center rounded-md transition-colors bg-red-50 text-red-700 hover:bg-red-100"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {!canSpvAction && !canHrdAction && (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: PERTUKARAN SHIFT & OFF                                            */}
      {/* ========================================================================= */}
      {mainMode === "pertukaran" && (
        <>
          {/* Info Callout */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold">Ketentuan & Alur Pertukaran Jadwal:</p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                • <strong>Tukar Shift:</strong> Dapat diajukan beberapa kali dalam sebulan tanpa batasan frekuensi (1 hari per transaksi).<br />
                • <strong>Tukar Off:</strong> Dibatasi maksimal 1 kali dalam sebulan.<br />
                • <strong>Alur Persetujuan:</strong> 1. Rekan Kerja tujuan menyetujui &rarr; 2. Supervisor memeriksa & menyetujui &rarr; 3. HRD memberikan persetujuan final (Sistem akan langsung mengubah jadwal kerja kedua karyawan secara otomatis).
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--bg-page)", border: "1px solid var(--border-default)" }}>
            {tabsSwap.map(tab => {
              let count = 0
              if (tab === "Menunggu SPV") count = swaps.filter(s => s.status === "menunggu_spv").length
              if (tab === "Menunggu HRD") count = swaps.filter(s => s.status === "menunggu_hrd").length
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTabSwap(tab)}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{
                    background: activeTabSwap === tab ? "var(--bg-surface)" : "transparent",
                    color: activeTabSwap === tab ? "var(--text-primary)" : "var(--text-muted)",
                    boxShadow: activeTabSwap === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {tab}
                  {count > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-bold">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-default)" }}>
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-full sm:max-w-xs" style={{ background: "var(--bg-page)", border: "1px solid var(--border-default)" }}>
                <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <input
                  type="search"
                  placeholder="Cari pemohon / rekan..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pemohon</TableHead>
                    <TableHead>Rekan Ditukar</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Jadwal Pemohon</TableHead>
                    <TableHead>Jadwal Rekan</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-28 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSwaps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
                        Tidak ada data pengajuan pertukaran
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSwaps.map((swap) => {
                      const isShift = swap.jenisPertukaran === "shift"
                      const canSpvAction = (isSpv || isHrdOrAdmin) && swap.status === "menunggu_spv"
                      const canHrdAction = isHrdOrAdmin && swap.status === "menunggu_hrd"

                      return (
                        <TableRow
                          key={swap.idPertukaran}
                          className="cursor-pointer"
                          onClick={() => { setSelectedSwap(swap); setIsSwapPreviewOpen(true) }}
                        >
                          {/* Pemohon */}
                          <TableCell>
                            <div>
                              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                                {swap.karyawanPemohon?.nama || "—"}
                              </div>
                              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                                {swap.karyawanPemohon?.departemen?.namaDepartemen || "—"}
                              </div>
                            </div>
                          </TableCell>

                          {/* Rekan Target */}
                          <TableCell>
                            <div>
                              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                                {swap.karyawanTarget?.nama || "—"}
                              </div>
                              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                                {swap.karyawanTarget?.departemen?.namaDepartemen || "—"}
                              </div>
                            </div>
                          </TableCell>

                          {/* Jenis Pertukaran */}
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              isShift ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}>
                              {isShift ? "Tukar Shift" : "Tukar Libur (Off)"}
                            </span>
                          </TableCell>

                          {/* Detail Pemohon */}
                          <TableCell className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            <div className="font-medium">{formatDate(swap.tanggalPemohon)}</div>
                            <div className="text-slate-500">
                              {isShift ? (swap.shiftPemohon?.namaShift || "Shift Awal") : "Hari Off"}
                            </div>
                          </TableCell>

                          {/* Detail Rekan */}
                          <TableCell className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            <div className="font-medium">{formatDate(swap.tanggalTarget)}</div>
                            <div className="text-slate-500">
                              {isShift ? (swap.shiftTarget?.namaShift || "Shift Tujuan") : "Hari Off"}
                            </div>
                          </TableCell>

                          {/* Alasan */}
                          <TableCell className="text-xs max-w-[150px] truncate" style={{ color: "var(--text-muted)" }}>
                            {swap.alasan}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge variant={getStatusVariant(swap.status)}>
                              {getPertukaranStatusLabel(swap.status)}
                            </Badge>
                          </TableCell>

                          {/* Aksi */}
                          <TableCell onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              {/* SPV Action */}
                              {canSpvAction && (
                                <>
                                  <button
                                    onClick={() => handleApproveSwapSpv(swap.idPertukaran)}
                                    disabled={submitting}
                                    title="SPV Setujui & Teruskan ke HRD"
                                    className="px-2 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" /> SPV
                                  </button>
                                  <button
                                    onClick={() => handleRejectSwapSpv(swap.idPertukaran)}
                                    disabled={submitting}
                                    title="Tolak sebagai SPV"
                                    className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {/* HRD Action */}
                              {canHrdAction && (
                                <>
                                  <button
                                    onClick={() => handleApproveSwapHrd(swap.idPertukaran)}
                                    disabled={submitting}
                                    title="HRD Setujui (Jadwal Otomatis Berubah)"
                                    className="px-2 py-1 text-xs font-semibold rounded bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-1 shadow-sm"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> Setujui HRD
                                  </button>
                                  <button
                                    onClick={() => handleRejectSwapHrd(swap.idPertukaran)}
                                    disabled={submitting}
                                    title="Tolak sebagai HRD"
                                    className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {!canSpvAction && !canHrdAction && (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* ========================================================================= */}
      {/* PREVIEW MODAL: IZIN                                                       */}
      {/* ========================================================================= */}
      {isPreviewOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6" onClick={() => setIsPreviewOpen(false)}>
          <div className="bg-[var(--bg-surface)] w-full max-w-5xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)] shrink-0">
              <h3 className="font-semibold text-[var(--text-primary)]">Detail Pengajuan Izin</h3>
              <button onClick={() => setIsPreviewOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Karyawan</div>
                  <div className="font-medium text-[var(--text-primary)]">{selectedRequest.karyawan?.nama || "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Departemen</div>
                  <div className="text-[var(--text-secondary)]">{selectedRequest.karyawan?.departemen?.namaDepartemen || "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Jenis</div>
                  <div className="text-[var(--text-secondary)]">{jenisIzinLabelMap[selectedRequest.jenisIzin] || capitalize(selectedRequest.jenisIzin)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Status</div>
                  <Badge variant={getStatusVariant(selectedRequest.status)}>{getIzinStatusLabel(selectedRequest.status)}</Badge>
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Tanggal Mulai</div>
                  <div className="text-[var(--text-secondary)]">{formatDate(selectedRequest.tanggalMulai)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Tanggal Selesai</div>
                  <div className="text-[var(--text-secondary)]">{formatDate(selectedRequest.tanggalSelesai)}</div>
                </div>
              </div>

              {/* Approval Progress Indicator */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-[var(--border-default)]">
                <div className="text-xs font-semibold text-slate-500 mb-2">Tahapan Persetujuan:</div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className={`p-2 rounded ${
                    selectedRequest.status !== "menunggu_spv" && !selectedRequest.status.startsWith("ditolak")
                      ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 font-semibold"
                      : selectedRequest.status === "menunggu_spv"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-semibold animate-pulse"
                      : selectedRequest.status === "ditolak_spv"
                      ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-semibold"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}>
                    1. Supervisor (SPV)
                    <div className="text-[10px] mt-0.5 opacity-80">
                      {selectedRequest.status === "menunggu_spv" ? "Menunggu Verifikasi" : selectedRequest.status === "ditolak_spv" ? "Ditolak SPV" : "Disetujui"}
                    </div>
                  </div>
                  <div className={`p-2 rounded ${
                    selectedRequest.status === "disetujui"
                      ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 font-semibold"
                      : selectedRequest.status === "menunggu_hrd"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-semibold animate-pulse"
                      : selectedRequest.status === "ditolak_hrd"
                      ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-semibold"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}>
                    2. HRD (Final)
                    <div className="text-[10px] mt-0.5 opacity-80">
                      {selectedRequest.status === "disetujui" ? "Disetujui Final" : selectedRequest.status === "ditolak_hrd" ? "Ditolak HRD" : selectedRequest.status === "menunggu_hrd" ? "Menunggu HRD" : "Antrean"}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Alasan</div>
                <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-page)] rounded-md px-3 py-2">{selectedRequest.alasan}</div>
              </div>

              {selectedRequest.filePendukung && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[var(--text-muted)]">Lampiran</div>
                  <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-white/5 p-3 rounded-lg border border-[var(--border-default)]">
                    <Paperclip className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    <a
                      href={getAttachmentUrl(selectedRequest.filePendukung)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-primary)] font-medium truncate hover:underline"
                    >
                      {selectedRequest.filePendukung.split(/[\\/]/).pop()}
                    </a>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-[var(--border-default)] bg-slate-100 dark:bg-black/20">
                    {getAttachmentType(selectedRequest.filePendukung) === "image" && (
                      // Browser-native image rendering keeps arbitrary upload dimensions intact.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getAttachmentUrl(selectedRequest.filePendukung)}
                        alt="Preview lampiran pengajuan izin"
                        className="w-full h-auto object-contain"
                      />
                    )}
                    {getAttachmentType(selectedRequest.filePendukung) === "pdf" && (
                      <iframe
                        src={getAttachmentUrl(selectedRequest.filePendukung)}
                        title="Preview lampiran pengajuan izin"
                        className="w-full h-[70vh] bg-white"
                      />
                    )}
                    {getAttachmentType(selectedRequest.filePendukung) === "other" && (
                      <div className="p-8 text-center text-sm text-[var(--text-muted)]">
                        Format file ini tidak mendukung preview langsung. Klik nama lampiran untuk membukanya.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRequest.catatanSpv && (
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Catatan Supervisor (SPV)</div>
                  <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-page)] rounded-md px-3 py-2 border border-[var(--border-default)]">{selectedRequest.catatanSpv}</div>
                </div>
              )}

              {selectedRequest.catatanHrd && (
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Catatan HRD</div>
                  <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-page)] rounded-md px-3 py-2 border border-[var(--border-default)]">{selectedRequest.catatanHrd}</div>
                </div>
              )}

              {selectedRequest.catatanApproval && !selectedRequest.catatanSpv && !selectedRequest.catatanHrd && (
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Catatan Approval</div>
                  <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-page)] rounded-md px-3 py-2">{selectedRequest.catatanApproval}</div>
                </div>
              )}

              {/* Action buttons based on status */}
              {selectedRequest.status === "menunggu_spv" && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={(e) => { handleApproveIzinSpv(selectedRequest.idIzin, e); setIsPreviewOpen(false) }}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" /> Setujui (SPV)
                  </button>
                  <button
                    onClick={(e) => { handleRejectIzinSpv(selectedRequest.idIzin, e); setIsPreviewOpen(false) }}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                  >
                    <X className="w-4 h-4" /> Tolak (SPV)
                  </button>
                </div>
              )}

              {selectedRequest.status === "menunggu_hrd" && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={(e) => { handleApproveIzinHrd(selectedRequest.idIzin, e); setIsPreviewOpen(false) }}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" /> Setujui Final (HRD)
                  </button>
                  <button
                    onClick={(e) => { handleRejectIzinHrd(selectedRequest.idIzin, e); setIsPreviewOpen(false) }}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                  >
                    <X className="w-4 h-4" /> Tolak (HRD)
                  </button>
                </div>
              )}

              {selectedRequest.status === "menunggu" && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={(e) => { handleApproveIzinHrd(selectedRequest.idIzin, e); setIsPreviewOpen(false) }}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" /> Setujui
                  </button>
                  <button
                    onClick={(e) => { handleRejectIzinHrd(selectedRequest.idIzin, e); setIsPreviewOpen(false) }}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                  >
                    <X className="w-4 h-4" /> Tolak
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PREVIEW MODAL: PERTUKARAN                                                 */}
      {/* ========================================================================= */}
      {isSwapPreviewOpen && selectedSwap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => setIsSwapPreviewOpen(false)}>
          <div className="bg-[var(--bg-surface)] w-full max-w-xl rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-[var(--text-primary)]">Detail Pengajuan Pertukaran Jadwal</h3>
              </div>
              <button onClick={() => setIsSwapPreviewOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Approval Progress Indicator */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-[var(--border-default)]">
                <div className="text-xs font-semibold text-slate-500 mb-2">Tahapan Persetujuan:</div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className={`p-2 rounded ${
                    selectedSwap.status !== "menunggu_rekan" && !selectedSwap.status.startsWith("ditolak")
                      ? "bg-green-100 text-green-800 font-bold"
                      : selectedSwap.status === "menunggu_rekan"
                        ? "bg-amber-100 text-amber-800 font-bold"
                        : "bg-slate-100 text-slate-500"
                  }`}>
                    1. Rekan Kerja
                  </div>
                  <div className={`p-2 rounded ${
                    selectedSwap.status === "menunggu_hrd" || selectedSwap.status === "disetujui"
                      ? "bg-green-100 text-green-800 font-bold"
                      : selectedSwap.status === "menunggu_spv"
                        ? "bg-amber-100 text-amber-800 font-bold"
                        : "bg-slate-100 text-slate-500"
                  }`}>
                    2. Supervisor
                  </div>
                  <div className={`p-2 rounded ${
                    selectedSwap.status === "disetujui"
                      ? "bg-green-100 text-green-800 font-bold"
                      : selectedSwap.status === "menunggu_hrd"
                        ? "bg-amber-100 text-amber-800 font-bold"
                        : "bg-slate-100 text-slate-500"
                  }`}>
                    3. Final HRD
                  </div>
                </div>
              </div>

              {/* Schedule Details Comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <div className="text-xs font-bold text-slate-500 uppercase">Pemohon</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                    {selectedSwap.karyawanPemohon?.nama}
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedSwap.karyawanPemohon?.departemen?.namaDepartemen}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-white/10 text-xs">
                    <span className="text-slate-500">Jadwal Asli:</span>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatDate(selectedSwap.tanggalPemohon)}
                    </div>
                    <div className="text-blue-600 dark:text-blue-400 font-medium">
                      {selectedSwap.jenisPertukaran === "shift" ? (selectedSwap.shiftPemohon?.namaShift || "Shift Awal") : "Hari Libur (Off)"}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <div className="text-xs font-bold text-slate-500 uppercase">Rekan Ditukar</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                    {selectedSwap.karyawanTarget?.nama}
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedSwap.karyawanTarget?.departemen?.namaDepartemen}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-white/10 text-xs">
                    <span className="text-slate-500">Jadwal Ditukar:</span>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatDate(selectedSwap.tanggalTarget)}
                    </div>
                    <div className="text-purple-600 dark:text-purple-400 font-medium">
                      {selectedSwap.jenisPertukaran === "shift" ? (selectedSwap.shiftTarget?.namaShift || "Shift Tujuan") : "Hari Libur (Off)"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Alasan Pertukaran:</div>
                <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-page)] rounded-md px-3 py-2">
                  {selectedSwap.alasan}
                </div>
              </div>

              {/* Notes */}
              {selectedSwap.catatanRekan && (
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Catatan Rekan:</span> {selectedSwap.catatanRekan}
                </div>
              )}
              {selectedSwap.catatanSpv && (
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Catatan SPV:</span> {selectedSwap.catatanSpv}
                </div>
              )}
              {selectedSwap.catatanHrd && (
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Catatan HRD:</span> {selectedSwap.catatanHrd}
                </div>
              )}

              {/* Action Buttons in Modal */}
              {((isSpv || isHrdOrAdmin) && selectedSwap.status === "menunggu_spv") && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { handleApproveSwapSpv(selectedSwap.idPertukaran); setIsSwapPreviewOpen(false) }}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" /> Setujui sebagai SPV (Teruskan ke HRD)
                  </button>
                  <button
                    onClick={() => { handleRejectSwapSpv(selectedSwap.idPertukaran); setIsSwapPreviewOpen(false) }}
                    disabled={submitting}
                    className="px-4 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                  >
                    <X className="w-4 h-4" /> Tolak
                  </button>
                </div>
              )}

              {(isHrdOrAdmin && selectedSwap.status === "menunggu_hrd") && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { handleApproveSwapHrd(selectedSwap.idPertukaran); setIsSwapPreviewOpen(false) }}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 shadow-md disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Setujui Final HRD (Ubah Jadwal Kerja)
                  </button>
                  <button
                    onClick={() => { handleRejectSwapHrd(selectedSwap.idPertukaran); setIsSwapPreviewOpen(false) }}
                    disabled={submitting}
                    className="px-4 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                  >
                    <X className="w-4 h-4" /> Tolak
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
