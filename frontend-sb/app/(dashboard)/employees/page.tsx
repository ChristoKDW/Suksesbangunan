"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Badge } from "@/components/atoms"
import { Search, Plus, X, Edit2, Trash2, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { Karyawan, Departemen, Jabatan } from "@/lib/types"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"

function getPhotoUrl(fotoProfil?: string | null) {
  if (!fotoProfil) return null
  if (fotoProfil.startsWith("http://") || fotoProfil.startsWith("https://")) return fotoProfil
  const clean = fotoProfil.replace(/\\/g, "/")
  return `${BASE_URL}${clean.startsWith("/") ? "" : "/"}${clean}`
}

const variantMap: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  aktif: "success",
  cuti: "warning",
  resign: "destructive",
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Karyawan[]>([])
  const [departments, setDepartments] = useState<Departemen[]>([])
  const [positions, setPositions] = useState<Jabatan[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()

  const [newEmployee, setNewEmployee] = useState({
    nik: "", nama: "", email: "", nomorTelepon: "", idDepartemen: 0, idJabatan: 0, tanggalMasuk: "", gajiPokok: 0, hakCuti: false, hariLibur: ""
  })
  const [editingEmployee, setEditingEmployee] = useState<Karyawan | null>(null)

  const fetchData = async () => {
    try {
      const [emp, dept, jab] = await Promise.all([
        api.get<Karyawan[]>("karyawan"),
        api.get<Departemen[]>("departemen"),
        api.get<Jabatan[]>("jabatan"),
      ])
      setEmployees(emp)
      setDepartments(dept)
      setPositions(jab)
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const activeCount = employees.filter((e) => e.statusAktif === "aktif").length

  const filteredEmployees = employees.filter(emp =>
    emp.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.nik.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        nik: newEmployee.nik,
        nama: newEmployee.nama,
      }
      if (newEmployee.email) body.email = newEmployee.email
      if (newEmployee.nomorTelepon) body.nomorTelepon = newEmployee.nomorTelepon
      if (newEmployee.idDepartemen) body.idDepartemen = newEmployee.idDepartemen
      if (newEmployee.idJabatan) body.idJabatan = newEmployee.idJabatan
      if (newEmployee.tanggalMasuk) body.tanggalMasuk = newEmployee.tanggalMasuk
      if (newEmployee.gajiPokok) body.gajiPokok = newEmployee.gajiPokok
      body.hariLibur = newEmployee.hariLibur || ""
      body.hakCuti = newEmployee.hakCuti
      body.statusAktif = "aktif"

      await api.post("karyawan", body)
      setIsModalOpen(false)
      setNewEmployee({ nik: "", nama: "", email: "", nomorTelepon: "", idDepartemen: 0, idJabatan: 0, tanggalMasuk: "", gajiPokok: 0, hakCuti: false, hariLibur: "" })
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menambahkan karyawan")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data karyawan ini secara permanen? Data riwayat jadwal, absensi, izin, dan penggajian terkait karyawan ini juga akan ikut dibersihkan.")) return
    try {
      await api.delete(`karyawan/${id}`)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus karyawan")
    }
  }

  const openEditModal = (emp: Karyawan) => {
    setEditingEmployee({ ...emp })
    setIsEditModalOpen(true)
  }

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return
    setSubmitting(true)
    try {
      await api.patch(`karyawan/${editingEmployee.idKaryawan}`, {
        nik: editingEmployee.nik,
        nama: editingEmployee.nama,
        email: editingEmployee.email || undefined,
        nomorTelepon: editingEmployee.nomorTelepon || undefined,
        idDepartemen: editingEmployee.idDepartemen || undefined,
        idJabatan: editingEmployee.idJabatan || undefined,
        statusAktif: editingEmployee.statusAktif,
        hakCuti: editingEmployee.hakCuti,
        hariLibur: editingEmployee.hariLibur || "",
      })
      setIsEditModalOpen(false)
      setEditingEmployee(null)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengupdate karyawan")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Karyawan</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{employees.length} total · {activeCount} aktif</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]">
          <Plus className="w-4 h-4" />
          Tambah Karyawan
        </button>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-lg rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Tambah Karyawan Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">NIK *</label>
                  <input required type="text" value={newEmployee.nik} onChange={e => setNewEmployee({...newEmployee, nik: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" placeholder="EMP001" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Nama *</label>
                  <input required type="text" value={newEmployee.nama} onChange={e => setNewEmployee({...newEmployee, nama: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" placeholder="Nama lengkap" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Email</label>
                  <input type="email" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" placeholder="email@company.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">No WhatsApp</label>
                  <input type="tel" value={newEmployee.nomorTelepon} onChange={e => setNewEmployee({...newEmployee, nomorTelepon: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" placeholder="08123456789" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Departemen</label>
                  <select value={newEmployee.idDepartemen} onChange={e => setNewEmployee({...newEmployee, idDepartemen: Number(e.target.value)})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                    <option value={0}>Pilih departemen</option>
                    {departments.map(d => <option key={d.idDepartemen} value={d.idDepartemen}>{d.namaDepartemen}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Jabatan</label>
                  <select value={newEmployee.idJabatan} onChange={e => setNewEmployee({...newEmployee, idJabatan: Number(e.target.value)})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                    <option value={0}>Pilih jabatan</option>
                    {positions.map(j => <option key={j.idJabatan} value={j.idJabatan}>{j.namaJabatan}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Tanggal Masuk</label>
                  <input type="date" value={newEmployee.tanggalMasuk} onChange={e => setNewEmployee({...newEmployee, tanggalMasuk: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Gaji Pokok</label>
                  <input type="number" value={newEmployee.gajiPokok || ""} onChange={e => setNewEmployee({...newEmployee, gajiPokok: Number(e.target.value)})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" placeholder="5000000" />
                </div>
              </div>
              {user?.role === "HRD" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Hak Cuti (Cuti Dibayar)</label>
                  <select value={newEmployee.hakCuti ? "true" : "false"} onChange={e => setNewEmployee({...newEmployee, hakCuti: e.target.value === "true"})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                    <option value="false">Belum Bisa Cuti</option>
                    <option value="true">Bisa Cuti (12 Hari)</option>
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Tipe Libur</label>
                <select value={newEmployee.hariLibur === "Sabtu,Minggu" ? "Sabtu,Minggu" : ""} onChange={e => setNewEmployee({...newEmployee, hariLibur: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                  <option value="">Libur Fleksibel</option>
                  <option value="Sabtu,Minggu">Libur Sabtu & Minggu</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-raised)] border border-transparent">Batal</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60">
                  {submitting ? "Menyimpan..." : "Simpan Karyawan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-lg rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-[var(--border-default)]">
              {editingEmployee.fotoProfil ? (
                <img
                  src={getPhotoUrl(editingEmployee.fotoProfil)!}
                  alt={editingEmployee.nama}
                  className="h-11 w-11 rounded-full object-cover border border-[var(--border-default)] shadow-sm"
                />
              ) : (
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ background: "var(--color-primary)" }}
                >
                  {editingEmployee.nama.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Edit Karyawan</h3>
                <p className="text-xs text-[var(--text-muted)] font-mono">{editingEmployee.nik} · {editingEmployee.nama}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateEmployee} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">NIK</label>
                  <input required type="text" value={editingEmployee.nik} onChange={e => setEditingEmployee({...editingEmployee, nik: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Nama</label>
                  <input required type="text" value={editingEmployee.nama} onChange={e => setEditingEmployee({...editingEmployee, nama: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Email</label>
                  <input type="email" value={editingEmployee.email || ""} onChange={e => setEditingEmployee({...editingEmployee, email: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">No WhatsApp</label>
                  <input type="tel" value={editingEmployee.nomorTelepon || ""} onChange={e => setEditingEmployee({...editingEmployee, nomorTelepon: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Departemen</label>
                  <select value={editingEmployee.idDepartemen || 0} onChange={e => setEditingEmployee({...editingEmployee, idDepartemen: Number(e.target.value)})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                    <option value={0}>Pilih departemen</option>
                    {departments.map(d => <option key={d.idDepartemen} value={d.idDepartemen}>{d.namaDepartemen}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Jabatan</label>
                  <select value={editingEmployee.idJabatan || 0} onChange={e => setEditingEmployee({...editingEmployee, idJabatan: Number(e.target.value)})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                    <option value={0}>Pilih jabatan</option>
                    {positions.map(j => <option key={j.idJabatan} value={j.idJabatan}>{j.namaJabatan}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Status</label>
                <select value={editingEmployee.statusAktif} onChange={e => setEditingEmployee({...editingEmployee, statusAktif: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                  <option value="aktif">Aktif</option>
                  <option value="cuti">Cuti</option>
                  <option value="resign">Resign</option>
                </select>
              </div>
              {user?.role === "HRD" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Hak Cuti (Cuti Dibayar)</label>
                  <select value={editingEmployee.hakCuti ? "true" : "false"} onChange={e => setEditingEmployee({...editingEmployee, hakCuti: e.target.value === "true"})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                    <option value="false">Belum Bisa Cuti</option>
                    <option value="true">Bisa Cuti (12 Hari)</option>
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Tipe Libur</label>
                <select value={editingEmployee.hariLibur === "Sabtu,Minggu" ? "Sabtu,Minggu" : ""} onChange={e => setEditingEmployee({...editingEmployee, hariLibur: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                  <option value="">Libur Fleksibel</option>
                  <option value="Sabtu,Minggu">Libur Sabtu & Minggu</option>
                </select>
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

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-[var(--border-default)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-full sm:max-w-xs bg-[var(--bg-page)] border border-[var(--border-default)]">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
            <input type="search" placeholder="Cari karyawan..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>NIK</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Tgl Masuk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => (
                <TableRow key={emp.idKaryawan}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {emp.fotoProfil ? (
                        <img
                          src={getPhotoUrl(emp.fotoProfil)!}
                          alt={emp.nama}
                          className="h-9 w-9 flex-shrink-0 rounded-full object-cover border border-[var(--border-default)] shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                            const fallback = (e.target as HTMLElement).parentElement?.querySelector(".avatar-fallback");
                            if (fallback) fallback.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div
                        className={`avatar-fallback flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${emp.fotoProfil ? "hidden" : ""}`}
                        style={{ background: "var(--color-primary)" }}
                      >
                        {emp.nama.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">{emp.nama}</div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {emp.email || "Tidak ada email"} {emp.nomorTelepon ? `• ${emp.nomorTelepon}` : ""}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[var(--text-secondary)] text-sm font-mono">{emp.nik}</TableCell>
                  <TableCell className="text-sm text-[var(--text-secondary)]">{emp.departemen?.namaDepartemen || "—"}</TableCell>
                  <TableCell className="text-sm text-[var(--text-secondary)]">{emp.jabatan?.namaJabatan || "—"}</TableCell>
                  <TableCell className="text-sm text-[var(--text-secondary)]">
                    {emp.tanggalMasuk ? new Date(emp.tanggalMasuk).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={variantMap[emp.statusAktif] || "secondary"}>{capitalize(emp.statusAktif)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(emp)} className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-[var(--color-primary)]">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteEmployee(emp.idKaryawan)} className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
