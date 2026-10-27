"use client"

import { useState, useEffect, useMemo } from "react"
import useSWR from "swr"
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Pagination,
} from "@/components/molecules"
import { LatticeLoader, TableRowSkeleton } from "@/components/atoms"
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Clock,
  Building2,
  Filter,
  CheckCircle2,
  ShieldCheck,
  Info,
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { Shift, Departemen } from "@/lib/types"
import { confirmDelete, showError, showWarning } from "@/lib/swal"

export default function ShiftsPage() {
  const { user } = useAuth()
  // ponytail: SWR caching - instan 0ms saat navigasi
  const { data: shifts = [], isLoading: loadingShifts, mutate: mutateShifts } = useSWR<Shift[]>("shift")
  const { data: departments = [], isLoading: loadingDepts, mutate: mutateDepts } = useSWR<Departemen[]>("departemen")
  const loading = loadingShifts && loadingDepts
  const refreshAll = () => { mutateShifts(); mutateDepts(); }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const isSPV = user?.role === "SPV"
  const isAdminOrHrd = user?.role === "Admin" || user?.role === "HRD"

  const [newShift, setNewShift] = useState({
    namaShift: "",
    jamMulai: "08:15",
    jamSelesai: "16:30",
    idDepartemen: "" as number | "",
  })

  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isDeptManagedByAdminOrHrd = (dept?: Departemen | null) => {
    if (!dept) return false
    const managers = Array.isArray(dept.pengelola)
      ? dept.pengelola
      : dept.pengelola
      ? [dept.pengelola]
      : []
    const hasAdminOrHrd = managers.some(
      (m: any) => m.role === "Admin" || m.role === "HRD"
    )
    const isBackoffice =
      dept.namaDepartemen?.toLowerCase().replace(/\s|_|-/g, "") ===
      "backoffice"
    return hasAdminOrHrd || isBackoffice
  }

  // Only operational departments (non-office) have shifts
  const operationalDepartments = useMemo(() => {
    return departments.filter((d) => !isDeptManagedByAdminOrHrd(d))
  }, [departments])

  // Lock SPV to their own department
  useEffect(() => {
    if (isSPV && user?.idDepartemen) {
      setSelectedDeptFilter(String(user.idDepartemen))
    }
  }, [isSPV, user?.idDepartemen])

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedDeptFilter, pageSize])

  const openAddModal = () => {
    const defaultDept =
      isSPV && user?.idDepartemen
        ? user.idDepartemen
        : selectedDeptFilter !== "all"
        ? Number(selectedDeptFilter)
        : operationalDepartments.length > 0
        ? operationalDepartments[0].idDepartemen
        : ""

    setNewShift({
      namaShift: "",
      jamMulai: "08:15",
      jamSelesai: "16:30",
      idDepartemen: defaultDept,
    })
    setIsModalOpen(true)
  }

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newShift.idDepartemen) {
      showWarning("Departemen wajib dipilih untuk setiap shift.")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        namaShift: newShift.namaShift.trim(),
        jamMulai: newShift.jamMulai.substring(0, 5),
        jamSelesai: newShift.jamSelesai.substring(0, 5),
        idDepartemen: Number(newShift.idDepartemen),
      }
      await api.post("shift", payload)
      setIsModalOpen(false)
      refreshAll()
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gagal menambahkan shift")
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (shift: Shift) => {
    setEditingShift({ ...shift })
    setIsEditModalOpen(true)
  }

  const handleUpdateShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingShift || !editingShift.idDepartemen) {
      showWarning("Departemen wajib dipilih untuk setiap shift.")
      return
    }

    setSubmitting(true)
    try {
      await api.patch(`shift/${editingShift.idShift}`, {
        namaShift: editingShift.namaShift.trim(),
        jamMulai: editingShift.jamMulai.substring(0, 5),
        jamSelesai: editingShift.jamSelesai.substring(0, 5),
        idDepartemen: Number(editingShift.idDepartemen),
      })
      setIsEditModalOpen(false)
      setEditingShift(null)
      refreshAll()
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gagal mengupdate shift")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteShift = async (id: number) => {
    if (!await confirmDelete("Apakah Anda yakin ingin menghapus shift ini?")) return
    try {
      await api.delete(`shift/${id}`)
      refreshAll()
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gagal menghapus shift")
    }
  }

  const formatTime = (t?: string | null) => (t ? t.substring(0, 5) : "?")

  // Filtered shifts based on search and selected department
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      // Exclude shifts of Admin/HRD backoffice
      if (s.departemen && isDeptManagedByAdminOrHrd(s.departemen)) {
        return false
      }

      // Department filter
      if (selectedDeptFilter !== "all") {
        if (s.idDepartemen !== Number(selectedDeptFilter)) return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = s.namaShift.toLowerCase().includes(q)
        const matchDept = s.departemen?.namaDepartemen
          ?.toLowerCase()
          .includes(q)
        return matchName || matchDept
      }

      return true
    })
  }, [shifts, selectedDeptFilter, searchQuery])

  // Count shifts per department
  const shiftCountPerDept = useMemo(() => {
    const counts: Record<number, number> = {}
    shifts.forEach((s) => {
      if (s.idDepartemen) {
        counts[s.idDepartemen] = (counts[s.idDepartemen] || 0) + 1
      }
    })
    return counts
  }, [shifts])

  // Paginated shifts
  const totalFiltered = filteredShifts.length
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalFiltered)
  const paginatedShifts = filteredShifts.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Daftar Shift Kerja Departemen
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            {isSPV
              ? `Daftar jam kerja shift khusus untuk departemen ${
                  departments.find((d) => d.idDepartemen === user?.idDepartemen)
                    ?.namaDepartemen || "Anda"
                }.`
              : "Kelola daftar jam kerja shift yang disesuaikan secara spesifik untuk masing-masing departemen operasional."}
          </p>
        </div>

        {isAdminOrHrd && (
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Tambah Shift
          </button>
        )}
      </div>

      {/* Operational Notice */}
      <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-300">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong>Aturan Shift Berbasis Departemen:</strong> Setiap shift wajib
          terikat ke departemen masing-masing. Karyawan hanya dapat dijadwalkan
          pada shift milik departemennya sendiri. Departemen tetap kantor
          (OFFICE / Backoffice) menggunakan jam kerja tetap dan tidak
          menggunakan shift.
        </div>
      </div>

      {/* Department Filter Bar (Tabs) */}
      {!isSPV && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              Pilih Departemen:
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              Total {operationalDepartments.length} Departemen Operasional
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedDeptFilter("all")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDeptFilter === "all"
                  ? "bg-[var(--color-primary)] text-white shadow-sm shadow-emerald-500/20"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)]"
              }`}
            >
              Semua Departemen
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedDeptFilter === "all"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-[var(--text-secondary)]"
                }`}
              >
                {shifts.length}
              </span>
            </button>

            {operationalDepartments.map((dept) => {
              const count = shiftCountPerDept[dept.idDepartemen] || 0
              const isActive = selectedDeptFilter === String(dept.idDepartemen)
              return (
                <button
                  key={dept.idDepartemen}
                  onClick={() => setSelectedDeptFilter(String(dept.idDepartemen))}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[var(--color-primary)] text-white shadow-sm shadow-emerald-500/20"
                      : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)]"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  {dept.namaDepartemen}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-[var(--text-secondary)]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-[var(--border-default)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 w-full sm:max-w-xs bg-[var(--bg-page)] border border-[var(--border-default)]">
              <Search className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
              <input
                type="search"
                placeholder="Cari nama shift..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          <span className="text-xs text-[var(--text-muted)]">
            Menampilkan {filteredShifts.length} shift
          </span>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Shift</TableHead>
                <TableHead>Departemen Terkait</TableHead>
                <TableHead>Jam Kerja</TableHead>
                {isAdminOrHrd && (
                  <TableHead className="w-24 text-right">Aksi</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRowSkeleton columns={isAdminOrHrd ? 4 : 3} rows={5} />
              ) : paginatedShifts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdminOrHrd ? 4 : 3}
                    className="text-center py-10 text-[var(--text-muted)] text-sm"
                  >
                    Tidak ada shift yang ditemukan untuk departemen ini.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedShifts.map((shift) => (
                  <TableRow key={shift.idShift}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[var(--text-primary)]">
                            {shift.namaShift}
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">
                            ID Shift #{shift.idShift}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {shift.departemen ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <Building2 className="w-3.5 h-3.5" />
                          {shift.departemen.namaDepartemen}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          Belum Ditentukan
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-lg bg-[var(--bg-page)] border border-[var(--border-default)] text-[var(--text-primary)]">
                        {formatTime(shift.jamMulai)} ?{" "}
                        {formatTime(shift.jamSelesai)}
                      </span>
                    </TableCell>

                    {isAdminOrHrd && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(shift)}
                            title="Edit Shift"
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-[var(--color-primary)]"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteShift(shift.idShift)}
                            title="Hapus Shift"
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalFiltered}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* MODAL TAMBAH SHIFT BARU                                        */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 [&>*]:my-auto bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-md rounded-2xl shadow-2xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-default)]">
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  Tambah Shift Baru
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Tetapkan shift untuk departemen operasional terkait.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddShift} className="p-5 space-y-4">
              {/* Department selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Departemen <span className="text-red-500">*</span>
                </label>
                {isSPV ? (
                  <div className="flex items-center gap-2 p-3 bg-[var(--bg-page)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-primary)]">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium">
                      {departments.find((d) => d.idDepartemen === user?.idDepartemen)
                        ?.namaDepartemen || "Departemen Anda"}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] ml-auto">
                      (Terkunci untuk SPV)
                    </span>
                  </div>
                ) : (
                  <select
                    required
                    value={newShift.idDepartemen}
                    onChange={(e) =>
                      setNewShift({
                        ...newShift,
                        idDepartemen: e.target.value ? Number(e.target.value) : "",
                      })
                    }
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] font-medium"
                  >
                    <option value="" disabled>
                      -- Pilih Departemen (Wajib) --
                    </option>
                    {operationalDepartments.map((d) => (
                      <option key={d.idDepartemen} value={d.idDepartemen}>
                        {d.namaDepartemen}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Shift Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Nama Shift <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={newShift.namaShift}
                  onChange={(e) =>
                    setNewShift({ ...newShift, namaShift: e.target.value })
                  }
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  placeholder="Contoh: Pagi, Middle, atau Siang"
                />
              </div>

              {/* Working Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Jam Mulai <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="time"
                    value={newShift.jamMulai}
                    onChange={(e) =>
                      setNewShift({ ...newShift, jamMulai: e.target.value })
                    }
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Jam Selesai <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="time"
                    value={newShift.jamSelesai}
                    onChange={(e) =>
                      setNewShift({ ...newShift, jamSelesai: e.target.value })
                    }
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-page)] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-60"
                >
                  {submitting ? (
                    <LatticeLoader
                      status="working"
                      label="Menyimpan..."
                      showTimer={false}
                      cellSize={4}
                      gap={2}
                      fontSize={13}
                      color="#ffffff"
                    />
                  ) : (
                    "Simpan Shift"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL EDIT SHIFT                                               */}
      {/* ============================================================== */}
      {isEditModalOpen && editingShift && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 [&>*]:my-auto bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-md rounded-2xl shadow-2xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-default)]">
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  Edit Shift #{editingShift.idShift}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Perbarui detail nama atau jam kerja shift departemen.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateShift} className="p-5 space-y-4">
              {/* Department selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Departemen <span className="text-red-500">*</span>
                </label>
                {isSPV ? (
                  <div className="flex items-center gap-2 p-3 bg-[var(--bg-page)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-primary)]">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium">
                      {departments.find((d) => d.idDepartemen === user?.idDepartemen)
                        ?.namaDepartemen || "Departemen Anda"}
                    </span>
                  </div>
                ) : (
                  <select
                    required
                    value={editingShift.idDepartemen || ""}
                    onChange={(e) =>
                      setEditingShift({
                        ...editingShift,
                        idDepartemen: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] font-medium"
                  >
                    {operationalDepartments.map((d) => (
                      <option key={d.idDepartemen} value={d.idDepartemen}>
                        {d.namaDepartemen}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Shift Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Nama Shift <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={editingShift.namaShift}
                  onChange={(e) =>
                    setEditingShift({
                      ...editingShift,
                      namaShift: e.target.value,
                    })
                  }
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              {/* Working Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Jam Mulai <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="time"
                    value={editingShift.jamMulai.substring(0, 5)}
                    onChange={(e) =>
                      setEditingShift({
                        ...editingShift,
                        jamMulai: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Jam Selesai <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="time"
                    value={editingShift.jamSelesai.substring(0, 5)}
                    onChange={(e) =>
                      setEditingShift({
                        ...editingShift,
                        jamSelesai: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-page)] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-60"
                >
                  {submitting ? (
                    <LatticeLoader
                      status="working"
                      label="Menyimpan..."
                      showTimer={false}
                      cellSize={4}
                      gap={2}
                      fontSize={13}
                      color="#ffffff"
                    />
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
