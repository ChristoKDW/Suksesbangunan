"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Search, Plus, Edit2, Trash2, X, Clock, Coffee, Building2, Loader2, ShieldCheck, Filter } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { Shift, Departemen } from "@/lib/types"

export default function ShiftsPage() {
  const { user } = useAuth()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [departments, setDepartments] = useState<Departemen[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const [newShift, setNewShift] = useState({
    namaShift: "",
    jamMulai: "",
    jamSelesai: "",
    jamMulaiIstirahat: "",
    jamSelesaiIstirahat: "",
    idDepartemen: null as number | null,
  })

  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isSPV = user?.role === "SPV"
  const isAdminOrHrd = user?.role === "Admin" || user?.role === "HRD"

  const fetchData = async () => {
    try {
      const [shiftData, deptData] = await Promise.all([
        api.get<Shift[]>("shift"),
        api.get<Departemen[]>("departemen").catch(() => []),
      ])
      setShifts(shiftData)
      setDepartments(deptData)
    } catch (err) {
      console.error("Failed to fetch shift:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openAddModal = () => {
    setNewShift({
      namaShift: "",
      jamMulai: "",
      jamSelesai: "",
      jamMulaiIstirahat: "",
      jamSelesaiIstirahat: "",
      idDepartemen: isSPV ? (user?.idDepartemen ?? null) : null,
    })
    setIsModalOpen(true)
  }

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        namaShift: newShift.namaShift,
        jamMulai: newShift.jamMulai,
        jamSelesai: newShift.jamSelesai,
        idDepartemen: isSPV ? user?.idDepartemen : newShift.idDepartemen,
        ...(newShift.jamMulaiIstirahat ? { jamMulaiIstirahat: newShift.jamMulaiIstirahat } : {}),
        ...(newShift.jamSelesaiIstirahat ? { jamSelesaiIstirahat: newShift.jamSelesaiIstirahat } : {}),
      }
      await api.post("shift", payload)
      setIsModalOpen(false)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menambahkan shift")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteShift = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus shift ini?")) return
    try {
      await api.delete(`shift/${id}`)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus shift")
    }
  }

  const openEditModal = (shift: Shift) => {
    setEditingShift({ ...shift })
    setIsEditModalOpen(true)
  }

  const handleUpdateShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingShift) return
    setSubmitting(true)
    try {
      await api.patch(`shift/${editingShift.idShift}`, {
        namaShift: editingShift.namaShift,
        jamMulai: editingShift.jamMulai.substring(0, 5),
        jamSelesai: editingShift.jamSelesai.substring(0, 5),
        idDepartemen: isSPV ? user?.idDepartemen : (editingShift.idDepartemen || null),
        jamMulaiIstirahat: editingShift.jamMulaiIstirahat ? editingShift.jamMulaiIstirahat.substring(0, 5) : null,
        jamSelesaiIstirahat: editingShift.jamSelesaiIstirahat ? editingShift.jamSelesaiIstirahat.substring(0, 5) : null,
      })
      setIsEditModalOpen(false)
      setEditingShift(null)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengupdate shift")
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (t?: string | null) => t ? t.substring(0, 5) : "—"

  // Check if current user can edit a given shift
  const canManageShift = (shift: Shift) => {
    if (isAdminOrHrd) return true
    if (isSPV && user?.idDepartemen && shift.idDepartemen === user.idDepartemen) {
      const deptName = shift.departemen?.namaDepartemen?.toLowerCase().replace(/[\s\-_]/g, "")
      return deptName !== "backoffice"
    }
    return false
  }

  // Filtered shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      // Dept filter
      if (selectedDeptFilter === "general" && s.idDepartemen !== null && s.idDepartemen !== undefined) {
        return false
      }
      if (selectedDeptFilter !== "all" && selectedDeptFilter !== "general") {
        if (s.idDepartemen !== Number(selectedDeptFilter)) return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchName = s.namaShift.toLowerCase().includes(query)
        const matchDept = (s.departemen?.namaDepartemen || "Umum").toLowerCase().includes(query)
        if (!matchName && !matchDept) return false
      }

      return true
    })
  }, [shifts, selectedDeptFilter, searchQuery])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--text-muted)" }} /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Daftar Shift</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {isSPV
              ? `Shift Departemen ${departments.find(d => d.idDepartemen === user?.idDepartemen)?.namaDepartemen || ""} & Shift Umum`
              : "Daftar shift kerja terstruktur per departemen (Backoffice dikelola oleh HRD & Admin)"}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
        >
          <Plus className="w-4 h-4" />
          Tambah Shift
        </button>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-md rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Tambah Shift Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddShift} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Nama Shift</label>
                <input
                  required
                  type="text"
                  value={newShift.namaShift}
                  onChange={e => setNewShift({...newShift, namaShift: e.target.value})}
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  placeholder="Contoh: Pagi Logistik"
                />
              </div>

              {/* Department selection */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Departemen</label>
                {isSPV ? (
                  <div className="flex items-center gap-2 p-2.5 bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md text-sm text-[var(--text-primary)]">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">
                      {departments.find(d => d.idDepartemen === user?.idDepartemen)?.namaDepartemen || "Departemen Anda"}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] ml-auto">(Terkunci untuk SPV)</span>
                  </div>
                ) : (
                  <select
                    value={newShift.idDepartemen ?? ""}
                    onChange={e => setNewShift({ ...newShift, idDepartemen: e.target.value ? Number(e.target.value) : null })}
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="">Umum (Semua Departemen)</option>
                    {departments.map((d) => (
                      <option key={d.idDepartemen} value={d.idDepartemen}>
                        {d.namaDepartemen}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Jam Mulai Kerja</label>
                  <input required type="time" value={newShift.jamMulai} onChange={e => setNewShift({...newShift, jamMulai: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Jam Selesai Kerja</label>
                  <input required type="time" value={newShift.jamSelesai} onChange={e => setNewShift({...newShift, jamSelesai: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                </div>
              </div>
              <div className="border-t border-[var(--border-default)] pt-3">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-[var(--text-primary)]">
                  <Coffee className="w-3.5 h-3.5 text-amber-500" />
                  <span>Jadwal Istirahat (Opsional)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-[var(--text-muted)]">Mulai Istirahat</label>
                    <input type="time" value={newShift.jamMulaiIstirahat} onChange={e => setNewShift({...newShift, jamMulaiIstirahat: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[var(--text-muted)]">Selesai Istirahat</label>
                    <input type="time" value={newShift.jamSelesaiIstirahat} onChange={e => setNewShift({...newShift, jamSelesaiIstirahat: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)]">Batal</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60">{submitting ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-md rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Edit Shift</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateShift} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Nama Shift</label>
                <input required type="text" value={editingShift.namaShift} onChange={e => setEditingShift({...editingShift, namaShift: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
              </div>

              {/* Department selection */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Departemen</label>
                {isSPV ? (
                  <div className="flex items-center gap-2 p-2.5 bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md text-sm text-[var(--text-primary)]">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">
                      {departments.find(d => d.idDepartemen === user?.idDepartemen)?.namaDepartemen || "Departemen Anda"}
                    </span>
                  </div>
                ) : (
                  <select
                    value={editingShift.idDepartemen ?? ""}
                    onChange={e => setEditingShift({ ...editingShift, idDepartemen: e.target.value ? Number(e.target.value) : null })}
                    className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="">Umum (Semua Departemen)</option>
                    {departments.map((d) => (
                      <option key={d.idDepartemen} value={d.idDepartemen}>
                        {d.namaDepartemen}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Jam Mulai Kerja</label>
                  <input required type="time" value={editingShift.jamMulai.substring(0, 5)} onChange={e => setEditingShift({...editingShift, jamMulai: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Jam Selesai Kerja</label>
                  <input required type="time" value={editingShift.jamSelesai.substring(0, 5)} onChange={e => setEditingShift({...editingShift, jamSelesai: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                </div>
              </div>
              <div className="border-t border-[var(--border-default)] pt-3">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-[var(--text-primary)]">
                  <Coffee className="w-3.5 h-3.5 text-amber-500" />
                  <span>Jadwal Istirahat (Opsional)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-[var(--text-muted)]">Mulai Istirahat</label>
                    <input type="time" value={editingShift.jamMulaiIstirahat ? editingShift.jamMulaiIstirahat.substring(0, 5) : ""} onChange={e => setEditingShift({...editingShift, jamMulaiIstirahat: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[var(--text-muted)]">Selesai Istirahat</label>
                    <input type="time" value={editingShift.jamSelesaiIstirahat ? editingShift.jamSelesaiIstirahat.substring(0, 5) : ""} onChange={e => setEditingShift({...editingShift, jamSelesaiIstirahat: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)]">Batal</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60">{submitting ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-[var(--border-default)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-full sm:max-w-xs bg-[var(--bg-page)] border border-[var(--border-default)]">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
              <input
                type="search"
                placeholder="Cari shift..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* Dept filter for Admin & HRD */}
            {isAdminOrHrd && (
              <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 bg-[var(--bg-page)] border border-[var(--border-default)]">
                <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <select
                  value={selectedDeptFilter}
                  onChange={e => setSelectedDeptFilter(e.target.value)}
                  className="bg-transparent text-xs text-[var(--text-primary)] outline-none"
                >
                  <option value="all">Semua Departemen ({shifts.length})</option>
                  <option value="general">Umum (Lintas Dept)</option>
                  {departments.map(d => (
                    <option key={d.idDepartemen} value={String(d.idDepartemen)}>
                      {d.namaDepartemen}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            Menampilkan {filteredShifts.length} dari {shifts.length} shift
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead>Jam Kerja</TableHead>
                <TableHead>Jam Istirahat</TableHead>
                <TableHead className="w-20 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[var(--text-muted)]">
                    Tidak ada shift yang cocok
                  </TableCell>
                </TableRow>
              ) : (
                filteredShifts.map((shift) => {
                  const editable = canManageShift(shift)
                  const isBackoffice = shift.departemen?.namaDepartemen?.toLowerCase().replace(/[\s\-_]/g, "") === "backoffice"

                  return (
                    <TableRow key={shift.idShift}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--bg-page)] border border-[var(--border-default)] text-[var(--text-muted)]">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-[var(--text-primary)]">{shift.namaShift}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {shift.departemen ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              isBackoffice
                                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                            }`}
                          >
                            <Building2 className="w-3 h-3" />
                            {shift.departemen.namaDepartemen}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                            Semua Departemen
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-[var(--text-secondary)]">
                        {formatTime(shift.jamMulai)} - {formatTime(shift.jamSelesai)}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-[var(--text-secondary)]">
                        {shift.jamMulaiIstirahat && shift.jamSelesaiIstirahat ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                            <Coffee className="w-3.5 h-3.5 inline" />
                            {formatTime(shift.jamMulaiIstirahat)} - {formatTime(shift.jamSelesaiIstirahat)}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editable ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(shift)}
                              title="Edit Shift"
                              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-[var(--color-primary)]"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteShift(shift.idShift)}
                              title="Hapus Shift"
                              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--text-muted)] italic">Hanya Lihat</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
