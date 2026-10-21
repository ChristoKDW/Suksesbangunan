"use client"

import { showError } from "@/lib/swal"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { LatticeLoader, Skeleton } from "@/components/atoms"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { Departemen, Jabatan, Karyawan } from "@/lib/types"
import AssetSection, { PendingAsset } from "./AssetSection"

type FormState = {
  nik: string
  nama: string
  email: string
  nomorTelepon: string
  noRekening: string
  namaBank: string
  jenisKelamin: string
  statusKaryawan: string
  idDepartemen: number
  idJabatan: number
  tanggalMasuk: string
  statusAktif: string
  gajiPokok: number
  tunjanganKonsumsiHari: number
  tunjanganTransportasi: number
  tunjanganKomunikasi: number
  tunjanganJabatan: number
  potonganBpjs: number
  hariLibur: string
  hakCuti: boolean
  namaPanggilan: string
  agama: string
  tempatLahir: string
  tanggalLahir: string
  statusPerkawinan: string
  namaIbuKandung: string
  kotaTerbitKtp: string
  kabupaten: string
  kecamatan: string
  kelurahan: string
  rtRw: string
  fotoKtp: string
  fotoKartuKeluarga: string
}

const emptyForm: FormState = {
  nik: "",
  nama: "",
  email: "",
  nomorTelepon: "",
  noRekening: "",
  namaBank: "BNI",
  jenisKelamin: "Laki-laki",
  statusKaryawan: "Internal",
  idDepartemen: 0,
  idJabatan: 0,
  tanggalMasuk: "",
  statusAktif: "aktif",
  gajiPokok: 0,
  tunjanganKonsumsiHari: 20000,
  tunjanganTransportasi: 0,
  tunjanganKomunikasi: 0,
  tunjanganJabatan: 0,
  potonganBpjs: 0,
  hariLibur: "Minggu",
  hakCuti: false,
  namaPanggilan: "",
  agama: "",
  tempatLahir: "",
  tanggalLahir: "",
  statusPerkawinan: "Belum Kawin",
  namaIbuKandung: "",
  kotaTerbitKtp: "",
  kabupaten: "",
  kecamatan: "",
  kelurahan: "",
  rtRw: "",
  fotoKtp: "",
  fotoKartuKeluarga: "",
}

const inputClass = "w-full bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
const requiredFields: Array<[keyof FormState, string, (v: unknown) => boolean]> = [
  ["nik", "NIK", (v) => String(v || "").trim().length > 0],
  ["nama", "Nama", (v) => String(v || "").trim().length > 0],
  ["email", "Email", (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ""))],
  ["nomorTelepon", "Nomor Telepon", (v) => String(v || "").trim().length > 0],
]

function Label({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return <label className="text-xs font-medium text-[var(--text-secondary)]">{children}{required && <span className="text-red-500"> *</span>}</label>
}

function getMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith("http")) return url
  const base = process.env.NEXT_PUBLIC_API_URL || "https://api.larasbysuksesbangunan.my.id"
  return `${base.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`
}

function toForm(emp: Karyawan): FormState {
  return {
    ...emptyForm,
    nik: emp.nik || "",
    nama: emp.nama || "",
    email: emp.email || "",
    nomorTelepon: emp.nomorTelepon || "",
    noRekening: emp.noRekening || "",
    namaBank: emp.namaBank || "",
    jenisKelamin: emp.jenisKelamin || "Laki-laki",
    statusKaryawan: emp.statusKaryawan || "Internal",
    idDepartemen: emp.idDepartemen || emp.departemen?.idDepartemen || 0,
    idJabatan: emp.idJabatan || emp.jabatan?.idJabatan || 0,
    tanggalMasuk: emp.tanggalMasuk ? emp.tanggalMasuk.split("T")[0] : "",
    statusAktif: emp.statusAktif || "aktif",
    gajiPokok: Number(emp.gajiPokok || 0),
    tunjanganKonsumsiHari: Number(emp.tunjanganKonsumsiHari ?? 20000),
    tunjanganTransportasi: Number(emp.tunjanganTransportasi || 0),
    tunjanganKomunikasi: Number(emp.tunjanganKomunikasi || 0),
    tunjanganJabatan: Number(emp.tunjanganJabatan || 0),
    potonganBpjs: Number(emp.potonganBpjs || 0),
    hariLibur: emp.hariLibur || "Minggu",
    hakCuti: !!emp.hakCuti,
    namaPanggilan: emp.namaPanggilan || "",
    agama: emp.agama || "",
    tempatLahir: emp.tempatLahir || "",
    tanggalLahir: emp.tanggalLahir || "",
    statusPerkawinan: emp.statusPerkawinan || "Belum Kawin",
    namaIbuKandung: emp.namaIbuKandung || "",
    kotaTerbitKtp: emp.kotaTerbitKtp || "",
    kabupaten: emp.kabupaten || "",
    kecamatan: emp.kecamatan || "",
    kelurahan: emp.kelurahan || "",
    rtRw: emp.rtRw || "",
    fotoKtp: emp.fotoKtp || "",
    fotoKartuKeluarga: emp.fotoKartuKeluarga || "",
  }
}

function toBody(form: FormState) {
  return {
    nik: form.nik.trim(),
    nama: form.nama.trim(),
    email: form.email.trim(),
    nomorTelepon: form.nomorTelepon.trim(),
    noRekening: form.noRekening.trim() || undefined,
    namaBank: form.namaBank.trim() || undefined,
    jenisKelamin: form.jenisKelamin,
    statusKaryawan: form.statusKaryawan || "Internal",
    idDepartemen: form.idDepartemen || undefined,
    idJabatan: form.idJabatan || undefined,
    tanggalMasuk: form.tanggalMasuk || undefined,
    statusAktif: form.statusAktif,
    hakCuti: form.hakCuti,
    gajiPokok: Number(form.gajiPokok || 0),
    tunjanganKonsumsiHari: Number(form.tunjanganKonsumsiHari || 0),
    tunjanganTransportasi: Number(form.tunjanganTransportasi || 0),
    tunjanganKomunikasi: Number(form.tunjanganKomunikasi || 0),
    tunjanganJabatan: Number(form.tunjanganJabatan || 0),
    potonganBpjs: Number(form.potonganBpjs || 0),
    hariLibur: form.hariLibur || "Minggu",
    namaPanggilan: form.namaPanggilan.trim() || undefined,
    agama: form.agama.trim() || undefined,
    tempatLahir: form.tempatLahir.trim() || undefined,
    tanggalLahir: form.tanggalLahir.trim() || undefined,
    statusPerkawinan: form.statusPerkawinan.trim() || undefined,
    namaIbuKandung: form.namaIbuKandung.trim() || undefined,
    kotaTerbitKtp: form.kotaTerbitKtp.trim() || undefined,
    kabupaten: form.kabupaten.trim() || undefined,
    kecamatan: form.kecamatan.trim() || undefined,
    kelurahan: form.kelurahan.trim() || undefined,
    rtRw: form.rtRw.trim() || undefined,
    fotoKtp: form.fotoKtp.trim() || undefined,
    fotoKartuKeluarga: form.fotoKartuKeluarga.trim() || undefined,
  }
}

export default function EmployeeForm({ id }: { id?: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [departments, setDepartments] = useState<Departemen[]>([])
  const [positions, setPositions] = useState<Jabatan[]>([])
  const [loading, setLoading] = useState(!!id)
  const [submitting, setSubmitting] = useState(false)
  const [missing, setMissing] = useState<string[]>([])
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [dept, jab, emp] = await Promise.all([
          api.get<Departemen[]>("departemen"),
          api.get<Jabatan[]>("jabatan"),
          id ? api.get<Karyawan>(`karyawan/${id}`) : Promise.resolve(null),
        ])
        setDepartments(dept)
        setPositions(jab)
        if (emp) setForm(toForm(emp))
      } catch (err) {
        showError(err instanceof Error ? err.message : "Gagal memuat data karyawan")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const bad = requiredFields.filter(([key, , ok]) => !ok(form[key])).map(([, label]) => label)
    setMissing(bad)
    if (bad.length) return
    setSubmitting(true)
    try {
      if (id) {
        await api.patch(`karyawan/${id}`, toBody(form))
      } else {
        const created = await api.post<Karyawan>("karyawan", toBody(form))
        const newId = created?.idKaryawan
        if (newId && pendingAssets.length > 0) {
          for (const asset of pendingAssets) {
            try {
              await api.post("aset", {
                idKaryawan: newId,
                kodeBarang: asset.kodeBarang,
                namaBarang: asset.namaBarang,
                tanggalPinjam: asset.tanggalPinjam,
                durasi: asset.durasi,
                keterangan: asset.keterangan || undefined,
              })
            } catch (assetErr) {
              console.error("Gagal menyimpan aset:", assetErr)
            }
          }
        }
      }
      router.push("/employees")
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gagal menyimpan karyawan")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="border-b border-[var(--border-default)]">
          <button onClick={() => router.push("/employees")} className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"><ArrowLeft className="h-4 w-4" /> Kembali</button>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{id ? "Edit Karyawan" : "Tambah Karyawan"}</h1>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="border-b border-[var(--border-default)]">
        <button onClick={() => router.push("/employees")} className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"><ArrowLeft className="h-4 w-4" /> Kembali</button>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{id ? "Edit Karyawan" : "Tambah Karyawan"}</h1>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate className="space-y-5 pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label required>NIK</Label><input className={inputClass} value={form.nik} onChange={(e) => set("nik", e.target.value)} /></div>
            <div className="space-y-1"><Label required>Nama</Label><input className={inputClass} value={form.nama} onChange={(e) => set("nama", e.target.value)} /></div>
            <div className="space-y-1"><Label required>Email</Label><input type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div className="space-y-1"><Label required>Nomor Telepon</Label><input type="tel" className={inputClass} value={form.nomorTelepon} onChange={(e) => set("nomorTelepon", e.target.value)} /></div>
            <div className="space-y-1">
              <Label>Nama Bank</Label>
              <select
                className={inputClass}
                value={form.namaBank || "BNI"}
                onChange={(e) => set("namaBank", e.target.value)}
              >
                <option value="BNI">BNI (Bank Negara Indonesia)</option>
                <option value="BCA">BCA (Bank Central Asia)</option>
                <option value="Mandiri">Bank Mandiri</option>
                <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                <option value="Lainnya">Bank Lainnya</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>No. Rekening ({form.namaBank || "BNI"})</Label>
              <input
                maxLength={form.namaBank === "BNI" || !form.namaBank ? 10 : 34}
                className={inputClass}
                placeholder={form.namaBank === "BNI" || !form.namaBank ? "Contoh: 2091165610 (10 digit BNI)" : "Masukkan nomor rekening"}
                value={form.noRekening}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "")
                  set("noRekening", val)
                }}
              />
              <p className="text-[11px] text-[var(--text-muted)]">
                {form.namaBank === "BNI" || !form.namaBank
                  ? "Standar payroll CV Sukses Bangunan menggunakan rekening BNI (10 digit angka)."
                  : "Pastikan nomor rekening sesuai dengan bank yang dipilih."}
              </p>
            </div>
            <div className="space-y-1"><Label>Departemen</Label><select className={inputClass} value={form.idDepartemen} onChange={(e) => set("idDepartemen", Number(e.target.value))}><option value={0}>Pilih departemen</option>{departments.map((d) => <option key={d.idDepartemen} value={d.idDepartemen}>{d.namaDepartemen}</option>)}</select></div>
            <div className="space-y-1"><Label>Jabatan</Label><select className={inputClass} value={form.idJabatan} onChange={(e) => set("idJabatan", Number(e.target.value))}><option value={0}>Pilih jabatan</option>{positions.map((j) => <option key={j.idJabatan} value={j.idJabatan}>{j.namaJabatan}</option>)}</select></div>
            <div className="space-y-1"><Label>Tanggal Masuk</Label><input type="date" className={inputClass} value={form.tanggalMasuk} onChange={(e) => set("tanggalMasuk", e.target.value)} /></div>
            <div className="space-y-1"><Label>Jenis Kelamin</Label><select className={inputClass} value={form.jenisKelamin} onChange={(e) => set("jenisKelamin", e.target.value)}><option>Laki-laki</option><option>Perempuan</option></select></div>
            <div className="space-y-1">
              <Label required>Status Karyawan</Label>
              <select className={inputClass} value={form.statusKaryawan} onChange={(e) => set("statusKaryawan", e.target.value)}>
                <option value="Internal">Internal (Digaji CV Sukses Bangunan)</option>
                <option value="External">External (Hanya Absensi / Digaji Vendor Sendiri)</option>
              </select>
            </div>
            {id && <div className="space-y-1"><Label>Status</Label><select className={inputClass} value={form.statusAktif} onChange={(e) => set("statusAktif", e.target.value)}><option value="aktif">Aktif</option><option value="cuti">Cuti</option><option value="resign">Resign</option></select></div>}
          </div>

          {/* Data Identitas & Kependudukan (KTP & KK) */}
          <div className="rounded-lg border border-[var(--border-default)] p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                Data Identitas & Kependudukan (KTP & KK)
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                Data dari pendaftaran karyawan / KTP & KK
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label>Nama Panggilan</Label>
                <input
                  className={inputClass}
                  placeholder="Contoh: Budi"
                  value={form.namaPanggilan}
                  onChange={(e) => set("namaPanggilan", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Tempat Lahir</Label>
                <input
                  className={inputClass}
                  placeholder="Kota/Kabupaten lahir"
                  value={form.tempatLahir}
                  onChange={(e) => set("tempatLahir", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Tanggal Lahir</Label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.tanggalLahir}
                  onChange={(e) => set("tanggalLahir", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Agama</Label>
                <select
                  className={inputClass}
                  value={form.agama}
                  onChange={(e) => set("agama", e.target.value)}
                >
                  <option value="">Pilih Agama</option>
                  <option value="Islam">Islam</option>
                  <option value="Kristen Protestan">Kristen Protestan</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Konghucu">Konghucu</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label>Status Perkawinan</Label>
                <select
                  className={inputClass}
                  value={form.statusPerkawinan}
                  onChange={(e) => set("statusPerkawinan", e.target.value)}
                >
                  <option value="Belum Kawin">Belum Kawin</option>
                  <option value="Kawin">Kawin</option>
                  <option value="Cerai Hidup">Cerai Hidup</option>
                  <option value="Cerai Mati">Cerai Mati</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label>Nama Ibu Kandung</Label>
                <input
                  className={inputClass}
                  placeholder="Nama ibu kandung"
                  value={form.namaIbuKandung}
                  onChange={(e) => set("namaIbuKandung", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Kota Terbit KTP</Label>
                <input
                  className={inputClass}
                  placeholder="Kota/Kab. terbit KTP"
                  value={form.kotaTerbitKtp}
                  onChange={(e) => set("kotaTerbitKtp", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Kabupaten / Kota</Label>
                <input
                  className={inputClass}
                  placeholder="Contoh: Gowa / Makassar"
                  value={form.kabupaten}
                  onChange={(e) => set("kabupaten", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Kecamatan</Label>
                <input
                  className={inputClass}
                  placeholder="Contoh: Somba Opu"
                  value={form.kecamatan}
                  onChange={(e) => set("kecamatan", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Kelurahan / Desa</Label>
                <input
                  className={inputClass}
                  placeholder="Contoh: Sungguminasa"
                  value={form.kelurahan}
                  onChange={(e) => set("kelurahan", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>RT / RW</Label>
                <input
                  className={inputClass}
                  placeholder="Contoh: 001/002"
                  value={form.rtRw}
                  onChange={(e) => set("rtRw", e.target.value)}
                />
              </div>
            </div>

            {/* Dokumen Foto KTP & KK */}
            <div className="grid gap-4 sm:grid-cols-2 pt-3 border-t border-[var(--border-default)]">
              <div className="rounded-lg border border-[var(--border-default)] p-3 bg-[var(--bg-page)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Foto KTP</span>
                  {form.fotoKtp && (
                    <a
                      href={getMediaUrl(form.fotoKtp)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      Buka Foto <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {form.fotoKtp ? (
                  <div className="relative aspect-[3/2] w-full overflow-hidden rounded border border-[var(--border-default)] bg-black/5">
                    <img
                      src={getMediaUrl(form.fotoKtp)!}
                      alt="Foto KTP"
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-24 items-center justify-center rounded border border-dashed border-[var(--border-default)] text-xs text-[var(--text-muted)] text-center p-2">
                    Belum ada foto KTP (diupload oleh karyawan di aplikasi mobile)
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-[var(--border-default)] p-3 bg-[var(--bg-page)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Foto Kartu Keluarga</span>
                  {form.fotoKartuKeluarga && (
                    <a
                      href={getMediaUrl(form.fotoKartuKeluarga)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      Buka Foto <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {form.fotoKartuKeluarga ? (
                  <div className="relative aspect-[3/2] w-full overflow-hidden rounded border border-[var(--border-default)] bg-black/5">
                    <img
                      src={getMediaUrl(form.fotoKartuKeluarga)!}
                      alt="Foto Kartu Keluarga"
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-24 items-center justify-center rounded border border-dashed border-[var(--border-default)] text-xs text-[var(--text-muted)] text-center p-2">
                    Belum ada foto Kartu Keluarga (diupload oleh karyawan di aplikasi mobile)
                  </div>
                )}
              </div>
            </div>
          </div>

          {form.statusKaryawan === "External" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <strong>Info Karyawan External:</strong> Karyawan ini digaji oleh perusahaannya/vendor sendiri. CV Sukses Bangunan hanya mengambil data absensinya saja. Karyawan ini tidak dimasukkan dalam penggajian CV Sukses Bangunan dan slip gaji disembunyikan di aplikasi mobile.
            </div>
          )}

          {user?.role === "HRD" && <div className="space-y-1"><Label>Hak Cuti (Cuti Dibayar)</Label><select className={inputClass} value={form.hakCuti ? "true" : "false"} onChange={(e) => set("hakCuti", e.target.value === "true")}><option value="false">Belum Bisa Cuti</option><option value="true">Bisa Cuti (12 Hari)</option></select></div>}

          {(user?.role === "HRD" || user?.role === "Admin") && (
            <div className="rounded-lg border border-[var(--border-default)] p-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">Pengaturan Gaji & Tunjangan</div>
              <div className="grid gap-3 sm:grid-cols-3">
                {([
                  ["gajiPokok", "Gaji Pokok"], ["tunjanganKonsumsiHari", "Tunj. Konsumsi/Hari"], ["tunjanganTransportasi", "Tunj. Transport"],
                  ["tunjanganKomunikasi", "Tunj. Komunikasi"], ["tunjanganJabatan", "Tunj. Jabatan"], ["potonganBpjs", "Potongan BPJS"],
                ] as Array<[keyof FormState, string]>).map(([key, label]) => (
                  <div key={key} className="space-y-1"><Label>{label}</Label><input type="number" className={inputClass} value={Number(form[key]) || ""} onChange={(e) => set(key, (e.target.value === "" ? 0 : Number(e.target.value)) as never)} onFocus={(e) => e.target.select()} /></div>
                ))}
              </div>
            </div>
          )}

          {!id && (
            <div className="pt-2">
              <AssetSection
                pendingAssets={pendingAssets}
                onAddPendingAsset={(item) => setPendingAssets((prev) => [...prev, item])}
                onRemovePendingAsset={(idx) => setPendingAssets((prev) => prev.filter((_, i) => i !== idx))}
              />
            </div>
          )}

          {missing.length > 0 && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Harap lengkapi: {missing.join(", ")}</div>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => router.push("/employees")} className="rounded-md px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-raised)]">Batal</button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
            >
              {submitting ? (
                <LatticeLoader
                  status="working"
                  label="Menyimpan..."
                  showTimer={false}
                  cellSize={4}
                  gap={2}
                  fontSize={13}
                  color="#ffffff"
                />
              ) : id ? (
                "Simpan Perubahan"
              ) : (
                "Simpan Karyawan"
              )}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
