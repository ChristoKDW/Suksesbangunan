"use client"
import { useState } from "react"
import useSWR from "swr"
import { ChevronDown, Minus, Plus, ShieldCheck, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { showApiError, toast } from "@/lib/swal"

interface Batas {
  jenis: string
  label: string
  keterangan: string
  maksPerBulan: number
  perBulan: boolean
}

/**
 * Batas jumlah pengajuan per jenis (0 = tanpa batas). Karyawan yang melewati batas
 * langsung diblokir di aplikasi mobile dengan pesan "Anda sudah melakukan pengajuan ...".
 */
export function BatasPengajuanPanel({ canEdit }: { canEdit: boolean }) {
  const [open, setOpen] = useState(false)
  const { data = [], isLoading, mutate } = useSWR<Batas[]>("aturan-pengajuan/batas")
  const [saving, setSaving] = useState<string | null>(null)

  const ubah = async (jenis: string, nilai: number) => {
    if (nilai < 0 || nilai > 31) return
    setSaving(jenis)
    try {
      await mutate(await api.patch<Batas[]>(`aturan-pengajuan/batas/${jenis}`, { maksPerBulan: nilai }), { revalidate: false })
      toast("Batas pengajuan tersimpan")
    } catch (err) {
      showApiError(err, "Gagal menyimpan batas")
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--bg-page)]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Batas Pengajuan Karyawan</div>
            <div className="text-[11px] text-[var(--text-muted)] truncate">
              Melewati batas → langsung diblokir di mobile: “Anda sudah melakukan pengajuan …”. Pengajuan oleh SPV langsung ke HRD.
            </div>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-[var(--border-default)] divide-y divide-[var(--border-default)]">
          {isLoading ? (
            <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin inline" /></div>
          ) : (
            data.map(b => (
              <div key={b.jenis} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--text-primary)]">{b.label}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{b.keterangan}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {canEdit && (
                    <button
                      type="button"
                      disabled={saving !== null || b.maksPerBulan <= 0}
                      onClick={() => ubah(b.jenis, b.maksPerBulan - 1)}
                      className="h-8 w-8 flex items-center justify-center rounded-md border border-[var(--border-default)] hover:bg-[var(--bg-page)] disabled:opacity-40"
                      aria-label="Kurangi"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <div className="min-w-[124px] text-center text-sm font-semibold text-[var(--text-primary)]">
                    {saving === b.jenis ? (
                      <Loader2 className="w-4 h-4 animate-spin inline" />
                    ) : b.maksPerBulan === 0 ? (
                      "Tanpa batas"
                    ) : (
                      `${b.maksPerBulan}x ${b.perBulan ? "/ bulan" : "berjalan"}`
                    )}
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      disabled={saving !== null || b.maksPerBulan >= 31}
                      onClick={() => ubah(b.jenis, b.maksPerBulan + 1)}
                      className="h-8 w-8 flex items-center justify-center rounded-md border border-[var(--border-default)] hover:bg-[var(--bg-page)] disabled:opacity-40"
                      aria-label="Tambah"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
