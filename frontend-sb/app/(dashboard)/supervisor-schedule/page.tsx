"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { LatticeLoader } from "@/components/atoms"
import {
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CalendarDays,
  CalendarRange,
  Loader2,
  Save,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  Coffee,
  RotateCw,
  Shuffle,
  Info,
  Calendar,
  Check,
  Trash2,
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { getIndonesianHolidayForDate, type HolidayItem } from "@/lib/indonesia-holidays"
import { fetchCalendarEvents, type CalendarEvent } from "@/lib/opica-calendar"
import type { Karyawan, Shift, JadwalKerja, Departemen, PengaturanPenggajian, HariLibur } from "@/lib/types"

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

function getDateOnlyParts(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number)
  return { year, month: month - 1, day }
}

export default function SupervisorSchedulePage() {
  const { user } = useAuth()
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([])
  const [shiftList, setShiftList] = useState<Shift[]>([])
  const [jadwalList, setJadwalList] = useState<JadwalKerja[]>([])
  const [departemenList, setDepartemenList] = useState<Departemen[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingSingle, setSavingSingle] = useState(false)

  const [cutOffSettings, setCutOffSettings] = useState<PengaturanPenggajian>({
    id: 1,
    tanggalCutOffMulai: 25,
    tanggalCutOffSelesai: 24,
    dendaPerTelatDefault: 20000,
    standarHariKerja: 26,
  })
  const [dbHolidays, setDbHolidays] = useState<HariLibur[]>([])

  // Month navigation
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth()) // 0-indexed

  // Schedule state: { `${idKaryawan}-${day}`: idShift | "cuti" | "libur" }
  const [schedule, setSchedule] = useState<Record<string, number | "cuti" | "libur">>({})
  const [initialSchedule, setInitialSchedule] = useState<Record<string, number | "cuti" | "libur">>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [opicaEvents, setOpicaEvents] = useState<CalendarEvent[]>([])

  // Auto-Generate Rolling Schedule state for HRD
  const [showAutoModal, setShowAutoModal] = useState(false)
  const [rollingConfigs, setRollingConfigs] = useState<Record<number, { offDay: string; startShiftId: number }>>({})

  // Modal Atur Jadwal 1 per 1 hari
  const [selectedCell, setSelectedCell] = useState<{
    idKaryawan: number
    date: number
    karyawan: Karyawan
  } | null>(null)

  const getHolidayForDay = (dayDate: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayDate).padStart(2, "0")}`
    const fromDb = dbHolidays.find((h) => h.tanggal === dateStr)
    if (fromDb) {
      return {
        date: dateStr,
        localName: fromDb.nama,
        name: fromDb.nama,
        type: "company_holiday" as const,
        isNationalHoliday: false,
        isCollectiveLeave: false,
        isHariNasional: false,
        isLibur: fromDb.isLibur,
        description: fromDb.keterangan || fromDb.nama,
      }
    }
    const opicaMatch = opicaEvents.find((e) => e.date === dateStr)
    if (opicaMatch) {
      return {
        date: dateStr,
        localName: opicaMatch.name || opicaMatch.localName,
        name: opicaMatch.name || opicaMatch.localName,
        type: opicaMatch.type,
        isNationalHoliday: opicaMatch.type === "libur_nasional",
        isCollectiveLeave: opicaMatch.type === "cuti_bersama",
        isHariNasional: opicaMatch.type === "hari_nasional",
        isLibur: opicaMatch.isLibur,
        description: opicaMatch.description || opicaMatch.name,
      }
    }
    const official = getIndonesianHolidayForDate(dateStr)
    return official ? { ...official, isLibur: true, isHariNasional: false, description: official.localName } : null
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const dNum = i + 1
    const d = new Date(year, month, dNum)
    const holiday = getHolidayForDay(dNum)
    const isTutupBuku = dNum === cutOffSettings.tanggalCutOffSelesai
    const isAwalHitung = dNum === cutOffSettings.tanggalCutOffMulai
    return {
      date: dNum,
      dayLabel: d.toLocaleDateString("id-ID", { weekday: "short" }),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      isSunday: d.getDay() === 0,
      holiday,
      isTutupBuku,
      isAwalHitung,
    }
  })

  const monthLabel = new Date(year, month).toLocaleDateString("id-ID", { month: "long", year: "numeric" })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [karyawan, shifts, jadwal, depts, settings, holidays, opicaCal] = await Promise.all([
        api.get<Karyawan[]>("karyawan"),
        api.get<Shift[]>("shift"),
        api.get<JadwalKerja[]>("jadwal-kerja"),
        api.get<Departemen[]>("departemen").catch(() => []),
        api.get<PengaturanPenggajian>("penggajian/settings").catch(() => null),
        api.get<HariLibur[]>("hari-libur").catch(() => []),
        fetchCalendarEvents(year, month + 1).catch(() => null),
      ])

      if (settings) setCutOffSettings(settings)
      if (holidays) setDbHolidays(holidays)
      if (opicaCal?.data) setOpicaEvents(opicaCal.data)

      // Filter khusus Karyawan yang berstatus SUPERVISOR (SPV)
      const supervisors = (karyawan || []).filter((k) => {
        if (k.statusAktif !== "aktif") return false
        const isRoleSpv = k.hakAkses?.role === "SPV"
        const jabatanName = k.jabatan?.namaJabatan?.toLowerCase() || ""
        const isJabatanSpv = jabatanName.includes("supervisor") || jabatanName.includes("spv")
        return isRoleSpv || isJabatanSpv
      })

      setKaryawanList(supervisors)
      setShiftList(shifts || [])
      setJadwalList(jadwal || [])
      setDepartemenList(depts || [])

      // Map data jadwal bulan ini
      const schedMap: Record<string, number | "cuti" | "libur"> = {}
      ;(jadwal || []).forEach((j) => {
        const date = getDateOnlyParts(j.tanggal)
        if (date.year === year && date.month === month) {
          const key = `${j.idKaryawan}-${date.day}`
          if (j.isCuti) {
            schedMap[key] = "cuti"
          } else if (j.idShift) {
            schedMap[key] = j.idShift
          } else {
            schedMap[key] = "libur"
          }
        }
      })
      setSchedule(schedMap)
      setInitialSchedule(schedMap)
      setHasChanges(false)
    } catch (err) {
      console.error("Gagal memuat data jadwal supervisor:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [year, month])

  // Shift config color mapping
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

  // Inisialisasi modal rolling configs
  const initRollingConfigs = () => {
    const configs: Record<number, { offDay: string; startShiftId: number }> = {}
    const defaultDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

    karyawanList.forEach((emp, index) => {
      const savedDay = emp.hariLibur?.trim()
      const offDay = savedDay && defaultDays.includes(savedDay) ? savedDay : defaultDays[index % defaultDays.length]

      // Shifts for this supervisor's department
      const empShifts = shiftList.filter((s) => !s.idDepartemen || s.idDepartemen === emp.idDepartemen)
      const availableShifts = empShifts.length > 0 ? empShifts : shiftList
      const startShiftId = availableShifts[index % Math.max(1, availableShifts.length)]?.idShift ?? 0

      configs[emp.idKaryawan] = { offDay, startShiftId }
    })
    setRollingConfigs(configs)
  }

  // Terapkan pola rolling shift ke semua supervisor
  const handleApplyRolling = async (saveImmediately: boolean = false) => {
    if (shiftList.length === 0) {
      alert("Tidak ada shift yang terdaftar di sistem. Buat shift terlebih dahulu di menu Daftar Shift.")
      return
    }

    const DAY_MAP: Record<string, number> = {
      Minggu: 0,
      Senin: 1,
      Selasa: 2,
      Rabu: 3,
      Kamis: 4,
      Jumat: 5,
      Sabtu: 6,
    }

    const newSchedule = { ...schedule }
    const bulkItems: {
      idKaryawan: number
      tanggal: string
      idShift?: number
      isCuti?: boolean
      isLibur?: boolean
      keterangan?: string
    }[] = []

    for (const emp of karyawanList) {
      const config = rollingConfigs[emp.idKaryawan]
      if (!config) continue

      const targetOffDay = DAY_MAP[config.offDay] ?? 3
      const empShifts = shiftList
        .filter((s) => !s.idDepartemen || s.idDepartemen === emp.idDepartemen)
        .sort((a, b) => (a.jamMulai || "").localeCompare(b.jamMulai || ""))
      const availableShifts = empShifts.length > 0 ? empShifts : shiftList

      let currentShiftIdx = availableShifts.findIndex((s) => s.idShift === config.startShiftId)
      if (currentShiftIdx === -1) currentShiftIdx = 0

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day)
        const dayOfWeek = dateObj.getDay()
        const key = `${emp.idKaryawan}-${day}`
        const tanggal = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

        // Cuti tidak ditimpa
        if (schedule[key] === "cuti") {
          bulkItems.push({ idKaryawan: emp.idKaryawan, tanggal, isCuti: true })
          continue
        }

        if (dayOfWeek === targetOffDay) {
          newSchedule[key] = "libur"
          bulkItems.push({
            idKaryawan: emp.idKaryawan,
            tanggal,
            isLibur: true,
            keterangan: `Libur Rutin Supervisor (${config.offDay})`,
          })
          if (availableShifts.length > 0) {
            currentShiftIdx = (currentShiftIdx + 1) % availableShifts.length
          }
        } else {
          const assignedShift = availableShifts[currentShiftIdx]
          if (assignedShift) {
            newSchedule[key] = assignedShift.idShift
            bulkItems.push({
              idKaryawan: emp.idKaryawan,
              tanggal,
              idShift: assignedShift.idShift,
            })
          }
        }
      }

      if (emp.hariLibur !== config.offDay) {
        api.patch(`karyawan/${emp.idKaryawan}/hari-libur`, { hariLibur: config.offDay }).catch(console.error)
      }
    }

    setSchedule(newSchedule)
    setShowAutoModal(false)

    if (saveImmediately) {
      setSaving(true)
      try {
        await api.post("jadwal-kerja/bulk", bulkItems)
        setHasChanges(false)
        await fetchData()
        alert(`Berhasil! Jadwal rotasi shift untuk ${karyawanList.length} Supervisor bulan ${monthLabel} telah disimpan.`)
      } catch (err) {
        alert(err instanceof Error ? err.message : "Gagal menyimpan jadwal otomatis")
      } finally {
        setSaving(false)
      }
    } else {
      setHasChanges(true)
      alert(`Jadwal rotasi untuk ${karyawanList.length} Supervisor telah digenerate ke tabel! Klik tombol "Simpan Perubahan" di atas untuk menyimpan permanen.`)
    }
  }

  // Buka dialog untuk edit 1 sel hari
  const handleOpenCell = (emp: Karyawan, date: number) => {
    setSelectedCell({
      idKaryawan: emp.idKaryawan,
      date,
      karyawan: emp,
    })
  }

  // Pilih nilai shift / libur / cuti / kosong untuk 1 hari
  const handleSelectDayValue = async (value: number | "cuti" | "libur" | undefined, saveNow: boolean = false) => {
    if (!selectedCell) return

    const key = `${selectedCell.idKaryawan}-${selectedCell.date}`
    const tanggal = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedCell.date).padStart(2, "0")}`

    if (saveNow) {
      setSavingSingle(true)
      try {
        const item: { idKaryawan: number; tanggal: string; idShift?: number; isCuti?: boolean; isLibur?: boolean } = {
          idKaryawan: selectedCell.idKaryawan,
          tanggal,
        }
        if (value === "cuti") {
          item.isCuti = true
        } else if (value === "libur") {
          item.isLibur = true
        } else if (typeof value === "number") {
          item.idShift = value
        }

        await api.post("jadwal-kerja/bulk", [item])
        if (value === undefined) {
          const { [key]: _, ...rest } = schedule
          setSchedule(rest)
        } else {
          setSchedule({ ...schedule, [key]: value })
        }
        await fetchData()
        setSelectedCell(null)
      } catch (err) {
        alert(err instanceof Error ? err.message : "Gagal menyimpan jadwal harian")
      } finally {
        setSavingSingle(false)
      }
      return
    }

    // Hanya update state lokal ke tabel
    if (value === undefined) {
      const { [key]: _, ...rest } = schedule
      setSchedule(rest)
    } else {
      setSchedule({ ...schedule, [key]: value })
    }
    setHasChanges(true)
    setSelectedCell(null)
  }

  // Simpan semua perubahan
  const handleSaveAll = async () => {
    setSaving(true)
    try {
      const items: { idKaryawan: number; tanggal: string; idShift?: number; isCuti?: boolean; isLibur?: boolean }[] = []
      Object.entries(schedule).forEach(([key, val]) => {
        if (initialSchedule[key] === val) return

        const [idKaryawanStr, dateStr] = key.split("-")
        const idKaryawan = Number(idKaryawanStr)
        const tanggal = `${year}-${String(month + 1).padStart(2, "0")}-${String(dateStr).padStart(2, "0")}`

        if (val === "cuti") {
          items.push({ idKaryawan, tanggal, isCuti: true })
        } else if (val === "libur") {
          items.push({ idKaryawan, tanggal, isCuti: false, isLibur: true })
        } else {
          items.push({ idKaryawan, tanggal, idShift: val })
        }
      })

      if (items.length === 0) {
        setHasChanges(false)
        return
      }

      await api.post("jadwal-kerja/bulk", items)
      setHasChanges(false)
      await fetchData()
      alert(`Berhasil! ${items.length} perubahan jadwal supervisor telah tersimpan ke sistem.`)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan perubahan jadwal")
    } finally {
      setSaving(false)
    }
  }

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400">
              Khusus HRD & Admin
            </span>
            <span className="text-xs text-[var(--text-muted)]">• {karyawanList.length} Supervisor Aktif</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
            Jadwal Kerja Supervisor (SPV)
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--text-muted)]">
            Halaman khusus HRD untuk mengatur jadwal shift harian individual maupun rotasi bulanan para Supervisor.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => {
              initRollingConfigs()
              setShowAutoModal(true)
            }}
            disabled={loading || karyawanList.length === 0}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Rotasi Shift</span>
          </button>

          {hasChanges && (
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Simpan Perubahan</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Card & Month Info */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Month Switcher */}
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] transition-colors"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-page)] border border-[var(--border-default)] font-semibold text-xs sm:text-sm text-[var(--text-primary)]">
                <CalendarRange className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>{monthLabel}</span>
              </div>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] transition-colors"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Instruction Banner */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-amber-50/80 dark:bg-amber-950/20 px-3 py-1.5 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
              <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>
                <strong>Klik pada sel hari mana saja</strong> untuk mengubah jadwal Supervisor tanggal tersebut (Pagi, Siang, Libur, Cuti, dll).
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="overflow-hidden border-[var(--border-default)]">
        <CardHeader className="py-3 px-4 border-b border-[var(--border-default)] flex flex-row items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-red-600 dark:text-red-400" />
            <h2 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
              Tabel Jadwal Harian Supervisor ({monthLabel})
            </h2>
          </div>
          {hasChanges && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Ada perubahan belum disimpan
            </span>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <LatticeLoader />
              <p className="mt-3 text-xs text-[var(--text-muted)]">Memuat data jadwal supervisor...</p>
            </div>
          ) : karyawanList.length === 0 ? (
            <div className="p-8 text-center">
              <UserCheck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Tidak ada Supervisor yang terdaftar</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Karyawan dengan hak akses SPV atau jabatan Supervisor akan otomatis muncul pada halaman ini.
              </p>
            </div>
          ) : (
            /* Responsive scroll container: touch-pan-x, smooth scrolling */
            <div className="w-full overflow-x-auto scroll-smooth touch-pan-x">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-900/60 border-b border-[var(--border-default)]">
                    {/* Sticky Employee Column Header */}
                    <th className="sticky left-0 z-20 bg-slate-100 dark:bg-[#0B0F17] px-3 py-2 text-left font-bold text-[var(--text-primary)] border-r border-[var(--border-default)] min-w-[140px] sm:min-w-[180px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Supervisor & Departemen
                    </th>

                    {/* Day Columns */}
                    {days.map((d) => {
                      const hasHoliday = Boolean(d.holiday)
                      const isHoliday = Boolean((d.holiday as any)?.isLibur)
                      const isHariNasional = Boolean((d.holiday as any)?.isHariNasional)
                      const isSun = d.isSunday
                      return (
                        <th
                          key={d.date}
                          className={`px-1 py-1.5 text-center font-semibold border-r border-[var(--border-default)] min-w-[34px] sm:min-w-[40px] ${
                            isHoliday || isSun
                              ? "bg-red-50/70 dark:bg-red-950/20 text-red-600 dark:text-red-400"
                              : isHariNasional
                              ? "bg-blue-50/70 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                              : "text-[var(--text-secondary)]"
                          }`}
                          title={
                            d.holiday?.name
                              ? `${isHoliday ? "Libur Nasional / Cuti Bersama" : "Hari Peringatan Nasional"}: ${d.holiday.name}${(d.holiday as any)?.description ? ` (${(d.holiday as any)?.description})` : ""}`
                              : isSun
                              ? "Minggu"
                              : ""
                          }
                        >
                          <div className="text-[10px] uppercase font-bold tracking-wider leading-none mb-0.5">
                            {d.dayLabel}
                          </div>
                          <div className={`text-xs font-bold leading-none ${isHoliday || isSun ? "text-red-600" : isHariNasional ? "text-blue-600" : ""}`}>
                            {d.date}
                          </div>
                          {hasHoliday && (
                            <div className={`text-[8px] font-bold leading-none mt-0.5 truncate max-w-[36px] mx-auto ${
                              isHoliday ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                            }`}>
                              {(d.holiday as any)?.isCollectiveLeave
                                ? "Cuti"
                                : isHoliday
                                ? "Libur"
                                : "Nasional"}
                            </div>
                          )}
                        </th>
                      )
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border-default)]">
                  {karyawanList.map((emp) => {
                    const deptName = emp.departemen?.namaDepartemen || "Tanpa Departemen"

                    return (
                      <tr
                        key={emp.idKaryawan}
                        className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Sticky Name Cell */}
                        <td className="sticky left-0 z-10 bg-white dark:bg-[#0B0F17] px-3 py-2 border-r border-[var(--border-default)] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-red-600/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {emp.nama.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-xs text-[var(--text-primary)] truncate max-w-[120px] sm:max-w-[150px]">
                                {emp.nama}
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)] truncate flex items-center gap-1">
                                <Building2 className="w-2.5 h-2.5" />
                                {deptName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Day Cells */}
                        {days.map((d) => {
                          const key = `${emp.idKaryawan}-${d.date}`
                          const val = schedule[key]
                          const isChanged = initialSchedule[key] !== val

                          let label = "—"
                          let cellStyle = {
                            backgroundColor: "transparent",
                            color: "var(--text-muted)",
                            border: "1px dashed rgba(148, 163, 184, 0.2)",
                          }

                          if (val === "cuti") {
                            label = "CUTI"
                            cellStyle = {
                              backgroundColor: "#fef3c7",
                              color: "#92400e",
                              border: "1px solid #fde68a",
                            }
                          } else if (val === "libur") {
                            label = "OFF"
                            cellStyle = {
                              backgroundColor: "#f1f5f9",
                              color: "#64748b",
                              border: "1px solid #cbd5e1",
                            }
                          } else if (typeof val === "number" && shiftConfigMap[val]) {
                            const conf = shiftConfigMap[val]
                            label = conf.label.split(" ")[0]?.toUpperCase() || "SHIFT"
                            cellStyle = {
                              backgroundColor: conf.bg,
                              color: conf.color,
                              border: `1px solid ${conf.border}`,
                            }
                          }

                          return (
                            <td
                              key={d.date}
                              onClick={() => handleOpenCell(emp, d.date)}
                              className={`p-1 text-center border-r border-[var(--border-default)] cursor-pointer hover:ring-2 hover:ring-red-400 transition-all select-none ${
                                d.isSunday ? "bg-red-50/20 dark:bg-red-950/5" : ""
                              } ${isChanged ? "ring-1 ring-amber-400" : ""}`}
                              title={`Klik untuk ubah jadwal ${emp.nama} pada tanggal ${d.date} ${monthLabel}`}
                            >
                              <div
                                style={cellStyle}
                                className="w-full h-8 rounded flex flex-col items-center justify-center text-[10px] font-bold tracking-tight transition-transform active:scale-95 shadow-2xs"
                              >
                                <span>{label}</span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend & Summary Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-default)]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-[var(--text-primary)]">Keterangan:</span>
          {shiftList.slice(0, 4).map((s) => {
            const conf = shiftConfigMap[s.idShift]
            return (
              <div key={s.idShift} className="flex items-center gap-1.5">
                <span
                  style={{ backgroundColor: conf?.bg, borderColor: conf?.border }}
                  className="w-3 h-3 rounded-xs border"
                />
                <span>
                  {s.namaShift} ({s.jamMulai?.substring(0, 5)}–{s.jamSelesai?.substring(0, 5)})
                </span>
              </div>
            )
          })}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-200 border border-slate-300" />
            <span>OFF (Libur Rutin)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-100 border border-amber-300" />
            <span>CUTI</span>
          </div>
        </div>
      </div>

      {/* MODAL 1: ATUR JADWAL 1 PER 1 HARI (Individual Day Shift Picker) */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0B0F17] w-full max-w-md rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                  <Calendar className="w-3.5 h-3.5" />
                  Atur Jadwal Harian
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 mt-0.5">
                  {selectedCell.karyawan.nama}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(year, month, selectedCell.date).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / Shift Options */}
            <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
                  Pilih Shift Kerja:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {shiftList.map((s) => {
                    const conf = shiftConfigMap[s.idShift]
                    const currentVal = schedule[`${selectedCell.idKaryawan}-${selectedCell.date}`]
                    const isSelected = currentVal === s.idShift

                    return (
                      <button
                        key={s.idShift}
                        type="button"
                        onClick={() => handleSelectDayValue(s.idShift)}
                        style={{
                          backgroundColor: isSelected ? conf?.bg : undefined,
                          borderColor: isSelected ? conf?.border : undefined,
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all hover:bg-slate-50 dark:hover:bg-white/5 ${
                          isSelected
                            ? "ring-2 ring-blue-500"
                            : "border-slate-200 dark:border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            style={{ backgroundColor: conf?.color }}
                            className="w-3 h-3 rounded-full flex-shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-xs text-slate-900 dark:text-slate-50">
                              {s.namaShift}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {s.jamMulai?.substring(0, 5)} – {s.jamSelesai?.substring(0, 5)}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
                  Atau Tetapkan Sebagai:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Option OFF / Libur */}
                  <button
                    type="button"
                    onClick={() => handleSelectDayValue("libur")}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                      schedule[`${selectedCell.idKaryawan}-${selectedCell.date}`] === "libur"
                        ? "bg-slate-200 border-slate-400 ring-2 ring-slate-500 text-slate-900"
                        : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Coffee className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="text-xs font-bold">Libur (OFF)</div>
                      <div className="text-[10px] text-slate-500">Libur rutin SPV</div>
                    </div>
                  </button>

                  {/* Option Cuti */}
                  <button
                    type="button"
                    onClick={() => handleSelectDayValue("cuti")}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                      schedule[`${selectedCell.idKaryawan}-${selectedCell.date}`] === "cuti"
                        ? "bg-amber-100 border-amber-400 ring-2 ring-amber-500 text-amber-900"
                        : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <CalendarDays className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="text-xs font-bold">Cuti Tahunan</div>
                      <div className="text-[10px] text-slate-500">Izin / Cuti resmi</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Reset / Kosongkan */}
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleSelectDayValue(undefined)}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Kosongkan Jadwal Hari Ini
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCell(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AUTO-GENERATE ROLLING SHIFT (Bulk) */}
      {showAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0B0F17] w-full max-w-xl rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-50">
                  Generate Rotasi Shift Supervisor ({monthLabel})
                </h3>
              </div>
              <button
                onClick={() => setShowAutoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Fitur ini mempermudah pembuatan jadwal sebulan penuh secara otomatis dengan menentukan hari libur rutin dan shift awal setiap Supervisor. Setelah digenerate, Anda tetap bisa mengubahnya hari per hari kapan saja.
              </p>

              <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-200 dark:border-white/10 rounded-lg">
                {karyawanList.map((emp) => {
                  const cfg = rollingConfigs[emp.idKaryawan] || { offDay: "Minggu", startShiftId: shiftList[0]?.idShift ?? 0 }
                  return (
                    <div key={emp.idKaryawan} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-50 truncate">
                          {emp.nama}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {emp.departemen?.namaDepartemen || "Tanpa Departemen"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Hari Libur Rutin */}
                        <select
                          value={cfg.offDay}
                          onChange={(e) =>
                            setRollingConfigs((prev) => ({
                              ...prev,
                              [emp.idKaryawan]: { ...cfg, offDay: e.target.value },
                            }))
                          }
                          className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs rounded-md px-2 py-1 text-slate-900 dark:text-slate-50 outline-none"
                        >
                          {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((d) => (
                            <option key={d} value={d}>
                              Libur: {d}
                            </option>
                          ))}
                        </select>

                        {/* Shift Awal */}
                        <select
                          value={cfg.startShiftId}
                          onChange={(e) =>
                            setRollingConfigs((prev) => ({
                              ...prev,
                              [emp.idKaryawan]: { ...cfg, startShiftId: Number(e.target.value) },
                            }))
                          }
                          className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs rounded-md px-2 py-1 text-slate-900 dark:text-slate-50 outline-none"
                        >
                          {shiftList.map((s) => (
                            <option key={s.idShift} value={s.idShift}>
                              {s.namaShift} ({s.jamMulai?.substring(0, 5)})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAutoModal(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleApplyRolling(true)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
              >
                Terapkan & Simpan Otomatis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
