"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules"
import { Badge } from "@/components/atoms"
import { Search, Plus, Edit2, Trash2, Loader2, Key, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { Karyawan } from "@/lib/types"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://alfiyah.my.id"

function getPhotoUrl(fotoProfil?: string | null) {
  if (!fotoProfil) return null
  if (fotoProfil.startsWith("http://") || fotoProfil.startsWith("https://")) return fotoProfil
  const clean = fotoProfil.replace(/\\/g, "/")
  return `${BASE_URL.replace(/\/+$/, "")}/${clean.replace(/^\/+/, "")}`
}

const variantMap: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  aktif: "success",
  cuti: "warning",
  resign: "destructive",
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatTanggal(dateStr?: string | null) {
  if (!dateStr) return "—"
  try {
    const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr
    const parts = cleanDate.split("-")
    if (parts.length === 3) {
      const year = Number(parts[0])
      const month = Number(parts[1]) - 1
      const day = Number(parts[2])
      const d = new Date(year, month, day)
      return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    }
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return dateStr
  }
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total]
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total]
  }
  return [1, "...", current - 1, current, current + 1, "...", total]
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Karyawan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { user } = useAuth()

  const fetchData = async () => {
    try {
      const emp = await api.get<Karyawan[]>("karyawan")
      setEmployees(emp)
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  const activeCount = employees.filter((e) => e.statusAktif === "aktif").length

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.jenisKelamin && emp.jenisKelamin.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const totalFiltered = filteredEmployees.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalFiltered)
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex)

  const handleDeleteEmployee = async (id: number) => {
    if (user?.role !== "Admin") {
      alert("Hanya Admin yang berhak menghapus data karyawan.")
      return
    }
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus data karyawan ini secara permanen? Data riwayat jadwal, absensi, izin, dan penggajian terkait karyawan ini juga akan ikut dibersihkan."
      )
    )
      return
    try {
      await api.delete(`karyawan/${id}`)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus karyawan")
    }
  }

  const handleApproveReset = async (id: number) => {
    if (!confirm("Setujui permintaan reset password untuk karyawan ini? Karyawan akan dapat membuat password baru."))
      return
    try {
      await api.patch(`karyawan/${id}/approve-reset`, {})
      alert("Permintaan reset password disetujui.")
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyetujui reset password")
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
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {employees.length} total · {activeCount} aktif
          </p>
        </div>
        <Link
          href="/employees/new"
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
        >
          <Plus className="w-4 h-4" />
          Tambah Karyawan
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-[var(--border-default)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-full sm:max-w-xs bg-[var(--bg-page)] border border-[var(--border-default)]">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
            <input
              type="search"
              placeholder="Cari nama, NIK, atau username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>NIK</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Jenis Kelamin</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Tgl Masuk</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-sm text-[var(--text-muted)]">
                    Tidak ada data karyawan yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEmployees.map((emp) => (
                <TableRow key={emp.idKaryawan}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {emp.fotoProfil ? (
                        <img
                          src={getPhotoUrl(emp.fotoProfil)!}
                          alt={emp.nama}
                          className="h-9 w-9 flex-shrink-0 rounded-full object-cover border border-[var(--border-default)] shadow-sm"
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = "none"
                            const fallback = (e.target as HTMLElement).parentElement?.querySelector(".avatar-fallback")
                            if (fallback) fallback.classList.remove("hidden")
                          }}
                        />
                      ) : null}
                      <div
                        className={`avatar-fallback flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${emp.fotoProfil ? "hidden" : ""}`}
                        style={{ background: "var(--color-primary)" }}
                      >
                        {emp.nama
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
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
                  <TableCell className="text-sm font-mono text-[var(--text-secondary)]">
                    <div className="flex flex-col gap-1 items-start">
                      {emp.username || <span className="font-sans text-[var(--text-muted)]">Belum dibuat</span>}
                      {emp.resetPasswordStatus === "pending" && (
                        <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                          Reset Pending
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {emp.jenisKelamin === "Perempuan" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-700 border border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800">
                        Perempuan
                      </span>
                    ) : emp.jenisKelamin === "Laki-laki" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
                        Laki-laki
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-[var(--text-secondary)]">
                    {emp.departemen?.namaDepartemen || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-[var(--text-secondary)]">
                    {emp.jabatan?.namaJabatan || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-[var(--text-secondary)]">
                    {formatTanggal(emp.tanggalMasuk)}
                  </TableCell>
                  <TableCell>
                    {emp.statusKaryawan === "External" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                        External
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        Internal
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={variantMap[emp.statusAktif] || "secondary"}>
                      {capitalize(emp.statusAktif)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {emp.resetPasswordStatus === "pending" && (
                        <button
                          onClick={() => handleApproveReset(emp.idKaryawan)}
                          title="Setujui Reset Password"
                          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors bg-amber-100 text-amber-700 hover:bg-amber-200"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      )}
                      <Link
                        href={`/employees/${emp.idKaryawan}/edit`}
                        title="Edit Karyawan"
                        className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-[var(--color-primary)]"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      {user?.role === "Admin" && (
                        <button
                          onClick={() => handleDeleteEmployee(emp.idKaryawan)}
                          title="Hapus Karyawan"
                          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[var(--text-muted)] hover:bg-[var(--bg-page)] hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-[var(--border-default)] bg-[var(--bg-card)]">
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
              <span>
                Menampilkan{" "}
                <strong className="text-[var(--text-primary)]">
                  {totalFiltered > 0 ? startIndex + 1 : 0}
                </strong>
                {" - "}
                <strong className="text-[var(--text-primary)]">{endIndex}</strong> dari{" "}
                <strong className="text-[var(--text-primary)]">{totalFiltered}</strong> karyawan
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span>Baris:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded border border-[var(--border-default)] bg-[var(--bg-page)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="Halaman Pertama"
                className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Halaman Sebelumnya"
                className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                  p === "..." ? (
                    <span key={`dots-${idx}`} className="px-1 text-xs text-[var(--text-muted)]">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${p}`}
                      onClick={() => setCurrentPage(Number(p))}
                      className={`flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-xs font-medium transition-colors ${
                        currentPage === p
                          ? "bg-[var(--color-primary)] text-white shadow-sm"
                          : "border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-raised)]"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title="Halaman Selanjutnya"
                className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Halaman Terakhir"
                className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
