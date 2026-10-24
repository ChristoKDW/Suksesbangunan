"use client"

import { useState, useEffect, useMemo } from "react"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flag,
  Sparkles,
  CalendarCheck,
  Building2,
  Info,
  Calendar as CalendarIcon,
  Tag,
  Loader2,
} from "lucide-react"
import { fetchCalendarEvents, type CalendarEvent } from "@/lib/opica-calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules"

export function DashboardCalendar() {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth()) // 0-indexed (0 = Jan, 9 = Okt)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<"all" | "libur" | "nasional">("all")
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [byDate, setByDate] = useState<Record<string, CalendarEvent[]>>({})
  const [loading, setLoading] = useState(true)

  // Load holidays for the active month & year
  useEffect(() => {
    let isMounted = true
    setLoading(true)

    fetchCalendarEvents(year, month + 1)
      .then((res) => {
        if (!isMounted) return
        setEvents(res.data || [])
        setByDate(res.byDate || {})
      })
      .catch((err) => {
        console.error("Gagal memuat kalender Opica:", err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [year, month])

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
    setSelectedDate(null)
  }

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
    setSelectedDate(null)
  }

  const goToToday = () => {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth())
    setSelectedDate(null)
  }

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay() // 0 = Sunday
    // Adjust starting day of week: Monday = 0, Sunday = 6
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const list: Array<{
      dateStr: string
      dayNum: number
      isCurrentMonth: boolean
      isSunday: boolean
      isToday: boolean
      events: CalendarEvent[]
      hasLibur: boolean
      hasHariNasional: boolean
      hasCompanyHoliday: boolean
    }> = []

    const todayStr = new Date().toISOString().slice(0, 10)

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i
      const prevDate = new Date(year, month - 1, dNum)
      const pYear = prevDate.getFullYear()
      const pMonth = String(prevDate.getMonth() + 1).padStart(2, "0")
      const pDay = String(dNum).padStart(2, "0")
      const dStr = `${pYear}-${pMonth}-${pDay}`

      list.push({
        dateStr: dStr,
        dayNum: dNum,
        isCurrentMonth: false,
        isSunday: prevDate.getDay() === 0,
        isToday: dStr === todayStr,
        events: byDate[dStr] || [],
        hasLibur: false,
        hasHariNasional: false,
        hasCompanyHoliday: false,
      })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d)
      const mStr = String(month + 1).padStart(2, "0")
      const dStr = `${year}-${mStr}-${String(d).padStart(2, "0")}`
      const dayEvents = byDate[dStr] || []

      const hasLibur = dayEvents.some((e) => e.isLibur || e.type === "libur_nasional" || e.type === "cuti_bersama")
      const hasHariNasional = dayEvents.some((e) => e.type === "hari_nasional")
      const hasCompanyHoliday = dayEvents.some((e) => e.type === "company_holiday")

      list.push({
        dateStr: dStr,
        dayNum: d,
        isCurrentMonth: true,
        isSunday: curDate.getDay() === 0,
        isToday: dStr === todayStr,
        events: dayEvents,
        hasLibur,
        hasHariNasional,
        hasCompanyHoliday,
      })
    }

    // Next month padding to fill complete grid (multiples of 7)
    const remaining = 7 - (list.length % 7)
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const nextDate = new Date(year, month + 1, i)
        const nYear = nextDate.getFullYear()
        const nMonth = String(nextDate.getMonth() + 1).padStart(2, "0")
        const dStr = `${nYear}-${nMonth}-${String(i).padStart(2, "0")}`

        list.push({
          dateStr: dStr,
          dayNum: i,
          isCurrentMonth: false,
          isSunday: nextDate.getDay() === 0,
          isToday: dStr === todayStr,
          events: byDate[dStr] || [],
          hasLibur: false,
          hasHariNasional: false,
          hasCompanyHoliday: false,
        })
      }
    }

    return list
  }, [year, month, byDate])

  const monthLabel = new Date(year, month).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  })

  // Filtered event list
  const filteredEvents = useMemo(() => {
    let list = events
    if (selectedDate) {
      list = list.filter((e) => e.date === selectedDate)
    }
    if (filterType === "libur") {
      list = list.filter((e) => e.isLibur || e.type === "libur_nasional" || e.type === "cuti_bersama")
    } else if (filterType === "nasional") {
      list = list.filter((e) => e.type === "hari_nasional")
    }
    return list
  }, [events, selectedDate, filterType])

  const liburCount = events.filter((e) => e.isLibur || e.type === "libur_nasional" || e.type === "cuti_bersama").length
  const nasionalCount = events.filter((e) => e.type === "hari_nasional").length

  return (
    <Card className="border-[var(--border-default)] shadow-xs overflow-hidden">
      {/* Header */}
      <CardHeader className="p-4 sm:p-5 border-b border-[var(--border-default)] bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                Kalender Kerja & Hari Nasional
              </CardTitle>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                <span>Sinkron resmi via Opica API</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Libur & Peringatan Nasional</span>
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 font-bold text-xs sm:text-sm text-[var(--text-primary)] min-w-[130px] text-center">
              {monthLabel}
            </div>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SISI KIRI: Kalender Grid (7 Kolom) */}
          <div className="lg:col-span-7 xl:col-span-7">
            {/* Nama Hari */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-[var(--text-muted)] mb-2 uppercase tracking-wider">
              <span>Sen</span>
              <span>Sel</span>
              <span>Rab</span>
              <span>Kam</span>
              <span>Jum</span>
              <span className="text-amber-600 dark:text-amber-400">Sab</span>
              <span className="text-red-600 dark:text-red-400">Min</span>
            </div>

            {/* Grid Tanggal */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d, idx) => {
                const isSelected = selectedDate === d.dateStr
                const hasEvents = d.events.length > 0

                return (
                  <button
                    key={`${d.dateStr}-${idx}`}
                    type="button"
                    onClick={() => {
                      if (!d.isCurrentMonth) return
                      setSelectedDate(selectedDate === d.dateStr ? null : d.dateStr)
                    }}
                    disabled={!d.isCurrentMonth}
                    className={`relative min-h-[52px] sm:min-h-[58px] p-1 rounded-lg border text-left transition-all flex flex-col justify-between ${
                      !d.isCurrentMonth
                        ? "opacity-25 border-transparent cursor-default bg-transparent"
                        : isSelected
                        ? "border-red-600 ring-2 ring-red-500/30 bg-red-50/40 dark:bg-red-950/20"
                        : d.hasLibur || d.isSunday
                        ? "border-red-200/80 dark:border-red-950/60 bg-red-50/30 dark:bg-red-950/10 hover:border-red-400"
                        : d.hasHariNasional
                        ? "border-blue-200/80 dark:border-blue-950/60 bg-blue-50/30 dark:bg-blue-950/10 hover:border-blue-400"
                        : "border-[var(--border-default)] hover:bg-[var(--bg-page)]"
                    } ${d.isToday ? "ring-2 ring-emerald-500" : ""}`}
                  >
                    {/* Header Tanggal */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-bold leading-none ${
                          !d.isCurrentMonth
                            ? "text-[var(--text-muted)]"
                            : d.hasLibur || d.isSunday
                            ? "text-red-600 dark:text-red-400"
                            : d.hasHariNasional
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-[var(--text-primary)]"
                        }`}
                      >
                        {d.dayNum}
                      </span>
                      {d.isToday && (
                        <span className="text-[9px] font-black uppercase px-1 rounded-xs bg-emerald-500 text-white leading-tight">
                          Hari ini
                        </span>
                      )}
                    </div>

                    {/* Dot / Pill Indicators */}
                    {hasEvents && d.isCurrentMonth && (
                      <div className="flex flex-col gap-0.5 mt-1 w-full">
                        {d.events.slice(0, 2).map((ev, eIdx) => {
                          const isLibur = ev.isLibur || ev.type === "libur_nasional" || ev.type === "cuti_bersama"
                          return (
                            <div
                              key={eIdx}
                              className={`text-[9px] font-semibold truncate rounded px-1 py-0.5 leading-tight ${
                                isLibur
                                  ? "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                              }`}
                              title={ev.name || ev.localName}
                            >
                              {ev.name || ev.localName}
                            </div>
                          )
                        })}
                        {d.events.length > 2 && (
                          <span className="text-[8px] text-[var(--text-muted)] font-bold pl-0.5">
                            +{d.events.length - 2} lagi
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 flex-wrap mt-3 pt-3 border-t border-[var(--border-default)] text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 flex-shrink-0" />
                <span>Libur Nasional / Tanggal Merah</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0" />
                <span>Hari Peringatan Nasional (Kerja)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span>Hari Ini</span>
              </div>
            </div>
          </div>

          {/* SISI KANAN: Daftar Agenda & Hari Penting Bulan Ini */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col">
            {/* Filter Tabs */}
            <div className="flex items-center justify-between gap-1 mb-3 flex-wrap">
              <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Agenda Bulan {monthLabel}</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-0.5 rounded-lg border border-[var(--border-default)] text-[11px]">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    filterType === "all"
                      ? "bg-white dark:bg-[#0B0F17] text-[var(--text-primary)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Semua ({events.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("libur")}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    filterType === "libur"
                      ? "bg-white dark:bg-[#0B0F17] text-red-600 dark:text-red-400 shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-red-600"
                  }`}
                >
                  Libur ({liburCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("nasional")}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    filterType === "nasional"
                      ? "bg-white dark:bg-[#0B0F17] text-blue-600 dark:text-blue-400 shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-blue-600"
                  }`}
                >
                  Nasional ({nasionalCount})
                </button>
              </div>
            </div>

            {selectedDate && (
              <div className="mb-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300 flex items-center justify-between">
                <span>
                  Memfilter tanggal:{" "}
                  <strong>
                    {new Date(selectedDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </strong>
                </span>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-[11px] underline font-semibold hover:opacity-80"
                >
                  Tampilkan Semua
                </button>
              </div>
            )}

            {/* List Event Cards */}
            <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-8 text-[var(--text-muted)]">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs">Memuat kalender & hari libur Opica...</span>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-[var(--border-default)] rounded-xl bg-slate-50/50 dark:bg-white/[0.01]">
                  <CalendarCheck className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    Tidak ada agenda libur / nasional
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {selectedDate ? "Tidak ada event pada tanggal terpilih." : "Tidak ada tanggal merah di bulan ini."}
                  </p>
                </div>
              ) : (
                filteredEvents.map((ev, idx) => {
                  const isLibur = ev.isLibur || ev.type === "libur_nasional" || ev.type === "cuti_bersama"
                  const dObj = new Date(ev.date)
                  const dayName = dObj.toLocaleDateString("id-ID", { weekday: "short" })
                  const dayNum = dObj.getDate()

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all ${
                        isLibur
                          ? "bg-red-50/40 dark:bg-red-950/15 border-red-200/80 dark:border-red-900/40 hover:bg-red-50/70"
                          : "bg-blue-50/40 dark:bg-blue-950/15 border-blue-200/80 dark:border-blue-900/40 hover:bg-blue-50/70"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Tanggal Badge */}
                        <div
                          className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center flex-shrink-0 font-bold border shadow-2xs ${
                            isLibur
                              ? "bg-red-600 text-white border-red-700"
                              : "bg-blue-600 text-white border-blue-700"
                          }`}
                        >
                          <span className="text-[9px] uppercase tracking-wider leading-none">{dayName}</span>
                          <span className="text-base font-extrabold leading-none mt-0.5">{dayNum}</span>
                        </div>

                        {/* Detail Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isLibur
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300"
                              }`}
                            >
                              {ev.type === "cuti_bersama"
                                ? "Cuti Bersama"
                                : isLibur
                                ? "Libur Nasional"
                                : "Hari Nasional"}
                            </span>
                            {ev.category && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--text-muted)] bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                                <Tag className="w-2.5 h-2.5" />
                                {ev.category}
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mt-1 leading-snug">
                            {ev.name || ev.localName}
                          </h4>

                          {ev.description && ev.description !== ev.name && (
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
