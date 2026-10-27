"use client"
import { useEffect, useState } from "react"
import useSWR from "swr"
import { CalendarHeart, Loader2, RotateCcw, Briefcase, PartyPopper } from "lucide-react"
import { api } from "@/lib/api"
import { confirmDialog, showApiError, toast } from "@/lib/swal"

type Perlakuan = "libur" | "kerja"
type Jenis = "libur_nasional" | "cuti_bersama"

interface DaftarKebijakan {
  tahun: number
  default: Record<Jenis, Perlakuan>
  daftar: { tanggal: string; nama: string; jenis: Jenis; perlakuan: Perlakuan; sumber: "default" | "khusus" }[]
}

const JENIS_LABEL: Record<Jenis, string> = { libur_nasional: "Libur Nasional", cuti_bersama: "Cuti Bersama" }

const fmtTanggal = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })

/** Tombol 2 pilihan (1 klik) Libur ⇄ Hari Kerja. */
function Toggle({ value, onChange, disabled, compact }: { value: Perlakuan; onChange: (v: Perlakuan) => void; disabled?: boolean; compact?: boolean }) {
  const opsi: { v: Perlakuan; label: string; icon: typeof PartyPopper; on: string }[] = [
    { v: "libur", label: compact ? "Libur" : "Libur (Tanggal Merah)", icon: PartyPopper, on: "bg-red-600 text-white border-red-600" },
    { v: "kerja", label: compact ? "Kerja" : "Hari Kerja Biasa", icon: Briefcase, on: "bg-slate-700 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-900" },
  ]
  return (
    <div className="inline-flex rounded-lg border border-[var(--border-default)] overflow-hidden shrink-0">
      {opsi.map(o => (
        <button
          key={o.v}
          type="button"
          disabled={disabled}
          onClick={() => value !== o.v && onChange(o.v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
            value === o.v ? o.on : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-page)]"
          }`}
        >
          <o.icon className="w-3.5 h-3.5" />
          {o.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Kebijakan Tanggal Merah: menentukan libur nasional / cuti bersama mana yang
 * diliburkan perusahaan. Libur → kantor off otomatis, operasional yang masuk dapat RO,
 * tidak dihitung hari kerja payroll. Kerja → hari kerja biasa tanpa RO.
 */
export function KebijakanTanggalMerah() {
  const [tahun, setTahun] = useState(() => new Date().getFullYear())
  const { data, isLoading, mutate } = useSWR<DaftarKebijakan>(`kebijakan-libur?tahun=${tahun}`)
  const [busy, setBusy] = useState<string | null>(null)
  const [tampilSemua, setTampilSemua] = useState(false)

  useEffect(() => setTampilSemua(false), [tahun])

  const ubahDefault = async (jenis: Jenis, v: Perlakuan) => {
    setBusy(jenis)
    try {
      await api.patch("kebijakan-libur/default", jenis === "libur_nasional" ? { liburNasional: v } : { cutiBersama: v })
      await mutate()
      toast(`${JENIS_LABEL[jenis]} kini ${v === "libur" ? "diliburkan" : "hari kerja biasa"}`)
    } catch (err) {
      showApiError(err, "Gagal menyimpan kebijakan")
    } finally {
      setBusy(null)
    }
  }

  const ubahTanggal = async (tanggal: string, v: Perlakuan) => {
    setBusy(tanggal)
    try {
      await api.patch(`kebijakan-libur/${tanggal}`, { perlakuan: v })
      await mutate()
      toast(v === "libur" ? "Ditetapkan sebagai tanggal merah" : "Ditetapkan sebagai hari kerja biasa")
    } catch (err) {
      showApiError(err, "Gagal menyimpan")
    } finally {
      setBusy(null)
    }
  }

  const reset = async () => {
    if (!(await confirmDialog(`Kembalikan semua tanggal tahun ${tahun} ke kebijakan default?`, { title: "Reset pengecualian?", confirmText: "Ya, reset" }))) return
    setBusy("reset")
    try {
      await api.post(`kebijakan-libur/reset?tahun=${tahun}`)
      await mutate()
      toast("Semua tanggal mengikuti kebijakan default")
    } catch (err) {
      showApiError(err, "Gagal reset")
    } finally {
      setBusy(null)
    }
  }

  const today = new Date().toLocaleDateString("en-CA")
  const daftar = (data?.daftar ?? []).filter(d => tampilSemua || d.tanggal >= today || tahun !== new Date().getFullYear())
  const adaKhusus = (data?.daftar ?? []).some(d => d.sumber === "khusus")

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-[var(--border-default)] space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
              <CalendarHeart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">Kebijakan Tanggal Merah & Cuti Bersama</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-2xl">
                <b>Libur</b> = karyawan kantor otomatis off, karyawan operasional yang tetap masuk mendapat <b>1 saldo RO</b>, dan tidak dihitung hari kerja di payroll.{" "}
                <b>Hari Kerja Biasa</b> = tetap masuk seperti biasa, <b>tanpa RO</b>.
              </p>
            </div>
          </div>
          <select
            value={tahun}
            onChange={e => setTahun(Number(e.target.value))}
            className="self-start bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-1.5 text-sm text-[var(--text-primary)]"
          >
            {[-1, 0, 1].map(o => {
              const y = new Date().getFullYear() + o
              return <option key={y} value={y}>{y}</option>
            })}
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {(["libur_nasional", "cuti_bersama"] as Jenis[]).map(j => (
            <div key={j} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-[var(--bg-page)] border border-[var(--border-default)] p-3">
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">Semua {JENIS_LABEL[j]}</div>
                <div className="text-[11px] text-[var(--text-muted)]">Berlaku untuk seluruh tanggal {JENIS_LABEL[j].toLowerCase()} (kecuali diatur khusus)</div>
              </div>
              {data ? (
                <Toggle value={data.default[j]} disabled={busy !== null} onChange={v => ubahDefault(j, v)} />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[var(--border-default)]">
        {isLoading ? (
          <div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-[var(--text-muted)]" /></div>
        ) : daftar.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-muted)]">Tidak ada libur resmi tersisa tahun ini.</div>
        ) : (
          daftar.map(d => (
            <div key={d.tanggal} className="flex flex-col gap-2 px-4 sm:px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-[var(--text-muted)] w-24 shrink-0">{fmtTanggal(d.tanggal)}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{d.nama}</span>
                </div>
                <div className="flex gap-1.5 mt-1 sm:ml-[6.5rem]">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${d.jenis === "libur_nasional" ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"}`}>
                    {JENIS_LABEL[d.jenis]}
                  </span>
                  {d.sumber === "khusus" && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">Diatur khusus</span>
                  )}
                </div>
              </div>
              <Toggle compact value={d.perlakuan} disabled={busy !== null} onChange={v => ubahTanggal(d.tanggal, v)} />
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-[var(--border-default)] bg-[var(--bg-page)]">
        {tahun === new Date().getFullYear() ? (
          <button type="button" onClick={() => setTampilSemua(v => !v)} className="text-xs font-semibold text-[var(--color-primary)] hover:underline">
            {tampilSemua ? "Sembunyikan tanggal yang sudah lewat" : "Tampilkan juga tanggal yang sudah lewat"}
          </button>
        ) : <span />}
        {adaKhusus && (
          <button type="button" onClick={reset} disabled={busy !== null} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50">
            <RotateCcw className="w-3.5 h-3.5" /> Reset ke default
          </button>
        )}
      </div>
    </div>
  )
}
