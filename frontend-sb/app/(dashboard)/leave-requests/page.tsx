"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Badge } from "@/components/atoms"
import { Check, X, FileText, Search, Paperclip, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import type { PengajuanIzin } from "@/lib/types"

const jenisIzinLabelMap: Record<string, string> = {
  izin: "Izin",
  sakit: "Izin Sakit",
  cuti: "Cuti Tahunan",
  "dinas luar": "Dinas Luar",
}

const typeColors: Record<string, { bg: string; color: string }> = {
  sakit: { bg: "#fef2f2", color: "#dc2626" },
  cuti: { bg: "#eff6ff", color: "#2563eb" },
  izin: { bg: "#faf5ff", color: "#9333ea" },
  "dinas luar": { bg: "#fffbeb", color: "#d97706" },
}

function getStatusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  switch (status) {
    case "disetujui": return "success"
    case "menunggu": return "warning"
    case "ditolak": return "destructive"
    default: return "secondary"
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<PengajuanIzin[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("Semua")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<PengajuanIzin | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const data = await api.get<PengajuanIzin[]>("pengajuan-izin")
      setRequests(data)
    } catch (err) {
      console.error("Failed to fetch pengajuan izin:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const pendingCount = requests.filter((r) => r.status === "menunggu").length

  const handleApprove = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSubmitting(true)
    try {
      await api.patch(`pengajuan-izin/${id}/approval`, { status: "disetujui" })
      await fetchData()
      if (selectedRequest?.idIzin === id) {
        setSelectedRequest(prev => prev ? { ...prev, status: "disetujui" } : null)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyetujui")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const catatan = prompt("Catatan penolakan (opsional):")
    setSubmitting(true)
    try {
      await api.patch(`pengajuan-izin/${id}/approval`, { status: "ditolak", catatanApproval: catatan || "" })
      await fetchData()
      if (selectedRequest?.idIzin === id) {
        setSelectedRequest(prev => prev ? { ...prev, status: "ditolak" } : null)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menolak")
    } finally {
      setSubmitting(false)
    }
  }

  const tabs = ["Semua", "Menunggu", "Disetujui", "Ditolak"]
  const tabStatusMap: Record<string, string | null> = {
    Semua: null,
    Menunggu: "menunggu",
    Disetujui: "disetujui",
    Ditolak: "ditolak",
  }

  const filteredRequests = requests
    .filter(r => {
      const tabStatus = tabStatusMap[activeTab]
      if (tabStatus && r.status !== tabStatus) return false
      if (searchQuery) {
        return (r.karyawan?.nama || "").toLowerCase().includes(searchQuery.toLowerCase())
      }
      return true
    })

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--text-muted)" }} /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Pengajuan Izin</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {pendingCount > 0 ? `${pendingCount} pengajuan menunggu persetujuan` : "Tidak ada pengajuan menunggu"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--bg-page)", border: "1px solid var(--border-default)" }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              background: activeTab === tab ? "var(--bg-surface)" : "transparent",
              color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {tab}
            {tab === "Menunggu" && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">{pendingCount}</span>
            )}
          </button>
        ))}
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
                <TableHead>Jenis Izin</TableHead>
                <TableHead>Tanggal Mulai</TableHead>
                <TableHead>Tanggal Selesai</TableHead>
                <TableHead>Hari</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
                    Tidak ada pengajuan
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => {
                  const days = daysBetween(req.tanggalMulai, req.tanggalSelesai)
                  const tc = typeColors[req.jenisIzin] || { bg: "#f3f4f6", color: "#6b7280" }
                  return (
                    <TableRow
                      key={req.idIzin}
                      className="cursor-pointer"
                      onClick={() => { setSelectedRequest(req); setIsPreviewOpen(true) }}
                    >
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{req.karyawan?.nama || "—"}</div>
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{req.karyawan?.departemen?.namaDepartemen || "—"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: tc.bg, color: tc.color }}>
                          {jenisIzinLabelMap[req.jenisIzin] || capitalize(req.jenisIzin)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {formatDate(req.tanggalMulai)}
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {formatDate(req.tanggalSelesai)}
                      </TableCell>
                      <TableCell className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{days}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate" style={{ color: "var(--text-muted)" }}>{req.alasan}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(req.status)}>{capitalize(req.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        {req.status === "menunggu" && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleApprove(req.idIzin, e)}
                              disabled={submitting}
                              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors bg-green-50 text-green-600 hover:bg-green-100"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleReject(req.idIzin, e)}
                              disabled={submitting}
                              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors bg-red-50 text-red-600 hover:bg-red-100"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* Detail Preview Modal */}
      {isPreviewOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => setIsPreviewOpen(false)}>
          <div className="bg-[var(--bg-surface)] w-full max-w-lg rounded-xl shadow-xl border border-[var(--border-default)] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Detail Pengajuan</h3>
              <button onClick={() => setIsPreviewOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Karyawan</div>
                  <div className="font-medium text-[var(--text-primary)]">{selectedRequest.karyawan?.nama || "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Departemen</div>
                  <div className="text-[var(--text-secondary)]">{selectedRequest.karyawan?.departemen?.namaDepartemen || "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Jenis</div>
                  <div className="text-[var(--text-secondary)]">{jenisIzinLabelMap[selectedRequest.jenisIzin] || capitalize(selectedRequest.jenisIzin)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Status</div>
                  <Badge variant={getStatusVariant(selectedRequest.status)}>{capitalize(selectedRequest.status)}</Badge>
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Tanggal Mulai</div>
                  <div className="text-[var(--text-secondary)]">{formatDate(selectedRequest.tanggalMulai)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Tanggal Selesai</div>
                  <div className="text-[var(--text-secondary)]">{formatDate(selectedRequest.tanggalSelesai)}</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Alasan</div>
                <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-page)] rounded-md px-3 py-2">{selectedRequest.alasan}</div>
              </div>
              {selectedRequest.filePendukung && (
                <div className="flex items-center gap-2 text-sm">
                  <Paperclip className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-[var(--color-primary)]">{selectedRequest.filePendukung}</span>
                </div>
              )}
              {selectedRequest.catatanApproval && (
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Catatan Approval</div>
                  <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-page)] rounded-md px-3 py-2">{selectedRequest.catatanApproval}</div>
                </div>
              )}
              {selectedRequest.status === "menunggu" && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={(e) => { handleApprove(selectedRequest.idIzin, e); setIsPreviewOpen(false) }}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" /> Setujui
                  </button>
                  <button
                    onClick={(e) => { handleReject(selectedRequest.idIzin, e); setIsPreviewOpen(false) }}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                  >
                    <X className="w-4 h-4" /> Tolak
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
