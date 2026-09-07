"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Badge } from "@/components/atoms"
import { Search, Download, UserCheck, UserX, Clock, Trash2, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import type { Absensi } from "@/lib/types"

function formatTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false })
}

function getStatusBadge(status: string | null): { label: string; variant: "success" | "warning" | "destructive" | "secondary" } {
  switch (status) {
    case "tepat waktu": return { label: "Tepat Waktu", variant: "success" }
    case "telat": return { label: "Terlambat", variant: "warning" }
    case "tidak hadir": return { label: "Tidak Hadir", variant: "destructive" }
    case "tidak sesuai jadwal": return { label: "Tidak Sesuai Jadwal", variant: "warning" }
    case "izin": return { label: "Izin", variant: "secondary" }
    case "sakit": return { label: "Sakit", variant: "warning" }
    case "cuti": return { label: "Cuti", variant: "secondary" }
    default: return { label: status || "—", variant: "secondary" }
  }
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Absensi[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = async () => {
    try {
      const data = await api.get<Absensi[]>("absensi")
      setAttendance(data)
    } catch (err) {
      console.error("Failed to fetch absensi:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus record absensi ini?")) return
    try {
      await api.delete(`absensi/${id}`)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus")
    }
  }

  // Filter by today by default
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayData = attendance.filter(a => {
    if (!a.jamMasukAktual) return false
    const d = new Date(a.jamMasukAktual)
    return d >= today && d < tomorrow
  })

  const filteredData = todayData.filter(record =>
    (record.karyawan?.nama || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(record.idKaryawan).includes(searchQuery)
  )

  const stats = {
    hadir: todayData.filter(a => a.statusKehadiran === "tepat waktu").length,
    terlambat: todayData.filter(a => a.statusKehadiran === "telat").length,
    tidakHadir: todayData.filter(a => a.statusKehadiran === "tidak hadir").length,
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--text-muted)" }} /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Data Absensi</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Hari ini — {today.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#f0fdf4" }}>
              <UserCheck style={{ width: "1.125rem", height: "1.125rem", color: "#16a34a" }} />
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{stats.hadir}</div>
          <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Tepat Waktu</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#fffbeb" }}>
              <Clock style={{ width: "1.125rem", height: "1.125rem", color: "#d97706" }} />
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{stats.terlambat}</div>
          <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Terlambat</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#fef2f2" }}>
              <UserX style={{ width: "1.125rem", height: "1.125rem", color: "#dc2626" }} />
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{stats.tidakHadir}</div>
          <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Tidak Hadir</div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-default)" }}>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-full sm:max-w-xs" style={{ background: "var(--bg-page)", border: "1px solid var(--border-default)" }}>
            <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
            <input type="search" placeholder="Cari karyawan..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-primary)" }} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead>Jam Masuk</TableHead>
                <TableHead>Jam Keluar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
                    Belum ada data absensi hari ini
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((record) => {
                  const badge = getStatusBadge(record.statusKehadiran)
                  return (
                    <TableRow key={record.idAbsensi}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: "var(--color-primary)" }}>
                            {record.karyawan?.nama?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                          </div>
                          <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{record.karyawan?.nama || "—"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{record.karyawan?.departemen?.namaDepartemen || "—"}</TableCell>
                      <TableCell className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{formatTime(record.jamMasukAktual)}</TableCell>
                      <TableCell className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{formatTime(record.jamKeluarAktual)}</TableCell>
                      <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                      <TableCell className="text-sm capitalize" style={{ color: "var(--text-muted)" }}>{record.metodeAbsen || "—"}</TableCell>
                      <TableCell>
                        <button onClick={() => handleDelete(record.idAbsensi)} className="flex h-8 w-8 items-center justify-center rounded-md transition-colors" style={{ color: "var(--text-muted)" }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
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
