"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Search, Plus, X, CalendarCheck, Edit2, Trash2, Loader2, AlertCircle, Clock } from "lucide-react"
import { api } from "@/lib/api"
import type { HariLibur, Shift } from "@/lib/types"

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<HariLibur[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [newHoliday, setNewHoliday] = useState<{
    nama: string
    tanggal: string
    keterangan: string
    idShift: number | ""
    isLibur: boolean
  }>({
    nama: "",
    tanggal: "",
    keterangan: "",
    idShift: "",
    isLibur: true,
  })
  const [editingHoliday, setEditingHoliday] = useState<{
    idHariLibur: number
    nama: string
    tanggal: string
    keterangan: string
    idShift: number | ""
    isLibur: boolean
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState("")

  const fetchHolidays = async () => {
    try {
      const [holidayData, shiftData] = await Promise.all([
        api.get<HariLibur[]>("hari-libur"),
        api.get<Shift[]>("shift").catch(() => []),
      ])
      setHolidays(holidayData)
      setShifts(shiftData)
      if (shiftData.length > 0) {
        setNewHoliday(prev => ({
          ...prev,
          idShift: prev.idShift || shiftData[0].idShift,
        }))
      }
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHolidays()
  }, [])

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHoliday.isLibur && !newHoliday.idShift) {
      alert("Harap pilih shift untuk hari penting ini.")
      return
    }
    setSubmitting(true)
    try {
      const res: any = await api.post("hari-libur", {
        nama: newHoliday.nama,
        tanggal: newHoliday.tanggal,
        keterangan: newHoliday.keterangan,
        idShift: newHoliday.isLibur ? undefined : Number(newHoliday.idShift),
        isLibur: newHoliday.isLibur,
      })
      alert(res.message || "Hari penting berhasil ditambahkan dan jadwal kerja karyawan telah disesuaikan.")
      setIsModalOpen(false)
      setNewHoliday({
        nama: "",
        tanggal: "",
        keterangan: "",
        idShift: shifts.length > 0 ? shifts[0].idShift : "",
        isLibur: true,
      })
      await fetchHolidays()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menambahkan hari penting")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteHoliday = async (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus hari penting "${nama}"? Jadwal kerja karyawan di tanggal tersebut akan dikembalikan.`)) {
      return
    }
    try {
      const res: any = await api.delete(`hari-libur/${id}`)
      alert(res.message || "Hari penting berhasil dihapus")
      await fetchHolidays()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus hari penting")
    }
  }

  const openEditModal = (h: HariLibur) => {
    setEditingHoliday({
      idHariLibur: h.idHariLibur,
      nama: h.nama,
      tanggal: h.tanggal,
      keterangan: h.keterangan || "",
      idShift: h.idShift || (shifts.length > 0 ? shifts[0].idShift : ""),
      isLibur: h.isLibur,
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateHoliday = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingHoliday) return
    if (!editingHoliday.isLibur && !editingHoliday.idShift) {
      alert("Harap pilih shift untuk hari penting ini.")
      return
    }
    setSubmitting(true)
    try {
      const res: any = await api.patch(`hari-libur/${editingHoliday.idHariLibur}`, {
        nama: editingHoliday.nama,
        tanggal: editingHoliday.tanggal,
        keterangan: editingHoliday.keterangan,
        idShift: editingHoliday.isLibur ? undefined : Number(editingHoliday.idShift),
        isLibur: editingHoliday.isLibur,
      })
      alert(res.message || "Hari penting berhasil diperbarui")
      setIsEditModalOpen(false)
      setEditingHoliday(null)
      await fetchHolidays()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui hari penting")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredHolidays = holidays.filter(h =>
    h.nama.toLowerCase().includes(search.toLowerCase()) ||
    h.tanggal.includes(search) ||
    (h.keterangan && h.keterangan.toLowerCase().includes(search.toLowerCase())) ||
    (h.shift && h.shift.namaShift.toLowerCase().includes(search.toLowerCase()))
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
            Hari Penting
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Atur hari-hari penting dan tetapkan shift kerja khusus dari HRD yang otomatis menimpa jadwal karyawan di departemen yang dikelola SPV.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
        >
          <Plus className="w-4 h-4" />
          Tambah Hari Penting
        </button>
      </div>

      {/* Info Card */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div className="text-xs space-y-1.5">
          <p className="font-semibold">Ketentuan Otoritas Jadwal Hari Penting:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong>Departemen Dikelola SPV:</strong> Jadwal kerja seluruh karyawan aktif di departemen ini pada tanggal hari penting akan <strong>otomatis ditimpa</strong> mengikuti Shift pilihan HRD, mengabaikan jadwal yang dibuat oleh SPV sebelumnya.
            </li>
            <li>
              <strong>Departemen Dikelola Admin & HRD:</strong> Karyawan memiliki jadwal tetap default kantor (<strong>Senin – Sabtu: 08:45 – 17:00, Minggu Libur</strong>) dan bersifat <strong>kebal</strong> sehingga tidak terpengaruh oleh hari penting ini.
            </li>
          </ul>
        </div>
      </div>

      {/* Add Holiday Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-lg rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Tambah Hari Penting Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddHoliday} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Nama Hari Penting / Event <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={newHoliday.nama}
                  onChange={e => setNewHoliday({ ...newHoliday, nama: e.target.value })}
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  placeholder="Contoh: Peringatan Hari Kemerdekaan / Pilkada Serentak"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Tanggal <span className="text-red-500">*</span></label>
                <input
                  required
                  type="date"
                  value={newHoliday.tanggal}
                  onChange={e => setNewHoliday({ ...newHoliday, tanggal: e.target.value })}
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-page)] p-3 text-sm text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={newHoliday.isLibur}
                  onChange={e => setNewHoliday({ ...newHoliday, isLibur: e.target.checked })}
                />
                <span>
                  <strong>Hari libur kerja</strong>
                  <span className="block text-xs font-normal text-[var(--text-muted)]">
                    Aktifkan untuk tanggal merah/libur perusahaan; nonaktifkan untuk menetapkan shift khusus.
                  </span>
                </span>
              </label>

              {/* Pilihan Shift dari Pengaturan Shift */}
              {!newHoliday.isLibur && <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Shift Kerja yang Ditetapkan HRD <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={newHoliday.idShift}
                  onChange={e => setNewHoliday({ ...newHoliday, idShift: Number(e.target.value) })}
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="" disabled>-- Pilih Shift dari Pengaturan Shift --</option>
                  {shifts.map(s => (
                    <option key={s.idShift} value={s.idShift}>
                      {s.namaShift} ({s.jamMulai.slice(0, 5)} - {s.jamSelesai.slice(0, 5)})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Shift ini akan otomatis menimpa jadwal seluruh karyawan di bawah kelolaan SPV pada tanggal ini.
                </p>
              </div>}

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Keterangan / Catatan</label>
                <textarea
                  rows={2}
                  value={newHoliday.keterangan}
                  onChange={e => setNewHoliday({ ...newHoliday, keterangan: e.target.value })}
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  placeholder="Contoh: Penyesuaian jam kerja toko untuk peringatan hari nasional"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-raised)] border border-transparent"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
                >
                  {submitting ? "Menerapkan Jadwal..." : "Simpan Hari Penting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Holiday Modal */}
      {isEditModalOpen && editingHoliday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-lg rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Edit Hari Penting</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateHoliday} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Nama Hari Penting / Event <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={editingHoliday.nama}
                  onChange={e => setEditingHoliday({ ...editingHoliday, nama: e.target.value })}
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Tanggal <span className="text-red-500">*</span></label>
                <input
                  required
                  type="date"
                  value={editingHoliday.tanggal}
                  onChange={e => setEditingHoliday({ ...editingHoliday, tanggal: e.target.value })}
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-page)] p-3 text-sm text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={editingHoliday.isLibur}
                  onChange={e => setEditingHoliday({ ...editingHoliday, isLibur: e.target.checked })}
                />
                <span>
                  <strong>Hari libur kerja</strong>
                  <span className="block text-xs font-normal text-[var(--text-muted)]">
                    Aktifkan untuk tanggal merah/libur perusahaan; nonaktifkan untuk menetapkan shift khusus.
                  </span>
                </span>
              </label>

              {/* Pilihan Shift dari Pengaturan Shift */}
              {!editingHoliday.isLibur && <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Shift Kerja yang Ditetapkan HRD <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={editingHoliday.idShift}
                  onChange={e => setEditingHoliday({ ...editingHoliday, idShift: Number(e.target.value) })}
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="" disabled>-- Pilih Shift dari Pengaturan Shift --</option>
                  {shifts.map(s => (
                    <option key={s.idShift} value={s.idShift}>
                      {s.namaShift} ({s.jamMulai.slice(0, 5)} - {s.jamSelesai.slice(0, 5)})
                    </option>
                  ))}
                </select>
              </div>}

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Keterangan / Catatan</label>
                <textarea
                  rows={2}
                  value={editingHoliday.keterangan}
                  onChange={e => setEditingHoliday({ ...editingHoliday, keterangan: e.target.value })}
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-raised)] border border-transparent"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
                >
                  {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table Card */}
      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-[var(--border-default)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-full sm:max-w-xs bg-[var(--bg-page)] border border-[var(--border-default)]">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
            <input
              type="search"
              placeholder="Cari hari penting atau shift..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hari Penting / Event</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Shift HRD</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Ditetapkan Oleh</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHolidays.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-sm text-[var(--text-muted)]">
                    Belum ada hari penting yang terdaftar.
                  </TableCell>
                </TableRow>
              ) : (
                filteredHolidays.map(h => (
                  <TableRow key={h.idHariLibur}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border bg-blue-500/10 border-blue-500/20 text-blue-600">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="font-medium text-[var(--text-primary)]">
                          {h.nama}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-md px-2.5 py-1 text-xs font-semibold bg-[var(--bg-page)] border border-[var(--border-default)] text-[var(--text-primary)]">
                        {h.tanggal}
                      </span>
                    </TableCell>
                    <TableCell>
                      {h.shift ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-semibold">{h.shift.namaShift}</span>
                          <span className="opacity-80">({h.shift.jamMulai.slice(0, 5)} - {h.shift.jamSelesai.slice(0, 5)})</span>
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--text-secondary)]">
                      {h.keterangan || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-[var(--text-muted)]">
                      {h.user ? `${h.user.nama} (${h.user.username})` : "Sistem"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(h)}
                          title="Edit"
                          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-[var(--color-primary)]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteHoliday(h.idHariLibur, h.nama)}
                          title="Hapus"
                          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
