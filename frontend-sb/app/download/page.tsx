"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Building2,
  Download,
  Smartphone,
  Apple,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react"

export default function DownloadPage() {
  const [platform, setPlatform] = useState<"android" | "ios">("android")
  const [copied, setCopied] = useState(false)

  const apkDownloadUrl = "https://larasbysuksesbangunan.my.id/apk/app-release.apk"
  const qrDirectUrl = "/apk/qr-apk-direct.svg"
  const qrDirectPngUrl = "/apk/qr-apk-direct.png"

  const handleCopyLink = () => {
    navigator.clipboard.writeText(apkDownloadUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-page)] relative overflow-hidden text-[var(--text-default)]">
      {/* Background Graphic Pattern */}
      <div className="absolute inset-0 z-0 opacity-30 mix-blend-multiply pointer-events-none">
        <svg className="absolute top-0 left-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern height="40" id="download-grid" patternUnits="userSpaceOnUse" width="40">
              <circle cx="2" cy="2" fill="var(--border-default)" r="1.5"></circle>
            </pattern>
          </defs>
          <rect fill="url(#download-grid)" height="100%" width="100%"></rect>
        </svg>
      </div>

      {/* Decorative Gradient Blobs */}
      <div className="absolute -top-28 -left-28 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-28 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 w-full border-b border-[var(--border-default)]/60 bg-[var(--bg-surface)]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight leading-tight">Sukses Bangunan</div>
              <div className="text-xs text-[var(--text-muted)]">Portal Unduh Aplikasi Mobile</div>
            </div>
          </div>

          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] hover:border-emerald-500/40 transition-all"
          >
            Masuk ke Dashboard
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Aplikasi Resmi Pegawai
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Unduh Aplikasi Absensi Mobile
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
            Scan barcode atau unduh langsung file instalasi untuk absensi mandiri, verifikasi wajah AI (Anti-Spoofing), dan pengelolaan slip gaji.
          </p>
        </div>

        {/* Platform Selector Switch */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm">
            <button
              onClick={() => setPlatform("android")}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                platform === "android"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25"
                  : "text-[var(--text-muted)] hover:text-[var(--text-default)]"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Android (APK)
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-white/20 text-white">
                Tersedia
              </span>
            </button>

            <button
              onClick={() => setPlatform("ios")}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                platform === "ios"
                  ? "bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white shadow-md shadow-slate-900/25"
                  : "text-[var(--text-muted)] hover:text-[var(--text-default)]"
              }`}
            >
              <Apple className="w-4 h-4" />
              iPhone (iOS)
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-500">
                Info
              </span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PLATFORM 1: ANDROID VIEW                                       */}
        {/* ============================================================== */}
        {platform === "android" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: QR Code Card */}
            <div className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center">
              <div className="w-full flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <QrCode className="w-3.5 h-3.5" />
                  Barcode Langsung
                </span>
                <span className="text-xs text-[var(--text-muted)]">v1.0.0 Release</span>
              </div>

              {/* QR Code Container */}
              <div className="relative p-4 bg-white rounded-2xl shadow-inner border border-slate-200 mb-5 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDirectUrl}
                  alt="QR Code Download APK Sukses Bangunan"
                  className="w-56 h-56 object-contain"
                />
                <div className="absolute inset-0 rounded-2xl bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-slate-800 bg-white/90 px-3 py-1 rounded-full shadow">
                    Scan Kamera HP
                  </span>
                </div>
              </div>

              <h2 className="font-bold text-base mb-1">Arahkan Kamera HP Anda</h2>
              <p className="text-xs text-[var(--text-muted)] mb-5 max-w-xs">
                Buka aplikasi Kamera atau Google Lens di HP Android Anda dan arahkan ke barcode di atas untuk langsung mendownload APK.
              </p>

              {/* QR Action Buttons */}
              <div className="w-full grid grid-cols-2 gap-2.5 pt-4 border-t border-[var(--border-default)]">
                <a
                  href={qrDirectPngUrl}
                  download="Barcode-Download-APK-Sukses-Bangunan.png"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[var(--border-default)] text-xs font-medium hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Simpan Barcode
                </a>

                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[var(--border-default)] text-xs font-medium hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-semibold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Salin Link
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Download Button & Specs & Install Steps */}
            <div className="lg:col-span-7 space-y-6">
              {/* Primary Download Banner */}
              <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
                      Paket Instalasi Android
                    </span>
                    <span className="text-xs text-emerald-200">Format: .APK</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold mb-2">
                    Aplikasi Absensi & Layanan Pegawai
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed mb-6">
                    Mendukung absensi wajah biometrik, deteksi kedipan & gelengan kepala (Anti-Spoofing), geofence kantor, serta pengajuan cuti dan slip gaji harian.
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <a
                      href={apkDownloadUrl}
                      download="absensi-sukses-bangunan.apk"
                      className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-emerald-800 font-bold text-sm shadow-lg hover:bg-emerald-50 hover:shadow-xl transition-all"
                    >
                      <Download className="w-4 h-4 text-emerald-700" />
                      Unduh APK Sekarang (83.3 MB)
                    </a>

                    <div className="text-center sm:text-left text-xs text-emerald-200">
                      <div>Versi: <strong>1.0.0 Release</strong></div>
                      <div>Android 7.0 (Nougat) ke atas</div>
                    </div>
                  </div>
                </div>

                {/* Subtle Decorative Icon */}
                <Smartphone className="absolute -bottom-8 -right-8 w-44 h-44 text-white/5 pointer-events-none" />
              </div>

              {/* Security & Feature Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold">100% Aman</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Bebas malware & virus</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold">AI Google ML Kit</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Deteksi wajah presisi</div>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold">Resmi Perusahaan</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Server Cloud Mandiri</div>
                  </div>
                </div>
              </div>

              {/* Installation Guide Card */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl p-6 sm:p-7 shadow-sm">
                <h4 className="font-bold text-sm sm:text-base mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-500" />
                  Panduan Cara Pasang (Install) di Android
                </h4>

                <ol className="space-y-4 text-xs sm:text-sm">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong>Download File APK</strong> melalui scan barcode kamera atau tombol di atas. Tunggu hingga proses download selesai.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      Buka notifikasi unduhan atau buka aplikasi <strong>File Manager &gt; Unduhan (Download)</strong>, lalu klik file <code>absensi-sukses-bangunan.apk</code>.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      Jika muncul peringatan <em>&ldquo;Instal aplikasi tidak dikenal&rdquo;</em>, pilih <strong>Pengaturan (Settings)</strong> lalu aktifkan <strong>&ldquo;Izinkan dari sumber ini&rdquo;</strong>, kemudian klik <strong>Instal</strong>.
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PLATFORM 2: IPHONE / IOS VIEW                                   */}
        {/* ============================================================== */}
        {platform === "ios" && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* iOS System Explanation Card */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <Apple className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Tentang Aplikasi untuk iPhone (iOS)</h3>
                  <div className="text-xs text-[var(--text-muted)]">Informasi Teknis Ekosistem Apple</div>
                </div>
              </div>

              {/* Informative Alert Box */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs sm:text-sm leading-relaxed mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Apakah iPhone bisa menginstal file APK?</strong>
                  <p className="mt-1">
                    Tidak bisa. File berekstensi <strong>.APK</strong> adalah format eksklusif sistem operasi <strong>Android</strong>. Perangkat iPhone (iOS) menggunakan format instalasi <strong>.IPA</strong> yang wajib melalui penandatanganan sertifikat Apple Developer atau distribusi resmi via <strong>Apple TestFlight / App Store</strong>.
                  </p>
                </div>
              </div>

              {/* Current iOS Status & Solutions */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm">Status & Solusi untuk Karyawan Pengguna iPhone:</h4>

                {/* Option 1: Web App Mobile */}
                <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold text-[10px] uppercase">
                        Solusi Langsung
                      </span>
                      <h5 className="font-bold text-sm sm:text-base">Gunakan Web Portal Mobile (Safari / Chrome)</h5>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mb-4">
                    Sistem web dashboard kami sudah 100% responsif untuk browser HP iPhone. Anda dapat mengakses akun, jadwal kerja, riwayat kehadiran, dan pengajuan izin tanpa perlu instalasi aplikasi tambahan.
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
                    >
                      Buka Web Portal di Safari
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <div className="text-[11px] text-[var(--text-muted)]">
                      Tips: Tap tombol <strong>Share</strong> di Safari &gt; <strong>Add to Home Screen</strong> agar tampil seperti aplikasi di iPhone Anda.
                    </div>
                  </div>
                </div>

                {/* Option 2: TestFlight / App Store Status */}
                <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[var(--text-default)] font-bold text-[10px] uppercase">
                      Dalam Proses
                    </span>
                    <h5 className="font-bold text-sm sm:text-base">Distribusi IPA via Apple TestFlight</h5>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    Build versi iOS (Flutter IPA) sedang dalam peninjauan akun Apple Developer Organisasi. Segera setelah rilis di TestFlight, link undangan instalasi untuk iPhone akan diperbarui di halaman ini.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-[var(--border-default)]/60 bg-[var(--bg-surface)] py-6 text-center text-xs text-[var(--text-muted)]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            &copy; 2026 <strong>CV Sukses Bangunindo</strong>. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:underline">Login Dashboard</Link>
            <span>&bull;</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Bantuan IT: it.suksesbangunindo@gmail.com</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
