"use client"

import { useState } from "react"
import { SlidersHorizontal, AlertTriangle, Unlock, UserX, FileCheck, ShieldAlert, History } from "lucide-react"
import { confirmDialog, showSuccess, toast } from "@/lib/swal"

interface OverrideLog {
  id: number
  waktu: string
  pelaku: string
  aksi: string
  alasan: string
}

export default function EmergencyControlPage() {
  const [logs, setLogs] = useState<OverrideLog[]>([
    {
      id: 1,
      waktu: "2026-10-27 16:30 WITA",
      pelaku: "Christo KDW (Owner)",
      aksi: "UNLOCK_TRIGGER_CUTI",
      alasan: "Koreksi salah input pengajuan cuti darurat karyawan #12",
    },
    {
      id: 2,
      waktu: "2026-10-25 09:15 WITA",
      pelaku: "Christo KDW (Owner)",
      aksi: "FORCE_UNFREEZE_SLIP",
      alasan: "Koreksi komponen lembur susulan sebelum transfer BNIDirect",
    },
  ])

  const handleUnlockCuti = async () => {
    const ok = await confirmDialog(
      "Tindakan ini akan mem-bypass database trigger trg_jadwal_kunci_cuti dan dicatat dalam audit trail. Lanjutkan?",
      {
        title: "Bypass Kunci Cuti Database",
        confirmText: "Ya, Buka Kunci",
        danger: true,
      }
    )
    if (ok) {
      const newEntry: OverrideLog = {
        id: Date.now(),
        waktu: new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Makassar" }),
        pelaku: "Christo KDW (Owner)",
        aksi: "UNLOCK_TRIGGER_CUTI",
        alasan: "Manual override via Super Admin Panel",
      }
      setLogs([newEntry, ...logs])
      showSuccess("Permintaan override kunci cuti berhasil dieksekusi", "Berhasil Di-Bypass")
    }
  }

  const handleRevokeSessions = async () => {
    const ok = await confirmDialog(
      "Seluruh sesi aktif (token JWT) pengguna akan dicabut dan dipaksa login ulang. Lanjutkan?",
      {
        title: "Revoke Universal Sessions",
        confirmText: "Ya, Putuskan Sesi",
        danger: true,
      }
    )
    if (ok) {
      showSuccess("Seluruh sesi aktif pengguna telah berhasil dibekukan", "Sesi Dicabut")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-red-600" />
          <span>Emergency Control & God-Mode Overrides</span>
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Akses khusus untuk membatalkan penguncian jadwal database trigger, force unfreeze slip gaji, dan revokasi sesi darurat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Bypass DB Trigger */}
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-red-200 dark:border-red-900/50 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Bypass Kunci Cuti (DB Trigger)</h3>
              <p className="text-xs text-[var(--text-secondary)]">Membuka baris jadwal kerja yang terkunci trigger trg_jadwal_kunci_cuti</p>
            </div>
          </div>
          <button
            onClick={handleUnlockCuti}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition"
          >
            Buka Kunci Jadwal Cuti
          </button>
        </div>

        {/* Kick All Sessions */}
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Kick / Revoke All Sessions</h3>
              <p className="text-xs text-[var(--text-secondary)]">Cabut seluruh token JWT aktif jika terindikasi insiden keamanan</p>
            </div>
          </div>
          <button
            onClick={handleRevokeSessions}
            className="w-full py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-700 dark:text-amber-400 font-bold text-xs transition"
          >
            Bekukan Seluruh Sesi
          </button>
        </div>
      </div>

      {/* Histori Override */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <History className="w-4 h-4 text-red-600" />
          <span>Audit Histori Tindakan Emergency Override</span>
        </h2>

        <div className="overflow-x-auto border border-[var(--border-default)] rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-[var(--text-secondary)] font-bold uppercase border-b border-[var(--border-default)]">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Eksekutor</th>
                <th className="py-3 px-4">Tindakan Override</th>
                <th className="py-3 px-4">Catatan / Alasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--sidebar-item-hover-bg)]">
                  <td className="py-3 px-4 font-mono text-gray-500">{log.waktu}</td>
                  <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">{log.pelaku}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                      {log.aksi}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{log.alasan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
