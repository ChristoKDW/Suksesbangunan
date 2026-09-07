"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, Save, Filter, Building2, UserCheck } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { Karyawan, Shift, JadwalKerja, Departemen } from "@/lib/types"

// Color palette for shifts
const shiftColors = [
  { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  { bg: "#faf5ff", color: "#7e22ce", border: "#e9d5ff" },
  { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
  { bg: "#f0f9ff", color: "#075985", border: "#bae6fd" },
]

const offColor = { bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0" }

export default function SchedulePage() {
  const { user } = useAuth()
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([])
  const [shiftList, setShiftList] = useState<Shift[]>([])
  const [jadwalList, setJadwalList] = useState<JadwalKerja[]>([])
  const [departemenList, setDepartemenList] = useState<Departemen[]>([])
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isSPV = user?.role === "SPV"
  const isAdminOrHrd = user?.role === "Admin" || user?.role === "HRD"

  // Current month navigation
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth()) // 0-indexed

  // Local schedule state: { `${idKaryawan}-${date}`: idShift | "cuti" | "libur" }
  const [schedule, setSchedule] = useState<Record<string, number | "cuti" | "libur">>({})
  const [initialLibur, setInitialLibur] = useState<Record<string, boolean>>({})
  const [hasChanges, setHasChanges] = useState(false)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1)
    return {
      date: i + 1,
      dayLabel: d.toLocaleDateString("id-ID", { weekday: "short" }),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    }
  })

  const monthLabel = new Date(year, month).toLocaleDateString("id-ID", { month: "long", year: "numeric" })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [karyawan, shifts, jadwal, depts] = await Promise.all([
        api.get<Karyawan[]>("karyawan"),
        api.get<Shift[]>("shift"),
        api.get<JadwalKerja[]>("jadwal-kerja"),
        api.get<Departemen[]>("departemen").catch(() => []),
      ])

      // If SPV, backend already filters karyawan strictly to SPV's department
      setKaryawanList(karyawan.filter(k => k.statusAktif === "aktif"))
      setShiftList(shifts)
      setJadwalList(jadwal)
      setDepartemenList(depts)

      // Build schedule map from jadwal data for current month
      const schedMap: Record<string, number | "cuti" | "libur"> = {}
      const initLiburMap: Record<string, boolean> = {}

      jadwal.forEach(j => {
        const d = new Date(j.tanggal)
        if (d.getFullYear() === year && d.getMonth() === month) {
          const key = `${j.idKaryawan}-${d.getDate()}`
          if (j.isCuti) {
            schedMap[key] = "cuti"
          } else if (j.idShift) {
            schedMap[key] = j.idShift
          } else {
            schedMap[key] = "libur"
            initLiburMap[key] = true
          }
        }
      })
      setSchedule(schedMap)
      setInitialLibur(initLiburMap)
      setHasChanges(false)
    } catch (err) {
      console.error("Failed to fetch schedule data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [year, month])

  // Build shift config map
  const shiftConfigMap = useMemo(() => {
    const map: Record<number, { label: string; time: string; bg: string; color: string; border: string }> = {}
    shiftList.forEach((s, i) => {
      const colors = shiftColors[i % shiftColors.length]
      const jamMulai = s.jamMulai?.substring(0, 5) || "—"
      const jamSelesai = s.jamSelesai?.substring(0, 5) || "—"
      map[s.idShift] = {
        label: s.namaShift,
        time: `${jamMulai}–${jamSelesai}`,
        ...colors,
      }
    })
    return map
  }, [shiftList])

  // Filtered karyawan list based on selected department filter
  const displayedKaryawan = useMemo(() => {
    if (isSPV) {
      // SPV only sees their own department's employees
      return karyawanList
    }
    if (selectedDeptFilter === "all") {
      return karyawanList
    }
    return karyawanList.filter(k => k.idDepartemen === Number(selectedDeptFilter))
  }, [karyawanList, isSPV, selectedDeptFilter])

  const handleCellClick = (idKaryawan: number, date: number, isFixedLibur: boolean, isBlockedLibur: boolean) => {
    if (isFixedLibur || isBlockedLibur) return

    const emp = karyawanList.find(k => k.idKaryawan === idKaryawan)
    if (!emp) return

    // Available shifts for this employee: matching department or general (null)
    const empShifts = shiftList.filter(s =>
      s.idDepartemen === null || s.idDepartemen === undefined || s.idDepartemen === emp.idDepartemen
    )

    const key = `${idKaryawan}-${date}`
    const currentVal = schedule[key]

    const shiftIds: (number | "cuti" | "libur")[] = empShifts.map(s => s.idShift)
    if (emp.hakCuti) {
      shiftIds.push("cuti")
    }

    const hasCuti = Object.entries(schedule).some(([k, v]) => k.startsWith(`${idKaryawan}-`) && v === "cuti")
    if (!hasCuti || currentVal === "cuti") {
      shiftIds.push("libur")
    }

    let nextVal: number | "cuti" | "libur" | undefined

    if (!currentVal) {
      nextVal = shiftIds.length > 0 ? shiftIds[0] : undefined
    } else {
      const idx = shiftIds.indexOf(currentVal)
      if (idx !== -1 && idx < shiftIds.length - 1) {
        nextVal = shiftIds[idx + 1]
      } else {
        nextVal = undefined
      }
    }

    // Periksa batas cuti tahunan (maksimal 12 hari)
    if (nextVal === "cuti") {
      let cutiCount = jadwalList.filter(j => {
        const d = new Date(j.tanggal)
        return j.idKaryawan === idKaryawan && j.isCuti && d.getFullYear() === year && d.getMonth() !== month
      }).length

      Object.entries(schedule).forEach(([k, v]) => {
        if (k.startsWith(`${idKaryawan}-`) && v === "cuti") cutiCount++
      })

      if (cutiCount >= 12) {
        alert(`Jatah cuti (12 hari) untuk ${emp?.nama || "karyawan ini"} sudah habis di tahun ${year}.`)
        nextVal = undefined
      }
    }

    if (nextVal === undefined) {
      const { [key]: _, ...rest } = schedule
      setSchedule(rest)
    } else {
      setSchedule({ ...schedule, [key]: nextVal })
    }
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const items: { idKaryawan: number; tanggal: string; idShift?: number; isCuti?: boolean }[] = []
      Object.entries(schedule).forEach(([key, val]) => {
        const [idKaryawanStr, dateStr] = key.split("-")
        const tanggal = `${year}-${String(month + 1).padStart(2, "0")}-${String(dateStr).padStart(2, "0")}`
        if (val === "cuti") {
          items.push({ idKaryawan: Number(idKaryawanStr), tanggal, isCuti: true })
        } else if (val === "libur") {
          items.push({ idKaryawan: Number(idKaryawanStr), tanggal, isCuti: false })
        } else {
          items.push({ idKaryawan: Number(idKaryawanStr), tanggal, idShift: val })
        }
      })
      await api.post("jadwal-kerja/bulk", items)
      setHasChanges(false)
      await fetchData()
      alert("Jadwal kerja berhasil disimpan!")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan jadwal")
    } finally {
      setSaving(false)
    }
  }

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--text-muted)" }} /></div>
  }

  const spvDeptName = departemenList.find(d => d.idDepartemen === user?.idDepartemen)?.namaDepartemen || "Departemen Anda"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Jadwal Kerja</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {isSPV ? (
              <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                <Building2 className="w-4 h-4" />
                Khusus Departemen {spvDeptName} ({displayedKaryawan.length} karyawan)
              </span>
            ) : (
              <span>Kelola jadwal shift karyawan ({displayedKaryawan.length} karyawan aktif ditampilkan)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Department Filter for Admin & HRD */}
          {isAdminOrHrd && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-[var(--bg-page)] border border-[var(--border-default)]">
              <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <select
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-[var(--text-primary)] outline-none"
              >
                <option value="all">Semua Departemen ({karyawanList.length} karyawan)</option>
                {departemenList.map(d => (
                  <option key={d.idDepartemen} value={String(d.idDepartemen)}>
                    {d.namaDepartemen}
                  </option>
                ))}
              </select>
            </div>
          )}

          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm bg-green-600 hover:bg-green-700 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 items-center">
        {shiftList.map((s, i) => {
          const colors = shiftColors[i % shiftColors.length]
          return (
            <div key={s.idShift} className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded" style={{ background: colors.bg, border: `1px solid ${colors.border}` }} />
              <span style={{ color: colors.color }} className="font-medium">{s.namaShift}</span>
              <span className="text-[var(--text-muted)]">({s.jamMulai?.substring(0, 5)}–{s.jamSelesai?.substring(0, 5)})</span>
            </div>
          )
        })}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded" style={{ background: "#fef3c7", border: `1px solid #fde68a` }} />
          <span style={{ color: "#92400e" }} className="font-medium">Libur</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded" style={{ background: offColor.bg, border: `1px solid ${offColor.border}` }} />
          <span style={{ color: offColor.color }} className="font-medium">Kosong</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded" style={{ background: "#fff7ed", border: `1px solid #fed7aa` }} />
          <span style={{ color: "#ea580c" }} className="font-medium">Cuti</span>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-[var(--text-muted)]" />
            <span className="text-base font-semibold text-[var(--text-primary)] capitalize">{monthLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-[var(--bg-page)] text-[var(--text-muted)]"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-[var(--bg-page)] text-[var(--text-muted)]"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full border-collapse text-xs min-w-[1200px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[var(--bg-surface)] px-3 py-2 text-left text-[var(--text-secondary)] font-medium border-b border-r border-[var(--border-default)] min-w-[160px]">Karyawan</th>
                {days.map(d => (
                  <th key={d.date} className={`px-1 py-2 text-center font-medium border-b border-[var(--border-default)] min-w-[40px] ${d.isWeekend ? 'bg-[var(--bg-page)]' : ''}`} style={{ color: d.isWeekend ? "var(--text-muted)" : "var(--text-secondary)" }}>
                    <div>{d.dayLabel}</div>
                    <div className="font-bold">{d.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedKaryawan.length === 0 ? (
                <tr>
                  <td colSpan={days.length + 1} className="py-8 text-center text-[var(--text-muted)]">
                    Tidak ada data karyawan
                  </td>
                </tr>
              ) : (
                displayedKaryawan.map((emp) => {
                  const hasCuti = Object.entries(schedule).some(([k, v]) => k.startsWith(`${emp.idKaryawan}-`) && v === "cuti")
                  const isBackoffice = emp.departemen?.namaDepartemen?.toLowerCase().replace(/[\s\-_]/g, "") === "backoffice"

                  return (
                    <tr key={emp.idKaryawan}>
                      <td className="sticky left-0 z-10 bg-[var(--bg-surface)] px-3 py-2 border-b border-r border-[var(--border-default)]">
                        <div className="font-medium text-[var(--text-primary)] truncate">{emp.nama}</div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span
                            className={
                              isBackoffice
                                ? "text-purple-600 dark:text-purple-400 font-semibold"
                                : "text-[var(--text-muted)]"
                            }
                          >
                            {emp.departemen?.namaDepartemen || "—"}
                          </span>
                        </div>
                      </td>
                      {days.map(d => {
                        const dDate = new Date(year, month, d.date)
                        const hariNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
                        const hariStr = hariNames[dDate.getDay()]
                        const liburArray = emp.hariLibur ? emp.hariLibur.split(",") : []
                        const isLibur = liburArray.includes(hariStr)

                        const key = `${emp.idKaryawan}-${d.date}`
                        const val = schedule[key]
                        const config = typeof val === 'number' ? shiftConfigMap[val] : null

                        const isOldLibur = initialLibur[key] === true
                        const isBlockedLibur = isOldLibur && hasCuti

                        return (
                          <td
                            key={d.date}
                            onClick={() => handleCellClick(emp.idKaryawan, d.date, isLibur, isBlockedLibur)}
                            className={`px-0.5 py-1 border-b border-[var(--border-default)] text-center transition-opacity ${d.isWeekend ? 'bg-[var(--bg-page)]' : ''} ${(isLibur || isBlockedLibur) ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'cursor-pointer hover:opacity-80'}`}
                          >
                            {isLibur ? (
                              <div className="rounded px-1 py-1 text-[10px] font-medium leading-tight mx-auto text-slate-500">
                                Libur
                              </div>
                            ) : val === "cuti" ? (
                              <div
                                className="rounded px-1 py-1 text-[10px] font-semibold leading-tight mx-auto"
                                style={{ background: "#fff7ed", color: "#ea580c", border: `1px solid #fed7aa` }}
                              >
                                Cuti
                              </div>
                            ) : val === "libur" ? (
                              <div className="rounded px-1 py-1 text-[10px] font-medium leading-tight mx-auto" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                                Libur
                              </div>
                            ) : config ? (
                              <div
                                className="rounded px-1 py-1 text-[10px] font-semibold leading-tight mx-auto"
                                style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
                              >
                                {config.label}
                              </div>
                            ) : (
                              <div className="rounded px-1 py-1 text-[10px] font-medium leading-tight mx-auto" style={{ color: offColor.color }}>
                                —
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
