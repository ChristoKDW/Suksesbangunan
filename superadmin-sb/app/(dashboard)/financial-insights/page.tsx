"use client"

import { useState, useEffect, useMemo } from "react"
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
  Search,
  X,
  ChevronRight,
  Clock,
  UserCheck,
  ShieldAlert,
} from "lucide-react"
import { api } from "@/lib/api"

interface DeptPayrollItem {
  idDepartemen?: number
  name: string
  roleDesc: string
  totalKaryawan: number
  thpTotal: string
  kasbonTerpotong: string
  lembur: string
  pct: number
}

interface EmployeePayrollDetail {
  idKaryawan: number
  nik: string
  nama: string
  fotoProfil: string | null
  jabatan: string
  statusKerja: string
  statusAktif: boolean
  hariKerja: number
  hariHadir: number
  gajiPokok: number
  gajiPokokFormatted: string
  konsumsi: number
  konsumsiFormatted: string
  lembur: number
  lemburFormatted: string
  kasbon: number
  kasbonFormatted: string
  denda: number
  dendaFormatted: string
  bpjs: number
  bpjsFormatted: string
  thp: number
  thpFormatted: string
  periodeAwal: string | null
  periodeAkhir: string | null
}

interface DeptDetailResponse {
  department: {
    id: number
    namaDepartemen: string
    roleDesc: string
    totalKaryawan: number
    totalThp: number
    totalThpFormatted: string
    totalLembur: number
    totalLemburFormatted: string
    totalKasbon: number
    totalKasbonFormatted: string
    totalDenda: number
    totalDendaFormatted: string
    periodeCutoff: string
  }
  employees: EmployeePayrollDetail[]
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

  // Modal Detail State
  const [selectedDept, setSelectedDept] = useState<DeptPayrollItem | null>(null)
  const [deptDetailData, setDeptDetailData] = useState<DeptDetailResponse | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [employeeSearch, setEmployeeSearch] = useState("")

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

  const handleOpenDeptDetail = async (dept: DeptPayrollItem) => {
    setSelectedDept(dept)
    setDeptDetailData(null)
    setEmployeeSearch("")
    setModalLoading(true)

    try {
      const identifier = dept.idDepartemen ? dept.idDepartemen : encodeURIComponent(dept.name)
      const res = await api.get<DeptDetailResponse>(
        `/super-admin/financial-insights/departments/${identifier}/employees`
      )
      setDeptDetailData(res)
    } catch (err) {
      console.error("Gagal mengambil detail karyawan departemen:", err)
    } finally {
      setModalLoading(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedDept(null)
    setDeptDetailData(null)
    setEmployeeSearch("")
  }

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    if (!deptDetailData?.employees) return []
    if (!employeeSearch.trim()) return deptDetailData.employees

    const q = employeeSearch.toLowerCase().trim()
    return deptDetailData.employees.filter((emp) =>
      emp.nama.toLowerCase().includes(q) ||
      emp.nik.toLowerCase().includes(q) ||
      emp.jabatan.toLowerCase().includes(q) ||
      emp.statusKerja.toLowerCase().includes(q)
    )
  }, [deptDetailData, employeeSearch])

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
              Alokasi total THP, lembur, dan potongan kasbon pada setiap unit kerja internal. Klik departemen untuk melihat rincian karyawan.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50">
            Total {stats.totalKaryawan} Karyawan Aktif
          </span>
        </div>

        <div className="space-y-3">
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
                onClick={() => handleOpenDeptDetail(dept)}
                className="group relative p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] space-y-2.5 cursor-pointer hover:border-red-500/80 hover:bg-red-50/20 dark:hover:bg-red-950/10 hover:shadow-md transition-all duration-200 active:scale-[0.995]"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text-primary)] group-hover:text-red-600 transition-colors">
                      {dept.name}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      ({dept.totalKaryawan} Karyawan · {dept.roleDesc})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-bold text-sm text-red-600">{dept.thpTotal}</span>
                      <span className="text-[11px] text-gray-400 ml-1">({dept.pct}%)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
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
                  <div className="flex items-center gap-4">
                    <span>
                      Cicilan Kasbon Kembali: <b className="text-[var(--text-primary)]">{dept.kasbonTerpotong}</b>
                    </span>
                    <span>
                      Biaya Lembur: <b className="text-[var(--text-primary)]">{dept.lembur}</b>
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Klik untuk rincian data karyawan &rarr;
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL DETAIL KARYAWAN DEPARTEMEN */}
      {selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--border-default)] flex items-start justify-between gap-4 bg-[var(--bg-page)]/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600">
                    <Building2 className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-[var(--text-primary)]">
                      {deptDetailData?.department?.namaDepartemen || selectedDept.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {deptDetailData?.department?.roleDesc || selectedDept.roleDesc} · Cut-off:{" "}
                      <b>{deptDetailData?.department?.periodeCutoff || stats.periodeCutoff}</b>
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-[var(--bg-hover)] transition-colors"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Summary Badges */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
              <div className="p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-default)]">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">
                  Total Karyawan
                </span>
                <span className="text-base font-black text-[var(--text-primary)]">
                  {deptDetailData?.department?.totalKaryawan ?? selectedDept.totalKaryawan} Orang
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-default)]">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">
                  Total THP Bersih
                </span>
                <span className="text-base font-black text-red-600">
                  {deptDetailData?.department?.totalThpFormatted ?? selectedDept.thpTotal}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-default)]">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">
                  Total Lembur
                </span>
                <span className="text-base font-black text-amber-600">
                  {deptDetailData?.department?.totalLemburFormatted ?? selectedDept.lembur}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-default)]">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">
                  Kasbon Terpotong
                </span>
                <span className="text-base font-black text-emerald-600">
                  {deptDetailData?.department?.totalKasbonFormatted ?? selectedDept.kasbonTerpotong}
                </span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between gap-3 bg-[var(--bg-page)]/30">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama karyawan, NIK, jabatan, atau status kerja..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-gray-400 focus:outline-none focus:border-red-500"
                />
              </div>
              <span className="text-xs text-[var(--text-secondary)] font-medium whitespace-nowrap">
                Menampilkan <b>{filteredEmployees.length}</b> dari {deptDetailData?.employees?.length || 0} karyawan
              </span>
            </div>

            {/* Modal Body / Table */}
            <div className="flex-1 overflow-y-auto p-4">
              {modalLoading ? (
                <div className="p-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-red-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-[var(--text-secondary)]">
                    Memuat rincian karyawan & riwayat payroll...
                  </p>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-12 text-center space-y-2 border border-dashed border-[var(--border-default)] rounded-xl">
                  <Users className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    Tidak ada karyawan yang sesuai pencarian
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Coba sesuaikan kata kunci pencarian atau bersihkan filter.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[var(--border-default)]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-secondary)] uppercase text-[10px] tracking-wider">
                        <th className="p-3">Karyawan</th>
                        <th className="p-3">Jabatan & Status</th>
                        <th className="p-3 text-center">Kehadiran</th>
                        <th className="p-3 text-right">Gaji Pokok</th>
                        <th className="p-3 text-right">Tunjangan & Lembur</th>
                        <th className="p-3 text-right">Potongan (Kasbon/Denda/BPJS)</th>
                        <th className="p-3 text-right font-bold text-red-600">THP Bersih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-default)] text-[var(--text-primary)]">
                      {filteredEmployees.map((emp) => (
                        <tr
                          key={emp.idKaryawan}
                          className="hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-[var(--text-secondary)] shrink-0 overflow-hidden">
                                {emp.fotoProfil ? (
                                  <img
                                    src={emp.fotoProfil}
                                    alt={emp.nama}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  emp.nama.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-xs text-[var(--text-primary)] leading-snug">
                                  {emp.nama}
                                </p>
                                <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                                  {emp.nik}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <p className="font-medium text-xs text-[var(--text-primary)]">{emp.jabatan}</p>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] border border-[var(--border-default)]">
                              {emp.statusKerja || "Karyawan"}
                            </span>
                          </td>

                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 font-bold text-xs px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                              <Clock className="w-3 h-3" />
                              {emp.hariHadir} / {emp.hariKerja} Hari
                            </span>
                          </td>

                          <td className="p-3 text-right font-medium">
                            {emp.gajiPokokFormatted}
                          </td>

                          <td className="p-3 text-right">
                            <div className="space-y-0.5">
                              <p className="font-medium">{emp.lemburFormatted}</p>
                              <span className="text-[10px] text-gray-400 block">
                                Makan: {emp.konsumsiFormatted}
                              </span>
                            </div>
                          </td>

                          <td className="p-3 text-right">
                            <div className="space-y-0.5">
                              <p className="font-medium text-amber-600">
                                Kasbon: {emp.kasbonFormatted}
                              </p>
                              <span className="text-[10px] text-gray-400 block">
                                Denda: {emp.dendaFormatted} · BPJS: {emp.bpjsFormatted}
                              </span>
                            </div>
                          </td>

                          <td className="p-3 text-right">
                            <span className="font-black text-xs text-red-600">
                              {emp.thpFormatted}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-page)]/50 flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)]">
                Data diperoleh langsung dari riwayat slip payroll & sistem absensi database PostgreSQL LARAS.
              </span>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-[var(--text-primary)] transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

