"use client"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/molecules"
import {
  FileText, Calendar, Users, Briefcase, FileSpreadsheet, Loader2, Landmark, Receipt, BadgeCheck, Info,
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { downloadReport, qs } from "@/lib/download"
import { showApiError, toast } from "@/lib/swal"
import type { Departemen } from "@/lib/types"

interface KaryawanOption {
  idKaryawan: number
  nik: string
  nama: string
  namaPanggilan?: string | null
  statusKaryawan: "Internal" | "External"
  statusAktif?: string
  idDepartemen?: number | null
  departemen: string
}

type Format = "excel" | "pdf" | "csv"

const thisMonth = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" }).slice(0, 7)
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" })

const inputCls =
  "w-full min-w-0 bg-[var(--bg-page)] border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-[var(--text-muted)]">{hint}</p>}
    </div>
  )
}

function ExportButton({
  onClick, loading, disabled, variant, children,
}: {
  onClick: () => void
  loading: boolean
  disabled: boolean
  variant: "excel" | "pdf" | "csv"
  children: ReactNode
}) {
  const color = {
    excel: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
    pdf: "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30",
    csv: "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30",
  }[variant]
  const Icon = variant === "pdf" ? FileText : FileSpreadsheet
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium border transition-colors disabled:opacity-50 ${color}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      <span className="truncate">{loading ? "Mengunduh..." : children}</span>
    </button>
  )
}

function ReportCard({
  icon, color, title, description, children, footer,
}: {
  icon: ReactNode
  color: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <Card className="flex flex-col min-w-0">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>{icon}</div>
          <CardTitle className="text-base sm:text-lg leading-tight">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">{children}</CardContent>
      <CardFooter className="flex flex-col sm:flex-row flex-wrap gap-2 border-t border-[var(--border-default)] pt-4 bg-[var(--bg-page)]">
        {footer}
      </CardFooter>
    </Card>
  )
}

/** Pilih karyawan dengan pencarian nama/NIK (cocok untuk daftar panjang di HP). */
function KaryawanPicker({
  list, value, onChange, allLabel,
}: {
  list: KaryawanOption[]
  value: string
  onChange: (v: string) => void
  allLabel: string
}) {
  const [search, setSearch] = useState("")
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? list.filter(k => `${k.nama} ${k.nik} ${k.namaPanggilan ?? ""}`.toLowerCase().includes(q)) : list
  }, [list, search])
  return (
    <div className="space-y-2">
      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Cari nama / NIK..."
        className={inputCls}
      />
      <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
        <option value="">{allLabel} ({list.length})</option>
        {filtered.map(k => (
          <option key={k.idKaryawan} value={k.idKaryawan}>
            {k.nama} — {k.departemen}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function ReportsPage() {
  const { user } = useAuth()
  const role = user?.role
  const isManager = role === "Admin" || role === "HRD"
  const isSpv = role === "SPV"

  const [loading, setLoading] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Departemen[]>([])
  const [karyawan, setKaryawan] = useState<KaryawanOption[]>([])

  // Kehadiran
  const [kehadiranBulan, setKehadiranBulan] = useState(thisMonth)
  const [kehadiranDept, setKehadiranDept] = useState("all")
  // Cuti & izin
  const [cutiBulan, setCutiBulan] = useState(thisMonth)
  const [cutiStatus, setCutiStatus] = useState("Semua Status")
  // Rekap absensi kop resmi
  const [absenBulan, setAbsenBulan] = useState(thisMonth)
  const [absenStatus, setAbsenStatus] = useState<"External" | "Internal" | "all">("External")
  const [absenDept, setAbsenDept] = useState("all")
  const [absenKaryawan, setAbsenKaryawan] = useState("")
  // Penggajian
  const [gajiPeriode, setGajiPeriode] = useState(thisMonth)
  const [gajiDept, setGajiDept] = useState("all")
  // Slip gaji perorangan
  const [slipPeriode, setSlipPeriode] = useState(thisMonth)
  const [slipKaryawan, setSlipKaryawan] = useState("")
  // BNIDirect
  const [bniPeriode, setBniPeriode] = useState(thisMonth)
  const [bniRekDebet, setBniRekDebet] = useState("")
  const [bniTanggal, setBniTanggal] = useState(today)
  const [bniRemark, setBniRemark] = useState("PAYROLL SUKSES BANGUNINDO")
  const [bniMetode, setBniMetode] = useState("bifast")

  useEffect(() => {
    if (!role) return
    if (isManager) api.get<Departemen[]>("departemen").then(setDepartments).catch(() => setDepartments([]))
    api.get<KaryawanOption[]>("reports/karyawan-options").then(setKaryawan).catch(() => setKaryawan([]))
    // Rekening debet & metode transfer tersimpan di server (Pengaturan Penggajian)
    if (isManager) {
      api
        .get<{ rekeningDebetBni?: string | null; metodeBankLain?: string }>("penggajian/settings")
        .then(s => {
          if (s?.rekeningDebetBni) setBniRekDebet(s.rekeningDebetBni)
          if (s?.metodeBankLain) setBniMetode(s.metodeBankLain)
        })
        .catch(() => undefined)
    }
  }, [role, isManager])

  const absenList = useMemo(
    () =>
      karyawan.filter(
        k =>
          (absenStatus === "all" || k.statusKaryawan === absenStatus) &&
          (absenDept === "all" || String(k.idDepartemen) === absenDept),
      ),
    [karyawan, absenStatus, absenDept],
  )
  const slipList = useMemo(() => karyawan.filter(k => k.statusKaryawan !== "External"), [karyawan])

  const run = async (key: string, endpoint: string, fallback: string) => {
    setLoading(key)
    try {
      await downloadReport(endpoint, fallback)
      toast("Laporan berhasil diunduh")
    } catch (err) {
      showApiError(err, "Terjadi kesalahan saat mengunduh laporan")
    } finally {
      setLoading(null)
    }
  }

  const btn = (key: string, variant: Format, label: string, endpoint: string, fallback: string) => (
    <ExportButton
      key={key}
      variant={variant}
      loading={loading === key}
      disabled={loading !== null}
      onClick={() => run(key, endpoint, fallback)}
    >
      {label}
    </ExportButton>
  )

  const deptSelect = (value: string, onChange: (v: string) => void) =>
    isManager && (
      <Field label="Departemen">
        <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
          <option value="all">Semua Departemen</option>
          {departments.map(d => (
            <option key={d.idDepartemen} value={d.idDepartemen}>{d.namaDepartemen}</option>
          ))}
        </select>
      </Field>
    )

  const bniQuery = (format: "excel" | "csv", sheet?: string) =>
    `reports/bni-direct${qs({
      periode: bniPeriode,
      rekDebet: bniRekDebet,
      tglTransaksi: bniTanggal.replace(/-/g, ""),
      remark: bniRemark,
      metodeBankLain: bniMetode,
      format,
      sheet,
    })}`
  const metodeLabel = { bifast: "BIFAST", online: "Online", kliring: "Kliring", rtgs: "RTGS" }[bniMetode] ?? "BIFAST"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">Pusat Laporan</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {isSpv
            ? "Unduh laporan kehadiran, cuti/izin, dan rekap absensi resmi untuk anggota tim Anda."
            : "Hasilkan dan unduh laporan absensi, penggajian, slip gaji, dan file transfer BNIDirect secara real-time."}
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Rekap absensi kop resmi — khusus permintaan brand untuk karyawan External */}
        <ReportCard
          icon={<BadgeCheck className="h-5 w-5" />}
          color="bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
          title="Rekap Absensi Karyawan External"
          description="Format resmi berkop CV. Sukses Bangunindo (TGL / MASUK / KELUAR) lengkap dengan cap & tanda tangan HRD — siap dikirim ke brand."
          footer={
            <>
              {btn("absen-pdf", "pdf", "PDF Resmi", `reports/absensi-karyawan${qs({
                bulan: absenBulan,
                idKaryawan: absenKaryawan,
                statusKaryawan: absenKaryawan ? undefined : absenStatus,
                departemen: absenKaryawan ? undefined : absenDept,
                format: "pdf",
              })}`, `Rekap_Absensi_${absenBulan}.pdf`)}
              {btn("absen-excel", "excel", "Excel", `reports/absensi-karyawan${qs({
                bulan: absenBulan,
                idKaryawan: absenKaryawan,
                statusKaryawan: absenKaryawan ? undefined : absenStatus,
                departemen: absenKaryawan ? undefined : absenDept,
                format: "excel",
              })}`, `Rekap_Absensi_${absenBulan}.xlsx`)}
            </>
          }
        >
          <Field label="Bulan">
            <input type="month" value={absenBulan} onChange={e => setAbsenBulan(e.target.value)} className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status Karyawan">
              <select
                value={absenStatus}
                onChange={e => { setAbsenStatus(e.target.value as typeof absenStatus); setAbsenKaryawan("") }}
                className={inputCls}
              >
                <option value="External">External</option>
                <option value="Internal">Internal</option>
                <option value="all">Semua</option>
              </select>
            </Field>
            {deptSelect(absenDept, v => { setAbsenDept(v); setAbsenKaryawan("") })}
          </div>
          <Field label="Karyawan" hint="Kosongkan untuk mengunduh semua karyawan sesuai filter (1 halaman per orang).">
            <KaryawanPicker list={absenList} value={absenKaryawan} onChange={setAbsenKaryawan} allLabel="Semua karyawan" />
          </Field>
        </ReportCard>

        {/* Kehadiran */}
        <ReportCard
          icon={<Calendar className="h-5 w-5" />}
          color="bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
          title="Kehadiran Bulanan"
          description={isSpv ? "Rekapitulasi absensi seluruh anggota tim Anda." : "Rekapitulasi absensi karyawan, keterlambatan, dan jam kerja aktual."}
          footer={
            <>
              {btn("kehadiran-excel", "excel", "Excel", `reports/kehadiran${qs({ periodeBulan: kehadiranBulan, departemen: kehadiranDept, format: "excel" })}`, `Laporan_Kehadiran_${kehadiranBulan}.xlsx`)}
              {btn("kehadiran-pdf", "pdf", "PDF", `reports/kehadiran${qs({ periodeBulan: kehadiranBulan, departemen: kehadiranDept, format: "pdf" })}`, `Laporan_Kehadiran_${kehadiranBulan}.pdf`)}
            </>
          }
        >
          <Field label="Periode Bulan">
            <input type="month" value={kehadiranBulan} onChange={e => setKehadiranBulan(e.target.value)} className={inputCls} />
          </Field>
          {deptSelect(kehadiranDept, setKehadiranDept)}
        </ReportCard>

        {/* Cuti & Izin */}
        <ReportCard
          icon={<Users className="h-5 w-5" />}
          color="bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400"
          title="Cuti & Izin"
          description="Data pengajuan cuti, izin, sakit, dan dinas luar beserta status persetujuan."
          footer={
            <>
              {btn("cuti-excel", "excel", "Excel", `reports/cuti-izin${qs({ rentangWaktu: cutiBulan, statusApproval: cutiStatus, format: "excel" })}`, "Laporan_Cuti_Izin.xlsx")}
              {btn("cuti-pdf", "pdf", "PDF", `reports/cuti-izin${qs({ rentangWaktu: cutiBulan, statusApproval: cutiStatus, format: "pdf" })}`, "Laporan_Cuti_Izin.pdf")}
            </>
          }
        >
          <Field label="Periode Bulan" hint="Kosongkan untuk semua periode.">
            <input type="month" value={cutiBulan} onChange={e => setCutiBulan(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Status Approval">
            <select value={cutiStatus} onChange={e => setCutiStatus(e.target.value)} className={inputCls}>
              <option value="Semua Status">Semua Status</option>
              <option value="disetujui">Disetujui</option>
              <option value="menunggu">Menunggu</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </Field>
        </ReportCard>

        {isManager && (
          <>
            {/* Slip gaji perorangan */}
            <ReportCard
              icon={<Receipt className="h-5 w-5" />}
              color="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
              title="Slip Gaji Perorangan"
              description="Cetak slip gaji sesuai template resmi untuk karyawan yang meminta dokumen, atau semua karyawan sekaligus."
              footer={
                <>
                  {btn("slip-pdf", "pdf", "PDF Slip", `reports/slip-gaji${qs({ periode: slipPeriode, idKaryawan: slipKaryawan, format: "pdf" })}`, `Slip_Gaji_${slipPeriode}.pdf`)}
                  {btn("slip-excel", "excel", "Excel", `reports/slip-gaji${qs({ periode: slipPeriode, idKaryawan: slipKaryawan, format: "excel" })}`, `Slip_Gaji_${slipPeriode}.xlsx`)}
                </>
              }
            >
              <Field label="Periode Gaji" hint="Bulan akhir cut-off, sama seperti di halaman Penggajian (mis. Agustus = 25 Jul – 24 Agu).">
                <input type="month" value={slipPeriode} onChange={e => setSlipPeriode(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Karyawan">
                <KaryawanPicker list={slipList} value={slipKaryawan} onChange={setSlipKaryawan} allLabel="Semua karyawan" />
              </Field>
            </ReportCard>

            {/* Penggajian */}
            <ReportCard
              icon={<Briefcase className="h-5 w-5" />}
              color="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
              title="Data Penggajian"
              description="Ringkasan perhitungan gaji, tunjangan, potongan, rekening, dan total bersih per karyawan."
              footer={
                <>
                  {btn("gaji-excel", "excel", "Excel", `reports/penggajian${qs({ periode: gajiPeriode, departemen: gajiDept, format: "excel" })}`, `Laporan_Penggajian_${gajiPeriode}.xlsx`)}
                  {btn("gaji-pdf", "pdf", "PDF", `reports/penggajian${qs({ periode: gajiPeriode, departemen: gajiDept, format: "pdf" })}`, `Laporan_Penggajian_${gajiPeriode}.pdf`)}
                </>
              }
            >
              <Field label="Periode Gaji">
                <input type="month" value={gajiPeriode} onChange={e => setGajiPeriode(e.target.value)} className={inputCls} />
              </Field>
              {deptSelect(gajiDept, setGajiDept)}
            </ReportCard>

            {/* BNIDirect */}
            <ReportCard
              icon={<Landmark className="h-5 w-5" />}
              color="bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
              title="BNIDirect Payroll"
              description="Template BNIDIRECT v1.9.6 lengkap 9 sheet. Rekening BNI masuk sheet Inhouse, bank lain otomatis ke sheet metode pilihan."
              footer={
                <>
                  {btn("bni-excel", "excel", "Excel 9 Sheet", bniQuery("excel"), `BNIDIRECT_Payroll_${bniPeriode}.xlsx`)}
                  {btn("bni-csv-ih", "csv", "CSV Inhouse", bniQuery("csv", "inhouse"), "BNIDIRECT_IH.csv")}
                  {btn("bni-csv-lain", "csv", `CSV ${metodeLabel}`, bniQuery("csv", bniMetode), `BNIDIRECT_${metodeLabel}.csv`)}
                </>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Periode Gaji">
                  <input type="month" value={bniPeriode} onChange={e => setBniPeriode(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Tanggal Transaksi">
                  <input type="date" value={bniTanggal} onChange={e => setBniTanggal(e.target.value)} className={inputCls} />
                </Field>
              </div>
              <Field label="Rek. Debet (Rekening Perusahaan)" hint="Cukup diisi sekali — otomatis tersimpan di server untuk export berikutnya.">
                <input
                  inputMode="numeric"
                  value={bniRekDebet}
                  onChange={e => {
                    setBniRekDebet(e.target.value.replace(/\D/g, "").slice(0, 16))
                  }}
                  placeholder="Contoh: 7654321678"
                  className={inputCls}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Remark (maks. 33)">
                  <input value={bniRemark} maxLength={33} onChange={e => setBniRemark(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Transfer Bank Lain via">
                  <select value={bniMetode} onChange={e => setBniMetode(e.target.value)} className={inputCls}>
                    <option value="bifast">BIFAST (≤ Rp250 jt)</option>
                    <option value="online">Online</option>
                    <option value="kliring">Kliring (SKN)</option>
                    <option value="rtgs">RTGS</option>
                  </select>
                </Field>
              </div>
              <p className="flex gap-2 rounded-md bg-[var(--bg-page)] border border-[var(--border-default)] p-2.5 text-[11px] leading-snug text-[var(--text-muted)]">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                CSV dibuat persis seperti tombol &quot;Create CSV&quot; di template, langsung siap upload. Karyawan tanpa rekening / kode bank tidak dikenal dicantumkan di sheet &quot;Perlu Dilengkapi&quot;.
              </p>
            </ReportCard>
          </>
        )}
      </div>
    </div>
  )
}
