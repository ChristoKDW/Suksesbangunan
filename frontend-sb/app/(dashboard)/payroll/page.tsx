"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import {
  Download,
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Loader2,
  FileText,
  Edit,
  Printer,
  X,
  Calendar,
  CheckCircle,
  AlertCircle,
  Search,
  Settings2,
  CalendarRange,
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { Penggajian, PengaturanPenggajian } from "@/lib/types"

const fmt = (n: number | null | undefined) => "Rp " + Number(n || 0).toLocaleString("id-ID")

export default function PayrollPage() {
  const { user } = useAuth()
  const [payroll, setPayroll] = useState<Penggajian[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [potonganGlobal, setPotonganGlobal] = useState("")
  const [dendaPerTelat, setDendaPerTelat] = useState<number>(20000)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [searchQuery, setSearchQuery] = useState("")

  // Settings state
  const [settings, setSettings] = useState<PengaturanPenggajian>({
    id: 1,
    tanggalCutOffMulai: 25,
    tanggalCutOffSelesai: 24,
    dendaPerTelatDefault: 20000,
    standarHariKerja: 26,
  })
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    tanggalCutOffMulai: 25,
    tanggalCutOffSelesai: 24,
    dendaPerTelatDefault: 20000,
    standarHariKerja: 26,
  })
  const [savingSettings, setSavingSettings] = useState(false)

  // Custom period in generate modal
  const [customPeriodeAwal, setCustomPeriodeAwal] = useState("")
  const [customPeriodeAkhir, setCustomPeriodeAkhir] = useState("")
  const [customHariKerja, setCustomHariKerja] = useState("")

  // Modals
  const [viewingSlip, setViewingSlip] = useState<Penggajian | null>(null)
  const [editingSlip, setEditingSlip] = useState<Penggajian | null>(null)

  // Edit form state
  const [editForm, setEditForm] = useState({
    totalHariKerja: 26,
    totalHariHadir: 0,
    gajiPokok: 0,
    gajiPokokSesuaiHari: 0,
    tarifKonsumsiPerHari: 20000,
    tunjanganKonsumsi: 0,
    tunjanganTransportasi: 0,
    tunjanganKomunikasi: 0,
    tunjanganJabatan: 0,
    lembur: 0,
    potonganBpjs: 0,
    potonganTerlambat: 0,
    potonganPinjaman: 0,
    potonganLainnya: 0,
    sisaPinjaman: 0,
    tanggalBayar: "",
    catatan: "",
  })

  const computeCutOffDates = (ym: string, startDay = 25, endDay = 24) => {
    const [yearStr, monthStr] = ym.split("-")
    const year = Number(yearStr)
    const month = Number(monthStr) // 1-12
    const prevDate = new Date(year, month - 2, startDay)
    const startY = prevDate.getFullYear()
    const startM = String(prevDate.getMonth() + 1).padStart(2, "0")
    const startD = String(startDay).padStart(2, "0")

    const curDate = new Date(year, month - 1, endDay)
    const endY = curDate.getFullYear()
    const endM = String(curDate.getMonth() + 1).padStart(2, "0")
    const endD = String(endDay).padStart(2, "0")

    return {
      start: `${startY}-${startM}-${startD}`,
      end: `${endY}-${endM}-${endD}`,
    }
  }

  const calculateWorkingDays = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 26
    const start = new Date(startStr + "T00:00:00")
    const end = new Date(endStr + "T00:00:00")
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 26
    let count = 0
    const cur = new Date(start)
    while (cur <= end) {
      if (cur.getDay() !== 0) {
        // Non-Minggu (Senin s/d Sabtu)
        count++
      }
      cur.setDate(cur.getDate() + 1)
    }
    return count > 0 ? count : 26
  }

  const fetchPayroll = async () => {
    try {
      const [data, settingsData] = await Promise.all([
        api.get<Penggajian[]>("penggajian"),
        api.get<PengaturanPenggajian>("penggajian/settings").catch(() => null),
      ])
      setPayroll(data)
      if (settingsData) {
        setSettings(settingsData)
        setSettingsForm({
          tanggalCutOffMulai: settingsData.tanggalCutOffMulai || 25,
          tanggalCutOffSelesai: settingsData.tanggalCutOffSelesai || 24,
          dendaPerTelatDefault: Number(settingsData.dendaPerTelatDefault) || 20000,
          standarHariKerja: settingsData.standarHariKerja || 26,
        })
      }
    } catch (err) {
      console.error("Failed to fetch penggajian:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayroll()
  }, [])

  const handleOpenGenerateModal = () => {
    setPotonganGlobal("")
    setDendaPerTelat(Number(settings.dendaPerTelatDefault) || 20000)
    const dates = computeCutOffDates(selectedMonth, settings.tanggalCutOffMulai, settings.tanggalCutOffSelesai)
    setCustomPeriodeAwal(dates.start)
    setCustomPeriodeAkhir(dates.end)
    setCustomHariKerja("")
    setIsGenerateModalOpen(true)
  }

  const handleMonthChangeInModal = (ym: string) => {
    setSelectedMonth(ym)
    const dates = computeCutOffDates(ym, settings.tanggalCutOffMulai, settings.tanggalCutOffSelesai)
    setCustomPeriodeAwal(dates.start)
    setCustomPeriodeAkhir(dates.end)
    setCustomHariKerja("")
  }

  const handlePeriodeAwalChange = (val: string) => {
    setCustomPeriodeAwal(val)
  }

  const handlePeriodeAkhirChange = (val: string) => {
    setCustomPeriodeAkhir(val)
  }

  const confirmGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    try {
      const params = new URLSearchParams({
        periode_awal: customPeriodeAwal,
        periode_akhir: customPeriodeAkhir,
        denda_per_telat: String(dendaPerTelat),
      })
      if (potonganGlobal.trim() !== "") params.set("potongan", potonganGlobal)
      if (customHariKerja.trim() !== "") params.set("total_hari_kerja", customHariKerja)
      await api.post(`penggajian/generate?${params.toString()}`)
      setIsGenerateModalOpen(false)
      await fetchPayroll()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal generate payroll")
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const updated = await api.patch<PengaturanPenggajian>("penggajian/settings", settingsForm)
      setSettings(updated)
      setIsSettingsModalOpen(false)
      alert("Pengaturan periode cut-off & denda penggajian berhasil disimpan!")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan pengaturan penggajian")
    } finally {
      setSavingSettings(false)
    }
  }

  const openEditModal = (p: Penggajian) => {
    setEditingSlip(p)
    setEditForm({
      totalHariKerja: p.totalHariKerja || 26,
      totalHariHadir: p.totalHariHadir || 0,
      gajiPokok: Number(p.gajiPokok || 0),
      gajiPokokSesuaiHari: Number(p.gajiPokokSesuaiHari || p.gajiPokok || 0),
      tarifKonsumsiPerHari: Number(p.tarifKonsumsiPerHari || 20000),
      tunjanganKonsumsi: Number(p.tunjanganKonsumsi || 0),
      tunjanganTransportasi: Number(p.tunjanganTransportasi || 0),
      tunjanganKomunikasi: Number(p.tunjanganKomunikasi || 0),
      tunjanganJabatan: Number(p.tunjanganJabatan || 0),
      lembur: Number(p.lembur || 0),
      potonganBpjs: Number(p.potonganBpjs || 0),
      potonganTerlambat: Number(p.potonganTerlambat || 0),
      potonganPinjaman: Number(p.potonganPinjaman || 0),
      potonganLainnya: Number(p.potonganLainnya || 0),
      sisaPinjaman: Number(p.sisaPinjaman || 0),
      tanggalBayar: p.tanggalBayar ? p.tanggalBayar.split("T")[0] : "",
      catatan: p.catatan || "",
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSlip) return
    setSavingEdit(true)
    try {
      const payload = {
        ...editForm,
        tanggalBayar: editForm.tanggalBayar ? editForm.tanggalBayar : null,
      }
      const updated = await api.patch<Penggajian>(`penggajian/${editingSlip.idGaji}`, payload)
      setPayroll(prev => prev.map(item => (item.idGaji === updated.idGaji ? updated : item)))
      if (viewingSlip?.idGaji === updated.idGaji) {
        setViewingSlip(updated)
      }
      setEditingSlip(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui rincian slip gaji")
    } finally {
      setSavingEdit(false)
    }
  }

  // Live calculation preview in Edit Modal
  const editPreviewEarnings = useMemo(() => {
    return (
      Number(editForm.gajiPokokSesuaiHari || 0) +
      Number(editForm.tunjanganKonsumsi || 0) +
      Number(editForm.tunjanganTransportasi || 0) +
      Number(editForm.tunjanganKomunikasi || 0) +
      Number(editForm.tunjanganJabatan || 0) +
      Number(editForm.lembur || 0)
    )
  }, [editForm])

  const editPreviewDeductions = useMemo(() => {
    return (
      Number(editForm.potonganBpjs || 0) +
      Number(editForm.potonganTerlambat || 0) +
      Number(editForm.potonganPinjaman || 0) +
      Number(editForm.potonganLainnya || 0)
    )
  }, [editForm])

  const editPreviewTakeHomePay = Math.max(editPreviewEarnings - editPreviewDeductions, 0)

  // Filter by selected month & search
  const filteredPayroll = payroll.filter(p => {
    const pAwal = p.periodeAwal ? p.periodeAwal.split("T")[0] : ""
    const pAkhir = p.periodeAkhir ? p.periodeAkhir.split("T")[0] : ""
    // Periode cut-off (misal 25 Agu - 24 Sep) adalah slip gaji untuk penggajian bulan September (tutup buku September)
    const matchMonth =
      !selectedMonth ||
      pAkhir.startsWith(selectedMonth) ||
      pAwal.startsWith(selectedMonth)
    const matchSearch =
      !searchQuery ||
      p.karyawan?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.karyawan?.nik?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.karyawan?.departemen?.namaDepartemen?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.karyawan?.jabatan?.namaJabatan?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchMonth && matchSearch
  })

  // Computed stats for filtered period
  const totalPayroll = filteredPayroll.reduce((sum, p) => sum + Number(p.totalGaji || 0), 0)
  const totalDeductions = filteredPayroll.reduce((sum, p) => sum + Number(p.potongan || 0), 0)
  const totalAllowances = filteredPayroll.reduce(
    (sum, p) =>
      sum +
      Number(p.tunjanganKonsumsi || 0) +
      Number(p.tunjanganTransportasi || 0) +
      Number(p.tunjanganKomunikasi || 0) +
      Number(p.tunjanganJabatan || 0),
    0
  )
  const processedCount = filteredPayroll.length

  const summaryStats = [
    {
      label: "Total Take Home Pay",
      value: fmt(totalPayroll),
      sub: `Periode ${selectedMonth}`,
      icon: DollarSign,
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
    },
    {
      label: "Karyawan Diproses",
      value: `${processedCount} orang`,
      sub: "Slip gaji aktif",
      icon: TrendingUp,
      iconBg: "#f0fdf4",
      iconColor: "#16a34a",
    },
    {
      label: "Total Tunjangan",
      value: fmt(totalAllowances),
      sub: "Konsumsi, transport, jabatan, dll",
      icon: CheckCircle,
      iconBg: "#fefce8",
      iconColor: "#ca8a04",
    },
    {
      label: "Total Potongan",
      value: fmt(totalDeductions),
      sub: "BPJS, terlambat, kasbon, lainnya",
      icon: TrendingDown,
      iconBg: "#fef2f2",
      iconColor: "#dc2626",
    },
  ]

  const formatPeriodeIndo = (dateStr: string) => {
    if (!dateStr) return "-"
    const d = new Date(dateStr)
    return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
  }

  const formatDateFullIndo = (dateStr: string) => {
    if (!dateStr) return "-"
    const d = new Date(dateStr)
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
  }

  const handlePrintSlip = () => {
    window.print()
  }

  const exportExcelUrl = `/api/reports/penggajian/excel?periode=${selectedMonth}&grup=all`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Print CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-slip, #printable-slip * {
            visibility: visible;
          }
          #printable-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Penggajian & Slip Gaji
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Kalkulasi gaji pokok, tunjangan terstruktur, potongan, dan cetak slip gaji karyawan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none cursor-pointer"
            />
          </div>

          <a
            href={exportExcelUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)] transition-colors"
          >
            <Download className="w-4 h-4 text-[var(--text-muted)]" />
            Export Excel
          </a>

          {(user?.role === "HRD" || user?.role === "Admin") && (
            <>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)] transition-colors"
                title="Atur siklus cut-off tanggal awal hitung & tutup buku"
              >
                <Settings2 className="w-4 h-4 text-[var(--text-muted)]" />
                Periode Cut-Off
              </button>
              <button
                onClick={handleOpenGenerateModal}
                disabled={generating}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 bg-[#16a34a] hover:bg-[#15803d] shadow-sm"
              >
                <Calculator className="w-4 h-4" />
                {generating ? "Memproses..." : "Generate Payroll"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map(stat => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: stat.iconBg }}
              >
                <stat.icon style={{ width: "1.125rem", height: "1.125rem", color: stat.iconColor }} />
              </div>
            </div>
            <div className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</div>
            <div className="mt-1 text-xs font-medium text-[var(--text-secondary)]">{stat.label}</div>
            <div className="text-xs text-[var(--text-muted)]">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-[var(--border-default)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-full sm:max-w-xs bg-[var(--bg-page)] border border-[var(--border-default)]">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
            <input
              type="search"
              placeholder="Cari nama, NIK, jabatan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            Menampilkan <span className="font-semibold text-[var(--text-primary)]">{filteredPayroll.length}</span> slip gaji
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Departemen / Jabatan</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead className="text-center">Hari Hadir</TableHead>
                <TableHead className="text-right">Gaji Pokok</TableHead>
                <TableHead className="text-right">Tunjangan</TableHead>
                <TableHead className="text-right">Potongan</TableHead>
                <TableHead className="text-right font-semibold">Total Diterima</TableHead>
                <TableHead className="text-center w-28">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayroll.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-sm text-[var(--text-muted)]">
                    Tidak ada data penggajian untuk periode {selectedMonth}.
                    {(user?.role === "HRD" || user?.role === "Admin") && (
                      <div className="mt-2">
                        Klik tombol <strong>"Generate Payroll"</strong> untuk mengkalkulasi otomatis.
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayroll.map(p => {
                  const totalTunjangan =
                    Number(p.tunjanganKonsumsi || 0) +
                    Number(p.tunjanganTransportasi || 0) +
                    Number(p.tunjanganKomunikasi || 0) +
                    Number(p.tunjanganJabatan || 0) +
                    Number(p.lembur || 0)

                  return (
                    <TableRow key={p.idGaji}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{ background: "var(--color-primary)" }}
                          >
                            {p.karyawan?.nama
                              ?.split(" ")
                              .map(n => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase() || "?"}
                          </div>
                          <div>
                            <div className="font-medium text-sm text-[var(--text-primary)]">
                              {p.karyawan?.nama || "—"}
                            </div>
                            <div className="text-xs text-[var(--text-muted)] font-mono">
                              {p.karyawan?.nik || "—"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-[var(--text-primary)]">
                          {p.karyawan?.jabatan?.namaJabatan || "—"}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {p.karyawan?.departemen?.namaDepartemen || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-[var(--text-secondary)] whitespace-nowrap">
                        {formatPeriodeIndo(p.periodeAwal)}
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {p.totalHariHadir || 0} / {p.totalHariKerja || 26} hari
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono text-[var(--text-secondary)]">
                        {fmt(p.gajiPokokSesuaiHari || p.gajiPokok)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono text-emerald-600 dark:text-emerald-400">
                        +{fmt(totalTunjangan)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono text-red-600 dark:text-red-400">
                        -{fmt(p.potongan)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono font-bold text-[var(--text-primary)]">
                        {fmt(p.totalGaji)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingSlip(p)}
                            title="Lihat & Cetak Slip Gaji"
                            className="p-1.5 rounded-md text-[var(--color-primary)] hover:bg-[var(--bg-surface-raised)] transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {(user?.role === "HRD" || user?.role === "Admin") && (
                            <button
                              onClick={() => openEditModal(p)}
                              disabled={!!p.tanggalBayar}
                              title={p.tanggalBayar ? "Slip sudah dibayar dan terkunci" : "Sesuaikan Rincian Gaji"}
                              className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
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

      {/* Generate Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-md rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Generate Payroll</h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
            <form onSubmit={confirmGenerate} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Bulan & Tahun Penggajian</label>
                <input
                  type="month"
                  required
                  value={selectedMonth}
                  onChange={e => handleMonthChangeInModal(e.target.value)}
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              {/* Rentang Periode Cut-Off */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Awal Hitung Gaji</label>
                  <input
                    type="date"
                    required
                    value={customPeriodeAwal}
                    onChange={e => handlePeriodeAwalChange(e.target.value)}
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">Awal periode cut-off</span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Tutup Buku</label>
                  <input
                    type="date"
                    required
                    value={customPeriodeAkhir}
                    onChange={e => handlePeriodeAkhirChange(e.target.value)}
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">Akhir periode cut-off</span>
                </div>
              </div>

              {/* Optional total working-day override */}
              <div className="space-y-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-page)] p-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Override Total Hari Kerja (Opsional)
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    Otomatis per jadwal karyawan
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={customHariKerja}
                    onChange={e => setCustomHariKerja(e.target.value)}
                    onFocus={e => e.target.select()}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomHariKerja(String(calculateWorkingDays(customPeriodeAwal, customPeriodeAkhir)))}
                    className="px-3 py-2 rounded-md text-xs font-medium bg-[var(--bg-surface-raised)] hover:bg-[var(--border-default)] text-[var(--text-secondary)] border border-[var(--border-default)] whitespace-nowrap transition-colors"
                    title="Isi override dari kalender non-Minggu"
                  >
                    Isi Kalender
                  </button>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] block">
                  Kosongkan agar backend menghitung otomatis per jadwal karyawan, termasuk RO/off. Isi hanya untuk memaksa nilai yang sama ke semua karyawan.
                </span>
              </div>

              <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-page)] p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-medium text-[var(--text-secondary)]">Denda Telat per Kali Terlambat:</span>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Otomatis dari <strong>Pengaturan Cut-Off</strong>
                  </div>
                </div>
                <div className="font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] px-2.5 py-1 rounded border border-[var(--border-default)]">
                  Rp {(settings.dendaPerTelatDefault || 20000).toLocaleString("id-ID")}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Potongan Global Tambahan (Rp)
                </label>
                <input
                  type="number"
                  value={potonganGlobal}
                  onChange={e => setPotonganGlobal(e.target.value)}
                  onFocus={e => e.target.select()}
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  placeholder="Kosong = pertahankan potongan slip"
                />
                <span className="text-[10px] text-[var(--text-muted)]">
                  Kosongkan untuk mempertahankan potongan lainnya per slip. Masukkan 0 hanya jika memang ingin menghapusnya.
                </span>
              </div>

              <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5">
                  <CalendarRange className="w-3.5 h-3.5" /> Metode Baku Penggajian CV Sukses Bangunindo
                </div>
                <p>
                  • <strong>Rentang Cut-off:</strong> Dari <strong>{customPeriodeAwal || "25"}</strong> s/d <strong>{customPeriodeAkhir || "24"}</strong>; hari kerja <strong>{customHariKerja ? `${customHariKerja} hari (override global)` : "otomatis per jadwal karyawan"}</strong>.
                </p>
                <p>
                  • <strong>Gaji Pokok:</strong> Prorata sesuai hari kerja: ((Hari Hadir + Sakit + Cuti) ÷ Total Hari Kerja) × Gaji Pokok.
                </p>
                <p>
                  • <strong>Tunjangan Konsumsi:</strong> Berbasis kehadiran fisik riil (Hari Hadir × Rp {(20000).toLocaleString("id-ID")}).
                </p>
                <p>
                  • <strong>Denda Terlambat:</strong> Jumlah terlambat riil × Rp {(dendaPerTelat || 20000).toLocaleString("id-ID")} per kejadian.
                </p>
                <p>
                  • Payroll yang sudah memiliki tanggal bayar terkunci dan tidak akan ditimpa saat generate ulang.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-raised)] border border-transparent"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-60 bg-[#16a34a] hover:bg-[#15803d]"
                >
                  {generating ? "Mengkalkulasi..." : "Mulai Generate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal (Pengaturan Cut-Off) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-md rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="font-semibold text-[var(--text-primary)]">Pengaturan Periode & Cut-Off</h3>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveSettings} className="p-4 space-y-4">
              <p className="text-xs text-[var(--text-muted)]">
                Tentukan siklus tanggal awal hitung dan tanggal tutup buku penggajian. Pengaturan ini akan ditandai pada Jadwal Kerja dan digunakan sebagai acuan perhitungan absensi.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Tanggal Awal Hitung Gaji</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[var(--text-muted)] font-bold">Tgl</span>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      required
                      value={settingsForm.tanggalCutOffMulai === 0 ? "" : settingsForm.tanggalCutOffMulai}
                      onChange={e => setSettingsForm({ ...settingsForm, tanggalCutOffMulai: e.target.value === "" ? 0 : Number(e.target.value) })}
                      onFocus={e => e.target.select()}
                      className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">Contoh: 25 (Bulan sebelumnya)</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Tanggal Tutup Buku</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[var(--text-muted)] font-bold">Tgl</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      required
                      value={settingsForm.tanggalCutOffSelesai === 0 ? "" : settingsForm.tanggalCutOffSelesai}
                      onChange={e => setSettingsForm({ ...settingsForm, tanggalCutOffSelesai: e.target.value === "" ? 0 : Number(e.target.value) })}
                      onFocus={e => e.target.select()}
                      className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">Contoh: 24 (Bulan berjalan)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Denda Telat Default (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={settingsForm.dendaPerTelatDefault === 0 ? "" : settingsForm.dendaPerTelatDefault}
                    onChange={e => setSettingsForm({ ...settingsForm, dendaPerTelatDefault: e.target.value === "" ? 0 : Number(e.target.value) })}
                    onFocus={e => e.target.select()}
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Standar Hari Kerja (Hari)</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    value={settingsForm.standarHariKerja === 0 ? "" : settingsForm.standarHariKerja}
                    onChange={e => setSettingsForm({ ...settingsForm, standarHariKerja: e.target.value === "" ? 0 : Number(e.target.value) })}
                    onFocus={e => e.target.select()}
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-raised)] border border-transparent"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
                >
                  {savingSettings ? "Menyimpan..." : "Simpan Pengaturan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL SLIP GAJI MODAL (EXACT MATCH CV SUKSES BANGUNINDO) */}
      {viewingSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white text-black w-full max-w-xl rounded-xl shadow-2xl overflow-hidden my-6 border border-gray-300">
            {/* Action Bar (Not printed) */}
            <div className="no-print bg-gray-100 px-4 py-3 border-b border-gray-300 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">Preview Slip Gaji Resmi</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintSlip}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Slip Gaji
                </button>
                {(user?.role === "HRD" || user?.role === "Admin") && (
                  <button
                    onClick={() => {
                      const s = viewingSlip
                      setViewingSlip(null)
                      openEditModal(s)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
                <button
                  onClick={() => setViewingSlip(null)}
                  className="text-gray-500 hover:text-black p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Slip Gaji Content */}
            <div id="printable-slip" className="p-6 font-sans text-xs sm:text-sm leading-tight text-black bg-white">
              {/* Header Box */}
              <div className="border border-black p-2 text-center font-bold tracking-wide mb-3 bg-white">
                <div className="text-base uppercase font-extrabold tracking-wider">CV SUKSES BANGUNINDO</div>
                <div className="text-sm tracking-widest mt-0.5">SLIP GAJI KARYAWAN</div>
              </div>

              {/* Info Karyawan Grid */}
              <div className="border border-black divide-y divide-black mb-3">
                <div className="grid grid-cols-12 px-2 py-1">
                  <div className="col-span-12 font-bold">
                    Periode: {formatDateFullIndo(viewingSlip.periodeAwal)} s/d {formatDateFullIndo(viewingSlip.periodeAkhir)} ({formatPeriodeIndo(viewingSlip.periodeAkhir)})
                  </div>
                </div>
                <div className="grid grid-cols-12 px-2 py-1">
                  <div className="col-span-3 font-semibold">Nama</div>
                  <div className="col-span-9 uppercase font-bold">: {viewingSlip.karyawan?.nama || "-"}</div>
                </div>
                <div className="grid grid-cols-12 px-2 py-1">
                  <div className="col-span-3 font-semibold">Jabatan</div>
                  <div className="col-span-9 font-medium">: {viewingSlip.karyawan?.jabatan?.namaJabatan || "-"}</div>
                </div>
                <div className="grid grid-cols-12 px-2 py-1">
                  <div className="col-span-3 font-semibold">Divisi</div>
                  <div className="col-span-9 font-medium">: {viewingSlip.karyawan?.departemen?.namaDepartemen || "-"}</div>
                </div>
              </div>

              {/* Rincian Penghasilan Table */}
              <table className="w-full border-collapse border border-black mb-3 text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-black font-bold">
                    <th className="text-left px-2 py-1.5" colSpan={3}>
                      RINCIAN PENGHASILAN
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-medium">
                  <tr className="font-bold">
                    <td className="px-2 py-1">TOTAL TAKE HOME PAY</td>
                    <td className="px-2 py-1 text-center"></td>
                    <td className="px-2 py-1 text-right font-mono font-bold">{fmt(viewingSlip.totalGaji)}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 font-bold">TOTAL HARI KERJA</td>
                    <td className="px-2 py-1 text-center font-bold font-mono">{viewingSlip.totalHariKerja || 26}</td>
                    <td className="px-2 py-1 text-right font-bold">HARI</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Gaji Pokok ({viewingSlip.totalHariKerja || 26} Hari Kerja)</td>
                    <td className="px-2 py-1 text-center"></td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(viewingSlip.gajiPokok)}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Gaji Pokok sesuai hari kerja</td>
                    <td className="px-2 py-1 text-center"></td>
                    <td className="px-2 py-1 text-right font-mono">
                      {fmt(viewingSlip.gajiPokokSesuaiHari || viewingSlip.gajiPokok)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Tunjangan Konsumsi</td>
                    <td className="px-2 py-1 text-center font-mono text-xs">
                      {viewingSlip.totalHariHadir || 0} Hari × {fmt(viewingSlip.tarifKonsumsiPerHari || 20000)}
                    </td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(viewingSlip.tunjanganKonsumsi)}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Tunjangan Transportasi</td>
                    <td className="px-2 py-1 text-center"></td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(viewingSlip.tunjanganTransportasi)}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Tunjangan Komunikasi</td>
                    <td className="px-2 py-1 text-center"></td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(viewingSlip.tunjanganKomunikasi)}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Tunjangan Jabatan</td>
                    <td className="px-2 py-1 text-center"></td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(viewingSlip.tunjanganJabatan)}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Lembur</td>
                    <td className="px-2 py-1 text-center"></td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(viewingSlip.lembur)}</td>
                  </tr>
                  <tr className="font-bold border-t-2 border-black">
                    <td className="px-2 py-1">Total Penghasilan</td>
                    <td className="px-2 py-1 text-center"></td>
                    <td className="px-2 py-1 text-right font-mono font-bold">
                      {fmt(
                        viewingSlip.totalPenghasilan ||
                          Number(viewingSlip.gajiPokokSesuaiHari || viewingSlip.gajiPokok || 0) +
                            Number(viewingSlip.tunjanganKonsumsi || 0) +
                            Number(viewingSlip.tunjanganTransportasi || 0) +
                            Number(viewingSlip.tunjanganKomunikasi || 0) +
                            Number(viewingSlip.tunjanganJabatan || 0) +
                            Number(viewingSlip.lembur || 0)
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Potongan Table */}
              <table className="w-full border-collapse border border-black mb-3 text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-black font-bold">
                    <th className="text-left px-2 py-1.5" colSpan={3}>
                      POTONGAN
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-medium">
                  <tr>
                    <td className="px-2 py-1" colSpan={2}>
                      Potongan BPJS KETENAGAKERJAAN
                    </td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(viewingSlip.potonganBpjs)}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1" colSpan={2}>
                      Potongan Terlambat
                    </td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(viewingSlip.potonganTerlambat)}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1" colSpan={2}>
                      Potongan pinjaman
                    </td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(viewingSlip.potonganPinjaman)}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1" colSpan={2}>
                      Potongan Lainnya
                    </td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(viewingSlip.potonganLainnya)}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1" colSpan={2}>
                      Sisa Pinjaman
                    </td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(viewingSlip.sisaPinjaman)}</td>
                  </tr>
                  <tr className="font-bold border-t-2 border-black">
                    <td className="px-2 py-1 font-bold" colSpan={2}>
                      Total Diterima
                    </td>
                    <td className="px-2 py-1 text-right font-mono font-bold">{fmt(viewingSlip.totalGaji)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Catatan Box */}
              <div className="border border-black p-2.5 text-xs space-y-1.5">
                <div className="font-bold uppercase tracking-wider">CATATAN:</div>
                <div className="text-[11px] leading-relaxed">
                  1. Slip gaji bersifat rahasia. Dilarang membagikan informasi gaji kepada sesama karyawan. Jika melanggar,
                  gaji dapat ditunda 1 bulan dan perubahan gaji (jika ada) dibatalkan.
                </div>
                <div className="text-[11px] leading-relaxed">
                  2. <strong>Ketentuan Sakit:</strong> Jika izin sakit dengan surat resmi/dokter yang disetujui, hanya tunjangan konsumsi (uang makan) yang dipotong. Gaji pokok tetap dibayarkan.
                </div>
                <div className="text-[11px] leading-relaxed">
                  3. <strong>Ketentuan Izin & Tidak Masuk Kerja (Alpa):</strong> Hari izin dan hari alpa/mangkir tidak dihitung dalam pembayaran gaji pokok maupun uang makan (potong gaji harian proporsional & tanpa tunjangan konsumsi).
                </div>
                {viewingSlip.catatan && (
                  <div className="text-[11px] leading-relaxed font-semibold text-gray-800 pt-1 border-t border-gray-300">
                    ℹ️ {viewingSlip.catatan}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SLIP GAJI MODAL (HRD & ADMIN) */}
      {editingSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[var(--bg-surface)] w-full max-w-xl rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden my-6">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Sesuaikan Slip Gaji</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {editingSlip.karyawan?.nama} ({editingSlip.karyawan?.nik}) · {formatPeriodeIndo(editingSlip.periodeAwal)}
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Perubahan di sini hanya untuk snapshot slip ini. Kenaikan gaji master dilakukan dari menu Karyawan.
                </p>
              </div>
              <button
                onClick={() => setEditingSlip(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 space-y-4 text-sm max-h-[80vh] overflow-y-auto">
              {/* Hari Kerja & Kehadiran */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Total Hari Kerja Standar</label>
                  <input
                    type="number"
                    value={editForm.totalHariKerja === 0 ? "" : (editForm.totalHariKerja ?? "")}
                    onChange={e => setEditForm({ ...editForm, totalHariKerja: e.target.value === "" ? 0 : Number(e.target.value) })}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Total Hari Hadir Aktual</label>
                  <input
                    type="number"
                    value={editForm.totalHariHadir === 0 ? "" : (editForm.totalHariHadir ?? "")}
                    onChange={e => {
                      const hadir = e.target.value === "" ? 0 : Number(e.target.value)
                      setEditForm({
                        ...editForm,
                        totalHariHadir: hadir,
                        tunjanganKonsumsi: hadir * (editForm.tarifKonsumsiPerHari || 0),
                      })
                    }}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* Gaji Pokok */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Gaji Pokok Penuh (Rp)</label>
                  <input
                    type="number"
                    value={editForm.gajiPokok === 0 ? "" : (editForm.gajiPokok ?? "")}
                    onChange={e => setEditForm({ ...editForm, gajiPokok: e.target.value === "" ? 0 : Number(e.target.value) })}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Gaji Pokok Sesuai Hari Kerja (Rp)
                  </label>
                  <input
                    type="number"
                    value={editForm.gajiPokokSesuaiHari === 0 ? "" : (editForm.gajiPokokSesuaiHari ?? "")}
                    onChange={e => setEditForm({ ...editForm, gajiPokokSesuaiHari: e.target.value === "" ? 0 : Number(e.target.value) })}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* Tunjangan Konsumsi */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Tarif Konsumsi / Hari (Rp)
                  </label>
                  <input
                    type="number"
                    value={editForm.tarifKonsumsiPerHari === 0 ? "" : (editForm.tarifKonsumsiPerHari ?? "")}
                    onChange={e => {
                      const tarif = e.target.value === "" ? 0 : Number(e.target.value)
                      setEditForm({
                        ...editForm,
                        tarifKonsumsiPerHari: tarif,
                        tunjanganKonsumsi: (editForm.totalHariHadir || 0) * tarif,
                      })
                    }}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Total Tunjangan Konsumsi (Rp)
                  </label>
                  <input
                    type="number"
                    value={editForm.tunjanganKonsumsi === 0 ? "" : (editForm.tunjanganKonsumsi ?? "")}
                    onChange={e => setEditForm({ ...editForm, tunjanganKonsumsi: e.target.value === "" ? 0 : Number(e.target.value) })}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* Tunjangan Lainnya */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Transportasi (Rp)</label>
                  <input
                    type="number"
                    value={editForm.tunjanganTransportasi === 0 ? "" : (editForm.tunjanganTransportasi ?? "")}
                    onChange={e => setEditForm({ ...editForm, tunjanganTransportasi: e.target.value === "" ? 0 : Number(e.target.value) })}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Komunikasi (Rp)</label>
                  <input
                    type="number"
                    value={editForm.tunjanganKomunikasi === 0 ? "" : (editForm.tunjanganKomunikasi ?? "")}
                    onChange={e => setEditForm({ ...editForm, tunjanganKomunikasi: e.target.value === "" ? 0 : Number(e.target.value) })}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Jabatan (Rp)</label>
                  <input
                    type="number"
                    value={editForm.tunjanganJabatan === 0 ? "" : (editForm.tunjanganJabatan ?? "")}
                    onChange={e => setEditForm({ ...editForm, tunjanganJabatan: e.target.value === "" ? 0 : Number(e.target.value) })}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* Lembur */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Upah Lembur (Rp)</label>
                <input
                  type="number"
                  value={editForm.lembur === 0 ? "" : (editForm.lembur ?? "")}
                  onChange={e => setEditForm({ ...editForm, lembur: e.target.value === "" ? 0 : Number(e.target.value) })}
                  onFocus={e => e.target.select()}
                  placeholder="0"
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              {/* Potongan BPJS & Terlambat */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--border-default)]">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">BPJS Ketenagakerjaan (Rp)</label>
                  <input
                    type="number"
                    value={editForm.potonganBpjs === 0 ? "" : (editForm.potonganBpjs ?? "")}
                    onChange={e => setEditForm({ ...editForm, potonganBpjs: e.target.value === "" ? 0 : Number(e.target.value) })}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Potongan Terlambat (Rp)</label>
                  <input
                    type="number"
                    value={editForm.potonganTerlambat === 0 ? "" : (editForm.potonganTerlambat ?? "")}
                    onChange={e => setEditForm({ ...editForm, potonganTerlambat: e.target.value === "" ? 0 : Number(e.target.value) })}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* Pinjaman / Kasbon / Lainnya */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Potongan Pinjaman / Kasbon (Rp)
                  </label>
                  <input
                    type="number"
                    value={editForm.potonganPinjaman === 0 ? "" : (editForm.potonganPinjaman ?? "")}
                    onChange={e => setEditForm({ ...editForm, potonganPinjaman: e.target.value === "" ? 0 : Number(e.target.value) })}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Sisa Pinjaman (Rp)</label>
                  <input
                    type="number"
                    value={editForm.sisaPinjaman === 0 ? "" : (editForm.sisaPinjaman ?? "")}
                    onChange={e => setEditForm({ ...editForm, sisaPinjaman: e.target.value === "" ? 0 : Number(e.target.value) })}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Potongan Lainnya (Rp)</label>
                  <input
                    type="number"
                    value={editForm.potonganLainnya === 0 ? "" : (editForm.potonganLainnya ?? "")}
                    onChange={e => setEditForm({ ...editForm, potonganLainnya: e.target.value === "" ? 0 : Number(e.target.value) })}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* Tanggal Bayar */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Tanggal Bayar</label>
                <input
                  type="date"
                  value={editForm.tanggalBayar}
                  onChange={e => setEditForm({ ...editForm, tanggalBayar: e.target.value })}
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              {/* Live Preview Summary */}
              <div className="p-3.5 rounded-lg bg-[var(--bg-page)] border border-[var(--border-default)] space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Total Penghasilan:</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {fmt(editPreviewEarnings)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Total Potongan:</span>
                  <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                    -{fmt(editPreviewDeductions)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-[var(--border-default)] pt-1.5">
                  <span className="text-[var(--text-primary)]">Take Home Pay (Diterima):</span>
                  <span className="font-mono text-[var(--color-primary)]">
                    {fmt(editPreviewTakeHomePay)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSlip(null)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-raised)] border border-transparent"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
                >
                  {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
