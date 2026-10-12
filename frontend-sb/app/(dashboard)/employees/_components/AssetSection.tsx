"use client"

import { confirmDialog, showError, showWarning } from "@/lib/swal"
import { useEffect, useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Badge } from "@/components/atoms"
import { api } from "@/lib/api"

type Asset = {
  idPeminjamanAset: number
  kodeBarang: string
  namaBarang: string
  tanggalPinjam: string
  durasi: string
  keterangan?: string | null
  status: "dipinjam" | "dikembalikan"
  tanggalDikembalikan?: string | null
}

const today = () => new Date().toISOString().slice(0, 10)
const inputClass = "w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"

export default function AssetSection({ idKaryawan }: { idKaryawan: string }) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ kodeBarang: "", namaBarang: "", tanggalPinjam: today(), durasi: "", keterangan: "" })

  const load = async () => {
    try {
      setAssets(await api.get<Asset[]>(`aset?idKaryawan=${idKaryawan}`))
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gagal memuat aset")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [idKaryawan])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.kodeBarang.trim() || !form.namaBarang.trim() || !form.tanggalPinjam || !form.durasi.trim()) return showWarning("Kode barang, nama barang, tanggal pinjam, dan durasi wajib diisi.")
    setSaving(true)
    try {
      await api.post("aset", { ...form, idKaryawan: Number(idKaryawan), keterangan: form.keterangan.trim() || undefined })
      setForm({ kodeBarang: "", namaBarang: "", tanggalPinjam: today(), durasi: "", keterangan: "" })
      await load()
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gagal menambah aset")
    } finally {
      setSaving(false)
    }
  }

  const returnAsset = async (id: number) => {
    if (!(await confirmDialog("Tandai aset ini sudah dikembalikan?"))) return
    await api.patch(`aset/${id}/kembalikan`, {})
    await load()
  }

  const remove = async (id: number) => {
    if (!(await confirmDialog("Hapus data peminjaman aset ini?"))) return
    await api.delete(`aset/${id}`)
    await load()
  }

  return (
    <Card>
      <CardHeader className="border-b border-[var(--border-default)]"><h2 className="text-lg font-semibold text-[var(--text-primary)]">Peminjaman Aset</h2></CardHeader>
      <CardContent className="space-y-4 pt-5">
        <form onSubmit={add} className="grid gap-3 rounded-lg border border-[var(--border-default)] p-3 sm:grid-cols-5">
          <input className={inputClass} placeholder="Kode barang" value={form.kodeBarang} onChange={(e) => setForm({ ...form, kodeBarang: e.target.value })} />
          <input className={inputClass} placeholder="Nama barang" value={form.namaBarang} onChange={(e) => setForm({ ...form, namaBarang: e.target.value })} />
          <input type="date" className={inputClass} value={form.tanggalPinjam} onChange={(e) => setForm({ ...form, tanggalPinjam: e.target.value })} />
          <input className={inputClass} placeholder="mis. 1 Tahun / Selama Masa Kerja" value={form.durasi} onChange={(e) => setForm({ ...form, durasi: e.target.value })} />
          <button disabled={saving} className="rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60">Tambah</button>
          <input className={`${inputClass} sm:col-span-5`} placeholder="Keterangan (opsional)" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />
        </form>

        <Table>
          <TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Barang</TableHead><TableHead>Tanggal Pinjam</TableHead><TableHead>Durasi</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow> : assets.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-[var(--text-muted)]">Belum ada peminjaman aset.</TableCell></TableRow> : assets.map((a) => (
              <TableRow key={a.idPeminjamanAset}>
                <TableCell className="font-mono text-sm">{a.kodeBarang}</TableCell>
                <TableCell>{a.namaBarang}</TableCell>
                <TableCell>{fmt(a.tanggalPinjam)}</TableCell>
                <TableCell>{a.durasi}</TableCell>
                <TableCell><Badge variant={a.status === "dipinjam" ? "warning" : "success"}>{a.status === "dipinjam" ? "Dipinjam" : "Dikembalikan"}</Badge></TableCell>
                <TableCell className="text-right">
                  {a.status === "dipinjam" && <button onClick={() => returnAsset(a.idPeminjamanAset)} className="mr-2 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">Dikembalikan</button>}
                  <button onClick={() => remove(a.idPeminjamanAset)} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
