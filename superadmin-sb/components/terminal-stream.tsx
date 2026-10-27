"use client"

import { useState, useEffect, useRef } from "react"
import { Terminal, Pause, Play, Trash2, CheckCircle, AlertTriangle } from "lucide-react"

const SAMPLE_LOGS = [
  "[Nest] 28565  - 28/10/2026, 04:30:12 WITA     LOG [NestApplication] Nest application successfully started",
  "[Nest] 28565  - 28/10/2026, 04:32:05 WITA     LOG [AbsensiService] Syncing geofence coordinates (-5.1192, 119.5120)",
  "[Nest] 28565  - 28/10/2026, 04:34:18 WITA     LOG [PenggajianService] Live slip calculation requested for karyawan #42",
  "[Nest] 28565  - 28/10/2026, 04:35:40 WITA     LOG [KebijakanLiburService] Cache hit: Libur Nasional = libur, Cuti Bersama = kerja",
  "[Nest] 28565  - 28/10/2026, 04:37:01 WITA     LOG [KasbonService] Auto-deduct check triggered for active slips",
  "[Nest] 28565  - 28/10/2026, 04:38:15 WITA     LOG [TypeORM] Query executed: SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10",
  "[Nest] 28565  - 28/10/2026, 04:40:02 WITA     LOG [JadwalKerjaService] Database trigger trg_jadwal_kunci_cuti verified active",
  "[Nest] 28565  - 28/10/2026, 04:41:22 WITA     LOG [SuperAdminGuard] Privilege authorization verified for user Christo",
]

export function TerminalStream() {
  const [logs, setLogs] = useState<string[]>(SAMPLE_LOGS)
  const [isPaused, setIsPaused] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Makassar" })
      const randomModules = ["[AbsensiService]", "[ReportsService]", "[NotificationService]", "[AuthWeb]", "[AuditLog]"]
      const mod = randomModules[Math.floor(Math.random() * randomModules.length)]
      const newEntry = `[Nest] 28565  - 28/10/2026, ${now} WITA     LOG ${mod} Periodic health heartbeat OK`
      
      setLogs((prev) => [...prev.slice(-40), newEntry])
    }, 4500)

    return () => clearInterval(interval)
  }, [isPaused])

  useEffect(() => {
    if (!isPaused) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs, isPaused])

  return (
    <div className="rounded-2xl border border-gray-800 bg-[#0A0A0C] text-gray-200 overflow-hidden shadow-2xl font-mono text-xs">
      {/* Top Header */}
      <div className="px-4 py-3 bg-[#121216] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-gray-300">PM2 Live Log Streamer (NestJS production)</span>
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPaused ? "bg-amber-400" : "bg-emerald-400"} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isPaused ? "bg-amber-500" : "bg-emerald-500"}`} />
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-[11px] font-sans font-medium flex items-center gap-1 transition"
          >
            {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
            <span>{isPaused ? "Lanjutkan" : "Jeda"}</span>
          </button>
          <button
            onClick={() => setLogs([])}
            className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-red-400 transition"
            title="Bersihkan log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Output Body */}
      <div className="p-4 h-64 overflow-y-auto space-y-1.5 select-text">
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">Log dibersihkan...</p>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="leading-relaxed whitespace-pre-wrap">
              <span className="text-emerald-400 font-bold">[Nest]</span>{" "}
              <span className="text-gray-400">{log.replace("[Nest] ", "")}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
