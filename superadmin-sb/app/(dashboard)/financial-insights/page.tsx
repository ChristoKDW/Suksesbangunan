"use client"

import { useState } from "react"
import { TrendingUp, DollarSign, Calendar, CreditCard, Building2, AlertCircle, ArrowUpRight, Users } from "lucide-react"

const DEPARTMENT_PAYROLL = [
  {
    name: "Divisi Sales & Area Toko",
    roleDesc: "Sales Advisor, Pramuniaga, Display Area Toko",
    totalKaryawan: 30,
    thpTotal: "Rp 49.500.000",
    kasbonTerpotong: "Rp 7.800.000",
    lembur: "Rp 5.800.000",
    pct: 33,
  },
  {
    name: "Divisi Gudang & Inventory Control",
    roleDesc: "Storekeeper, Warehousekeeper, Checker Stok",
    totalKaryawan: 22,
    thpTotal: "Rp 35.600.000",
    kasbonTerpotong: "Rp 6.400.000",
    lembur: "Rp 3.800.000",
    pct: 24,
  },
  {
    name: "Divisi Kasir & Customer Service",
    roleDesc: "Kasir Toko, CS, Front Office Toko",
    totalKaryawan: 16,
    thpTotal: "Rp 26.800.000",
    kasbonTerpotong: "Rp 4.200.000",
    lembur: "Rp 2.900.000",
    pct: 18,
  },
  {
    name: "Divisi Pengiriman & Ekspedisi",
    roleDesc: "Driver Delivery, Helper Antar Material",
    totalKaryawan: 16,
    thpTotal: "Rp 23.400.000",
    kasbonTerpotong: "Rp 4.100.000",
    lembur: "Rp 1.800.000",
    pct: 16,
  },
  {
    name: "Divisi Kantor, HRD & Finance",
    roleDesc: "Staf HRD, Finance, Head Administration",
    totalKaryawan: 12,
    thpTotal: "Rp 13.200.000",
    kasbonTerpotong: "Rp 1.800.000",
    lembur: "Rp 500.000",
    pct: 9,
  },
]

export default function FinancialInsightsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-red-600" />
          <span>Financial Insights & Payroll Intelligence</span>
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Analisis alokasi beban gaji riil, efisiensi lembur, dan perputaran kasbon antar divisi di <b>Toko LARAS</b>.
        </p>
      </div>

      {/* 3 Top Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-2 shadow-sm">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Total Beban Payroll Bersih (THP)</span>
          <p className="text-2xl font-black text-[var(--text-primary)]">Rp 148.500.000</p>
          <span className="text-[11px] text-gray-500">Total 96 karyawan aktif (Toko LARAS)</span>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-2 shadow-sm">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Piutang Kasbon Terpotong Otomatis</span>
          <p className="text-2xl font-black text-amber-600">Rp 24.300.000</p>
          <span className="text-[11px] text-gray-500">100% cicilan aktif lancar terpotong via payroll</span>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-2 shadow-sm">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Total Denda Masuk Kas Perusahaan</span>
          <p className="text-2xl font-black text-emerald-600">Rp 2.150.000</p>
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
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
            Total 96 Karyawan Aktif
          </span>
        </div>

        <div className="space-y-4">
          {DEPARTMENT_PAYROLL.map((dept) => (
            <div key={dept.name} className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] space-y-2.5 hover:border-red-300 transition">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-sm text-[var(--text-primary)]">{dept.name}</span>
                  <span className="text-[11px] text-gray-500 ml-2 font-medium">({dept.totalKaryawan} Karyawan · {dept.roleDesc})</span>
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
                <span>Cicilan Kasbon Kembali: <b className="text-[var(--text-primary)]">{dept.kasbonTerpotong}</b></span>
                <span>Biaya Lembur: <b className="text-[var(--text-primary)]">{dept.lembur}</b></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
