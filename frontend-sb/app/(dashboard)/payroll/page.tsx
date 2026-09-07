"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Download, Calculator, DollarSign, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import type { Penggajian } from "@/lib/types"

const fmt = (n: number) => "Rp " + Number(n).toLocaleString("id-ID")

export default function PayrollPage() {
  const [payroll, setPayroll] = useState<Penggajian[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [potonganGlobal, setPotonganGlobal] = useState<number>(0)

  const fetchPayroll = async () => {
    try {
      const data = await api.get<Penggajian[]>("penggajian")
      setPayroll(data)
    } catch (err) {
      console.error("Failed to fetch penggajian:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPayroll() }, [])

  const handleOpenGenerateModal = () => {
    setPotonganGlobal(0)
    setIsGenerateModalOpen(true)
  }

  const confirmGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    // Generate payroll for current month
    const now = new Date()
    const periodeAwal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const periodeAkhir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${lastDay}`
    
    setGenerating(true)
    try {
      await api.post(`penggajian/generate?periode_awal=${periodeAwal}&periode_akhir=${periodeAkhir}&potongan=${potonganGlobal}`)
      setIsGenerateModalOpen(false)
      await fetchPayroll()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal generate payroll")
    } finally {
      setGenerating(false)
    }
  }

  // Computed stats
  const totalPayroll = payroll.reduce((sum, p) => sum + Number(p.totalGaji), 0)
  const totalDeductions = payroll.reduce((sum, p) => sum + Number(p.potongan), 0)
  const processedCount = payroll.length

  const summaryStats = [
    { label: "Total Payroll", value: fmt(totalPayroll), sub: "Periode saat ini", icon: DollarSign, iconBg: "#eff6ff", iconColor: "#2563eb" },
    { label: "Processed", value: `${processedCount} karyawan`, sub: "Total data gaji", icon: TrendingUp, iconBg: "#f0fdf4", iconColor: "#16a34a" },
    { label: "Total Potongan", value: fmt(totalDeductions), sub: "Periode ini", icon: TrendingDown, iconBg: "#fef2f2", iconColor: "#dc2626" },
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--text-muted)" }} /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Penggajian</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Kalkulasi gaji dan potongan</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenGenerateModal}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ background: "#16a34a" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#15803d")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#16a34a")}
          >
            <Calculator style={{ width: "0.875rem", height: "0.875rem" }} />
            {generating ? "Generating..." : "Generate Payroll"}
          </button>
        </div>
      </div>

      {/* Generate Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-sm rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Generate Payroll</h3>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                ✕
              </button>
            </div>
            <form onSubmit={confirmGenerate} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Potongan Global (Rp)</label>
                <p className="text-xs text-[var(--text-muted)] mb-2">Potongan untuk semua karyawan periode ini (Koperasi, BPJS, dll).</p>
                <input 
                  type="number" 
                  value={potonganGlobal} 
                  onChange={e => setPotonganGlobal(Number(e.target.value))} 
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" 
                  placeholder="Contoh: 50000" 
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsGenerateModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-raised)] border border-transparent">Batal</button>
                <button type="submit" disabled={generating} className="px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-60" style={{ background: "#16a34a" }}>
                  {generating ? "Memproses..." : "Mulai Generate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: stat.iconBg }}>
                <stat.icon style={{ width: "1.125rem", height: "1.125rem", color: stat.iconColor }} />
              </div>
            </div>
            <div className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{stat.value}</div>
            <div className="mt-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{stat.label}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="border-b pb-4" style={{ borderColor: "var(--border-default)" }}>
          <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Detail Penggajian</h3>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead className="text-right">Gaji Pokok</TableHead>
                <TableHead className="text-right">Potongan</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payroll.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
                    Belum ada data penggajian. Klik "Generate Payroll" untuk membuat.
                  </TableCell>
                </TableRow>
              ) : (
                payroll.map((p) => (
                  <TableRow key={p.idGaji}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: "var(--color-primary)" }}>
                          {p.karyawan?.nama?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                        </div>
                        <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{p.karyawan?.nama || "—"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{p.karyawan?.departemen?.namaDepartemen || "—"}</TableCell>
                    <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{p.karyawan?.jabatan?.namaJabatan || "—"}</TableCell>
                    <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {new Date(p.periodeAwal).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{fmt(p.gajiPokok)}</TableCell>
                    <TableCell className="text-right text-sm font-mono" style={{ color: "#dc2626" }}>-{fmt(p.potongan)}</TableCell>
                    <TableCell className="text-right text-sm font-mono font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(p.totalGaji)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
