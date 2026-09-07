"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/molecules"
import { FileText, Calendar, Users, Briefcase, FileSpreadsheet, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import type { Departemen } from "@/lib/types"

export default function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Departemen[]>([])
  
  // Kehadiran filters
  const [kehadiranBulan, setKehadiranBulan] = useState(new Date().toISOString().substring(0,7))
  const [kehadiranDept, setKehadiranDept] = useState("all")

  // Cuti filters
  const [cutiWaktu, setCutiWaktu] = useState("Semua Waktu")
  const [cutiStatus, setCutiStatus] = useState("Semua Status")

  // Penggajian filters
  const [gajiPeriode, setGajiPeriode] = useState(new Date().toISOString().substring(0,7))
  const [gajiGrup, setGajiGrup] = useState("Semua Karyawan")
  
  useEffect(() => {
    api.get<Departemen[]>("departemen")
      .then(setDepartments)
      .catch(console.error)
  }, [])

  const downloadFile = async (url: string, filename: string) => {
    const token = localStorage.getItem("accessToken")
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/${url}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    if (!res.ok) throw new Error("Gagal mengunduh laporan")
    
    const blob = await res.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)
  }

  const handleExport = async (type: "kehadiran" | "cuti" | "gaji", format: "excel" | "pdf") => {
    if (format === "pdf") {
      alert("Catatan: Fungsi ekspor PDF secara native akan dialihkan ke Excel terlebih dahulu, karena membutuhkan integrasi library cetak. Anda bisa menyimpan Excel lalu menyimpannya sebagai PDF.")
      return
    }

    setLoading(`${type}-${format}`)
    try {
      if (type === "kehadiran") {
        await downloadFile(`reports/kehadiran/excel?periodeBulan=${kehadiranBulan}&departemen=${kehadiranDept}`, `Laporan_Kehadiran_${kehadiranBulan}.xlsx`)
      } else if (type === "cuti") {
        await downloadFile(`reports/cuti-izin/excel?rentangWaktu=${cutiWaktu}&statusApproval=${cutiStatus}`, `Laporan_Cuti_Izin.xlsx`)
      } else if (type === "gaji") {
        await downloadFile(`reports/penggajian/excel?periode=${gajiPeriode}&grup=${gajiGrup}`, `Laporan_Penggajian_${gajiPeriode}.xlsx`)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan saat mengunduh")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Pusat Laporan
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Hasilkan dan unduh berbagai laporan data dari database secara real-time.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Report 1: Kehadiran */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Calendar className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">Kehadiran Bulanan</CardTitle>
            </div>
            <CardDescription>
              Rekapitulasi absensi karyawan, keterlambatan, dan jam kerja aktual.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Periode Bulan</label>
              <input type="month" value={kehadiranBulan} onChange={e => setKehadiranBulan(e.target.value)} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Departemen</label>
              <select value={kehadiranDept} onChange={e => setKehadiranDept(e.target.value)} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                <option value="all">Semua Departemen</option>
                {departments.map(d => (
                  <option key={d.idDepartemen} value={d.idDepartemen}>{d.namaDepartemen}</option>
                ))}
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2 border-t border-[var(--border-default)] pt-4 bg-[var(--bg-page)]">
            <button 
              onClick={() => handleExport("kehadiran", "excel")}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50"
            >
              {loading === "kehadiran-excel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Excel
            </button>
            <button 
              onClick={() => handleExport("kehadiran", "pdf")}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
          </CardFooter>
        </Card>

        {/* Report 2: Cuti & Izin */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">Cuti & Izin</CardTitle>
            </div>
            <CardDescription>
              Data pengajuan cuti, izin sakit, dan alpa beserta status persetujuan.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Rentang Waktu</label>
              <select value={cutiWaktu} onChange={e => setCutiWaktu(e.target.value)} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                <option>Semua Waktu</option>
                <option>Bulan Ini</option>
                <option>Bulan Lalu</option>
                <option>3 Bulan Terakhir</option>
                <option>Tahun Ini</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Status Approval</label>
              <select value={cutiStatus} onChange={e => setCutiStatus(e.target.value)} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                <option>Semua Status</option>
                <option>Disetujui</option>
                <option>Menunggu</option>
                <option>Ditolak</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2 border-t border-[var(--border-default)] pt-4 bg-[var(--bg-page)]">
            <button 
              onClick={() => handleExport("cuti", "excel")}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50"
            >
              {loading === "cuti-excel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Excel
            </button>
            <button 
              onClick={() => handleExport("cuti", "pdf")}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
          </CardFooter>
        </Card>

        {/* Report 3: Penggajian */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">Data Penggajian</CardTitle>
            </div>
            <CardDescription>
              Ringkasan perhitungan gaji, potongan, dan total bersih per karyawan.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Periode Penggajian</label>
              <input type="month" value={gajiPeriode} onChange={e => setGajiPeriode(e.target.value)} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Grup Karyawan</label>
              <select value={gajiGrup} onChange={e => setGajiGrup(e.target.value)} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                <option>Semua Karyawan</option>
                <option>Staf Tetap</option>
                <option>Kontrak</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2 border-t border-[var(--border-default)] pt-4 bg-[var(--bg-page)]">
            <button 
              onClick={() => handleExport("gaji", "excel")}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50"
            >
              {loading === "gaji-excel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Excel
            </button>
            <button 
              onClick={() => handleExport("gaji", "pdf")}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
