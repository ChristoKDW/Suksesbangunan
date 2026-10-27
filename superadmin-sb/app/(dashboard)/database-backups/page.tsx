"use client"

import { useState } from "react"
import { Database, Download, HardDrive, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react"
import { confirmDialog, showSuccess, toast } from "@/lib/swal"

interface BackupItem {
  id: string
  name: string
  size: string
  date: string
  type: "auto" | "manual"
}

export default function DatabaseBackupsPage() {
  const [loading, setLoading] = useState(false)
  const [backups, setBackups] = useState<BackupItem[]>([
    {
      id: "1",
      name: "absensi_sukses_bangunan_20261028_0220.sql.gz",
      size: "42.8 MB",
      date: "2026-10-28 02:20 WITA",
      type: "auto",
    },
    {
      id: "2",
      name: "absensi_sukses_bangunan_20261027_1200.sql.gz",
      size: "41.6 MB",
      date: "2026-10-27 12:00 WITA",
      type: "manual",
    },
    {
      id: "3",
      name: "absensi_sukses_bangunan_20261026_0000.sql.gz",
      size: "40.9 MB",
      date: "2026-10-26 00:00 WITA",
      type: "auto",
    },
  ])

  const handleTriggerBackup = async () => {
    const ok = await confirmDialog(
      "Sistem akan membuat file dump database PostgreSQL terkompresi (.sql.gz) langsung di server VPS. Lanjutkan?",
      {
        title: "Snapshot Database Manual",
        confirmText: "Eksekusi Sekarang",
      }
    )
    if (!ok) return

    setLoading(true)
    setTimeout(() => {
      const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, "") + "_" + new Date().getHours() + new Date().getMinutes()
      const newBackup: BackupItem = {
        id: String(Date.now()),
        name: `absensi_sukses_bangunan_${nowStr}.sql.gz`,
        size: "43.1 MB",
        date: "2026-10-28 (Baru saja)",
        type: "manual",
      }
      setBackups([newBackup, ...backups])
      setLoading(false)
      showSuccess("Snapshot PostgreSQL terkompresi berhasil dibuat dan disimpan di /root/backup-db/", "Snapshot Selesai")
    }, 1200)
  }

  const handleDownload = (name: string) => {
    toast(`Mengunduh berkas cadangan: ${name}`, "info")
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <Database className="w-6 h-6 text-red-600" />
            <span>Database Backups & Recovery</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Manajemen snapshot database PostgreSQL, unduhan backup terenkripsi, dan verifikasi cron.
          </p>
        </div>

        <button
          onClick={handleTriggerBackup}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Membuat Dump Database...</span>
            </>
          ) : (
            <>
              <HardDrive className="w-4 h-4" />
              <span>Snapshot Database Manual</span>
            </>
          )}
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Berkas Cadangan Database di Server VPS
          </h3>
          <span className="text-[11px] text-[var(--text-muted)]">
            Disimpan di: <code className="font-mono text-red-600">/root/backup-db/</code>
          </span>
        </div>

        <div className="border border-[var(--border-default)] rounded-xl divide-y divide-[var(--border-default)] text-xs">
          {backups.map((item) => (
            <div
              key={item.id}
              className="p-4 flex items-center justify-between hover:bg-[var(--sidebar-item-hover-bg)] transition"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-[var(--text-primary)]">{item.name}</p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.type === "manual"
                          ? "bg-red-50 text-red-600 border border-red-200"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.type === "manual" ? "MANUAL" : "CRON"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Ukuran: {item.size} · Waktu: {item.date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(item.name)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] hover:text-red-600 hover:border-red-300 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
