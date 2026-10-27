"use client"

import { useState } from "react"
import { Server, Activity, Database, RefreshCw, Cpu, HardDrive, CheckCircle2, AlertTriangle, Layers } from "lucide-react"
import { TerminalStream } from "@/components/terminal-stream"
import { toast } from "@/lib/swal"

const PM2_SERVICES = [
  { name: "backend", port: 3002, pid: 28565, status: "online", memory: "118 MB", uptime: "14h 22m", restarts: 0 },
  { name: "frontend", port: 3000, pid: 29012, status: "online", memory: "86 MB", uptime: "14h 20m", restarts: 0 },
  { name: "superadmin", port: 3001, pid: 31045, status: "online", memory: "72 MB", uptime: "1h 05m", restarts: 0 },
]

export default function SystemHealthPage() {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      toast("Telemetri server berhasil diperbarui", "success")
    }, 400)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <Server className="w-6 h-6 text-red-600" />
            <span>Server Health & Telemetry</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Status cluster PM2, utilisasi CPU/RAM VPS 103.247.11.91, dan koneksi PostgreSQL.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-secondary)] hover:text-red-600 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-red-600" : ""}`} />
          <span>Refresh Telemetri</span>
        </button>
      </div>

      {/* 3 Metric Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Load CPU VPS</span>
            <Cpu className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">18.4%</div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full w-[18.4%]" />
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">Intel Xeon 4 vCPU · Status Stabil</p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">RAM VPS Terpakai</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">3.2 GB / 8 GB</div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full w-[40%]" />
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">Available Memory: 4.8 GB Bebas</p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Storage SSD VPS</span>
            <HardDrive className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">28 GB / 100 GB</div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full w-[28%]" />
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">Free Space: 72 GB Tersedia</p>
        </div>
      </div>

      {/* PM2 Process Cluster Table */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Layers className="w-4 h-4 text-red-600" />
          <span>Status Cluster PM2 (Server Produksi 103.247.11.91)</span>
        </h2>

        <div className="overflow-x-auto border border-[var(--border-default)] rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-[var(--text-secondary)] font-bold uppercase border-b border-[var(--border-default)]">
              <tr>
                <th className="py-3 px-4">Nama Service</th>
                <th className="py-3 px-4">Port</th>
                <th className="py-3 px-4">PID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Memory</th>
                <th className="py-3 px-4">Uptime</th>
                <th className="py-3 px-4 text-right">Restarts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {PM2_SERVICES.map((s) => (
                <tr key={s.name} className="hover:bg-[var(--sidebar-item-hover-bg)]">
                  <td className="py-3 px-4 font-bold text-[var(--text-primary)]">{s.name}</td>
                  <td className="py-3 px-4 font-mono text-gray-500">:{s.port}</td>
                  <td className="py-3 px-4 font-mono text-gray-400">{s.pid}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      online
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{s.memory}</td>
                  <td className="py-3 px-4 text-gray-500">{s.uptime}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-gray-500">{s.restarts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Terminal Stream */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-600" />
          <span>Live Log Output (NestJS Application)</span>
        </h2>
        <TerminalStream />
      </div>
    </div>
  )
}
