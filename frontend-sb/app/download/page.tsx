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
  Info,
  Share2,
  PlusSquare
} from "lucide-react"

export default function DownloadPage() {
  const [platform, setPlatform] = useState<"android" | "ios">("android")
  const [copiedAndroid, setCopiedAndroid] = useState(false)
  const [copiedIos, setCopiedIos] = useState(false)

  const apkDownloadUrl = "https://larasbysuksesbangunan.my.id/apk/app-release.apk"
  const iosAccessUrl = "https://larasbysuksesbangunan.my.id/login?platform=ios"

  const qrAndroidSvg = "/apk/qr-apk-direct.svg"
  const qrAndroidPng = "/apk/qr-apk-direct.png"

  const qrIosSvg = "/apk/qr-ios-mobile.svg"
  const qrIosPng = "/apk/qr-ios-mobile.png"

  const handleCopyLink = (target: "android" | "ios") => {
    if (target === "android") {
      navigator.clipboard.writeText(apkDownloadUrl)
      setCopiedAndroid(true)
      setTimeout(() => setCopiedAndroid(false), 2500)
    } else {
      navigator.clipboard.writeText(iosAccessUrl)
      setCopiedIos(true)
      setTimeout(() => setCopiedIos(false), 2500)
    }
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
              <div className="font-bold text-base tracking-tight leading-tight">LARAS</div>
              <div className="text-xs text-[var(--text-muted)]">Portal Unduh Aplikasi Mobile &bull; Sukses Bangunan</div>
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
            Aplikasi Resmi Pegawai &bull; LARAS
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Unduh Aplikasi Mobile LARAS
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
            Scan barcode atau unduh langsung file instalasi aplikasi LARAS untuk absensi mandiri, verifikasi wajah AI (Anti-Spoofing), geofencing, dan pengelolaan slip gaji di perangkat Anda.
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
                  ? "bg-gradient-to-r from-slate-900 to-blue-900 dark:from-slate-800 dark:to-blue-950 text-white shadow-md shadow-slate-900/25"
                  : "text-[var(--text-muted)] hover:text-[var(--text-default)]"
              }`}
            >
              <Apple className="w-4 h-4" />
              iPhone (iOS)
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400">
                Barcode Siap
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
                  Barcode Download APK LARAS
                </span>
                <span className="text-xs text-[var(--text-muted)]">v1.0.0 Release</span>
              </div>

              {/* QR Code Container */}
              <div className="relative p-4 bg-white rounded-2xl shadow-inner border border-slate-200 mb-5 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrAndroidSvg}
                  alt="QR Code Download APK LARAS Android"
                  className="w-56 h-56 object-contain"
                />
                <div className="absolute inset-0 rounded-2xl bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-slate-800 bg-white/90 px-3 py-1 rounded-full shadow">
                    Scan Kamera HP
                  </span>
                </div>
              </div>

              <h2 className="font-bold text-base mb-1">Arahkan Kamera HP Android</h2>
              <p className="text-xs text-[var(--text-muted)] mb-5 max-w-xs">
                Buka aplikasi Kamera atau Google Lens di HP Android Anda dan arahkan ke barcode di atas untuk langsung mendownload APK LARAS.
              </p>

              {/* QR Action Buttons */}
              <div className="w-full grid grid-cols-2 gap-2.5 pt-4 border-t border-[var(--border-default)]">
                <a
                  href={qrAndroidPng}
                  download="Barcode-Download-APK-LARAS.png"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[var(--border-default)] text-xs font-medium hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Simpan Barcode
                </a>

                <button
                  onClick={() => handleCopyLink("android")}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[var(--border-default)] text-xs font-medium hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  {copiedAndroid ? (
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
                    Aplikasi LARAS &bull; Layanan & Presensi Pegawai
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed mb-6">
                    Mendukung absensi wajah biometrik AI, deteksi kedipan & gelengan kepala (Anti-Spoofing), geofence kantor, serta pengajuan cuti dan slip gaji harian.
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <a
                      href={apkDownloadUrl}
                      download="LARAS.apk"
                      className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-emerald-800 font-bold text-sm shadow-lg hover:bg-emerald-50 hover:shadow-xl transition-all"
                    >
                      <Download className="w-4 h-4 text-emerald-700" />
                      Unduh APK LARAS (83.3 MB)
                    </a>

                    <div className="text-center sm:text-left text-xs text-emerald-200">
                      <div>Versi: <strong>1.0.0 Release</strong></div>
                      <div>Android 7.0 (Nougat) ke atas</div>
                    </div>
                  </div>
                </div>

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
                      Buka notifikasi unduhan atau buka aplikasi <strong>File Manager &gt; Unduhan (Download)</strong>, lalu klik file <code>LARAS.apk</code> (atau <code>app-release.apk</code>).
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: QR Code Card for iPhone */}
            <div className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center">
              <div className="w-full flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <QrCode className="w-3.5 h-3.5" />
                  Barcode Akses iPhone (iOS) &bull; LARAS
                </span>
                <span className="text-xs text-[var(--text-muted)]">iOS 14.0+</span>
              </div>

              {/* QR Code Container */}
              <div className="relative p-4 bg-white rounded-2xl shadow-inner border border-slate-200 mb-5 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrIosSvg}
                  alt="QR Code Akses Aplikasi LARAS iPhone"
                  className="w-56 h-56 object-contain"
                />
                <div className="absolute inset-0 rounded-2xl bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-slate-800 bg-white/90 px-3 py-1 rounded-full shadow">
                    Scan Kamera iPhone
                  </span>
                </div>
              </div>

              <h2 className="font-bold text-base mb-1">Arahkan Kamera iPhone Anda</h2>
              <p className="text-xs text-[var(--text-muted)] mb-5 max-w-xs">
                Buka aplikasi Kamera bawaan iPhone Anda dan arahkan ke barcode di atas untuk langsung membuka dan memasang aplikasi LARAS.
              </p>

              {/* QR Action Buttons */}
              <div className="w-full grid grid-cols-2 gap-2.5 pt-4 border-t border-[var(--border-default)]">
                <a
                  href={qrIosPng}
                  download="Barcode-Akses-iPhone-LARAS.png"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[var(--border-default)] text-xs font-medium hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Simpan Barcode
                </a>

                <button
                  onClick={() => handleCopyLink("ios")}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[var(--border-default)] text-xs font-medium hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  {copiedIos ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-blue-500 font-semibold">Tersalin!</span>
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

            {/* Right Column: Direct Launch & iPhone PWA Steps */}
            <div className="lg:col-span-7 space-y-6">
              {/* Primary Launch Banner for iPhone */}
              <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
                      Ekosistem Apple iOS
                    </span>
                    <span className="text-xs text-blue-200">Format: Mobile Web App (PWA)</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold mb-2">
                    Aplikasi LARAS di iPhone
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed mb-6">
                    Aplikasi web mobile responsif 1-tap siap pasang di layar utama iPhone Anda tanpa perlu melalui App Store yang rumit. Lengkap dengan fitur absensi, jadwal kerja, dan slip gaji.
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <a
                      href={iosAccessUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-slate-900 font-bold text-sm shadow-lg hover:bg-slate-100 transition-all"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      Buka Aplikasi LARAS di iPhone
                    </a>

                    <div className="text-center sm:text-left text-xs text-slate-300">
                      <div>Kompatibilitas: <strong>iOS 14.0+</strong></div>
                      <div>Safari / Chrome iPhone</div>
                    </div>
                  </div>
                </div>

                <Apple className="absolute -bottom-8 -right-8 w-44 h-44 text-white/5 pointer-events-none" />
              </div>

              {/* iPhone Step-by-Step Installation Guide */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl p-6 sm:p-7 shadow-sm">
                <h4 className="font-bold text-sm sm:text-base mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  Cara Memasang Aplikasi LARAS ke Layar Utama iPhone (Home Screen)
                </h4>

                <ol className="space-y-4 text-xs sm:text-sm">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong>Scan Barcode iPhone</strong> dengan kamera iPhone Anda atau tap tombol <em>&ldquo;Buka Aplikasi LARAS di iPhone&rdquo;</em> di atas melalui browser <strong>Safari</strong>.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      Di browser Safari, tekan ikon <strong>Share</strong> (ikon kotak dengan panah menghadap ke atas di bilah bawah Safari).
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      Gulir ke bawah dan pilih opsi <strong>&ldquo;Add to Home Screen&rdquo; (Tambahkan ke Layar Utama)</strong>, lalu tekan <strong>Add (Tambah)</strong> di pojok kanan atas.
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      Selesai! Ikon aplikasi <strong>LARAS</strong> kini muncul di layar utama iPhone Anda dan dapat dibuka 1-tap seperti aplikasi native App Store.
                    </div>
                  </li>
                </ol>
              </div>

              {/* Technical Note on iOS App Store & Native Build */}
              <div className="p-4 rounded-2xl bg-slate-500/5 border border-[var(--border-default)] text-xs text-[var(--text-muted)] flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Catatan Khusus Instalasi Format .IPA (Native iOS):</strong>
                  <p className="mt-1">
                    Untuk instalasi paket binary native iOS (<code>SuksesBangunan-iOS.ipa</code>), file dapat ditandatangani menggunakan sertifikat pengembang via Sideloadly atau Xcode ke perangkat iPhone Anda.
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
