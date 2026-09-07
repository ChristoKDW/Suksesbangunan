"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Search, Plus, X, Briefcase, Edit2, Trash2, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import type { Jabatan } from "@/lib/types"

export default function PositionsPage() {
  const [positions, setPositions] = useState<Jabatan[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [newPosition, setNewPosition] = useState({ namaJabatan: "" })
  const [editingPosition, setEditingPosition] = useState<Jabatan | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchPositions = async () => {
    try {
      const data = await api.get<Jabatan[]>("jabatan")
      setPositions(data)
    } catch (err) {
      console.error("Failed to fetch jabatan:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPositions() }, [])

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post("jabatan", { namaJabatan: newPosition.namaJabatan })
      setIsModalOpen(false)
      setNewPosition({ namaJabatan: "" })
      await fetchPositions()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menambahkan jabatan")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePosition = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus jabatan ini?")) return
    try {
      await api.delete(`jabatan/${id}`)
      await fetchPositions()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus jabatan")
    }
  }

  const openEditModal = (pos: Jabatan) => {
    setEditingPosition({ ...pos })
    setIsEditModalOpen(true)
  }

  const handleUpdatePosition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPosition) return
    setSubmitting(true)
    try {
      await api.patch(`jabatan/${editingPosition.idJabatan}`, { namaJabatan: editingPosition.namaJabatan })
      setIsEditModalOpen(false)
      setEditingPosition(null)
      await fetchPositions()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengupdate jabatan")
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
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Jabatan</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Total {positions.length} jabatan terdaftar</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]">
          <Plus className="w-4 h-4" />
          Tambah Jabatan
        </button>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-md rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Tambah Jabatan Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddPosition} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Nama Jabatan</label>
                <input required type="text" value={newPosition.namaJabatan} onChange={e => setNewPosition({ namaJabatan: e.target.value })} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" placeholder="Contoh: Manager" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-raised)] border border-transparent">Batal</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60">
                  {submitting ? "Menyimpan..." : "Simpan Jabatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-md rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Edit Jabatan</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdatePosition} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Nama Jabatan</label>
                <input required type="text" value={editingPosition.namaJabatan} onChange={e => setEditingPosition({...editingPosition, namaJabatan: e.target.value})} className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
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
            <input type="search" placeholder="Cari jabatan..." className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jabatan</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((pos) => (
                <TableRow key={pos.idJabatan}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--bg-page)] border border-[var(--border-default)] text-[var(--text-muted)]">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="font-medium text-[var(--text-primary)]">{pos.namaJabatan}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-md px-2 py-1 text-xs font-medium bg-[var(--bg-page)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                      #{pos.idJabatan}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(pos)} className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-[var(--color-primary)]">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeletePosition(pos.idJabatan)} className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-red-500">
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
