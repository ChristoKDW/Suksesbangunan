"use client"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { HandCoins, Plus, Check, X, Ban, History, Loader2, Wallet, Clock, CheckCircle2 } from "lucide-react"
import { api } from "@/lib/api"
import { confirmDialog, showApiError, showWarning, toast } from "@/lib/swal"

interface KasbonRow {
  idKasbon: number
  idKaryawan: number
  karyawan?: { nama: string; nik: string; departemen?: { namaDepartemen: string } }
  jumlah: number
  cicilanPerBulan: number
  mulaiPeriode: string
  status: "menunggu" | "aktif" | "lunas" | "ditolak" | "dibatalkan"
  alasan?: string | null
  catatanHrd?: string | null
  sumber: "hrd" | "mobile"
  terbayar: number
  sisa: number
  riwayat: { idGaji: number; periodeAkhir: string; nominal: number }[]
  createdAt: string
}

interface KaryawanOption {
  idKaryawan: number
  nama: string
  nik: string
  statusKaryawan: string
  departemen: string
}

const rp = (n: number) => "Rp " + Math.round(Number(n) || 0).toLocaleString("id-ID")
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
const periodeLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number)
  return `${BULAN[(m || 1) - 1]} ${y}`
}
const bulanDepan = () => {
  const [y, m] = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" }).split("-").map(Number)
  const d = new Date(Date.UTC(y, m, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

const STATUS_STYLE: Record<KasbonRow["status"], string> = {
  menunggu: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  aktif: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  lunas: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  ditolak: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  dibatalkan: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
}

const inputCls =
  "w-full min-w-0 bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"

export default function KasbonPage() {
  const [rows, setRows] = useState<KasbonRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"semua" | KasbonRow["status"]>("semua")
  const [karyawan, setKaryawan] = useState<KaryawanOption[]>([])
  const [modal, setModal] = useState<"baru" | { approve: KasbonRow } | { riwayat: KasbonRow } | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ idKaryawan: "", jumlah: "", cicilanPerBulan: "", mulaiPeriode: bulanDepan(), alasan: "" })
  const [search, setSearch] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      setRows(await api.get<KasbonRow[]>("kasbon"))
    } catch (err) {
      showApiError(err, "Gagal memuat data kasbon")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    api
      .get<KaryawanOption[]>("reports/karyawan-options?statusKaryawan=Internal")
      .then(setKaryawan)
      .catch(() => setKaryawan([]))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(
      r =>
        (filter === "semua" || r.status === filter) &&
        (!q || `${r.karyawan?.nama} ${r.karyawan?.nik}`.toLowerCase().includes(q)),
    )
  }, [rows, filter, search])

  const stats = useMemo(() => {
    const aktif = rows.filter(r => r.status === "aktif")
    return {
      menunggu: rows.filter(r => r.status === "menunggu").length,
      aktif: aktif.length,
      totalSisa: aktif.reduce((s, r) => s + r.sisa, 0),
      cicilanBulanIni: aktif.reduce((s, r) => s + Math.min(r.cicilanPerBulan, r.sisa), 0),
    }
  }, [rows])

  const openBaru = () => {
    setForm({ idKaryawan: "", jumlah: "", cicilanPerBulan: "", mulaiPeriode: bulanDepan(), alasan: "" })
    setModal("baru")
  }

  const openApprove = (r: KasbonRow) => {
    setForm({
      idKaryawan: String(r.idKaryawan),
      jumlah: String(r.jumlah),
      cicilanPerBulan: String(r.cicilanPerBulan),
      mulaiPeriode: r.mulaiPeriode,
      alasan: "",
    })
    setModal({ approve: r })
  }

  const submitBaru = async () => {
    const jumlah = Number(form.jumlah)
    const cicilan = Number(form.cicilanPerBulan)
    if (!form.idKaryawan || !jumlah || !cicilan) return showWarning("Karyawan, jumlah, dan cicilan wajib diisi.")
    if (cicilan > jumlah) return showWarning("Cicilan per bulan tidak boleh melebihi jumlah kasbon.")
    setSaving(true)
    try {
      await api.post("kasbon", {
        idKaryawan: Number(form.idKaryawan),
        jumlah,
        cicilanPerBulan: cicilan,
        mulaiPeriode: form.mulaiPeriode,
        alasan: form.alasan || undefined,
      })
      toast("Kasbon tercatat — cicilan dipotong otomatis saat Generate Payroll")
      setModal(null)
      load()
    } catch (err) {
      showApiError(err, "Gagal mencatat kasbon")
    } finally {
      setSaving(false)
    }
  }

  const submitApproval = async (r: KasbonRow, setuju: boolean) => {
    if (!setuju && !(await confirmDialog(`Tolak pengajuan kasbon ${r.karyawan?.nama} sebesar ${rp(r.jumlah)}?`, { title: "Tolak kasbon?", confirmText: "Ya, tolak", danger: true }))) return
    setSaving(true)
    try {
      await api.patch(`kasbon/${r.idKasbon}/approval`, {
        setuju,
        cicilanPerBulan: setuju ? Number(form.cicilanPerBulan) : undefined,
        mulaiPeriode: setuju ? form.mulaiPeriode : undefined,
        catatanHrd: form.alasan || undefined,
      })
      toast(setuju ? "Kasbon disetujui" : "Kasbon ditolak")
      setModal(null)
      load()
    } catch (err) {
      showApiError(err, "Gagal memproses kasbon")
    } finally {
      setSaving(false)
    }
  }

  const batalkan = async (r: KasbonRow) => {
    const ok = await confirmDialog(
      `Hentikan kasbon ${r.karyawan?.nama}? Sisa ${rp(r.sisa)} tidak akan dipotong lagi dari gaji (mis. karena sudah dilunasi tunai).`,
      { title: "Hentikan kasbon?", confirmText: "Ya, hentikan", danger: true },
    )
    if (!ok) return
    try {
      await api.patch(`kasbon/${r.idKasbon}/batal`, {})
      toast("Kasbon dihentikan")
      load()
    } catch (err) {
      showApiError(err, "Gagal menghentikan kasbon")
    }
  }

  const statCards = [
    { label: "Menunggu Persetujuan", value: String(stats.menunggu), icon: Clock, color: "text-amber-600 bg-amber-100 dark:bg-amber-500/15" },
    { label: "Kasbon Aktif", value: String(stats.aktif), icon: HandCoins, color: "text-blue-600 bg-blue-100 dark:bg-blue-500/15" },
    { label: "Total Sisa Pinjaman", value: rp(stats.totalSisa), icon: Wallet, color: "text-rose-600 bg-rose-100 dark:bg-rose-500/15" },
    { label: "Estimasi Potongan / Periode", value: rp(stats.cicilanBulanIni), icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">Kasbon Karyawan</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Cicilan dipotong otomatis setiap Generate Payroll, sisa dihitung sendiri, dan berstatus Lunas saat habis.
          </p>
        </div>
        <button
          onClick={openBaru}
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-sm"
        >
          <Plus className="w-4 h-4" /> Catat Kasbon
        </button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-[var(--text-muted)] truncate">{s.label}</div>
                <div className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate">{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {(["semua", "menunggu", "aktif", "lunas", "ditolak", "dibatalkan"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-colors ${
                    filter === s
                      ? "bg-[var(--color-primary)] text-white border-transparent"
                      : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-page)]"
                  }`}
                >
                  {s}
                  {s === "menunggu" && stats.menunggu > 0 ? ` (${stats.menunggu})` : ""}
                </button>
              ))}
            </div>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama / NIK..."
              className={`${inputCls} sm:max-w-xs`}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-right">Cicilan</TableHead>
                <TableHead className="text-right">Sisa</TableHead>
                <TableHead>Mulai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-[var(--text-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin inline" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-sm text-[var(--text-muted)]">
                    Belum ada data kasbon.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(r => (
                  <TableRow key={r.idKasbon}>
                    <TableCell className="min-w-[180px]">
                      <div className="font-medium text-[var(--text-primary)]">{r.karyawan?.nama ?? "-"}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {r.karyawan?.departemen?.namaDepartemen ?? "-"} · {r.sumber === "mobile" ? "Diajukan via mobile" : "Dicatat HRD"}
                      </div>
                      {r.alasan && <div className="text-[11px] text-[var(--text-muted)] italic truncate max-w-[240px]">“{r.alasan}”</div>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm whitespace-nowrap">{rp(r.jumlah)}</TableCell>
                    <TableCell className="text-right font-mono text-sm whitespace-nowrap">{rp(r.cicilanPerBulan)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold whitespace-nowrap">{rp(r.sisa)}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{periodeLabel(r.mulaiPeriode)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {r.status === "menunggu" && (
                          <button onClick={() => openApprove(r)} title="Proses pengajuan" className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => setModal({ riwayat: r })} title="Riwayat cicilan" className="p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-page)]">
                          <History className="w-4 h-4" />
                        </button>
                        {(r.status === "aktif" || r.status === "menunggu") && (
                          <button onClick={() => batalkan(r)} title="Hentikan kasbon" className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 [&>*]:my-auto bg-black/50 backdrop-blur-sm px-4" onClick={() => !saving && setModal(null)}>
          <div className="w-full max-w-md rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
              <h2 className="font-semibold text-[var(--text-primary)]">
                {modal === "baru" ? "Catat Kasbon" : "approve" in modal ? "Proses Pengajuan Kasbon" : "Riwayat Cicilan"}
              </h2>
              <button onClick={() => setModal(null)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modal !== "baru" && "riwayat" in modal ? (
              <div className="p-5 space-y-3">
                <div className="text-sm text-[var(--text-secondary)]">
                  {modal.riwayat.karyawan?.nama} · Terbayar <b>{rp(modal.riwayat.terbayar)}</b> dari {rp(modal.riwayat.jumlah)}
                </div>
                {modal.riwayat.riwayat.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">Belum ada cicilan terpotong. Cicilan dipotong saat Generate Payroll periode {periodeLabel(modal.riwayat.mulaiPeriode)} dan seterusnya.</p>
                ) : (
                  <ul className="divide-y divide-[var(--border-default)] text-sm">
                    {modal.riwayat.riwayat.map(c => (
                      <li key={c.idGaji} className="flex justify-between py-2">
                        <span>Gaji periode {periodeLabel(c.periodeAkhir.slice(0, 7))}</span>
                        <span className="font-mono">{rp(c.nominal)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {modal === "baru" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">Karyawan</label>
                    <select value={form.idKaryawan} onChange={e => setForm({ ...form, idKaryawan: e.target.value })} className={inputCls}>
                      <option value="">Pilih karyawan...</option>
                      {karyawan.map(k => (
                        <option key={k.idKaryawan} value={k.idKaryawan}>{k.nama} — {k.departemen}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="rounded-lg bg-[var(--bg-page)] p-3 text-sm space-y-1">
                    <div><b>{modal.approve.karyawan?.nama}</b> mengajukan <b>{rp(modal.approve.jumlah)}</b></div>
                    {modal.approve.alasan && <div className="text-[var(--text-muted)]">Alasan: {modal.approve.alasan}</div>}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">Jumlah Kasbon (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      disabled={modal !== "baru"}
                      value={form.jumlah}
                      onChange={e => setForm({ ...form, jumlah: e.target.value })}
                      className={`${inputCls} disabled:opacity-60`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">Cicilan per Bulan (Rp)</label>
                    <input type="number" min={0} value={form.cicilanPerBulan} onChange={e => setForm({ ...form, cicilanPerBulan: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Mulai Dipotong pada Gaji Periode</label>
                  <input type="month" value={form.mulaiPeriode} onChange={e => setForm({ ...form, mulaiPeriode: e.target.value })} className={inputCls} />
                  {Number(form.jumlah) > 0 && Number(form.cicilanPerBulan) > 0 && (
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Lunas dalam ± {Math.ceil(Number(form.jumlah) / Number(form.cicilanPerBulan))} kali potong gaji.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">{modal === "baru" ? "Keperluan / Keterangan" : "Catatan HRD (opsional)"}</label>
                  <input value={form.alasan} onChange={e => setForm({ ...form, alasan: e.target.value })} className={inputCls} />
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                  {modal === "baru" ? (
                    <button onClick={submitBaru} disabled={saving} className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] disabled:opacity-60">
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />} Simpan Kasbon
                    </button>
                  ) : (
                    <>
                      <button onClick={() => submitApproval(modal.approve, false)} disabled={saving} className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold border border-rose-300 text-rose-600 hover:bg-rose-50 disabled:opacity-60">
                        Tolak
                      </button>
                      <button onClick={() => submitApproval(modal.approve, true)} disabled={saving} className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Setujui
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
