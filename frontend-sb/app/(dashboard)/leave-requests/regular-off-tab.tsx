"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Badge } from "@/components/atoms"
import { Check, X, Search, Loader2, Calendar, CheckCircle2, Clock, AlertCircle, Info } from "lucide-react"
import { regularOffApi } from "@/lib/api-ro"
import { useAuth } from "@/lib/auth-context"
import type { PengajuanRo } from "@/lib/types-ro"

function getStatusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  switch (status) {
    case "disetujui":
      return "success"
    case "menunggu_spv":
    case "menunggu_hrd":
      return "warning"
    case "ditolak_spv":
    case "ditolak_hrd":
      return "destructive"
    default:
      return "secondary"
  }
}

function getRoStatusLabel(status: string): string {
  switch (status) {
    case "menunggu_spv":
      return "Menunggu SPV"
    case "menunggu_hrd":
      return "Menunggu HRD"
    case "disetujui":
      return "Disetujui (Jadwal Libur RO)"
    case "ditolak_spv":
      return "Ditolak SPV"
    case "ditolak_hrd":
      return "Ditolak HRD"
    case "dibatalkan":
      return "Dibatalkan"
    default:
      return status
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function RegularOffTab() {
  const { user } = useAuth()
  const isSpv = user?.role === "SPV"
  const isHrdOrAdmin = user?.role === "HRD" || user?.role === "Admin"

  const [roList, setRoList] = useState<PengajuanRo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("Semua")
  const [searchQuery, setSearchQuery] = useState("")
  const [submittingId, setSubmittingId] = useState<number | null>(null)

  // Dialog Approval
  const [actionModal, setActionModal] = useState<{
    open: boolean
    idPengajuan: number | null
    type: "approve" | "reject"
    roleTarget: "SPV" | "HRD"
    catatan: string
    karyawanNama: string
    tanggalList: string[]
  }>({
    open: false,
    idPengajuan: null,
    type: "approve",
    roleTarget: "SPV",
    catatan: "",
    karyawanNama: "",
    tanggalList: [],
  })

  const fetchRoList = async () => {
    try {
      setLoading(true)
      let data: PengajuanRo[] = []
      if (isSpv) {
        data = await regularOffApi.getForSpv()
      } else {
        data = await regularOffApi.getForHrd()
      }
      setRoList(data)
    } catch (err) {
      console.error("Gagal mengambil data Regular Off:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoList()
  }, [isSpv, isHrdOrAdmin])

  const handleOpenAction = (
    item: PengajuanRo,
    type: "approve" | "reject",
    roleTarget: "SPV" | "HRD"
  ) => {
    const tanggalList = Array.isArray(item.tanggalDipilih)
      ? item.tanggalDipilih
      : typeof item.tanggalDipilih === "string"
      ? (item.tanggalDipilih as string).split(",")
      : []

    setActionModal({
      open: true,
      idPengajuan: item.idPengajuanRo,
      type,
      roleTarget,
      catatan: "",
      karyawanNama: item.karyawan?.nama || "Karyawan",
      tanggalList,
    })
  }

  const handleConfirmAction = async () => {
    if (!actionModal.idPengajuan) return
    const id = actionModal.idPengajuan
    const setuju = actionModal.type === "approve"
    const catatan = actionModal.catatan.trim() || undefined

    try {
      setSubmittingId(id)
      if (actionModal.roleTarget === "SPV") {
        await regularOffApi.respondSpv(id, { setuju, catatan })
      } else {
        await regularOffApi.respondHrd(id, { setuju, catatan })
      }
      setActionModal((prev) => ({ ...prev, open: false }))
      await fetchRoList()
    } catch (err: any) {
      alert(`Gagal memproses persetujuan: ${err?.message || "Terjadi kesalahan"}`)
    } finally {
      setSubmittingId(null)
    }
  }

  // Filter
  const filteredList = roList.filter((item) => {
    // Search
    const q = searchQuery.toLowerCase()
    const matchSearch =
      !q ||
      item.karyawan?.nama.toLowerCase().includes(q) ||
      item.karyawan?.nik.toLowerCase().includes(q) ||
      item.karyawan?.departemen?.namaDepartemen.toLowerCase().includes(q)

    if (!matchSearch) return false

    // Tab filter
    if (activeFilter === "Semua") return true
    if (activeFilter === "Menunggu") {
      return item.status === "menunggu_spv" || item.status === "menunggu_hrd"
    }
    if (activeFilter === "Disetujui") {
      return item.status === "disetujui"
    }
    if (activeFilter === "Ditolak") {
      return item.status === "ditolak_spv" || item.status === "ditolak_hrd" || item.status === "dibatalkan"
    }
    return true
  })

  const countMenunggu = roList.filter(
    (i) => i.status === "menunggu_spv" || i.status === "menunggu_hrd"
  ).length

  return (
    <div className="space-y-4">
      {/* Informational Banner */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 text-blue-900 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-blue-950">
            Mekanisme Regular Off (RO) Karyawan Operasional:
          </p>
          <ul className="list-disc pl-4 space-y-0.5 text-blue-800">
            <li>Karyawan operasional yang masuk pada Hari Libur Nasional resmi (non-Minggu) mendapatkan 1 hak Regular Off (RO).</li>
            <li>RO hanya dapat digunakan mulai bulan berikutnya dan memiliki masa aktif selama 3 bulan.</li>
            <li>Alur persetujuan: <strong>SPV</strong> &rarr; <strong>HRD</strong>.</li>
            <li>
              <strong>Penting:</strong> Ketika HRD menyetujui pengajuan, jadwal kerja karyawan pada tanggal-tanggal tersebut <em>otomatis berubah menjadi libur RO</em>, mengabaikan jadwal shift sebelumnya.
            </li>
          </ul>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs sm:text-sm font-medium">
          {["Semua", "Menunggu", "Disetujui", "Ditolak"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeFilter === tab
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab}
              {tab === "Menunggu" && countMenunggu > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                  {countMenunggu}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari karyawan / NIK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead>Tanggal Libur RO</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-red-500" />
                    Memuat daftar pengajuan Regular Off...
                  </TableCell>
                </TableRow>
              ) : filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    Tidak ada pengajuan Regular Off yang sesuai.
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((item) => {
                  const tanggalList = Array.isArray(item.tanggalDipilih)
                    ? item.tanggalDipilih
                    : typeof item.tanggalDipilih === "string"
                    ? (item.tanggalDipilih as string).split(",")
                    : []

                  const canSpvAction = isSpv && item.status === "menunggu_spv"
                  const canHrdAction = isHrdOrAdmin && item.status === "menunggu_hrd"
                  const isProcessing = submittingId === item.idPengajuanRo

                  return (
                    <TableRow key={item.idPengajuanRo} className="hover:bg-slate-50/60">
                      <TableCell>
                        <div className="font-medium text-slate-900">{item.karyawan?.nama}</div>
                        <div className="text-xs text-slate-500 font-mono">NIK: {item.karyawan?.nik}</div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs sm:text-sm">
                        {item.karyawan?.departemen?.namaDepartemen || "Operasional"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {tanggalList.map((tgl) => (
                            <span
                              key={tgl}
                              className="inline-flex items-center gap-1 text-[11px] font-medium bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200"
                            >
                              <Calendar className="w-3 h-3" />
                              {formatDate(tgl.trim())}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800 text-xs sm:text-sm">
                        {item.jumlahHari} Hari
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                        {item.alasan || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(item.status)}>
                          {getRoStatusLabel(item.status)}
                        </Badge>
                        {item.status === "menunggu_hrd" && item.userSpv && (
                          <div className="text-[10px] text-emerald-600 mt-0.5">
                            Disetujui SPV: {item.userSpv.nama}
                          </div>
                        )}
                        {item.catatanSpv && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            SPV: &quot;{item.catatanSpv}&quot;
                          </div>
                        )}
                        {item.catatanHrd && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            HRD: &quot;{item.catatanHrd}&quot;
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isProcessing ? (
                          <Loader2 className="w-5 h-5 animate-spin text-slate-400 inline-block" />
                        ) : canSpvAction ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenAction(item, "approve", "SPV")}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors inline-flex items-center gap-1"
                              title="Setujui dan teruskan ke HRD"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Setujui (SPV)
                            </button>
                            <button
                              onClick={() => handleOpenAction(item, "reject", "SPV")}
                              className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors inline-flex items-center gap-1"
                              title="Tolak pengajuan"
                            >
                              <X className="w-3.5 h-3.5" />
                              Tolak
                            </button>
                          </div>
                        ) : canHrdAction ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenAction(item, "approve", "HRD")}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors inline-flex items-center gap-1 shadow-xs"
                              title="Setujui dan otomatis update jadwal kerja jadi libur RO"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Setujui (HRD)
                            </button>
                            <button
                              onClick={() => handleOpenAction(item, "reject", "HRD")}
                              className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors inline-flex items-center gap-1"
                              title="Tolak pengajuan"
                            >
                              <X className="w-3.5 h-3.5" />
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Dialog Konfirmasi Approval / Rejection */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                {actionModal.type === "approve" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                )}
                {actionModal.type === "approve" ? "Setujui" : "Tolak"} Pengajuan Regular Off
              </h3>
              <button
                onClick={() => setActionModal((prev) => ({ ...prev, open: false }))}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 space-y-2">
              <p>
                Konfirmasi {actionModal.type === "approve" ? "persetujuan" : "penolakan"} untuk karyawan{" "}
                <strong className="text-slate-900">{actionModal.karyawanNama}</strong>:
              </p>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="text-slate-500 text-xs">Tanggal libur RO yang diajukan:</div>
                <div className="font-medium text-slate-900">
                  {actionModal.tanggalList.map((t) => formatDate(t.trim())).join(", ")}
                </div>
              </div>

              {actionModal.type === "approve" && actionModal.roleTarget === "HRD" && (
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs">
                  <strong>Perhatian:</strong> Menyetujui pengajuan ini akan <strong>otomatis mengubah jadwal kerja</strong> karyawan pada tanggal-tanggal tersebut menjadi <strong>RO (Regular Off)</strong>, mengabaikan jadwal shift sebelumnya yang dibuat oleh SPV.
                </div>
              )}

              <div className="space-y-1 pt-1">
                <label className="text-xs font-medium text-slate-700">
                  Catatan {actionModal.roleTarget} (Opsional):
                </label>
                <textarea
                  rows={2}
                  value={actionModal.catatan}
                  onChange={(e) =>
                    setActionModal((prev) => ({ ...prev, catatan: e.target.value }))
                  }
                  placeholder={
                    actionModal.type === "approve"
                      ? "Tambahkan catatan persetujuan jika ada..."
                      : "Alasan penolakan..."
                  }
                  className="w-full text-xs sm:text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionModal((prev) => ({ ...prev, open: false }))}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors inline-flex items-center gap-1 ${
                  actionModal.type === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {actionModal.type === "approve" ? "Ya, Setujui" : "Ya, Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
