"use client"

import { confirmDialog, showError, showSuccess } from "@/lib/swal"
import { useState } from "react"
import useSWR from "swr"
import { Check, X, Search, Loader2, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Badge, LatticeLoader } from "@/components/atoms"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

type TundaOff = {
  idTundaOff: number
  karyawan?: { nama: string; departemen?: { namaDepartemen: string } }
  tanggalOffAsal: string
  tanggalOffBaru: string
  alasan: string
  status: string
  catatanSpv?: string | null
  catatanHrd?: string | null
  createdAt?: string
}

function statusLabel(status: string) {
  const map: Record<string, string> = { menunggu_spv: "Menunggu SPV", ditolak_spv: "Ditolak SPV", menunggu_hrd: "Menunggu HRD", ditolak_hrd: "Ditolak HRD", disetujui: "Disetujui", dibatalkan: "Dibatalkan" }
  return map[status] || status
}
function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  if (status === "disetujui") return "success"
  if (status.startsWith("menunggu")) return "warning"
  if (status.startsWith("ditolak")) return "destructive"
  return "secondary"
}
const fmt = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })

export default function TundaOffPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [submittingId, setSubmittingId] = useState<number | null>(null)

  // ponytail: SWR caching + background live sync
  const fetchTundaOff = async () => {
    if (user?.role === "Admin") {
      const [spv, hrd] = await Promise.all([
        api.get<TundaOff[]>("tunda-off/pengajuan/spv"),
        api.get<TundaOff[]>("tunda-off/pengajuan/hrd"),
      ])
      return [...spv, ...hrd.filter((h) => !spv.some((s) => s.idTundaOff === h.idTundaOff))]
    } else if (user?.role === "SPV") {
      return api.get<TundaOff[]>("tunda-off/pengajuan/spv")
    } else {
      return api.get<TundaOff[]>("tunda-off/pengajuan/hrd")
    }
  }

  const { data: items = [], isLoading: loading, mutate } = useSWR<TundaOff[]>(
    user ? `tunda-off/${user.role}` : null,
    fetchTundaOff,
    { refreshInterval: 20000 }
  )

  const respond = async (item: TundaOff, setuju: boolean) => {
    const roleTarget = item.status === "menunggu_spv" ? "spv" : "hrd"
    const catatan = prompt(setuju ? "Catatan persetujuan (opsional):" : `Catatan penolakan ${roleTarget.toUpperCase()} (opsional):`) || ""
    if (!setuju && !(await confirmDialog("Tolak pengajuan tunda off ini?"))) return
    setSubmittingId(item.idTundaOff)
    try {
      await api.patch(`tunda-off/pengajuan/${item.idTundaOff}/approval-${roleTarget}`, { setuju, catatan })
      mutate()
      showSuccess(setuju ? "Pengajuan disetujui." : "Pengajuan ditolak.")
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gagal memproses pengajuan")
    } finally {
      setSubmittingId(null)
    }
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return !q || i.karyawan?.nama.toLowerCase().includes(q) || i.karyawan?.departemen?.namaDepartemen.toLowerCase().includes(q) || i.alasan.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengajuan Tunda Off</h1>
        <p className="mt-1 text-sm text-slate-500">Persetujuan perubahan tanggal libur karyawan.</p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari karyawan/departemen..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-red-500 focus:outline-none" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Karyawan</TableHead><TableHead>Departemen</TableHead><TableHead>Perubahan Off</TableHead><TableHead>Alasan</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <LatticeLoader status="working" label="Memuat pengajuan tunda off..." showTimer={false} cellSize={5} gap={2} fontSize={13} color="var(--color-primary)" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-slate-400">Tidak ada pengajuan tunda off.</TableCell>
                </TableRow>
              ) : filtered.map((item) => {
                const canAction = (user?.role === "Admin" || (user?.role === "SPV" && item.status === "menunggu_spv") || ((user?.role === "HRD") && item.status === "menunggu_hrd"))
                return <TableRow key={item.idTundaOff}>
                  <TableCell className="font-medium text-slate-900">{item.karyawan?.nama || "—"}</TableCell>
                  <TableCell className="text-sm text-slate-600">{item.karyawan?.departemen?.namaDepartemen || "—"}</TableCell>
                  <TableCell><div className="inline-flex items-center gap-2 text-sm"><span>{fmt(item.tanggalOffAsal)}</span><ArrowRight className="h-4 w-4 text-slate-400" /><span className="font-medium text-slate-900">{fmt(item.tanggalOffBaru)}</span></div></TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-slate-600">{item.alasan}</TableCell>
                  <TableCell><Badge variant={statusVariant(item.status)}>{statusLabel(item.status)}</Badge>{item.catatanSpv && <div className="mt-1 text-[10px] italic text-slate-500">SPV: {item.catatanSpv}</div>}{item.catatanHrd && <div className="mt-1 text-[10px] italic text-slate-500">HRD: {item.catatanHrd}</div>}</TableCell>
                  <TableCell className="text-right">{submittingId === item.idTundaOff ? <LatticeLoader status="working" label="Memproses..." showTimer={false} cellSize={3} gap={1} fontSize={11} color="var(--color-primary)" /> : canAction ? <div className="inline-flex gap-1"><button onClick={() => respond(item, true)} className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"><Check className="h-3.5 w-3.5" />Setujui</button><button onClick={() => respond(item, false)} className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"><X className="h-3.5 w-3.5" />Tolak</button></div> : <span className="text-xs text-slate-400">—</span>}</TableCell>
                </TableRow>
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
