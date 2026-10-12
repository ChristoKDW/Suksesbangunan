"use client"

import { showError } from "@/lib/swal"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/molecules"
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
    idDepartemen: emp.idDepartemen || 0,
    idJabatan: emp.idJabatan || 0,
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

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" /></div>

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
            <div className="space-y-1"><Label>No. Rekening (BNI)</Label><input maxLength={34} className={inputClass} value={form.noRekening} onChange={(e) => set("noRekening", e.target.value)} /></div>
            <div className="space-y-1"><Label>Nama Bank</Label><input maxLength={50} className={inputClass} value={form.namaBank} onChange={(e) => set("namaBank", e.target.value)} /></div>
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
            <button type="submit" disabled={submitting} className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60">{submitting ? "Menyimpan..." : id ? "Simpan Perubahan" : "Simpan Karyawan"}</button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
