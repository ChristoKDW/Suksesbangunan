"use client"

import { useState, useEffect } from "react"
import { Trash2, Calendar, AlertTriangle, Loader2, CheckCircle2, X, Users, CalendarRange } from "lucide-react"
import { api } from "@/lib/api"
import type { Karyawan } from "@/lib/types"

interface DeleteScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  year: number
  month: number // 0-indexed (0 = Januari, 9 = Oktober)
  employees: Karyawan[]
  initialTargetId?: number | "all"
  deptName?: string
  onSuccess: () => Promise<void> | void
}

export function DeleteScheduleModal({
  isOpen,
  onClose,
  year,
  month,
  employees,
  initialTargetId = "all",
  deptName,
  onSuccess,
}: DeleteScheduleModalProps) {
  const [targetType, setTargetType] = useState<"all" | "single">(initialTargetId === "all" ? "all" : "single")
  const [selectedEmpId, setSelectedEmpId] = useState<number>(
    initialTargetId === "all" ? (employees[0]?.idKaryawan ?? 0) : initialTargetId
  )

  // Modes: "month" | "week" | "range"
  const [deleteMode, setDeleteMode] = useState<"month" | "week" | "range">("month")
  const [selectedWeek, setSelectedWeek] = useState<number>(1) // 1 to 5

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthStr = String(month + 1).padStart(2, "0")
  const monthName = new Date(year, month).toLocaleDateString("id-ID", { month: "long", year: "numeric" })

  const [startDate, setStartDate] = useState<string>(`${year}-${monthStr}-01`)
  const [endDate, setEndDate] = useState<string>(`${year}-${monthStr}-${String(daysInMonth).padStart(2, "0")}`)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Sync state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null)
      setSuccessMsg(null)
      if (initialTargetId === "all") {
        setTargetType("all")
        if (employees.length > 0) setSelectedEmpId(employees[0].idKaryawan)
      } else {
        setTargetType("single")
        setSelectedEmpId(initialTargetId)
      }
      setDeleteMode("month")
      setStartDate(`${year}-${monthStr}-01`)
      setEndDate(`${year}-${monthStr}-${String(daysInMonth).padStart(2, "0")}`)
    }
  }, [isOpen, initialTargetId, year, month, daysInMonth, monthStr, employees])

  if (!isOpen) return null

  // Preset Minggu
  const weekPresets = [
    { num: 1, label: "Minggu 1", start: 1, end: Math.min(7, daysInMonth) },
    { num: 2, label: "Minggu 2", start: 8, end: Math.min(14, daysInMonth) },
    { num: 3, label: "Minggu 3", start: 15, end: Math.min(21, daysInMonth) },
    { num: 4, label: "Minggu 4", start: 22, end: Math.min(28, daysInMonth) },
    { num: 5, label: "Minggu 5", start: 29, end: daysInMonth },
  ].filter(w => w.start <= daysInMonth)

  // Hitung rentang tanggal efektif sesuai mode
  const getEffectiveDateRange = (): { start: string; end: string; desc: string } => {
    if (deleteMode === "month") {
      const s = `${year}-${monthStr}-01`
      const e = `${year}-${monthStr}-${String(daysInMonth).padStart(2, "0")}`
      return { start: s, end: e, desc: `1 bulan penuh (${monthName})` }
    }
    if (deleteMode === "week") {
      const preset = weekPresets.find(w => w.num === selectedWeek) || weekPresets[0]
      const s = `${year}-${monthStr}-${String(preset.start).padStart(2, "0")}`
      const e = `${year}-${monthStr}-${String(preset.end).padStart(2, "0")}`
      return { start: s, end: e, desc: `${preset.label} (${preset.start} - ${preset.end} ${monthName})` }
    }
    return { start: startDate, end: endDate, desc: `Rentang ${startDate} s/d ${endDate}` }
  }

  const effective = getEffectiveDateRange()

  // Target ID Karyawan
  const targetIds = targetType === "all" ? employees.map(e => e.idKaryawan) : [selectedEmpId]
  const targetName =
    targetType === "all"
      ? `Semua Karyawan (${employees.length} orang)`
      : employees.find(e => e.idKaryawan === selectedEmpId)?.nama || "Karyawan Terpilih"

  const handleDelete = async () => {
    if (targetIds.length === 0) {
      setErrorMsg("Tidak ada karyawan yang dipilih.")
      return
    }
    if (!effective.start || !effective.end) {
      setErrorMsg("Tanggal mulai dan tanggal selesai wajib diisi.")
      return
    }
    if (effective.start > effective.end) {
      setErrorMsg("Tanggal mulai tidak boleh lebih besar dari tanggal selesai.")
      return
    }

    const confirmText = `Apakah Anda yakin ingin menghapus jadwal untuk:\n- Target: ${targetName}\n- Periode: ${effective.desc}\n\nJadwal yang dihapus akan kembali kosong.`
    if (!window.confirm(confirmText)) return

    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await api.post<{ deletedCount: number; message: string }>("jadwal-kerja/delete-range", {
        idKaryawan: targetIds,
        startDate: effective.start,
        endDate: effective.end,
      })

      setSuccessMsg(res?.message || "Jadwal berhasil dihapus!")
      await onSuccess()
      setTimeout(() => {
        onClose()
      }, 900)
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal menghapus jadwal kerja.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-[var(--border-default)] flex items-center justify-between bg-gradient-to-r from-rose-50/80 to-amber-50/60 dark:from-rose-950/20 dark:to-amber-950/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Hapus Jadwal Kerja</h2>
              <p className="text-xs text-[var(--text-muted)]">
                {deptName ? `Departemen ${deptName} · ` : ""}Bulan {monthName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-page)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-sm">
          {/* Notifikasi Status */}
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Pilih Target Karyawan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              1. Target Karyawan
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setTargetType("all")}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  targetType === "all"
                    ? "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20"
                    : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-page)]"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Semua ({employees.length} Orang)</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType("single")}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  targetType === "single"
                    ? "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20"
                    : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-page)]"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Per Orang</span>
              </button>
            </div>

            {targetType === "single" && (
              <div className="mt-2">
                <select
                  value={selectedEmpId}
                  onChange={e => setSelectedEmpId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-page)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-medium outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {employees.map(emp => (
                    <option key={emp.idKaryawan} value={emp.idKaryawan}>
                      {emp.nama} ({emp.departemen?.namaDepartemen || "Tanpa Dept"})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. Pilih Mode Penghapusan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              2. Periode Penghapusan
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDeleteMode("month")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  deleteMode === "month"
                    ? "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20"
                    : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-page)]"
                }`}
              >
                <Calendar className="w-4 h-4 mb-1" />
                <span className="font-bold text-xs">Keseluruhan</span>
                <span className="text-[10px] text-[var(--text-muted)]">1 Bulan Penuh</span>
              </button>

              <button
                type="button"
                onClick={() => setDeleteMode("week")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  deleteMode === "week"
                    ? "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20"
                    : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-page)]"
                }`}
              >
                <CalendarRange className="w-4 h-4 mb-1" />
                <span className="font-bold text-xs">1 Minggu</span>
                <span className="text-[10px] text-[var(--text-muted)]">Pilih Minggu</span>
              </button>

              <button
                type="button"
                onClick={() => setDeleteMode("range")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  deleteMode === "range"
                    ? "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20"
                    : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-page)]"
                }`}
              >
                <Calendar className="w-4 h-4 mb-1" />
                <span className="font-bold text-xs">Rentang Tanggal</span>
                <span className="text-[10px] text-[var(--text-muted)]">Tanggal Bebas</span>
              </button>
            </div>
          </div>

          {/* Sub-form Mode Minggu */}
          {deleteMode === "week" && (
            <div className="p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-default)] space-y-2">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Pilih Minggu yang akan Dihapus:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {weekPresets.map(w => (
                  <button
                    key={w.num}
                    type="button"
                    onClick={() => setSelectedWeek(w.num)}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-all ${
                      selectedWeek === w.num
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] hover:border-rose-300"
                    }`}
                  >
                    <div className="font-bold">{w.label}</div>
                    <div className="text-[10px] opacity-80">
                      Tgl {w.start} - {w.end}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sub-form Mode Rentang Tanggal Bebas */}
          {deleteMode === "range" && (
            <div className="p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-default)] grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Ringkasan Konfirmasi */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <span>📋</span>
              <span>Ringkasan Jadwal yang akan Dihapus:</span>
            </div>
            <div className="text-[var(--text-secondary)]">
              • Target: <span className="font-semibold text-rose-600 dark:text-rose-400">{targetName}</span>
            </div>
            <div className="text-[var(--text-secondary)]">
              • Periode: <span className="font-semibold text-[var(--text-primary)]">{effective.desc}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-page)] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading || targetIds.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>Hapus Jadwal Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  )
}
