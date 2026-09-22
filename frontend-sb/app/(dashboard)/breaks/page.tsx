"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Badge } from "@/components/atoms"
import { Search, Download, Coffee, AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import type { Istirahat, Absensi, Karyawan } from "@/lib/types"

function formatTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false })
}

export default function BreaksPage() {
  const [breaks, setBreaks] = useState<Istirahat[]>([])
  const [absensiList, setAbsensiList] = useState<Absensi[]>([])
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = async () => {
    try {
      const [ist, abs, kar] = await Promise.all([
        api.get<Istirahat[]>("istirahat"),
        api.get<Absensi[]>("absensi"),
        api.get<Karyawan[]>("karyawan"),
      ])
      setBreaks(ist)
      setAbsensiList(abs)
      setKaryawanList(kar)
    } catch (err) {
      console.error("Failed to fetch break data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus record istirahat ini?")) return
    try {
      await api.delete(`istirahat/${id}`)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus")
    }
  }

  // Build lookup maps for joining
  const absensiMap = useMemo(() => {
    const map: Record<number, Absensi> = {}
    absensiList.forEach(a => { map[a.idAbsensi] = a })
    return map
  }, [absensiList])

  const karyawanMap = useMemo(() => {
    const map: Record<number, Karyawan> = {}
    karyawanList.forEach(k => { map[k.idKaryawan] = k })
    return map
  }, [karyawanList])

  // Enrich break records with karyawan info
  const enrichedBreaks = useMemo(() => {
    return breaks.map(b => {
      const absensi = absensiMap[b.idAbsensi] || b.absensi
      const idKaryawan = absensi?.idKaryawan
      const karyawan = idKaryawan ? (karyawanMap[idKaryawan] || absensi?.karyawan) : null
      return { ...b, karyawan, absensi }
    })
  }, [breaks, absensiMap, karyawanMap])

  const filteredData = enrichedBreaks.filter(record =>
    (record.karyawan?.nama || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Stats
  const activeBreaks = enrichedBreaks.filter(b => !b.jamMasukIstirahat).length
  const overtimeBreaks = enrichedBreaks.filter(b => b.terlambatKembali).length
  const onTimeBreaks = enrichedBreaks.filter(b => b.durasiMenit !== null && b.durasiMenit <= 60).length

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--text-muted)" }} /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Waktu Istirahat</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{enrichedBreaks.length} total record</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#eff6ff" }}>
              <Coffee style={{ width: "1.125rem", height: "1.125rem", color: "#2563eb" }} />
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{activeBreaks}</div>
          <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Sedang Istirahat</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#fef2f2" }}>
              <AlertCircle style={{ width: "1.125rem", height: "1.125rem", color: "#dc2626" }} />
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{overtimeBreaks}</div>
          <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Terlambat Kembali</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#f0fdf4" }}>
              <CheckCircle2 style={{ width: "1.125rem", height: "1.125rem", color: "#16a34a" }} />
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{onTimeBreaks}</div>
          <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Tepat Waktu</div>
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
                <TableHead>Keluar</TableHead>
                <TableHead>Kembali</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>Kelebihan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
                    Belum ada data istirahat
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((record) => {
                  const isActive = !record.jamMasukIstirahat
                  const isOvertime = record.terlambatKembali || record.terlambatAktif
                  return (
                    <TableRow key={record.idIstirahat}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: "var(--color-primary)" }}>
                            {record.karyawan?.nama?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "?"}
                          </div>
                          <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{record.karyawan?.nama || `Absensi #${record.idAbsensi}`}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{record.karyawan?.departemen?.namaDepartemen || "—"}</TableCell>
                      <TableCell className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{formatTime(record.jamKeluarIstirahat)}</TableCell>
                      <TableCell className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{formatTime(record.jamMasukIstirahat)}</TableCell>
                      <TableCell className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                        {record.durasiMenit !== null
                          ? `${record.durasiMenit} min`
                          : `${record.durasiAktifMenit || 0} min (aktif)`}
                      </TableCell>
                      <TableCell className="text-sm font-mono" style={{ color: isOvertime ? "#dc2626" : "var(--text-secondary)" }}>
                        {record.kelebihanMenit > 0 ? `+${record.kelebihanMenit} min` : "—"}
                      </TableCell>
                      <TableCell>
                        {isActive ? (
                          <Badge variant="warning">Istirahat</Badge>
                        ) : isOvertime ? (
                          <Badge variant="destructive">{isActive ? "Terlambat Aktif" : "Terlambat Kembali"}</Badge>
                        ) : (
                          <Badge variant="success">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <button onClick={() => handleDelete(record.idIstirahat)} className="flex h-8 w-8 items-center justify-center rounded-md transition-colors" style={{ color: "var(--text-muted)" }}>
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
