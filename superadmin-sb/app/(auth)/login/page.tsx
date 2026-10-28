"use client"

import { useState, useEffect } from "react"
import { ShieldAlert, ArrowRight, Lock, User, Eye, EyeOff, ShieldCheck, Mail, AlertTriangle } from "lucide-react"
import { useSuperAdminAuth } from "@/lib/auth-context"
import { toast } from "@/lib/swal"

export default function LoginPage() {
  const { login } = useSuperAdminAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [kickReason, setKickReason] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("kicked") === "1") {
        setKickReason("Sesi Anda telah diputuskan oleh Super Administrator. Silakan login kembali.")
      } else if (params.get("expired") === "1") {
        setKickReason("Sesi login Anda telah berakhir. Silakan login kembali.")
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      toast("Masukkan username dan password Anda", "warning")
      return
    }
    setLoading(true)
    try {
      await login(username.trim(), password)
      await toast("Kode OTP verifikasi telah dikirimkan ke email resmi Anda", "info")
    } catch (err: any) {
      toast(err.message || "Gagal masuk, periksa kredensial Anda", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-page)]">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-xl p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-md mb-2">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            LARAS Super Admin
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Executive & System Management Panel · CV. Sukses Bangunindo
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-[11px] font-bold border border-red-200 dark:border-red-900 mt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Autentikasi 2-Langkah Aktif (Email OTP)</span>
          </div>
        </div>

        {kickReason && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{kickReason}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Username Super Admin
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="superadmin"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-sm font-medium focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Master Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-sm font-medium focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Lanjut ke Verifikasi Email</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Info Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[var(--border-default)] text-[11px] text-[var(--text-secondary)] space-y-1.5 leading-relaxed">
          <p className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span>Pengiriman Kode OTP via Email</span>
          </p>
          <p>
            Setelah menekan tombol lanjut, 6 digit kode keamanan dikirimkan langsung ke inbox email resmi Anda untuk verifikasi identitas eksekutif.
          </p>
        </div>
      </div>
    </div>
  )
}
