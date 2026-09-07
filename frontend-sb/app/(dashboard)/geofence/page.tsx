"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Search, Plus, X, Trash2, Edit2, MapPin, ExternalLink, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import type { PengaturanKantor, Departemen } from "@/lib/types"

export default function OfficeLocationsPage() {
  const [offices, setOffices] = useState<PengaturanKantor[]>([])
  const [departments, setDepartments] = useState<Departemen[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    namaKantor: "",
    latitude: "",
    longitude: "",
    radiusMeter: "100",
    idDepartemen: 0,
  })

  const fetchData = async () => {
    try {
      const [off, dept] = await Promise.all([
        api.get<PengaturanKantor[]>("pengaturan-kantor"),
        api.get<Departemen[]>("departemen"),
      ])
      setOffices(off)
      setDepartments(dept)
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filteredOffices = offices.filter(office =>
    office.namaKantor.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenModal = (office?: PengaturanKantor) => {
    if (office) {
      setFormData({
        namaKantor: office.namaKantor,
        latitude: String(office.latitude),
        longitude: String(office.longitude),
        radiusMeter: String(office.radiusMeter),
        idDepartemen: office.idDepartemen || 0,
      })
      setIsEditing(true)
      setEditId(office.idKantor)
    } else {
      setFormData({ namaKantor: "", latitude: "", longitude: "", radiusMeter: "100", idDepartemen: 0 })
      setIsEditing(false)
      setEditId(null)
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const body: Record<string, unknown> = {
      namaKantor: formData.namaKantor,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      radiusMeter: Number(formData.radiusMeter),
    }
    if (formData.idDepartemen) body.idDepartemen = formData.idDepartemen

    try {
      if (isEditing && editId) {
        await api.patch(`pengaturan-kantor/${editId}`, body)
      } else {
        await api.post("pengaturan-kantor", body)
      }
      setIsModalOpen(false)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus lokasi kantor ini?")) return
    try {
      await api.delete(`pengaturan-kantor/${id}`)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--text-muted)" }} /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Titik Kantor</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{offices.length} lokasi terdaftar — Radius geofence untuk validasi absensi</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]">
          <Plus className="w-4 h-4" />
          Tambah Lokasi
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-lg rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <h3 className="font-semibold text-[var(--text-primary)]">{isEditing ? "Edit Lokasi" : "Tambah Lokasi Baru"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Nama Kantor *</label>
                <input required type="text" value={formData.namaKantor} onChange={e => setFormData({...formData, namaKantor: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" placeholder="Kantor Pusat Jakarta" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Latitude *</label>
                  <input required type="number" step="any" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" placeholder="-6.2088" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Longitude *</label>
                  <input required type="number" step="any" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" placeholder="106.8456" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Radius (meter) *</label>
                  <input required type="number" value={formData.radiusMeter} onChange={e => setFormData({...formData, radiusMeter: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" placeholder="100" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Departemen</label>
                  <select value={formData.idDepartemen} onChange={e => setFormData({...formData, idDepartemen: Number(e.target.value)})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                    <option value={0}>Semua Departemen</option>
                    {departments.map(d => <option key={d.idDepartemen} value={d.idDepartemen}>{d.namaDepartemen}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)]">Batal</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60">
                  {submitting ? "Menyimpan..." : "Simpan"}
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
            <input type="search" placeholder="Cari kantor..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kantor</TableHead>
                <TableHead>Koordinat</TableHead>
                <TableHead>Radius</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead>Maps</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOffices.map((office) => (
                <TableRow key={office.idKantor}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--bg-page)] border border-[var(--border-default)] text-[var(--text-muted)]">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="font-medium text-[var(--text-primary)]">{office.namaKantor}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono text-[var(--text-secondary)]">
                    {Number(office.latitude).toFixed(4)}, {Number(office.longitude).toFixed(4)}
                  </TableCell>
                  <TableCell className="text-sm text-[var(--text-secondary)]">{office.radiusMeter}m</TableCell>
                  <TableCell className="text-sm text-[var(--text-secondary)]">{office.departemen?.namaDepartemen || "Semua"}</TableCell>
                  <TableCell>
                    <a
                      href={`https://www.google.com/maps?q=${office.latitude},${office.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Lihat
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenModal(office)} className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-[var(--color-primary)]">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(office.idKantor)} className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-red-500">
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
