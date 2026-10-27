"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  DollarSign,
  Calendar,
  CreditCard,
  Building2,
  AlertCircle,
  ArrowUpRight,
  Users,
  RefreshCw,
} from "lucide-react"
import { api } from "@/lib/api"

interface DeptPayrollItem {
  name: string
  roleDesc: string
  totalKaryawan: number
  thpTotal: string
  kasbonTerpotong: string
  lembur: string
  pct: number
}

export default function FinancialInsightsPage() {
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<DeptPayrollItem[]>([])
  const [stats, setStats] = useState({
    totalKaryawan: 0,
    totalThp: "Rp 0",
    totalKasbonTerpotong: "Rp 0",
    totalDenda: "Rp 0",
    periodeCutoff: "-",
  })

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const data = await api.get<any>("/super-admin/financial-insights")
      if (data) {
        if (Array.isArray(data.departments)) {
          setDepartments(data.departments)
        } else {
          setDepartments([])
        }
        setStats({
          totalKaryawan: data.totalKaryawanAktif || 0,
          totalThp: data.totalThpFormatted || "Rp 0",
          totalKasbonTerpotong: data.totalKasbonTerpotongFormatted || "Rp 0",
          totalDenda: data.totalDendaFormatted || "Rp 0",
          periodeCutoff: data.periodeAwal && data.periodeAkhir 
            ? `${data.periodeAwal} s/d ${data.periodeAkhir}` 
            : "Belum Ada Periode",
        })
      }
    } catch (err) {
      console.warn("Failed fetching financial insights:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-red-600" />
            <span>Financial Insights & Payroll Intelligence</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Analisis alokasi beban gaji riil, efisiensi lembur, dan perputaran kasbon antar divisi di <b>Toko LARAS</b>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="p-2 rounded-xl border border-[var(--border-default)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-red-600" : ""}`} />
          </button>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-[var(--border-default)] text-[var(--text-secondary)]">
            Cut-off: {stats.periodeCutoff}
          </span>
        </div>
      </div>

      {/* 3 Top Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-2 shadow-sm">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">
            Total Beban Payroll Bersih (THP)
          </span>
          <p className="text-2xl font-black text-[var(--text-primary)]">{stats.totalThp}</p>
          <span className="text-[11px] text-gray-500">
            Total {stats.totalKaryawan} karyawan aktif (Toko LARAS)
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-2 shadow-sm">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">
            Piutang Kasbon Terpotong Otomatis
          </span>
          <p className="text-2xl font-black text-amber-600">{stats.totalKasbonTerpotong}</p>
          <span className="text-[11px] text-gray-500">100% cicilan aktif lancar terpotong via payroll</span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-2 shadow-sm">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">
            Total Denda Masuk Kas Perusahaan
          </span>
          <p className="text-2xl font-black text-emerald-600">{stats.totalDenda}</p>
          <span className="text-[11px] text-gray-500">Akumulasi denda telat & istirahat &gt; 60 menit</span>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-600" />
              <span>Distribusi Beban Penggajian per Departemen (Toko LARAS)</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Alokasi total THP, lembur, dan potongan kasbon pada setiap unit kerja internal.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50">
            Total {stats.totalKaryawan} Karyawan Aktif
          </span>
        </div>

        <div className="space-y-4">
          {departments.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[var(--border-default)] rounded-xl text-gray-400">
              <Building2 className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="font-bold text-xs text-[var(--text-secondary)]">Belum ada rincian data penggajian departemen</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Data alokasi beban akan terakumulasi otomatis saat proses payroll disetujui.</p>
            </div>
          ) : (
            departments.map((dept) => (
            <div
              key={dept.name}
              className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] space-y-2.5 hover:border-red-300 transition"
            >
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-sm text-[var(--text-primary)]">{dept.name}</span>
                  <span className="text-[11px] text-gray-500 ml-2 font-medium">
                    ({dept.totalKaryawan} Karyawan · {dept.roleDesc})
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-red-600">{dept.thpTotal}</span>
                  <span className="text-[11px] text-gray-400 ml-1">({dept.pct}%)</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${dept.pct}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-[var(--text-secondary)] pt-1 gap-2">
                <span>
                  Cicilan Kasbon Kembali: <b className="text-[var(--text-primary)]">{dept.kasbonTerpotong}</b>
                </span>
                <span>
                  Biaya Lembur: <b className="text-[var(--text-primary)]">{dept.lembur}</b>
                </span>
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  )
}
