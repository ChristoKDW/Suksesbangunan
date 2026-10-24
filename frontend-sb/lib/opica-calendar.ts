import { api } from "./api"
import { getIndonesianHolidays } from "./indonesia-holidays"

export interface CalendarEvent {
  date: string // YYYY-MM-DD
  localName: string
  name?: string
  type: "libur_nasional" | "cuti_bersama" | "hari_nasional" | "company_holiday"
  category?: string
  isLibur: boolean
  keterangan?: string | null
  description?: string | null
  shift?: any
}

export interface CalendarEventsResponse {
  status: string
  year: number
  month?: number | null
  count: number
  data: CalendarEvent[]
  byDate: Record<string, CalendarEvent[]>
}

// Memory cache untuk web client
const clientCache = new Map<string, { timestamp: number; data: CalendarEventsResponse }>()
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 menit

export async function fetchCalendarEvents(year: number, month?: number): Promise<CalendarEventsResponse> {
  const cacheKey = `${year}-${month || "all"}`
  const cached = clientCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  // 1. Coba ambil dari backend NestJS kita (/hari-libur/kalender)
  try {
    const query = month ? `?year=${year}&month=${month}` : `?year=${year}`
    const res = await api.get<CalendarEventsResponse>(`hari-libur/kalender${query}`)
    if (res && res.data && Array.isArray(res.data)) {
      clientCache.set(cacheKey, { timestamp: Date.now(), data: res })
      return res
    }
  } catch (err) {
    console.warn("Backend /hari-libur/kalender tidak merespon, mencoba fetch langsung Opica API...", err)
  }

  // 2. Fallback langsung ke Opica API (app.opica.id) jika backend sedang offline
  try {
    const monthQuery = month ? `&month=${month}` : ""
    const [liburRes, nasionalRes] = await Promise.all([
      fetch(`https://app.opica.id/api-libur/api?year=${year}${monthQuery}`).then((r) => r.json()).catch(() => null),
      fetch(`https://app.opica.id/api-libur/api/hari-nasional?year=${year}${monthQuery}`).then((r) => r.json()).catch(() => null),
    ])

    const events: CalendarEvent[] = []
    const byDate: Record<string, CalendarEvent[]> = {}

    if (liburRes?.status === "success" && Array.isArray(liburRes.data)) {
      for (const item of liburRes.data) {
        if (!item.holiday_date) continue
        const isCuti = item.holiday_type === "cuti_bersama"
        const ev: CalendarEvent = {
          date: item.holiday_date,
          localName: item.description || (isCuti ? "Cuti Bersama" : "Libur Nasional"),
          name: item.description,
          type: isCuti ? "cuti_bersama" : "libur_nasional",
          category: "nasional",
          isLibur: true,
          description: item.description,
        }
        events.push(ev)
        if (!byDate[ev.date]) byDate[ev.date] = []
        byDate[ev.date].push(ev)
      }
    }

    if (nasionalRes?.status === "success" && Array.isArray(nasionalRes.data)) {
      for (const item of nasionalRes.data) {
        if (!item.date) continue
        const already = events.some((e) => e.date === item.date && e.name === item.name)
        if (!already) {
          const ev: CalendarEvent = {
            date: item.date,
            localName: item.name,
            name: item.name,
            type: "hari_nasional",
            category: item.category || "nasional",
            isLibur: Boolean(item.is_public_holiday),
            description: item.description,
          }
          events.push(ev)
          if (!byDate[ev.date]) byDate[ev.date] = []
          byDate[ev.date].push(ev)
        }
      }
    }

    events.sort((a, b) => a.date.localeCompare(b.date))
    const result: CalendarEventsResponse = {
      status: "success",
      year,
      month,
      count: events.length,
      data: events,
      byDate,
    }
    clientCache.set(cacheKey, { timestamp: Date.now(), data: result })
    return result
  } catch (err) {
    console.error("Gagal fetch langsung Opica API, menggunakan fallback lokal:", err)
  }

  // 3. Fallback lokal titimangsa / date-holidays
  const localList = getIndonesianHolidays(year)
  const events: CalendarEvent[] = []
  const byDate: Record<string, CalendarEvent[]> = {}

  for (const item of localList) {
    if (month) {
      const m = parseInt(item.date.substring(5, 7), 10)
      if (m !== month) continue
    }
    const ev: CalendarEvent = {
      date: item.date,
      localName: item.localName,
      name: item.localName,
      type: item.isCollectiveLeave ? "cuti_bersama" : "libur_nasional",
      category: "nasional",
      isLibur: true,
      description: item.isCollectiveLeave ? "Cuti Bersama Resmi" : "Hari Libur Nasional Resmi",
    }
    events.push(ev)
    if (!byDate[ev.date]) byDate[ev.date] = []
    byDate[ev.date].push(ev)
  }

  const fallbackResult: CalendarEventsResponse = {
    status: "success",
    year,
    month,
    count: events.length,
    data: events,
    byDate,
  }
  return fallbackResult
}
