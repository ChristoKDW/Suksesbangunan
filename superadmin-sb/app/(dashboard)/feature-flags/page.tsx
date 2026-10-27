"use client"

import { useState } from "react"
import { ToggleRight, MapPin, ShieldCheck, Sliders, CheckCircle2 } from "lucide-react"
import { confirmDialog, showSuccess, toast } from "@/lib/swal"

export default function FeatureFlagsPage() {
  const [maintenance, setMaintenance] = useState(false)
  const [kasbonActive, setKasbonActive] = useState(true)
  const [livenessActive, setLivenessActive] = useState(true)
  const [geofenceRadius, setGeofenceRadius] = useState(50)

  const handleToggleMaintenance = async () => {
    const nextState = !maintenance
    const ok = await confirmDialog(
      nextState
        ? "Mengaktifkan Maintenance Mode akan memblokir akses absensi karyawan dan web operasional. Lanjutkan?"
        : "Matikan Maintenance Mode dan izinkan kembali seluruh akses operasional?",
      {
        title: nextState ? "Aktifkan Maintenance Mode" : "Non-aktifkan Maintenance Mode",
        confirmText: nextState ? "Ya, Aktifkan" : "Ya, Matikan",
        danger: nextState,
      }
    )
    if (ok) {
      setMaintenance(nextState)
      showSuccess(`Maintenance Mode berhasil ${nextState ? "diaktifkan" : "dinon-aktifkan"}`)
    }
  }

  const handleSaveRadius = () => {
    toast(`Radius geofence global diatur ke ${geofenceRadius} meter`, "success")
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] flex items-center gap-2">
          <ToggleRight className="w-6 h-6 text-red-600" />
          <span>Feature Flags & Dynamic System Configuration</span>
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Saklar kontrol fitur tingkat sistem tanpa perlu mengubah kode atau me-restart backend server.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-6 shadow-sm">
        {/* Maintenance Mode */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[var(--border-default)] gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--text-primary)]">System-wide Maintenance Mode</span>
              {maintenance && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                  AKTIF
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Alihkan seluruh request mobile app & web operasional ke halaman layar pemeliharaan sistem.
            </p>
          </div>
          <button
            onClick={handleToggleMaintenance}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              maintenance
                ? "bg-red-600 text-white hover:bg-red-700 shadow-sm"
                : "border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {maintenance ? "Matikan Maintenance" : "Aktifkan Maintenance"}
          </button>
        </div>

        {/* Modul Kasbon */}
        <div className="flex items-center justify-between pb-6 border-b border-[var(--border-default)]">
          <div className="space-y-1">
            <span className="text-sm font-bold text-[var(--text-primary)]">Modul Kasbon & Potongan Slip</span>
            <p className="text-xs text-[var(--text-secondary)]">
              Izinkan pengajuan kasbon baru di mobile dan eksekusi pemotongan otomatis saat generate payroll.
            </p>
          </div>
          <button
            onClick={() => {
              setKasbonActive(!kasbonActive)
              toast(`Modul kasbon ${!kasbonActive ? "diaktifkan" : "dinon-aktifkan"}`, "info")
            }}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              kasbonActive ? "bg-red-600" : "bg-gray-300 dark:bg-gray-700"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                kasbonActive ? "left-6.5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Liveness Face AI */}
        <div className="flex items-center justify-between pb-6 border-b border-[var(--border-default)]">
          <div className="space-y-1">
            <span className="text-sm font-bold text-[var(--text-primary)]">Deteksi Liveness Wajah (Face Anti-Spoofing)</span>
            <p className="text-xs text-[var(--text-secondary)]">
              Wajibkan kedipan/gerakan wajah saat absensi masuk di aplikasi mobile karyawan.
            </p>
          </div>
          <button
            onClick={() => {
              setLivenessActive(!livenessActive)
              toast(`Liveness wajah ${!livenessActive ? "diaktifkan" : "dinon-aktifkan"}`, "info")
            }}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              livenessActive ? "bg-red-600" : "bg-gray-300 dark:bg-gray-700"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                livenessActive ? "left-6.5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Geofence Static Radius */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>Radius Geofence Kehadiran Default</span>
              </span>
              <p className="text-xs text-[var(--text-secondary)]">
                Batas radius lingkaran GPS absensi dihitung dari koordinat kantor pusat via Haversine Formula.
              </p>
            </div>
            <span className="font-mono font-bold text-sm text-red-600">{geofenceRadius} Meter</span>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="range"
              min="20"
              max="200"
              step="5"
              value={geofenceRadius}
              onChange={(e) => setGeofenceRadius(Number(e.target.value))}
              className="w-full accent-red-600 cursor-pointer"
            />
            <button
              onClick={handleSaveRadius}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-50 hover:text-red-600 text-xs font-bold transition whitespace-nowrap"
            >
              Simpan Radius
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
