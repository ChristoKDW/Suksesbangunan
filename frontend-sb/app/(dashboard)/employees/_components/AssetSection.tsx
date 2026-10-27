"use client"

import { confirmDelete, confirmDialog, showError, showWarning } from "@/lib/swal"
import { useEffect, useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Badge, LatticeLoader } from "@/components/atoms"
import { api } from "@/lib/api"

export type PendingAsset = {
  kodeBarang: string
  namaBarang: string
  tanggalPinjam: string
  durasi: string
  keterangan?: string
}

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

export default function AssetSection({
  idKaryawan,
  pendingAssets = [],
  onAddPendingAsset,
  onRemovePendingAsset,
}: {
  idKaryawan?: string
  pendingAssets?: PendingAsset[]
  onAddPendingAsset?: (asset: PendingAsset) => void
  onRemovePendingAsset?: (index: number) => void
}) {
  const isPendingMode = !idKaryawan
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(!!idKaryawan)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ kodeBarang: "", namaBarang: "", tanggalPinjam: today(), durasi: "", keterangan: "" })

  const load = async () => {
    if (!idKaryawan) return
    try {
      setAssets(await api.get<Asset[]>(`aset?idKaryawan=${idKaryawan}`))
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gagal memuat aset")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (idKaryawan) {
      load()
    }
  }, [idKaryawan])

  const add = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!form.kodeBarang.trim() || !form.namaBarang.trim() || !form.tanggalPinjam || !form.durasi.trim()) {
      return showWarning("Kode barang, nama barang, tanggal pinjam, dan durasi wajib diisi.")
    }

    if (isPendingMode) {
      onAddPendingAsset?.({
        kodeBarang: form.kodeBarang.trim(),
        namaBarang: form.namaBarang.trim(),
        tanggalPinjam: form.tanggalPinjam,
        durasi: form.durasi.trim(),
        keterangan: form.keterangan.trim() || undefined,
      })
      setForm({ kodeBarang: "", namaBarang: "", tanggalPinjam: today(), durasi: "", keterangan: "" })
      return
    }

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      add()
    }
  }

  const returnAsset = async (id: number) => {
    if (!(await confirmDialog("Tandai aset ini sudah dikembalikan?"))) return
    await api.patch(`aset/${id}/kembalikan`, {})
    await load()
  }

  const remove = async (id: number) => {
    if (!(await confirmDelete("Hapus data peminjaman aset ini?"))) return
    await api.delete(`aset/${id}`)
    await load()
  }

  return (
    <Card>
      <CardHeader className="border-b border-[var(--border-default)]">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Peminjaman Aset</h2>
          {isPendingMode && (
            <span className="text-xs text-[var(--text-muted)]">
              Opsional: Aset yang ditambahkan akan otomatis dicatat sebagai peminjaman saat karyawan baru disimpan.
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="grid gap-3 rounded-lg border border-[var(--border-default)] p-3 sm:grid-cols-5">
          <input
            className={inputClass}
            placeholder="Kode barang"
            value={form.kodeBarang}
            onChange={(e) => setForm({ ...form, kodeBarang: e.target.value })}
            onKeyDown={handleKeyDown}
          />
          <input
            className={inputClass}
            placeholder="Nama barang"
            value={form.namaBarang}
            onChange={(e) => setForm({ ...form, namaBarang: e.target.value })}
            onKeyDown={handleKeyDown}
          />
          <input
            type="date"
            className={inputClass}
            value={form.tanggalPinjam}
            onChange={(e) => setForm({ ...form, tanggalPinjam: e.target.value })}
            onKeyDown={handleKeyDown}
          />
          <input
            className={inputClass}
            placeholder="mis. 1 Tahun / Selama Masa Kerja"
            value={form.durasi}
            onChange={(e) => setForm({ ...form, durasi: e.target.value })}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={() => add()}
            disabled={saving}
            className="rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
          >
            {isPendingMode ? "Tambah Aset" : saving ? "Menyimpan..." : "Tambah"}
          </button>
          <input
            className={`${inputClass} sm:col-span-5`}
            placeholder="Keterangan (opsional)"
            value={form.keterangan}
            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
            onKeyDown={handleKeyDown}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Barang</TableHead>
              <TableHead>Tanggal Pinjam</TableHead>
              <TableHead>Durasi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  <LatticeLoader status="working" label="Memuat aset..." showTimer={false} cellSize={4} gap={2} fontSize={13} color="var(--color-primary)" />
                </TableCell>
              </TableRow>
            ) : isPendingMode ? (
              pendingAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-[var(--text-muted)]">
                    Belum ada peminjaman aset yang ditambahkan.
                  </TableCell>
                </TableRow>
              ) : (
                pendingAssets.map((a, idx) => (
                  <TableRow key={`${a.kodeBarang}-${idx}`}>
                    <TableCell className="font-mono text-sm">{a.kodeBarang}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{a.namaBarang}</div>
                        {a.keterangan && <div className="text-xs text-[var(--text-muted)]">{a.keterangan}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{fmt(a.tanggalPinjam)}</TableCell>
                    <TableCell>{a.durasi}</TableCell>
                    <TableCell>
                      <Badge variant="warning">Dipinjam</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => onRemovePendingAsset?.(idx)}
                        title="Hapus aset"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )
            ) : assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-[var(--text-muted)]">
                  Belum ada peminjaman aset.
                </TableCell>
              </TableRow>
            ) : (
              assets.map((a) => (
                <TableRow key={a.idPeminjamanAset}>
                  <TableCell className="font-mono text-sm">{a.kodeBarang}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{a.namaBarang}</div>
                      {a.keterangan && <div className="text-xs text-[var(--text-muted)]">{a.keterangan}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{fmt(a.tanggalPinjam)}</TableCell>
                  <TableCell>{a.durasi}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === "dipinjam" ? "warning" : "success"}>
                      {a.status === "dipinjam" ? "Dipinjam" : "Dikembalikan"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {a.status === "dipinjam" && (
                      <button
                        type="button"
                        onClick={() => returnAsset(a.idPeminjamanAset)}
                        className="mr-2 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                      >
                        Dikembalikan
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(a.idPeminjamanAset)}
                      title="Hapus aset"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
