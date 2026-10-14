"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { userApi, User } from "@/lib/api"
import { Card, CardContent, CardHeader } from "@/components/molecules"
import { LatticeLoader, PageLoader } from "@/components/atoms"
import {
  User as UserIcon,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Camera,
  Loader2,
} from "lucide-react"

export default function ProfilePage() {
  const { user: authUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nama: "",
    username: "",
    password: "",
    konfirmasiPassword: "",
    fotoProfil: "",
  })

  const [departmentName, setDepartmentName] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await userApi.getProfile()
        setFormData({
          nama: profile.nama || "",
          username: profile.username || "",
          password: "",
          konfirmasiPassword: "",
          fotoProfil: profile.fotoProfil || "",
        })
        if (profile.departemen?.namaDepartemen) {
          setDepartmentName(profile.departemen.namaDepartemen)
        }
      } catch (err) {
        // Fallback to authUser if endpoint has issue
        if (authUser) {
          setFormData((prev) => ({
            ...prev,
            nama: authUser.nama || "",
            username: authUser.username || "",
            fotoProfil: authUser.fotoProfil || "",
          }))
        }
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [authUser])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Ukuran foto maksimal 2 MB")
      e.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, fotoProfil: event.target?.result as string }))
    }
    reader.readAsDataURL(file)
  }

  // Password validation checks
  const isMinLength = formData.password.length >= 8
  const hasUpper = /[A-Z]/.test(formData.password)
  const hasLower = /[a-z]/.test(formData.password)
  const hasNumber = /\d/.test(formData.password)
  const hasSpecial = /[@$!%*?&#^_\-.~+=#<>]/.test(formData.password)
  const isPasswordValid = isMinLength && hasUpper && hasLower && hasNumber && hasSpecial

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!formData.username.trim()) {
      setErrorMessage("Username tidak boleh kosong")
      return
    }

    if (formData.password) {
      if (!isPasswordValid) {
        setErrorMessage(
          "Password baru belum memenuhi kriteria: minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan simbol."
        )
        return
      }

      if (formData.password !== formData.konfirmasiPassword) {
        setErrorMessage("Konfirmasi password baru tidak cocok.")
        return
      }
    }

    setSubmitting(true)

    try {
      const payload: Partial<User> = {
        nama: formData.nama.trim(),
        username: formData.username.trim(),
      }

      if (formData.password && formData.password.trim() !== "") {
        payload.password = formData.password
      }

      if (formData.fotoProfil) {
        payload.fotoProfil = formData.fotoProfil
      }

      const updated = await userApi.updateProfile(payload)

      // Update local storage
      const savedUserStr = localStorage.getItem("userData")
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr)
        const updatedUser = {
          ...savedUser,
          nama: updated.nama || payload.nama,
          username: updated.username || payload.username,
        }
        if (payload.fotoProfil) updatedUser.fotoProfil = payload.fotoProfil
        try {
          localStorage.setItem("userData", JSON.stringify(updatedUser))
        } catch (err) {
          delete updatedUser.fotoProfil
          localStorage.setItem("userData", JSON.stringify(updatedUser))
        }
      }

      setSuccessMessage("Profil, username, dan password berhasil disimpan!")
      setFormData((prev) => ({
        ...prev,
        password: "",
        konfirmasiPassword: "",
      }))

      // Optional reload after 1.5s to refresh header
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal memperbarui profil")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <PageLoader label="Memuat data profil..." />
  }

  const role = authUser?.role || "Pengguna"

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Profil & Akun Saya
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Atur data diri, username login, dan kata sandi akun {role} Anda di sini.
        </p>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account Overview */}
        <Card className="bg-white dark:bg-[#1E293B] border-slate-200 dark:border-white/10 shadow-sm md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            {/* Avatar with Upload Badge */}
            <div className="relative group cursor-pointer mb-4">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 flex items-center justify-center shadow-inner">
                {formData.fotoProfil ? (
                  <img
                    src={formData.fotoProfil}
                    alt="Foto Profil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <label className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-[10px] text-white font-medium">Ubah Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-50">
              {formData.nama || "Tanpa Nama"}
            </h3>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              @{formData.username || "-"}
            </p>

            {/* Role Badge */}
            <div className="mt-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5 border ${
                  role === "Admin"
                    ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                    : role === "HRD"
                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                }`}
              >
                <Shield className="w-3 h-3" />
                {role}
              </span>
            </div>

            {/* Department info if any */}
            {departmentName && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 w-full flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Departemen: <strong>{departmentName}</strong></span>
              </div>
            )}

            <div className="mt-6 text-xs text-slate-400 dark:text-slate-500 leading-relaxed text-left w-full bg-slate-50 dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/5">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Catatan Keamanan:</span>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Username bersifat unik untuk login.</li>
                <li>Gunakan password yang kuat demi menjaga keamanan data absensi kantor.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Edit Form */}
        <Card className="bg-white dark:bg-[#1E293B] border-slate-200 dark:border-white/10 shadow-sm md:col-span-2">
          <CardHeader className="border-b border-slate-200 dark:border-white/10 pb-4">
            <h2 className="font-semibold text-base text-slate-900 dark:text-slate-50">
              Pengaturan Akun & Kredensial
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Perbarui username atau atur ulang kata sandi baru akun Anda.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-red-500 transition-colors"
                  placeholder="Nama lengkap Anda"
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Username Login
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-50 font-mono outline-none focus:border-red-500 transition-colors"
                  placeholder="Username untuk login"
                />
                <p className="text-[11px] text-slate-400">
                  Username ini digunakan saat Anda login ke dashboard web.
                </p>
              </div>

              {/* Divider Password */}
              <div className="pt-3 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <KeyRound className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Ganti Kata Sandi (Opsional)
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Biarkan kosong jika Anda tidak ingin mengubah password akun Anda saat ini.
                </p>

                {/* Password Baru */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Password Baru
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{showPassword ? "Sembunyikan" : "Lihat"}</span>
                    </button>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-red-500 transition-colors"
                    placeholder="Masukkan password baru"
                  />

                  {/* Password Checklist Helper */}
                  {formData.password.length > 0 && (
                    <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1.5">
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Kriteria Kekuatan Password:
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <span className={isMinLength ? "text-emerald-600" : "text-slate-400"}>
                          {isMinLength ? "✓" : "○"} Min. 8 karakter
                        </span>
                        <span className={hasUpper ? "text-emerald-600" : "text-slate-400"}>
                          {hasUpper ? "✓" : "○"} Huruf besar (A-Z)
                        </span>
                        <span className={hasLower ? "text-emerald-600" : "text-slate-400"}>
                          {hasLower ? "✓" : "○"} Huruf kecil (a-z)
                        </span>
                        <span className={hasNumber ? "text-emerald-600" : "text-slate-400"}>
                          {hasNumber ? "✓" : "○"} Angka (0-9)
                        </span>
                        <span className={`col-span-2 ${hasSpecial ? "text-emerald-600" : "text-slate-400"}`}>
                          {hasSpecial ? "✓" : "○"} Karakter khusus (@$!%*?&#^_-...)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Konfirmasi Password */}
                {formData.password.length > 0 && (
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Ulangi Password Baru
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                      >
                        {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                        <span>{showConfirmPassword ? "Sembunyikan" : "Lihat"}</span>
                      </button>
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.konfirmasiPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, konfirmasiPassword: e.target.value })
                      }
                      className={`w-full bg-slate-50 dark:bg-[#0B0F17] border rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-50 outline-none transition-colors ${
                        formData.konfirmasiPassword &&
                        formData.password !== formData.konfirmasiPassword
                          ? "border-red-500"
                          : "border-slate-200 dark:border-white/10 focus:border-red-500"
                      }`}
                      placeholder="Ketik ulang password baru"
                    />
                    {formData.konfirmasiPassword &&
                      formData.password !== formData.konfirmasiPassword && (
                        <p className="text-[11px] text-red-500 font-medium">
                          Konfirmasi password tidak cocok!
                        </p>
                      )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-60 shadow-sm transition-colors"
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
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan Akun</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
