"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Search, Plus, X, UserCog, Edit2, Trash2, Loader2, Shield } from "lucide-react"
import { userApi, User } from "@/lib/api"
import { api } from "@/lib/api"
import type { Departemen } from "@/lib/types"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Departemen[]>([])
  
  const [newUser, setNewUser] = useState<Partial<User>>({ nama: "", username: "", password: "", role: "HRD" })
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = async () => {
    try {
      const [data, depts] = await Promise.all([
        userApi.getAll(),
        api.get<Departemen[]>("departemen")
      ])
      setUsers(data)
      setDepartments(depts)
    } catch (err) {
      console.error("Failed to fetch users:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await userApi.create(newUser)
      setIsModalOpen(false)
      setNewUser({ nama: "", username: "", password: "", role: "HRD" })
      await fetchUsers()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menambahkan user")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus akun ini?")) return
    try {
      await userApi.delete(id)
      await fetchUsers()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus user")
    }
  }

  const openEditModal = (u: User) => {
    const id = u.idUser
    setEditingUser({ idUser: id, nama: u.nama, username: u.username, role: u.role, fotoProfil: u.fotoProfil })
    setIsEditModalOpen(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setSubmitting(true)
    try {
      const { idUser, idDepartemen, ...updates } = editingUser as any
      if (idUser) {
        await userApi.update(idUser, updates)
      }
      setIsEditModalOpen(false)
      setEditingUser(null)
      await fetchUsers()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengupdate user")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Pengguna Sistem
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Total {users.length} pengelola sistem terdaftar
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm bg-red-600 hover:bg-red-500"
        >
          <Plus className="w-4 h-4" />
          Tambah Pengguna
        </button>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-semibold text-slate-900 dark:text-slate-50">Tambah Pengguna Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-50">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-4 space-y-4">

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Nama Lengkap</label>
                <input required type="text" value={newUser.nama} onChange={e => setNewUser({...newUser, nama: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-red-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Username</label>
                <input required type="text" value={(newUser as any).username} onChange={e => setNewUser({...newUser, username: e.target.value} as any)} className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-red-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Password</label>
                <input required type="password" value={(newUser as any).password} onChange={e => setNewUser({...newUser, password: e.target.value} as any)} className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-red-500" placeholder="Kombinasi huruf, angka & simbol" />
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Wajib min. 8 karakter gabungan huruf besar, huruf kecil, angka, dan simbol (contoh: Admin#2026)
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Role Akses</label>
                <select required value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as "Admin" | "HRD" | "SPV"})} className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-red-500">
                  <option value="HRD">HRD</option>
                  <option value="SPV">SPV</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Departemen yang dikelola oleh akun ini diatur langsung melalui menu Departemen.
                </p>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent">Batal</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-500 disabled:opacity-60">
                  {submitting ? "Menyimpan..." : "Simpan Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-semibold text-slate-900 dark:text-slate-50">Edit Pengguna</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-50">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-4 space-y-4">
              <div className="flex justify-center mb-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                  {(editingUser as any).fotoProfil ? (
                    <img 
                      src={(editingUser as any).fotoProfil} 
                      alt="Pratinjau" 
                      className="h-full w-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                      onClick={() => setPreviewImage((editingUser as any).fotoProfil)}
                    />
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <UserCog className="w-6 h-6" />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Nama Lengkap</label>
                <input required type="text" value={editingUser.nama} onChange={e => setEditingUser({...editingUser, nama: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-red-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Username</label>
                <input required type="text" value={(editingUser as any).username || ''} onChange={e => setEditingUser({...editingUser, username: e.target.value} as any)} className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-red-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Password (Kosongkan jika tidak diubah)</label>
                <input type="password" placeholder="Kombinasi huruf, angka & simbol" onChange={e => setEditingUser({...editingUser, password: e.target.value} as any)} className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-red-500" />
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Jika diisi, wajib min. 8 karakter gabungan huruf besar, huruf kecil, angka, dan simbol
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Role Akses</label>
                <select required disabled={editingUser.role === 'Admin'} value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as "Admin" | "HRD" | "SPV"})} className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-red-500 disabled:opacity-50">
                  {editingUser.role === 'Admin' && <option value="Admin">Admin</option>}
                  <option value="HRD">HRD</option>
                  <option value="SPV">SPV</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Departemen yang dikelola oleh akun ini diatur langsung melalui menu Departemen.
                </p>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent">Batal</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-500 disabled:opacity-60">
                  {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table card */}
      <Card className="bg-white dark:bg-[#1E293B] border-slate-200 dark:border-white/10 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-slate-200 dark:border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-full sm:max-w-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input type="search" placeholder="Cari pengguna..." className="flex-1 bg-transparent text-sm outline-none text-slate-900 dark:text-slate-50 placeholder:text-slate-400" />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 dark:border-white/10">
                <TableHead className="text-slate-500 dark:text-slate-400">Pengguna</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Role</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Username</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Departemen Dikelola</TableHead>
                <TableHead className="w-12 text-slate-500 dark:text-slate-400"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const id = u.idUser;
                const isAdmin = u.role === 'Admin';
                return (
                  <TableRow key={id} className="border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full overflow-hidden bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                          {u.fotoProfil ? (
                            <img 
                              src={u.fotoProfil} 
                              alt="Profil" 
                              className="h-full w-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setPreviewImage(u.fotoProfil!)}
                            />
                          ) : (
                            <UserCog className="w-4 h-4" />
                          )}
                        </div>
                        <div className="font-medium text-slate-900 dark:text-slate-50">
                          {u.nama} {isAdmin && <span className="ml-2 text-xs font-normal text-slate-400">(Utama)</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-md px-2 py-1 text-xs font-medium inline-flex items-center gap-1.5 border 
                        ${u.role === 'Admin' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : ''}
                        ${u.role === 'HRD' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : ''}
                        ${u.role === 'SPV' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : ''}
                      `}>
                        <Shield className="w-3 h-3" />
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                        {(u as any).username || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {u.departemen?.namaDepartemen ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                          {u.departemen.namaDepartemen}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(u)} title="Edit Pengguna" className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-red-500">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!isAdmin ? (
                          <button onClick={() => id && handleDeleteUser(id)} title="Hapus Pengguna" className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="w-8 h-8"></div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Full Size Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full flex items-center justify-center">
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/20"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
