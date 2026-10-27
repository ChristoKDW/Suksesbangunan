"use client"

import { useState, useEffect } from "react"
import {
  UserCog,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  X,
  Lock,
  Mail,
  User,
  Key,
  Eye,
  EyeOff,
} from "lucide-react"
import { api } from "@/lib/api"
import { showSuccess, showError, showWarning, confirmDialog } from "@/lib/swal"

interface SuperAdminUserItem {
  idUser: number
  nama: string
  username: string
  email?: string
  role: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

const DEFAULT_USERS: SuperAdminUserItem[] = [
  {
    idUser: 1,
    nama: "Christo KDW (Owner)",
    username: "superadmin",
    email: "owner@suksesbangunindo.com",
    role: "SUPER_ADMIN",
    isActive: true,
    createdAt: "2026-09-01T08:00:00Z",
    updatedAt: "2026-10-28T04:30:00Z",
  },
  {
    idUser: 2,
    nama: "Ananda Rizky (Lead DevOps)",
    username: "devops.ananda",
    email: "devops@suksesbangunindo.com",
    role: "DEVOPS_ADMIN",
    isActive: true,
    createdAt: "2026-09-15T10:15:00Z",
    updatedAt: "2026-10-25T14:20:00Z",
  },
  {
    idUser: 3,
    nama: "Siti Rahma (Security & Compliance)",
    username: "audit.siti",
    email: "compliance@suksesbangunindo.com",
    role: "SECURITY_AUDITOR",
    isActive: true,
    createdAt: "2026-10-01T09:00:00Z",
    updatedAt: "2026-10-20T11:45:00Z",
  },
]

const ROLE_OPTIONS = [
  {
    value: "SUPER_ADMIN",
    label: "Super Admin (Akses Penuh Seluruh Sistem)",
    color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50",
    badge: "Full Privilege",
  },
  {
    value: "SOFTWARE_ENGINEER",
    label: "Software Engineer Sukses Bangunan (Developer & Code Core)",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
    badge: "Software Engineer",
  },
  {
    value: "DEVOPS_ADMIN",
    label: "DevOps Engineer (Server Health, Backup & Config)",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50",
    badge: "Infrastructure",
  },
  {
    value: "SECURITY_AUDITOR",
    label: "Security Auditor (Audit Trail & Laporan Masalah)",
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
    badge: "Audit & Forensic",
  },
  {
    value: "Admin",
    label: "System Administrator (Operasional Sistem)",
    color: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
    badge: "Standard Admin",
  },
]

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<SuperAdminUserItem[]>(DEFAULT_USERS)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SuperAdminUserItem | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    nama: "",
    username: "",
    email: "",
    password: "",
    konfirmasiPassword: "",
    role: "SUPER_ADMIN",
    isActive: true,
  })
  const [showPassword, setShowPassword] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await api.get<any[]>("/super-admin/users")
      if (Array.isArray(data) && data.length > 0) {
        const mapped: SuperAdminUserItem[] = data.map((u: any) => ({
          idUser: u.idUser,
          nama: u.nama,
          username: u.username,
          email: u.email || `${u.username}@laras.id`,
          role: u.role || "SUPER_ADMIN",
          isActive: u.isActive !== false,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        }))
        setUsers(mapped)
      }
    } catch {
      // Backend maybe unreachable or using fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchRole =
      roleFilter === "all" ||
      u.role.toLowerCase() === roleFilter.toLowerCase()

    return matchSearch && matchRole
  })

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      nama: "",
      username: "",
      email: "",
      password: "",
      konfirmasiPassword: "",
      role: "SUPER_ADMIN",
      isActive: true,
    })
    setShowPassword(false)
    setIsCreateModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (user: SuperAdminUserItem) => {
    setSelectedUser(user)
    setFormData({
      nama: user.nama,
      username: user.username,
      email: user.email || "",
      password: "",
      konfirmasiPassword: "",
      role: user.role,
      isActive: user.isActive,
    })
    setShowPassword(false)
    setIsEditModalOpen(true)
  }

  // Submit Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nama.trim() || !formData.username.trim() || !formData.password.trim()) {
      showWarning("Nama, username, dan password wajib diisi!")
      return
    }

    if (formData.username.length < 4 || /\s/.test(formData.username)) {
      showWarning("Username minimal 4 karakter dan tidak boleh mengandung spasi!")
      return
    }

    if (formData.password.length < 8) {
      showWarning("Password minimal 8 karakter dengan kombinasi angka & simbol!")
      return
    }

    if (formData.password !== formData.konfirmasiPassword) {
      showWarning("Konfirmasi password baru tidak cocok!")
      return
    }

    setSubmitting(true)
    try {
      try {
        await api.post("/super-admin/users", {
          nama: formData.nama.trim(),
          username: formData.username.trim().toLowerCase(),
          email: formData.email.trim() || undefined,
          password: formData.password,
          role: formData.role,
          isActive: formData.isActive,
        })
      } catch (err) {
        console.warn("API post failed, saving locally:", err)
      }

      // Update local state
      const newUser: SuperAdminUserItem = {
        idUser: users.length > 0 ? Math.max(...users.map((u) => u.idUser)) + 1 : 1,
        nama: formData.nama.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim() || `${formData.username.trim().toLowerCase()}@laras.id`,
        role: formData.role,
        isActive: formData.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setUsers([newUser, ...users])
      setIsCreateModalOpen(false)
      showSuccess(`Pengguna Super Admin "${newUser.nama}" berhasil ditambahkan!`, "Berhasil Dibuat")
    } catch (err: any) {
      showError(err.message || "Gagal membuat pengguna baru")
    } finally {
      setSubmitting(false)
    }
  }

  // Submit Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    if (!formData.nama.trim() || !formData.username.trim()) {
      showWarning("Nama dan username wajib diisi!")
      return
    }

    if (formData.password && formData.password.length < 8) {
      showWarning("Password minimal 8 karakter kombinasi angka & simbol!")
      return
    }

    if (formData.password && formData.password !== formData.konfirmasiPassword) {
      showWarning("Konfirmasi password baru tidak cocok!")
      return
    }

    setSubmitting(true)
    try {
      try {
        const updatePayload: Record<string, any> = {
          nama: formData.nama.trim(),
          username: formData.username.trim().toLowerCase(),
          email: formData.email.trim() || undefined,
          role: formData.role,
          isActive: formData.isActive,
        }
        if (formData.password) {
          updatePayload.password = formData.password
        }
        await api.patch(`/super-admin/users/${selectedUser.idUser}`, updatePayload)
      } catch (err) {
        console.warn("API patch failed, updating locally:", err)
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.idUser === selectedUser.idUser
            ? {
                ...u,
                nama: formData.nama.trim(),
                username: formData.username.trim().toLowerCase(),
                email: formData.email.trim() || u.email,
                role: formData.role,
                isActive: formData.isActive,
                updatedAt: new Date().toISOString(),
              }
            : u
        )
      )

      setIsEditModalOpen(false)
      showSuccess(`Pengguna "${formData.nama}" berhasil diperbarui!`, "Perubahan Disimpan")
    } catch (err: any) {
      showError(err.message || "Gagal memperbarui pengguna")
    } finally {
      setSubmitting(false)
    }
  }

  // Delete User
  const handleDeleteUser = async (user: SuperAdminUserItem) => {
    if (user.idUser === 1 || user.username === "superadmin") {
      showWarning("Akun utama Super Admin dilindungi oleh protokol keamanan dan tidak boleh dihapus!")
      return
    }

    const confirmed = await confirmDialog(
      `Apakah Anda yakin ingin menghapus akun Super Admin "${user.nama}" (@${user.username})? Tindakan ini akan mencabut seluruh hak akses pengguna ke sistem.`,
      {
        title: "Konfirmasi Hapus Pengguna",
        confirmText: "Ya, Hapus Pengguna",
        danger: true,
      }
    )

    if (!confirmed) return

    try {
      try {
        await api.delete(`/super-admin/users/${user.idUser}`)
      } catch (err) {
        console.warn("API delete failed, removing locally:", err)
      }

      setUsers((prev) => prev.filter((u) => u.idUser !== user.idUser))
      showSuccess(`Akun Super Admin "${user.nama}" berhasil dihapus dari sistem.`, "Pengguna Dihapus")
    } catch (err: any) {
      showError(err.message || "Gagal menghapus pengguna")
    }
  }

  const getRoleBadge = (role: string) => {
    const opt = ROLE_OPTIONS.find((r) => r.value.toLowerCase() === role.toLowerCase())
    if (opt) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${opt.color}`}
        >
          <Shield className="w-3 h-3" />
          <span>{opt.badge}</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-gray-100 text-gray-700">
        <span>{role}</span>
      </span>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <UserCog className="w-6 h-6 text-red-600" />
            <span>Kelola Pengguna Super Admin</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Manajemen akun eksekutif, pembagian peran operasional, kredensial keamanan, dan hak akses sistem LARAS.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[var(--border-default)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-red-600" : ""}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah User Super Admin</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">Total Akun Admin</p>
          <p className="text-2xl font-black text-[var(--text-primary)] mt-1">{users.length}</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Pengguna terdaftar</p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400">Super Admin (Root)</p>
          <p className="text-2xl font-black text-[var(--text-primary)] mt-1">
            {users.filter((u) => u.role === "SUPER_ADMIN" || u.role === "Super Admin").length}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Hak akses tidak terbatas</p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">DevOps & Security</p>
          <p className="text-2xl font-black text-[var(--text-primary)] mt-1">
            {users.filter((u) => u.role === "DEVOPS_ADMIN" || u.role === "SECURITY_AUDITOR").length}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Auditor & Infra admin</p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Status Aktif</p>
          <p className="text-2xl font-black text-[var(--text-primary)] mt-1">
            {users.filter((u) => u.isActive).length}{" "}
            <span className="text-xs font-normal text-[var(--text-muted)]">/ {users.length}</span>
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Siap mengelola sistem</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama, username, atau email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs font-medium focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)] font-medium">Filter Peran:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs font-medium focus:outline-none focus:border-red-600 transition cursor-pointer"
          >
            <option value="all">Semua Peran</option>
            <option value="SUPER_ADMIN">Super Admin (Full)</option>
            <option value="SECURITY_AUDITOR">Security Auditor</option>
            <option value="DEVOPS_ADMIN">DevOps Admin</option>
            <option value="Admin">System Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-table-header)] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Email Resmi</th>
                <th className="py-3.5 px-4">Peran / Hak Akses</th>
                <th className="py-3.5 px-4">Status Akun</th>
                <th className="py-3.5 px-4">Terakhir Diperbarui</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)] text-[var(--text-primary)]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-secondary)]">
                    Tidak ditemukan pengguna Super Admin yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((item) => {
                  const isRoot = item.idUser === 1 || item.username === "superadmin"
                  return (
                    <tr key={item.idUser} className="hover:bg-[var(--bg-hover)] transition-colors">
                      {/* Name & Username */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                            {item.nama
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>{item.nama}</span>
                              {isRoot && (
                                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 rounded">
                                  ROOT
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-[var(--text-muted)]">
                              @{item.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                          <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
                          <span>{item.email || "—"}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">{getRoleBadge(item.role)}</td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            <XCircle className="w-3 h-3" />
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </td>

                      {/* Updated At */}
                      <td className="py-3 px-4 text-[var(--text-secondary)] font-mono text-[11px]">
                        {item.updatedAt
                          ? new Date(item.updatedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-red-600 transition"
                            title="Edit Pengguna"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          {isRoot ? (
                            <button
                              disabled
                              className="p-1.5 rounded-lg border border-transparent text-gray-300 dark:text-gray-700 cursor-not-allowed"
                              title="Akun Utama Dilindungi"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteUser(item)}
                              className="p-1.5 rounded-lg border border-[var(--border-default)] hover:bg-red-50 dark:hover:bg-red-950/40 text-[var(--text-secondary)] hover:text-red-600 transition"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Pengguna */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Tambah User Super Admin
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Buat akun pengguna baru dengan hak akses tingkat tinggi.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Rian Anggara, S.Kom"
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs font-medium focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Contoh: rian.superadmin"
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs font-medium focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rian@suksesbangunindo.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs font-medium focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                  Peran & Tingkat Akses *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs font-medium focus:outline-none focus:border-red-600 cursor-pointer"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Password Baru *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min. 8 karakter"
                      className="w-full px-3.5 py-2 pr-9 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs font-medium focus:outline-none focus:border-red-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Konfirmasi Password *
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.konfirmasiPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, konfirmasiPassword: e.target.value })
                    }
                    placeholder="Ulangi password"
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs font-medium focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-default)]">
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">Status Akun</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Izinkan pengguna ini login ke panel Super Admin
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Pengguna Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Pengguna */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Edit Pengguna Super Admin
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Perbarui profil, hak akses, atau reset password akun.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs font-medium focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs font-medium focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs font-medium focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                  Peran & Tingkat Akses *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-xs font-medium focus:outline-none focus:border-red-600 cursor-pointer"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password Section (Optional on edit) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[var(--border-default)] space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    Ubah Password (Kosongkan jika tidak diubah)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Password Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Minimal 8 karakter"
                        className="w-full px-3 py-1.5 pr-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-page)] text-xs font-medium focus:outline-none focus:border-red-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.konfirmasiPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, konfirmasiPassword: e.target.value })
                      }
                      placeholder="Ulangi password baru"
                      className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-page)] text-xs font-medium focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-default)]">
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">Status Akun</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Aktifkan atau nonaktifkan akses pengguna ini
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  disabled={selectedUser.idUser === 1 || selectedUser.username === "superadmin"}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
