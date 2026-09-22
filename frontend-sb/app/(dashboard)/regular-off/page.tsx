"use client"

import RegularOffTab from "../leave-requests/regular-off-tab"

export default function RegularOffPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengajuan Regular Off (RO)</h1>
        <p className="text-sm text-slate-500 mt-1">
          Daftar persetujuan hak libur Regular Off (RO) untuk karyawan operasional yang bekerja pada hari libur nasional.
        </p>
      </div>

      <RegularOffTab />
    </div>
  )
}
