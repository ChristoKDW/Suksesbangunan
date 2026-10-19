"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Edit2,
  Loader2,
  ShieldCheck,
  UserCheck,
  Calendar,
  Mail,
  Phone,
  Building2,
  Briefcase,
  CreditCard,
  MapPin,
  ExternalLink,
  ShieldAlert,
  Package,
  CheckCircle2,
  XCircle,
  FileText,
  User as UserIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { Badge, Skeleton } from "@/components/atoms"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { Karyawan } from "@/lib/types"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.larasbysuksesbangunan.my.id"

function getPhotoUrl(foto?: string | null) {
  if (!foto) return null
  if (foto.startsWith("http://") || foto.startsWith("https://")) return foto
  const clean = foto.replace(/\\/g, "/")
  return `${BASE_URL.replace(/\/+$/, "")}/${clean.replace(/^\/+/, "")}`
}

function formatTanggal(d?: string | null): string {
  if (!d) return "—"
  try {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return d
  }
}

function hitungUsia(tanggalLahir?: string | null): string {
  if (!tanggalLahir) return ""
  try {
    const lahir = new Date(tanggalLahir)
    const now = new Date()
    let usia = now.getFullYear() - lahir.getFullYear()
    const m = now.getMonth() - lahir.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < lahir.getDate())) {
      usia--
    }
    return usia > 0 ? ` (${usia} tahun)` : ""
  } catch {
    return ""
  }
}

function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "Rp 0"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface Asset {
  idPeminjamanAset: number
  kodeBarang: string
  namaBarang: string
  tanggalPinjam: string
  durasi: string
  keterangan?: string | null
  status: "dipinjam" | "dikembalikan"
  tanggalDikembalikan?: string | null
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()
  const { user } = useAuth()

  const [employee, setEmployee] = useState<Karyawan | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empData, assetData] = await Promise.all([
          api.get<Karyawan>(`karyawan/${id}`),
          api.get<Asset[]>(`aset?idKaryawan=${id}`).catch(() => []),
        ])
        setEmployee(empData)
        setAssets(assetData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat detail karyawan")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6 pb-12 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4">
          <div>
            <button
              onClick={() => router.push("/employees")}
              className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Karyawan
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Detail Karyawan
              </h1>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </div>

        {/* Hero Skeleton Card */}
        <Card className="overflow-hidden border border-[var(--border-default)] shadow-xs">
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 h-28 relative" />
          <CardContent className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-14 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <Skeleton className="h-28 w-28 rounded-2xl ring-4 ring-white dark:ring-slate-900" />
                <div className="space-y-2 pb-1">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detail Tabs Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </Card>
          <Card className="p-6 md:col-span-2 space-y-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </Card>
        </div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
          <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-rose-500" />
          <h2 className="text-lg font-bold">Terjadi Kesalahan</h2>
          <p className="text-sm mt-1">{error || "Karyawan tidak ditemukan"}</p>
          <button
            onClick={() => router.push("/employees")}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Karyawan
          </button>
        </div>
      </div>
    )
  }

  const isHrdOrAdmin = user?.role === "Admin" || user?.role === "HRD"
  const fotoProfilUrl = getPhotoUrl(employee.fotoProfil)
  const fotoKtpUrl = getPhotoUrl(employee.fotoKtp)
  const fotoKkUrl = getPhotoUrl(employee.fotoKartuKeluarga)

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4">
        <div>
          <button
            onClick={() => router.push("/employees")}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Karyawan
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Detail Karyawan
            </h1>
            <Badge
              variant={
                employee.statusAktif === "aktif"
                  ? "success"
                  : employee.statusAktif === "cuti"
                  ? "warning"
                  : "destructive"
              }
            >
              {employee.statusAktif.toUpperCase()}
            </Badge>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                employee.statusKaryawan === "External"
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              {employee.statusKaryawan || "Internal"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/employees/${employee.idKaryawan}/edit`}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-all"
          >
            <Edit2 className="w-4 h-4" /> Edit Karyawan
          </Link>
        </div>
      </div>

      {/* Hero Profile Banner */}
      <Card className="overflow-hidden border border-[var(--border-default)] shadow-xs">
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 h-28 relative" />
        <CardContent className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-14 mb-4">
            <div className="flex items-end gap-4">
              {fotoProfilUrl ? (
                <img
                  src={fotoProfilUrl}
                  alt={employee.nama}
                  className="h-24 w-24 rounded-2xl object-cover border-4 border-[var(--bg-card)] shadow-md bg-white"
                />
              ) : (
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-2xl text-2xl font-black text-white border-4 border-[var(--bg-card)] shadow-md"
                  style={{ background: "var(--color-primary)" }}
                >
                  {employee.nama
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
                  {employee.nama}
                  {employee.namaPanggilan && (
                    <span className="text-sm font-normal text-[var(--text-muted)]">
                      (&quot;{employee.namaPanggilan}&quot;)
                    </span>
                  )}
                </h2>
                <div className="text-xs text-[var(--text-muted)] flex items-center gap-2 font-mono mt-0.5">
                  <span>NIK: {employee.nik}</span>
                  {employee.username && (
                    <>
                      <span>•</span>
                      <span>Username: @{employee.username}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Hak Kelola Akses & Biometrik Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {employee.hakAkses?.hasAccess ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                  <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span>Hak Akses: {employee.hakAkses.label}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  <UserIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span>Staf Operasional</span>
                </div>
              )}

              {employee.fotoWajahReferensi ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Wajah Terdaftar</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                  <XCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Wajah Belum Terdaftar</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Informasi Kepegawaian & Kontak */}
        <Card>
          <CardHeader className="border-b border-[var(--border-default)] pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <Briefcase className="w-4 h-4 text-[var(--color-primary)]" />
              Informasi Kepegawaian & Kontak
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3.5 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-default)]/60">
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Departemen
              </span>
              <span className="font-semibold text-[var(--text-primary)]">
                {employee.departemen?.namaDepartemen || "—"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-default)]/60">
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Jabatan
              </span>
              <span className="font-semibold text-[var(--text-primary)]">
                {employee.jabatan?.namaJabatan || "—"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-default)]/60">
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </span>
              <span className="font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                {employee.email || "—"}
                {employee.emailTerverifikasi && (
                  <span title="Email Terverifikasi">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </span>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-default)]/60">
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> No. Telepon / WA
              </span>
              <span className="font-medium text-[var(--text-primary)]">
                {employee.nomorTelepon || "—"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-default)]/60">
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Tanggal Mulai Bekerja
              </span>
              <span className="font-semibold text-[var(--text-primary)]">
                {formatTanggal(employee.tanggalMasuk)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-default)]/60">
              <span className="text-xs text-[var(--text-muted)]">Hari Libur Rutin</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {employee.hariLibur || "Minggu"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-[var(--text-muted)]">Hak Cuti Tahunan</span>
              <span
                className={`font-semibold ${
                  employee.hakCuti ? "text-emerald-600" : "text-slate-500"
                }`}
              >
                {employee.hakCuti ? "Aktif (Berhak Cuti)" : "Tidak Aktif"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Identitas Pribadi & Kependudukan */}
        <Card>
          <CardHeader className="border-b border-[var(--border-default)] pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <UserCheck className="w-4 h-4 text-[var(--color-primary)]" />
              Identitas Kependudukan (KTP)
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3.5 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-default)]/60">
              <span className="text-xs text-[var(--text-muted)]">Tempat, Tanggal Lahir</span>
              <span className="font-medium text-[var(--text-primary)] text-right">
                {employee.tempatLahir ? `${employee.tempatLahir}, ` : ""}
                {formatTanggal(employee.tanggalLahir)}
                {hitungUsia(employee.tanggalLahir)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-default)]/60">
              <span className="text-xs text-[var(--text-muted)]">Jenis Kelamin</span>
              <span className="font-medium text-[var(--text-primary)]">
                {employee.jenisKelamin || "—"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-default)]/60">
              <span className="text-xs text-[var(--text-muted)]">Agama</span>
              <span className="font-medium text-[var(--text-primary)]">
                {employee.agama || "—"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-default)]/60">
              <span className="text-xs text-[var(--text-muted)]">Status Pernikahan</span>
              <span className="font-medium text-[var(--text-primary)]">
                {employee.statusPerkawinan || "Belum Kawin"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[var(--border-default)]/60">
              <span className="text-xs text-[var(--text-muted)]">Nama Ibu Kandung</span>
              <span className="font-medium text-[var(--text-primary)]">
                {employee.namaIbuKandung || "—"}
              </span>
            </div>

            <div className="flex justify-between items-start py-1">
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5" /> Alamat / Domisili
              </span>
              <div className="text-right text-xs space-y-0.5 text-[var(--text-primary)]">
                <div>RT/RW: {employee.rtRw || "—"}</div>
                <div>Kelurahan: {employee.kelurahan || "—"}</div>
                <div>Kecamatan: {employee.kecamatan || "—"}</div>
                <div>Kabupaten/Kota: {employee.kabupaten || employee.kotaTerbitKtp || "—"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dokumen Foto KTP & Kartu Keluarga */}
      <Card>
        <CardHeader className="border-b border-[var(--border-default)] pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <FileText className="w-4 h-4 text-[var(--color-primary)]" />
            Dokumen Berkas (Foto KTP & Kartu Keluarga)
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Foto KTP */}
            <div className="rounded-xl border border-[var(--border-default)] p-4 bg-[var(--bg-page)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-primary)]">Foto KTP Asli</span>
                {fotoKtpUrl && (
                  <a
                    href={fotoKtpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    Buka Ukuran Penuh <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              {fotoKtpUrl ? (
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border border-[var(--border-default)] bg-black/5 shadow-2xs">
                  <img
                    src={fotoKtpUrl}
                    alt="Foto KTP Karyawan"
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-36 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-default)] text-xs text-[var(--text-muted)] text-center p-4">
                  <FileText className="w-8 h-8 mb-2 opacity-40" />
                  <span>Belum ada foto KTP</span>
                  <span className="text-[11px] opacity-75 mt-0.5">
                    Karyawan dapat mengunggah melalui aplikasi mobile
                  </span>
                </div>
              )}
            </div>

            {/* Foto Kartu Keluarga */}
            <div className="rounded-xl border border-[var(--border-default)] p-4 bg-[var(--bg-page)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-primary)]">Foto Kartu Keluarga</span>
                {fotoKkUrl && (
                  <a
                    href={fotoKkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    Buka Ukuran Penuh <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              {fotoKkUrl ? (
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border border-[var(--border-default)] bg-black/5 shadow-2xs">
                  <img
                    src={fotoKkUrl}
                    alt="Foto Kartu Keluarga"
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-36 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-default)] text-xs text-[var(--text-muted)] text-center p-4">
                  <FileText className="w-8 h-8 mb-2 opacity-40" />
                  <span>Belum ada foto Kartu Keluarga</span>
                  <span className="text-[11px] opacity-75 mt-0.5">
                    Karyawan dapat mengunggah melalui aplikasi mobile
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Informasi Penggajian & Rekening Bank (Khusus Admin & HRD) */}
      {isHrdOrAdmin && (
        <Card>
          <CardHeader className="border-b border-[var(--border-default)] pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Informasi Penggajian & Rekening Bank
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <div className="rounded-lg border border-[var(--border-default)] p-3 bg-[var(--bg-page)]">
                <span className="text-xs text-[var(--text-muted)] block">Rekening Bank</span>
                <span className="font-bold text-[var(--text-primary)] text-base font-mono">
                  {employee.noRekening || "—"}
                </span>
                <span className="text-xs text-[var(--text-secondary)] block mt-0.5">
                  Bank {employee.namaBank || "BNI"}
                </span>
              </div>

              <div className="rounded-lg border border-[var(--border-default)] p-3 bg-[var(--bg-page)]">
                <span className="text-xs text-[var(--text-muted)] block">Gaji Pokok</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-base">
                  {formatRupiah(employee.gajiPokok)}
                </span>
                <span className="text-xs text-[var(--text-secondary)] block mt-0.5">
                  {employee.statusKaryawan === "External" ? "Karyawan External" : "Per Bulan"}
                </span>
              </div>

              <div className="rounded-lg border border-[var(--border-default)] p-3 bg-[var(--bg-page)]">
                <span className="text-xs text-[var(--text-muted)] block">Uang Makan / Konsumsi</span>
                <span className="font-bold text-blue-700 dark:text-blue-400 text-base">
                  {formatRupiah(employee.tunjanganKonsumsiHari)}
                </span>
                <span className="text-xs text-[var(--text-secondary)] block mt-0.5">
                  Per Hari Hadir
                </span>
              </div>

              <div className="rounded-lg border border-[var(--border-default)] p-3 bg-[var(--bg-page)]">
                <span className="text-xs text-[var(--text-muted)] block">Tunjangan Jabatan</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {formatRupiah(employee.tunjanganJabatan)}
                </span>
              </div>

              <div className="rounded-lg border border-[var(--border-default)] p-3 bg-[var(--bg-page)]">
                <span className="text-xs text-[var(--text-muted)] block">Tunjangan Transportasi</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {formatRupiah(employee.tunjanganTransportasi)}
                </span>
              </div>

              <div className="rounded-lg border border-[var(--border-default)] p-3 bg-[var(--bg-page)]">
                <span className="text-xs text-[var(--text-muted)] block">Tunjangan Komunikasi</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {formatRupiah(employee.tunjanganKomunikasi)}
                </span>
              </div>

              <div className="rounded-lg border border-[var(--border-default)] p-3 bg-[var(--bg-page)]">
                <span className="text-xs text-[var(--text-muted)] block">Potongan BPJS</span>
                <span className="font-semibold text-rose-600">
                  {formatRupiah(employee.potonganBpjs)}
                </span>
              </div>
            </div>

            {employee.statusKaryawan === "External" && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <strong>Catatan Karyawan External:</strong> Karyawan ini digaji langsung oleh perusahaan/vendor mitra. CV Sukses Bangunan hanya mencatat absensi dan karyawan tidak masuk dalam payroll rutin.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Card 4: Riwayat Peminjaman Aset */}
      <Card>
        <CardHeader className="border-b border-[var(--border-default)] pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <Package className="w-4 h-4 text-[var(--color-primary)]" />
              Aset Perusahaan yang Dipinjam ({assets.length})
            </div>
            <Link
              href={`/employees/${employee.idKaryawan}/edit`}
              className="text-xs text-[var(--color-primary)] hover:underline font-semibold"
            >
              + Kelola Aset
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {assets.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)]">
              Belum ada aset perusahaan yang dipinjam oleh karyawan ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--bg-page)] border-b border-[var(--border-default)] text-[var(--text-secondary)] uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Kode Barang</th>
                    <th className="px-4 py-2.5">Nama Barang</th>
                    <th className="px-4 py-2.5">Tgl Pinjam</th>
                    <th className="px-4 py-2.5">Durasi</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {assets.map((ast) => (
                    <tr key={ast.idPeminjamanAset}>
                      <td className="px-4 py-2.5 font-mono font-medium text-[var(--text-primary)]">
                        {ast.kodeBarang}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">
                        {ast.namaBarang}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--text-muted)]">
                        {formatTanggal(ast.tanggalPinjam)}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                        {ast.durasi}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant={ast.status === "dipinjam" ? "warning" : "success"}
                        >
                          {ast.status === "dipinjam" ? "Dipinjam" : "Dikembalikan"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-[var(--text-muted)]">
                        {ast.keterangan || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
