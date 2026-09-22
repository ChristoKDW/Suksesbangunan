"use client"
import { useState, useEffect, useMemo, Fragment } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, Save, Filter, Building2, UserCheck, CalendarRange, Sparkles, AlertCircle, Shuffle, RotateCw, CheckCircle2, X, Info } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { getIndonesianHolidayForDate, type HolidayItem } from "@/lib/indonesia-holidays"
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

export default function SchedulePage() {
  const { user } = useAuth()
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([])
  const [shiftList, setShiftList] = useState<Shift[]>([])
  const [jadwalList, setJadwalList] = useState<JadwalKerja[]>([])
  const [departemenList, setDepartemenList] = useState<Departemen[]>([])
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [cutOffSettings, setCutOffSettings] = useState<PengaturanPenggajian>({
    id: 1,
    tanggalCutOffMulai: 25,
    tanggalCutOffSelesai: 24,
    dendaPerTelatDefault: 20000,
    standarHariKerja: 26,
  })
  const [dbHolidays, setDbHolidays] = useState<HariLibur[]>([])

  const isSPV = user?.role === "SPV"
  const isAdminOrHrd = user?.role === "Admin" || user?.role === "HRD"

  // Current month navigation
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth()) // 0-indexed

  // Local schedule state: { `${idKaryawan}-${date}`: idShift | "cuti" | "libur" }
  const [schedule, setSchedule] = useState<Record<string, number | "cuti" | "libur">>({})
  const [initialSchedule, setInitialSchedule] = useState<Record<string, number | "cuti" | "libur">>({})
  const [initialLibur, setInitialLibur] = useState<Record<string, boolean>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Auto-Generate Rolling Schedule state for SPV
  const [showAutoModal, setShowAutoModal] = useState(false)
  const [rollingConfigs, setRollingConfigs] = useState<Record<number, { offDay: string; startShiftId: number }>>({})

  const getHolidayForDay = (dayDate: number): (HolidayItem & { isLibur?: boolean }) | null => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayDate).padStart(2, "0")}`
    const fromDb = dbHolidays.find(h => h.tanggal === dateStr)
    if (fromDb) {
      return {
        date: dateStr,
        localName: fromDb.nama,
        name: fromDb.nama,
        type: "company_holiday",
        isNationalHoliday: false,
        isCollectiveLeave: false,
        isLibur: fromDb.isLibur,
      }
    }
    const official = getIndonesianHolidayForDate(dateStr)
    return official ? { ...official, isLibur: true } : null
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

  // Cut-off period labels for display
  const prevMonthDate = new Date(year, month - 1, cutOffSettings.tanggalCutOffMulai)
  const cutOffMulaiLabel = `${cutOffSettings.tanggalCutOffMulai} ${prevMonthDate.toLocaleDateString("id-ID", { month: "short", year: "numeric" })}`
  const cutOffSelesaiLabel = `${cutOffSettings.tanggalCutOffSelesai} ${new Date(year, month, cutOffSettings.tanggalCutOffSelesai).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}`

  const fetchData = async () => {
    setLoading(true)
    try {
      const [karyawan, shifts, jadwal, depts, settings, holidays] = await Promise.all([
        api.get<Karyawan[]>("karyawan"),
        api.get<Shift[]>("shift"),
        api.get<JadwalKerja[]>("jadwal-kerja"),
        api.get<Departemen[]>("departemen").catch(() => []),
        api.get<PengaturanPenggajian>("penggajian/settings").catch(() => null),
        api.get<HariLibur[]>("hari-libur").catch(() => []),
      ])

      if (settings) setCutOffSettings(settings)
      if (holidays) setDbHolidays(holidays)

      // If SPV, backend already filters karyawan strictly to SPV's department
      setKaryawanList(karyawan.filter(k => k.statusAktif === "aktif"))
      setShiftList(shifts)
      setJadwalList(jadwal)
      setDepartemenList(depts)

      // Build schedule map from jadwal data for current month
      const schedMap: Record<string, number | "cuti" | "libur"> = {}
      const initLiburMap: Record<string, boolean> = {}

      const checkIsAdminDept = (idDepartemen?: number | null) => {
        if (!idDepartemen) return true
        const dept = depts.find(d => d.idDepartemen === idDepartemen)
        if (!dept) return true
        const managers = Array.isArray(dept.pengelola)
          ? dept.pengelola
          : dept.pengelola
          ? [dept.pengelola]
          : []
        const hasAdminOrHrd = managers.some(m => m.role === "Admin" || m.role === "HRD")
        const isBackoffice = dept.namaDepartemen?.toLowerCase().replace(/[\s\-_]/g, "") === "backoffice"
        return hasAdminOrHrd || isBackoffice
      }

      jadwal.forEach(j => {
        const date = getDateOnlyParts(j.tanggal)
        if (date.year === year && date.month === month) {
          const key = `${j.idKaryawan}-${date.day}`
          const emp = karyawan.find(k => k.idKaryawan === j.idKaryawan)
          const isEmpAdmin = checkIsAdminDept(emp?.idDepartemen)

          if (isEmpAdmin) {
            if (j.isCuti) {
              schedMap[key] = "cuti"
            }
          } else {
            if (j.isCuti) {
              schedMap[key] = "cuti"
            } else if (j.idShift) {
              schedMap[key] = j.idShift
            } else {
              schedMap[key] = "libur"
              initLiburMap[key] = true
            }
          }
        }
      })
      setSchedule(schedMap)
      setInitialSchedule(schedMap)
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

  const isDeptManagedByAdminOrHrd = (idDepartemen?: number | null) => {
    if (!idDepartemen) return true
    const dept = departemenList.find(d => d.idDepartemen === idDepartemen)
    if (!dept) return true
    const managers = Array.isArray(dept.pengelola)
      ? dept.pengelola
      : dept.pengelola
      ? [dept.pengelola]
      : []
    const hasAdminOrHrd = managers.some(m => m.role === "Admin" || m.role === "HRD")
    const isBackoffice = dept.namaDepartemen?.toLowerCase().replace(/[\s\-_]/g, "") === "backoffice"
    return hasAdminOrHrd || isBackoffice
  }

  // Cek apakah user yang sedang login berhak mengubah jadwal karyawan tertentu
  // Sesuai ketentuan:
  // 1. Departemen yang dikelola Admin & HRD itu TIDAK PERLU diatur lagi dan TIDAK BISA diubah juga (sudah otomatis default permanen: 08:45-17:00, Minggu & Libur Nasional Libur).
  // 2. Departemen yang dikelola SPV HANYA bisa diatur oleh SPV bersangkutan. Admin & HRD hanya melihat (Read-Only).
  const canUserEditEmployee = (emp: Karyawan) => {
    const isManaged = isDeptManagedByAdminOrHrd(emp.idDepartemen)
    if (isManaged) {
      // Departemen Admin & HRD: Tidak perlu dan tidak bisa diubah (permanen default)
      return false
    }
    if (isSPV) {
      // SPV hanya bisa mengatur jadwal departemennya sendiri
      return emp.idDepartemen === user?.idDepartemen
    }
    // Admin dan HRD hanya melihat jadwal SPV (read-only)
    return false
  }

  // Filtered karyawan list based on selected department filter
  const displayedKaryawan = useMemo(() => {
    if (isSPV) {
      // SPV only sees their own department's employees and NEVER Admin/HRD managed employees
      return karyawanList.filter(k => !isDeptManagedByAdminOrHrd(k.idDepartemen) && k.idDepartemen === user?.idDepartemen)
    }
    if (selectedDeptFilter === "all") {
      return karyawanList
    }
    return karyawanList.filter(k => k.idDepartemen === Number(selectedDeptFilter))
  }, [karyawanList, isSPV, user?.idDepartemen, selectedDeptFilter, departemenList])

  // Shifts available for current user/department, ordered by start time (Pagi -> Middle -> Siang)
  const departmentShifts = useMemo(() => {
    return shiftList
      .filter(s => s.idDepartemen === null || s.idDepartemen === undefined || (isSPV && s.idDepartemen === user?.idDepartemen))
      .sort((a, b) => (a.jamMulai || "").localeCompare(b.jamMulai || ""))
  }, [shiftList, isSPV, user?.idDepartemen])

  // Karyawan yang dapat diedit oleh user login
  const editableEmployees = useMemo(() => {
    return displayedKaryawan.filter(emp => canUserEditEmployee(emp))
  }, [displayedKaryawan, isSPV, user?.idDepartemen, departemenList])

  // Inisialisasi konfigurasi rolling shift untuk modal
  const initRollingConfigs = () => {
    const configs: Record<number, { offDay: string; startShiftId: number }> = {}
    const defaultDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

    editableEmployees.forEach((emp, index) => {
      const savedDay = emp.hariLibur?.trim()
      const offDay = (savedDay && defaultDays.includes(savedDay))
        ? savedDay
        : defaultDays[index % defaultDays.length]

      let startShiftId = departmentShifts[0]?.idShift ?? 0
      if (departmentShifts.length > 0) {
        startShiftId = departmentShifts[index % departmentShifts.length].idShift
      }

      configs[emp.idKaryawan] = { offDay, startShiftId }
    })
    setRollingConfigs(configs)
  }

  // Distribusikan hari libur merata di antara karyawan (Senin s/d Minggu)
  const distributeOffDaysEvenly = () => {
    const defaultDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    setRollingConfigs(prev => {
      const updated = { ...prev }
      editableEmployees.forEach((emp, index) => {
        const offDay = defaultDays[index % defaultDays.length]
        updated[emp.idKaryawan] = {
          ...(updated[emp.idKaryawan] || { startShiftId: departmentShifts[0]?.idShift ?? 0 }),
          offDay,
        }
      })
      return updated
    })
  }

  // Distribusikan shift awal merata (Pagi, Middle, Siang)
  const distributeShiftsEvenly = () => {
    if (departmentShifts.length === 0) return
    setRollingConfigs(prev => {
      const updated = { ...prev }
      editableEmployees.forEach((emp, index) => {
        const startShiftId = departmentShifts[index % departmentShifts.length].idShift
        updated[emp.idKaryawan] = {
          ...(updated[emp.idKaryawan] || { offDay: "Rabu" }),
          startShiftId,
        }
      })
      return updated
    })
  }

  // Terapkan pola rolling shift ke bulan ini
  const handleApplyRolling = async (saveImmediately: boolean = false) => {
    if (departmentShifts.length === 0) {
      alert("Tidak ada shift yang terdaftar untuk departemen ini. Buat shift terlebih dahulu di menu Shift.")
      return
    }

    const DAY_MAP: Record<string, number> = {
      "Minggu": 0,
      "Senin": 1,
      "Selasa": 2,
      "Rabu": 3,
      "Kamis": 4,
      "Jumat": 5,
      "Sabtu": 6,
    }

    const newSchedule = { ...schedule }
    const bulkItems: { idKaryawan: number; tanggal: string; idShift?: number; isCuti?: boolean; isLibur?: boolean; keterangan?: string }[] = []

    for (const emp of editableEmployees) {
      const config = rollingConfigs[emp.idKaryawan]
      if (!config) continue

      const targetOffDay = DAY_MAP[config.offDay] ?? 3
      let currentShiftIdx = departmentShifts.findIndex(s => s.idShift === config.startShiftId)
      if (currentShiftIdx === -1) currentShiftIdx = 0

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day)
        const dayOfWeek = dateObj.getDay()
        const key = `${emp.idKaryawan}-${day}`
        const tanggal = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

        // Cuti approved tidak ditimpa
        if (schedule[key] === "cuti") {
          bulkItems.push({ idKaryawan: emp.idKaryawan, tanggal, isCuti: true })
          continue
        }

        if (dayOfWeek === targetOffDay) {
          // Hari libur mingguan rutin karyawan
          newSchedule[key] = "libur"
          bulkItems.push({
            idKaryawan: emp.idKaryawan,
            tanggal,
            isLibur: true,
            keterangan: `Libur Rutin (${config.offDay})`
          })

          // Rolling shift setelah hari libur: berganti ke shift berikutnya
          currentShiftIdx = (currentShiftIdx + 1) % departmentShifts.length
        } else {
          // Hari kerja biasa
          const assignedShift = departmentShifts[currentShiftIdx]
          newSchedule[key] = assignedShift.idShift
          bulkItems.push({
            idKaryawan: emp.idKaryawan,
            tanggal,
            idShift: assignedShift.idShift,
          })
        }
      }

      // Simpan hariLibur ke database karyawan jika berubah
      if (emp.hariLibur !== config.offDay) {
        api.patch(`karyawan/${emp.idKaryawan}`, { hariLibur: config.offDay }).catch(console.error)
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
        alert(`Berhasil! Jadwal rolling untuk ${editableEmployees.length} karyawan bulan ${monthLabel} telah berhasil dibuat dan disimpan otomatis ke sistem.`)
      } catch (err) {
        alert(err instanceof Error ? err.message : "Gagal menyimpan jadwal otomatis")
      } finally {
        setSaving(false)
      }
    } else {
      setHasChanges(true)
      alert(`Jadwal rolling untuk ${editableEmployees.length} karyawan berhasil digenerate ke tabel! Silakan periksa atau sesuaikan jadwal, lalu klik "Simpan Perubahan" di atas.`)
    }
  }

  // Group displayed karyawan by department for visual sections (Sekat Departemen)
  const departmentSections = useMemo(() => {
    const map = new Map<number | null, Karyawan[]>()

    displayedKaryawan.forEach(emp => {
      const deptId = emp.idDepartemen || null
      if (!map.has(deptId)) {
        map.set(deptId, [])
      }
      map.get(deptId)!.push(emp)
    })

    const groups: {
      idDepartemen: number | null
      namaDepartemen: string
      isManagedByAdminOrHrd: boolean
      managerNames: string
      karyawan: Karyawan[]
    }[] = []

    map.forEach((empList, deptId) => {
      const dept = departemenList.find(d => d.idDepartemen === deptId)
      const managers = Array.isArray(dept?.pengelola)
        ? dept.pengelola
        : dept?.pengelola
        ? [dept.pengelola]
        : []
      const hasAdminOrHrd = managers.some(m => m.role === "Admin" || m.role === "HRD")
      const isBackoffice = dept?.namaDepartemen?.toLowerCase().replace(/[\s\-_]/g, "") === "backoffice"
      const isManaged = hasAdminOrHrd || isBackoffice || !dept

      const spvManagers = managers.filter(m => m.role === "SPV").map(m => m.nama).join(", ")

      let managerLabel = "HRD & Admin"
      if (!isManaged) {
        managerLabel = spvManagers ? `Supervisor: ${spvManagers}` : "Supervisor"
      } else if (managers.length > 0) {
        managerLabel = `HRD & Admin (${managers.map(m => m.nama).join(", ")})`
      }

      groups.push({
        idDepartemen: deptId,
        namaDepartemen: dept?.namaDepartemen || "Tanpa Departemen",
        isManagedByAdminOrHrd: isManaged,
        managerNames: managerLabel,
        karyawan: empList,
      })
    })

    // Sort: Departemen HRD/Admin di atas, lalu departemen SPV
    return groups.sort((a, b) => {
      if (a.isManagedByAdminOrHrd && !b.isManagedByAdminOrHrd) return -1
      if (!a.isManagedByAdminOrHrd && b.isManagedByAdminOrHrd) return 1
      return a.namaDepartemen.localeCompare(b.namaDepartemen)
    })
  }, [displayedKaryawan, departemenList])

  const handleCellClick = (idKaryawan: number, date: number, isFixedLibur: boolean, isBlockedLibur: boolean) => {
    const emp = karyawanList.find(k => k.idKaryawan === idKaryawan)
    if (!emp) return

    const isManaged = isDeptManagedByAdminOrHrd(emp.idDepartemen)
    if (isManaged) {
      alert(`Jadwal kerja karyawan di departemen ${emp.departemen?.namaDepartemen || "Office"} sudah default otomatis (08:45–17:00, Minggu & Libur Nasional Libur). Tidak perlu diatur dan tidak bisa diubah.`)
      return
    }

    if (!isSPV || emp.idDepartemen !== user?.idDepartemen) {
      alert(`Jadwal karyawan departemen ${emp.departemen?.namaDepartemen || "ini"} dikelola secara mandiri oleh Supervisor. Admin dan HRD hanya dapat melihat (Read-Only) dan tidak dapat mengubahnya.`)
      return
    }

    if (isFixedLibur || isBlockedLibur) return

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
        const date = getDateOnlyParts(j.tanggal)
        return j.idKaryawan === idKaryawan && j.isCuti && date.year === year && date.month !== month
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
      const items: { idKaryawan: number; tanggal: string; idShift?: number; isCuti?: boolean; isLibur?: boolean }[] = []
      Object.entries(schedule).forEach(([key, val]) => {
        if (initialSchedule[key] === val) return

        const [idKaryawanStr, dateStr] = key.split("-")
        const idKaryawan = Number(idKaryawanStr)
        const emp = karyawanList.find(k => k.idKaryawan === idKaryawan)
        if (!emp) return

        // Hanya simpan jadwal karyawan yang berhak dikelola oleh user yang login!
        if (!canUserEditEmployee(emp)) {
          return
        }

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

      const saved = await api.post<JadwalKerja[]>("jadwal-kerja/bulk", items)
      const allSaved = items.every(item => saved.some(result =>
        result.idKaryawan === item.idKaryawan &&
        result.tanggal.slice(0, 10) === item.tanggal &&
        (item.idShift === undefined || result.idShift === item.idShift) &&
        (item.isCuti === undefined || result.isCuti === item.isCuti)
      ))
      if (!allSaved) {
        throw new Error("Backend tidak mengembalikan jadwal yang sesuai dengan perubahan. Silakan muat ulang dan coba lagi.")
      }

      setHasChanges(false)
      await fetchData()
      alert(`${items.length} perubahan jadwal berhasil disimpan!`)
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

          {/* Tombol Generate Otomatis untuk SPV */}
          {editableEmployees.length > 0 && (
            <button
              onClick={() => {
                initRollingConfigs()
                setShowAutoModal(true)
              }}
              className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all cursor-pointer"
              title="Generate jadwal sebulan penuh secara otomatis dengan sistem rolling shift"
            >
              <Sparkles className="w-4 h-4" />
              <span>⚡ Generate Jadwal Otomatis (Rolling)</span>
            </button>
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

      {/* Banner Siklus Periode Penggajian & Cut-Off */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                Siklus Periode Penggajian (Awal Hitung & Tutup Buku)
              </span>
            </div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              Periode Gaji {monthLabel}: <span className="text-blue-700 dark:text-blue-400 font-bold">{cutOffMulaiLabel}</span> s/d <span className="text-rose-700 dark:text-rose-400 font-bold">{cutOffSelesaiLabel}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              • <strong>Tanggal 1 – {cutOffSettings.tanggalCutOffSelesai} {new Date(year, month).toLocaleDateString("id-ID", { month: "short" })}:</strong> Masuk ke perhitungan <strong>Slip Gaji {new Date(year, month).toLocaleDateString("id-ID", { month: "long" })}</strong> (Tutup Buku: {cutOffSettings.tanggalCutOffSelesai} {new Date(year, month).toLocaleDateString("id-ID", { month: "short" })}).<br />
              • <strong>Tanggal {cutOffSettings.tanggalCutOffMulai} – {daysInMonth} {new Date(year, month).toLocaleDateString("id-ID", { month: "short" })}:</strong> Sudah mulai masuk ke perhitungan <strong>Slip Gaji Bulan Depan</strong>.<br />
              • Karyawan yang hadir penuh pada periode cut-off ({cutOffMulaiLabel} s/d {cutOffSelesaiLabel}) tanpa izin/sakit/absen berhak menerima <strong>gaji pokok penuh</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-rose-300/80 dark:border-rose-800/80 text-center shadow-2xs">
              <div className="text-[10px] font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center justify-center gap-1">
                🛑 Tutup Buku
              </div>
              <div className="text-xs font-bold text-[var(--text-primary)] mt-0.5">{cutOffSettings.tanggalCutOffSelesai} {new Date(year, month).toLocaleDateString("id-ID", { month: "short" })}</div>
            </div>
            <div className="px-3.5 py-2 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-emerald-300/80 dark:border-emerald-800/80 text-center shadow-2xs">
              <div className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1">
                🟢 Buka Buku Baru
              </div>
              <div className="text-xs font-bold text-[var(--text-primary)] mt-0.5">{cutOffSettings.tanggalCutOffMulai} {new Date(year, month).toLocaleDateString("id-ID", { month: "short" })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 items-center">
        {isAdminOrHrd && (
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300 dark:bg-purple-950 dark:border-purple-700" />
            <span className="text-purple-700 dark:text-purple-300 font-semibold">Reguler Kantor (Tetap)</span>
            <span className="text-[var(--text-muted)]">(08:45–17:00, Minggu Libur)</span>
          </div>
        )}
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
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded bg-rose-100 border border-rose-300 dark:bg-rose-950 dark:border-rose-700" />
          <span className="text-rose-700 dark:text-rose-300 font-semibold">Tutup Buku (Tgl {cutOffSettings.tanggalCutOffSelesai})</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700" />
          <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Awal Hitung Gaji (Tgl {cutOffSettings.tanggalCutOffMulai})</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300 dark:bg-red-950 dark:border-red-700" />
          <span className="text-red-700 dark:text-red-300 font-semibold">Libur Nasional / Cuti Bersama</span>
        </div>
        {isAdminOrHrd && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              🔒 Read-Only
            </span>
            <span className="text-amber-800 dark:text-amber-300 font-medium">Dikelola SPV (Hanya Lihat)</span>
          </div>
        )}
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
                {days.map(d => {
                  const hasHoliday = !!d.holiday
                  return (
                    <th
                      key={d.date}
                      className={`px-1 py-1.5 text-center font-medium border-b border-[var(--border-default)] min-w-[48px] relative transition-colors ${
                        d.isTutupBuku
                          ? "bg-rose-50/80 dark:bg-rose-950/40 border-t-2 border-t-rose-500"
                          : d.isAwalHitung
                          ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-t-2 border-t-emerald-500"
                          : hasHoliday
                          ? "bg-red-50/80 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                          : d.isWeekend
                          ? "bg-[var(--bg-page)] text-[var(--text-muted)]"
                          : "text-[var(--text-secondary)]"
                      }`}
                      title={
                        d.isTutupBuku
                          ? `🛑 Tanggal ${d.date}: Tutup Buku Penggajian Bulan ${monthLabel}`
                          : d.isAwalHitung
                          ? `🟢 Tanggal ${d.date}: Awal Hitung Gaji Baru Periode Berikutnya`
                          : hasHoliday
                          ? `${d.holiday?.isCollectiveLeave ? "Cuti Bersama" : "Libur Nasional"}: ${d.holiday?.localName}`
                          : undefined
                      }
                    >
                      {/* Badge Tutup Buku / Awal Hitung Gaji */}
                      {d.isTutupBuku && (
                        <div className="text-[8px] font-black leading-none uppercase tracking-tighter text-rose-700 dark:text-rose-300 bg-rose-200/90 dark:bg-rose-900/80 rounded px-0.5 py-0.5 mb-1 shadow-2xs">
                          Tutup
                        </div>
                      )}
                      {d.isAwalHitung && (
                        <div className="text-[8px] font-black leading-none uppercase tracking-tighter text-emerald-700 dark:text-emerald-300 bg-emerald-200/90 dark:bg-emerald-900/80 rounded px-0.5 py-0.5 mb-1 shadow-2xs">
                          Awal
                        </div>
                      )}
                      {hasHoliday && !d.isTutupBuku && !d.isAwalHitung && (
                        <div className="text-[8px] font-bold leading-none text-red-600 dark:text-red-400 mb-0.5 truncate max-w-[45px] mx-auto">
                          {d.holiday?.isCollectiveLeave ? "Cuti" : "Libur"}
                        </div>
                      )}
                      <div className="text-[10px] uppercase">{d.dayLabel}</div>
                      <div className={`font-bold text-xs ${hasHoliday || d.isSunday ? "text-red-600 dark:text-red-400" : ""}`}>
                        {d.date}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {departmentSections.length === 0 ? (
                <tr>
                  <td colSpan={days.length + 1} className="py-8 text-center text-[var(--text-muted)]">
                    Tidak ada data karyawan
                  </td>
                </tr>
              ) : (
                departmentSections.map((section) => {
                  const isManaged = section.isManagedByAdminOrHrd
                  const canManageSection = isSPV
                    ? (!isManaged && section.idDepartemen === user?.idDepartemen)
                    : isManaged

                  return (
                    <Fragment key={section.idDepartemen ?? "no-dept"}>
                      {/* SEKAT PEMISAH PER DEPARTEMEN */}
                      <tr className="border-t-2 border-b border-[var(--border-default)]">
                        <td
                          colSpan={days.length + 1}
                          className={`sticky left-0 z-10 px-4 py-2.5 ${
                            isManaged
                              ? "bg-purple-50/90 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200"
                              : "bg-amber-50/90 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200"
                          }`}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`p-1.5 rounded-md ${
                                  isManaged
                                    ? "bg-purple-200/90 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                    : "bg-amber-200/90 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                                }`}
                              >
                                <Building2 className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-xs uppercase tracking-wider">
                                Departemen {section.namaDepartemen}
                              </span>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-current/20">
                                {section.karyawan.length} Karyawan
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              {isManaged ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300/60">
                                  <span>👑</span>
                                  <span>{section.managerNames}</span>
                                  <span className="ml-1 text-[10px] font-bold text-purple-800 dark:text-purple-200 bg-purple-200/80 dark:bg-purple-800/80 px-1.5 py-0.5 rounded">
                                    🔒 Default Tetap (08:45–17:00, Minggu & Libur Libur)
                                  </span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300/60">
                                  <span>👤</span>
                                  <span>{section.managerNames}</span>
                                  {isAdminOrHrd ? (
                                    <span className="ml-1 text-[10px] font-bold text-amber-900 dark:text-amber-100 bg-amber-200/80 dark:bg-amber-800/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <span>🔒</span>
                                      <span>Hanya Lihat (Read-Only)</span>
                                    </span>
                                  ) : isSPV && canManageSection ? (
                                    <span className="ml-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-200/80 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                                      Dikelola Anda
                                    </span>
                                  ) : null}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* DAFTAR KARYAWAN DALAM DEPARTEMEN INI */}
                      {section.karyawan.map((emp) => {
                        const hasCuti = Object.entries(schedule).some(([k, v]) => k.startsWith(`${emp.idKaryawan}-`) && v === "cuti")
                        const canEdit = canUserEditEmployee(emp)
                        const isEmpAdminDept = isDeptManagedByAdminOrHrd(emp.idDepartemen)

                        return (
                          <tr key={emp.idKaryawan} className={!canEdit ? "bg-slate-50/40 dark:bg-slate-900/20" : ""}>
                            <td className="sticky left-0 z-10 bg-[var(--bg-surface)] px-3 py-2 border-b border-r border-[var(--border-default)]">
                              <div className="flex items-center justify-between gap-1">
                                <div className="font-medium text-[var(--text-primary)] truncate">{emp.nama}</div>
                                {isEmpAdminDept ? (
                                  <span
                                    title="Jadwal Tetap Kantor: 08:45 - 17:00 (Default otomatis - Tidak bisa diubah)"
                                    className="text-[9px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 rounded px-1.5 py-0.5 shrink-0"
                                  >
                                    Jadwal Tetap
                                  </span>
                                ) : !canEdit ? (
                                  <span
                                    title="Mode Hanya Lihat: Jadwal karyawan ini dikelola secara mandiri oleh Supervisor"
                                    className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded px-1.5 py-0.5 shrink-0"
                                  >
                                    Read-Only (SPV)
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] mt-0.5">
                                <span className="text-[var(--text-muted)] font-mono">{emp.nik}</span>
                                {emp.jabatan && (
                                  <span className="text-[var(--text-secondary)]">· {emp.jabatan.namaJabatan}</span>
                                )}
                              </div>
                            </td>
                            {days.map(d => {
                              const key = `${emp.idKaryawan}-${d.date}`
                              const val = schedule[key]
                              const config = typeof val === "number" ? shiftConfigMap[val] : null

                              const isOldLibur = initialLibur[key] === true
                              const isBlockedLibur = isOldLibur && hasCuti
                              const isSunday = d.isSunday
                              const holiday = d.holiday

                              // Tampilan badge jadwal
                              let displayBadge = null
                              if (isEmpAdminDept) {
                                if (val === "cuti") {
                                  displayBadge = (
                                    <div
                                      className="rounded px-1 py-1 text-[10px] font-semibold leading-tight mx-auto"
                                      style={{ background: "#fff7ed", color: "#ea580c", border: `1px solid #fed7aa` }}
                                    >
                                      Cuti
                                    </div>
                                  )
                                } else if (holiday && holiday.isLibur !== false) {
                                  displayBadge = (
                                    <div className="rounded px-1 py-1 text-[9px] font-bold leading-tight mx-auto bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800 truncate max-w-[65px]">
                                      {holiday.isCollectiveLeave ? "Cuti Bersama" : "Libur"}
                                    </div>
                                  )
                                } else if (isSunday) {
                                  displayBadge = (
                                    <div className="rounded px-1 py-1 text-[10px] font-medium leading-tight mx-auto text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                      Libur
                                    </div>
                                  )
                                } else {
                                  displayBadge = (
                                    <div className="rounded px-1 py-1 text-[10px] font-semibold leading-tight mx-auto bg-purple-100/80 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                      08:45–17:00
                                    </div>
                                  )
                                }
                              } else if (val === "cuti") {
                                displayBadge = (
                                  <div
                                    className="rounded px-1 py-1 text-[10px] font-semibold leading-tight mx-auto"
                                    style={{ background: "#fff7ed", color: "#ea580c", border: `1px solid #fed7aa` }}
                                  >
                                    Cuti
                                  </div>
                                )
                              } else if (val === "libur") {
                                displayBadge = (
                                  <div className="rounded px-1 py-1 text-[10px] font-medium leading-tight mx-auto" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                                    Libur
                                  </div>
                                )
                              } else if (config) {
                                displayBadge = (
                                  <div
                                    className="rounded px-1 py-1 text-[10px] font-semibold leading-tight mx-auto"
                                    style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
                                  >
                                    {config.label}
                                  </div>
                                )
                              } else {
                                displayBadge = (
                                  <div className="rounded px-1 py-1 text-[10px] font-medium leading-tight mx-auto" style={{ color: offColor.color }}>
                                    —
                                  </div>
                                )
                              }

                              const cellTitle = !canEdit
                                ? `🔒 Dikelola oleh ${section.managerNames}. Admin dan HRD hanya dapat melihat (Read-Only) dan tidak dapat mengubahnya.`
                                : d.holiday
                                ? `${d.holiday.isCollectiveLeave ? "Cuti Bersama" : "Libur Nasional"}: ${d.holiday.localName}`
                                : undefined

                              return (
                                <td
                                  key={d.date}
                                  onClick={canEdit ? () => handleCellClick(emp.idKaryawan, d.date, false, isBlockedLibur) : undefined}
                                  title={cellTitle}
                                  className={`px-0.5 py-1 border-b border-[var(--border-default)] text-center transition-opacity ${
                                    d.holiday ? "bg-red-50/20 dark:bg-red-950/10" : d.isWeekend ? "bg-[var(--bg-page)]" : ""
                                  } ${
                                    !canEdit
                                      ? "cursor-not-allowed select-none opacity-85"
                                      : isBlockedLibur
                                      ? "opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
                                      : "cursor-pointer hover:opacity-80"
                                  }`}
                                >
                                  {displayBadge}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      {/* MODAL GENERATE JADWAL OTOMATIS (SISTEM ROLLING SHIFT) */}
      {showAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border-default)] flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">
                    Generate Jadwal Otomatis (Sistem Rolling Shift)
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Bulan {monthLabel} · {editableEmployees.length} Karyawan ({spvDeptName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoModal(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-page)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Petunjuk Sistem Rolling */}
              <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Cara Kerja Pola Rolling Shift Perusahaan</span>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] space-y-1 pl-6 leading-relaxed">
                  <p>
                    • <strong>Urutan Shift:</strong> {departmentShifts.map((s, idx) => (
                      <span key={s.idShift}>
                        <span className="font-semibold text-blue-700 dark:text-blue-300">{s.namaShift} ({s.jamMulai?.slice(0, 5)}–{s.jamSelesai?.slice(0, 5)})</span>
                        {idx < departmentShifts.length - 1 ? " ➔ " : " ➔ (kembali ke awal)"}
                      </span>
                    ))}
                  </p>
                  <p>
                    • <strong>Pergantian Shift:</strong> Setiap kali melewati <strong>Hari Libur Rutin Mingguan</strong>, shift karyawan otomatis berganti ke shift urutan berikutnya.
                  </p>
                  <p>
                    • <strong>Libur Fleksibel:</strong> Di tanggal merah atau hari libur nasional, karyawan operasional tetap masuk sesuai jadwal shift rolling mereka (kecuali bertepatan dengan hari libur rutinnya).
                  </p>
                </div>
              </div>

              {/* Quick Actions Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-2.5 pb-1">
                <span className="font-semibold text-[var(--text-secondary)] text-xs">
                  Atur Hari Libur & Shift Awal Karyawan:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={distributeOffDaysEvenly}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-page)] hover:bg-[var(--bg-surface-raised)] text-[11px] font-semibold text-[var(--text-primary)] transition-colors shadow-2xs cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-blue-600" />
                    Bagi Hari Libur Merata (Senin–Minggu)
                  </button>
                  <button
                    type="button"
                    onClick={distributeShiftsEvenly}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-page)] hover:bg-[var(--bg-surface-raised)] text-[11px] font-semibold text-[var(--text-primary)] transition-colors shadow-2xs cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
                    Bagi Shift Awal Merata
                  </button>
                </div>
              </div>

              {/* Daftar Karyawan & Setting */}
              <div className="border border-[var(--border-default)] rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-page)] border-b border-[var(--border-default)] text-[var(--text-secondary)]">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold w-10 text-center">#</th>
                      <th className="py-2.5 px-3 font-semibold min-w-[150px]">Karyawan</th>
                      <th className="py-2.5 px-3 font-semibold min-w-[140px]">Hari Libur Rutin</th>
                      <th className="py-2.5 px-3 font-semibold min-w-[160px]">Shift Awal (Tgl 1)</th>
                      <th className="py-2.5 px-3 font-semibold min-w-[200px]">Simulasi Siklus Shift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-default)]">
                    {editableEmployees.map((emp, i) => {
                      const cfg = rollingConfigs[emp.idKaryawan] || { offDay: "Rabu", startShiftId: departmentShifts[0]?.idShift ?? 0 }
                      const startShift = departmentShifts.find(s => s.idShift === cfg.startShiftId)
                      const startIdx = departmentShifts.findIndex(s => s.idShift === cfg.startShiftId)
                      const nextShift = departmentShifts[(startIdx + 1) % departmentShifts.length]
                      const nextNextShift = departmentShifts[(startIdx + 2) % departmentShifts.length]

                      return (
                        <tr key={emp.idKaryawan} className="hover:bg-[var(--bg-page)]/40 transition-colors">
                          <td className="py-2.5 px-3 text-center text-[var(--text-muted)] font-mono">{i + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-[var(--text-primary)]">{emp.nama}</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">{emp.nik} · {emp.jabatan?.namaJabatan || "Staf"}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={cfg.offDay}
                              onChange={e => {
                                setRollingConfigs({
                                  ...rollingConfigs,
                                  [emp.idKaryawan]: { ...cfg, offDay: e.target.value }
                                })
                              }}
                              className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-page)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-blue-500"
                            >
                              <option value="Senin">Senin</option>
                              <option value="Selasa">Selasa</option>
                              <option value="Rabu">Rabu</option>
                              <option value="Kamis">Kamis</option>
                              <option value="Jumat">Jumat</option>
                              <option value="Sabtu">Sabtu</option>
                              <option value="Minggu">Minggu</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={cfg.startShiftId}
                              onChange={e => {
                                setRollingConfigs({
                                  ...rollingConfigs,
                                  [emp.idKaryawan]: { ...cfg, startShiftId: Number(e.target.value) }
                                })
                              }}
                              className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-page)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-blue-500"
                            >
                              {departmentShifts.map(s => (
                                <option key={s.idShift} value={s.idShift}>
                                  {s.namaShift} ({s.jamMulai?.slice(0, 5)}–{s.jamSelesai?.slice(0, 5)})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold dark:bg-blue-950 dark:text-blue-300">
                                {startShift?.namaShift || "Shift 1"}
                              </span>
                              <span className="text-[var(--text-muted)]">➔</span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold dark:bg-amber-950 dark:text-amber-300">
                                Libur ({cfg.offDay})
                              </span>
                              <span className="text-[var(--text-muted)]">➔</span>
                              <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold dark:bg-purple-950 dark:text-purple-300">
                                {nextShift?.namaShift || "Shift 2"}
                              </span>
                              {departmentShifts.length > 2 && (
                                <>
                                  <span className="text-[var(--text-muted)]">➔</span>
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold dark:bg-emerald-950 dark:text-emerald-300">
                                    {nextNextShift?.namaShift || "Shift 3"}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--border-default)] flex items-center justify-between flex-wrap gap-3 bg-[var(--bg-page)]/50">
              <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Hari libur rutin akan disimpan permanen ke data karyawan untuk bulan berikutnya.</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowAutoModal(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-raised)] text-xs font-semibold text-[var(--text-secondary)] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleApplyRolling(false)}
                  className="px-4 py-2 rounded-lg border border-blue-600/40 hover:bg-blue-50 dark:hover:bg-blue-950 text-xs font-semibold text-blue-700 dark:text-blue-300 transition-colors shadow-2xs cursor-pointer"
                >
                  📋 Terapkan ke Tabel (Review Dulu)
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleApplyRolling(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs font-bold text-white transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {saving ? "Menyimpan Jadwal..." : "🚀 Terapkan & Simpan Otomatis"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
