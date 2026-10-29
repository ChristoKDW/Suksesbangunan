"use client"
import { useMemo, useState } from "react"
import useSWR from "swr"
import { Card, CardContent } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Check, X, Loader2, Clock, CheckCircle2, Banknote } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { confirmDialog, showApiError, toast } from "@/lib/swal"

interface PencairanRow {
  idPencairan: number
  jenis: "ro" | "cuti"
  jumlahHari: number
  tahun: number | null
  alasan: string | null
  status: "menunggu_spv" | "ditolak_spv" | "menunggu_hrd" | "ditolak_hrd" | "disetujui" | "dibatalkan"
  catatanSpv: string | null
  catatanHrd: string | null
  tanggalDisetujui: string | null
  idGaji: number | null
  nominal: number
  createdAt: string
  karyawan?: { nama: string; nik: string; departemen?: { namaDepartemen: string } }
}

const rp = (n: number) => "Rp " + Math.round(Number(n) || 0).toLocaleString("id-ID")

const STATUS: Record<PencairanRow["status"], { label: string; cls: string }> = {
  menunggu_spv: { label: "Menunggu SPV", cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
  menunggu_hrd: { label: "Menunggu HRD", cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
  disetujui: { label: "Disetujui", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" },
  ditolak_spv: { label: "Ditolak SPV", cls: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300" },
  ditolak_hrd: { label: "Ditolak HRD", cls: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300" },
  dibatalkan: { label: "Dibatalkan", cls: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300" },
}

const FILTERS = ["menunggu", "disetujui", "ditolak", "semua"] as const

export default function PencairanPage() {
  const { user } = useAuth()
  const isSpv = user?.role === "SPV"
  const { data: rows = [], isLoading, mutate } = useSWR<PencairanRow[]>("pencairan")
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("menunggu")
  const [busy, setBusy] = useState<number | null>(null)

  // SPV hanya memproses tahap SPV; HRD/Admin memproses tahap HRD (dan SPV sebagai cadangan)
  const bisaProses = (r: PencairanRow) =>
    isSpv ? r.status === "menunggu_spv" : r.status === "menunggu_spv" || r.status === "menunggu_hrd"

  const filtered = useMemo(
    () =>
      rows.filter(r =>
        filter === "semua" ? true : filter === "ditolak" ? r.status.startsWith("ditolak") : r.status.startsWith(filter),
      ),
    [rows, filter],
  )

  const stats = {
    menunggu: rows.filter(bisaProses).length,
    disetujui: rows.filter(r => r.status === "disetujui").length,
    belumDibayar: rows.filter(r => r.status === "disetujui" && !r.idGaji).length,
  }

  const proses = async (r: PencairanRow, setuju: boolean) => {
    const label = `pencairan ${r.jenis.toUpperCase()} ${r.jumlahHari} hari — ${r.karyawan?.nama}`
    const ok = await confirmDialog(
      setuju
        ? `Setujui ${label}?${isSpv ? " Pengajuan akan diteruskan ke HRD." : " Nominal (gaji pokok ÷ hari kerja periode × hari) dibayar pada Generate Payroll periode ini."}`
        : `Tolak ${label}? Saldo akan dikembalikan ke karyawan.`,
      setuju
        ? { title: "Setujui pencairan?", confirmText: "Ya, setujui" }
        : { title: "Tolak pencairan?", confirmText: "Ya, tolak", danger: true },
    )
    if (!ok) return
    setBusy(r.idPencairan)
    try {
      await api.patch(`pencairan/${r.idPencairan}/approval`, { setuju })
      toast(setuju ? "Pencairan disetujui" : "Pencairan ditolak")
      mutate()
    } catch (err) {
      showApiError(err, "Gagal memproses pencairan")
    } finally {
      setBusy(null)
    }
  }

  const statCards = [
    { label: "Perlu Diproses", value: stats.menunggu, icon: Clock, color: "text-amber-600 bg-amber-100 dark:bg-amber-500/15" },
    { label: "Disetujui", value: stats.disetujui, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15" },
    { label: "Menunggu Generate Payroll", value: stats.belumDibayar, icon: Banknote, color: "text-blue-600 bg-blue-100 dark:bg-blue-500/15" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">Pencairan RO & Cuti</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Karyawan mengajukan dari aplikasi mobile. 1 hari = gaji pokok ÷ hari kerja periode, dibayar pada slip periode saat HRD menyetujui.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-[var(--text-muted)] truncate">{s.label}</div>
                <div className="text-base font-bold text-[var(--text-primary)]">{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-colors ${
                  filter === f
                    ? "bg-[var(--color-primary)] text-white border-transparent"
                    : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-page)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="text-right">Hari</TableHead>
                <TableHead>Diajukan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-[var(--text-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin inline" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-sm text-[var(--text-muted)]">
                    Belum ada pengajuan pencairan.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(r => (
                  <TableRow key={r.idPencairan}>
                    <TableCell className="min-w-[180px]">
                      <div className="font-medium text-[var(--text-primary)]">{r.karyawan?.nama ?? "-"}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{r.karyawan?.departemen?.namaDepartemen ?? "-"}</div>
                      {r.alasan && <div className="text-[11px] text-[var(--text-muted)] italic truncate max-w-[240px]">“{r.alasan}”</div>}
                      {(r.catatanHrd || r.catatanSpv) && (
                        <div className="text-[11px] text-[var(--text-muted)] truncate max-w-[240px]">Catatan: {r.catatanHrd || r.catatanSpv}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {r.jenis === "ro" ? "Regular Off" : `Cuti ${r.tahun ?? ""}`}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{r.jumlahHari}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                      {r.idGaji ? rp(r.nominal) : r.status === "disetujui" ? <span className="text-[11px] text-[var(--text-muted)]">Saat Generate Payroll</span> : "—"}
                    </TableCell>
                    <TableCell>
                      {bisaProses(r) && (
                        <div className="flex items-center justify-center gap-1">
                          {busy === r.idPencairan ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
                          ) : (
                            <>
                              <button onClick={() => proses(r, true)} title="Setujui" className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => proses(r, false)} title="Tolak" className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </TableCell>
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
