"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Search, Plus, X, Building2, Edit2, Trash2, Loader2, UserCheck, Users } from "lucide-react"
import { api, userApi, User } from "@/lib/api"
import type { Departemen } from "@/lib/types"

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Departemen[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [newDept, setNewDept] = useState<{ namaDepartemen: string; idPengelola: number[] }>({
    namaDepartemen: "",
    idPengelola: [],
  })
  const [editingDept, setEditingDept] = useState<{
    idDepartemen: number;
    namaDepartemen: string;
    idPengelola: number[];
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const getManagers = (dept: Departemen) => {
    if (!dept.pengelola) return []
    if (Array.isArray(dept.pengelola)) return dept.pengelola
    return [dept.pengelola]
  }

  const fetchDepartments = async () => {
    try {
      const [data, userList] = await Promise.all([
        api.get<Departemen[]>("departemen"),
        userApi.getAll().catch(() => []),
      ])
      setDepartments(data)
      setUsers(userList)
    } catch (err) {
      console.error("Failed to fetch departemen:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDepartments() }, [])

  const isUserDisabled = (targetUser: User, selectedIds: number[]) => {
    if (selectedIds.includes(targetUser.idUser)) return false
    if (selectedIds.length === 0) return false

    const selectedUsers = users.filter(u => selectedIds.includes(u.idUser))
    const hasSpv = selectedUsers.some(u => u.role === "SPV")
    const hasAdminOrHrd = selectedUsers.some(u => u.role === "Admin" || u.role === "HRD")

    if (targetUser.role === "SPV" && hasAdminOrHrd) return true
    if ((targetUser.role === "Admin" || targetUser.role === "HRD") && hasSpv) return true

    return false
  }

  const toggleNewDeptUser = (userId: number) => {
    const targetUser = users.find(u => u.idUser === userId)
    if (targetUser && isUserDisabled(targetUser, newDept.idPengelola)) {
      alert("Pengelola dengan role SPV tidak dapat digabung dengan Admin atau HRD.")
      return
    }
    setNewDept(prev => {
      const exists = prev.idPengelola.includes(userId)
      return {
        ...prev,
        idPengelola: exists
          ? prev.idPengelola.filter(id => id !== userId)
          : [...prev.idPengelola, userId],
      }
    })
  }

  const toggleEditDeptUser = (userId: number) => {
    if (!editingDept) return
    const targetUser = users.find(u => u.idUser === userId)
    if (targetUser && isUserDisabled(targetUser, editingDept.idPengelola)) {
      alert("Pengelola dengan role SPV tidak dapat digabung dengan Admin atau HRD.")
      return
    }
    const exists = editingDept.idPengelola.includes(userId)
    setEditingDept({
      ...editingDept,
      idPengelola: exists
        ? editingDept.idPengelola.filter(id => id !== userId)
        : [...editingDept.idPengelola, userId],
    })
  }

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newDept.idPengelola.length === 0) {
      alert("Harap pilih minimal 1 orang pengelola untuk departemen ini")
      return
    }
    const selectedUsers = users.filter(u => newDept.idPengelola.includes(u.idUser))
    const hasSpv = selectedUsers.some(u => u.role === "SPV")
    const hasAdminOrHrd = selectedUsers.some(u => u.role === "Admin" || u.role === "HRD")
    if (hasSpv && hasAdminOrHrd) {
      alert("Pengelola dengan role SPV tidak dapat digabung dengan Admin atau HRD dalam satu departemen.")
      return
    }
    setSubmitting(true)
    try {
      await api.post("departemen", {
        namaDepartemen: newDept.namaDepartemen,
        idPengelola: newDept.idPengelola,
      })
      setIsModalOpen(false)
      setNewDept({ namaDepartemen: "", idPengelola: [] })
      await fetchDepartments()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menambahkan departemen")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDept = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus departemen ini?")) return
    try {
      await api.delete(`departemen/${id}`)
      await fetchDepartments()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus departemen")
    }
  }

  const openEditModal = (dept: Departemen) => {
    const managers = getManagers(dept)
    setEditingDept({
      idDepartemen: dept.idDepartemen,
      namaDepartemen: dept.namaDepartemen,
      idPengelola: managers.map(m => m.idUser),
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateDept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDept) return
    const selectedUsers = users.filter(u => editingDept.idPengelola.includes(u.idUser))
    const hasSpv = selectedUsers.some(u => u.role === "SPV")
    const hasAdminOrHrd = selectedUsers.some(u => u.role === "Admin" || u.role === "HRD")
    if (hasSpv && hasAdminOrHrd) {
      alert("Pengelola dengan role SPV tidak dapat digabung dengan Admin atau HRD dalam satu departemen.")
      return
    }
    setSubmitting(true)
    try {
      await api.patch(`departemen/${editingDept.idDepartemen}`, {
        namaDepartemen: editingDept.namaDepartemen,
        idPengelola: editingDept.idPengelola,
      })
      setIsEditModalOpen(false)
      setEditingDept(null)
      await fetchDepartments()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengupdate departemen")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredDepts = departments.filter(d => 
    d.namaDepartemen.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Departemen
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Total {departments.length} departemen terdaftar
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
        >
          <Plus className="w-4 h-4" />
          Tambah Departemen
        </button>
      </div>

      {/* Add Dept Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-lg rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Tambah Departemen Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddDept} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Nama Departemen</label>
                <input required type="text" value={newDept.namaDepartemen} onChange={e => setNewDept({...newDept, namaDepartemen: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" placeholder="Contoh: Logistik & Gudang" />
              </div>

              {/* Multi-Select Pengelola */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Pengelola <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-[var(--color-primary)]">
                    {newDept.idPengelola.length} akun dipilih
                  </span>
                </div>

                <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2 text-[11px] text-amber-700 dark:text-amber-400">
                  <strong>Aturan Pengelola:</strong> SPV tidak dapat digabung dengan Admin atau HRD dalam satu departemen.
                </div>

                <div className="border border-[var(--border-default)] rounded-lg p-2 max-h-52 overflow-y-auto space-y-1.5 bg-[var(--bg-page)]">
                  {users.map(u => {
                    const isSelected = newDept.idPengelola.includes(u.idUser)
                    const isDisabled = isUserDisabled(u, newDept.idPengelola)
                    return (
                      <div
                        key={u.idUser}
                        onClick={() => !isDisabled && toggleNewDeptUser(u.idUser)}
                        title={isDisabled ? "SPV tidak dapat digabung dengan Admin atau HRD" : ""}
                        className={`flex items-center justify-between p-2 rounded-md text-xs transition-colors ${
                          isDisabled
                            ? "opacity-40 cursor-not-allowed bg-[var(--bg-surface)] border border-transparent text-[var(--text-muted)]"
                            : isSelected
                            ? "cursor-pointer bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/40 text-[var(--text-primary)]"
                            : "cursor-pointer hover:bg-[var(--bg-surface-raised)] border border-transparent text-[var(--text-secondary)]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => {}}
                            className="rounded accent-[var(--color-primary)] cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div>
                            <p className="font-medium text-[var(--text-primary)] leading-tight">{u.nama}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">@{u.username}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          u.role === 'Admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                          u.role === 'HRD' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Pilih pengelola yang bertugas: hanya sesama SPV, atau Admin & HRD.
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-raised)] border border-transparent">Batal</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60">
                  {submitting ? "Menyimpan..." : "Simpan Departemen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dept Modal */}
      {isEditModalOpen && editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-lg rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Edit Departemen</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateDept} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Nama Departemen</label>
                <input required type="text" value={editingDept.namaDepartemen} onChange={e => setEditingDept({...editingDept, namaDepartemen: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
              </div>

              {/* Multi-Select Pengelola */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Pengelola
                  </label>
                  <span className="text-[11px] font-semibold text-[var(--color-primary)]">
                    {editingDept.idPengelola.length} akun dipilih
                  </span>
                </div>

                <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2 text-[11px] text-amber-700 dark:text-amber-400">
                  <strong>Aturan Pengelola:</strong> SPV tidak dapat digabung dengan Admin atau HRD dalam satu departemen.
                </div>

                <div className="border border-[var(--border-default)] rounded-lg p-2 max-h-52 overflow-y-auto space-y-1.5 bg-[var(--bg-page)]">
                  {users.map(u => {
                    const isSelected = editingDept.idPengelola.includes(u.idUser)
                    const isDisabled = isUserDisabled(u, editingDept.idPengelola)
                    return (
                      <div
                        key={u.idUser}
                        onClick={() => !isDisabled && toggleEditDeptUser(u.idUser)}
                        title={isDisabled ? "SPV tidak dapat digabung dengan Admin atau HRD" : ""}
                        className={`flex items-center justify-between p-2 rounded-md text-xs transition-colors ${
                          isDisabled
                            ? "opacity-40 cursor-not-allowed bg-[var(--bg-surface)] border border-transparent text-[var(--text-muted)]"
                            : isSelected
                            ? "cursor-pointer bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/40 text-[var(--text-primary)]"
                            : "cursor-pointer hover:bg-[var(--bg-surface-raised)] border border-transparent text-[var(--text-secondary)]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => {}}
                            className="rounded accent-[var(--color-primary)] cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div>
                            <p className="font-medium text-[var(--text-primary)] leading-tight">{u.nama}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">@{u.username}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          u.role === 'Admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                          u.role === 'HRD' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-raised)] border border-transparent">Batal</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60">
                  {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table card */}
      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-[var(--border-default)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-full sm:max-w-xs bg-[var(--bg-page)] border border-[var(--border-default)]">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
            <input 
              type="search" 
              placeholder="Cari departemen..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" 
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Departemen</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Pengelola</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepts.map((dept) => {
                const managers = getManagers(dept)
                return (
                  <TableRow key={dept.idDepartemen}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--bg-page)] border border-[var(--border-default)] text-[var(--text-muted)]">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="font-medium text-[var(--text-primary)]">
                          {dept.namaDepartemen}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-md px-2 py-1 text-xs font-medium bg-[var(--bg-page)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                        #{dept.idDepartemen}
                      </span>
                    </TableCell>
                    <TableCell>
                      {managers.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                          {managers.map((m) => (
                            <div
                              key={m.idUser}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-page)] border border-[var(--border-default)] text-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                              <span className="font-medium text-[var(--text-primary)]">{m.nama}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                m.role === 'Admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                                m.role === 'HRD' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                                'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}>
                                {m.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-amber-500 italic">Belum ditentukan</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(dept)} className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-[var(--color-primary)]">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteDept(dept.idDepartemen)} className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
