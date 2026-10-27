"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Mail, ShieldCheck, ArrowLeft, RefreshCw, KeyRound } from "lucide-react"
import { useSuperAdminAuth } from "@/lib/auth-context"
import { showError, showSuccess, toast } from "@/lib/swal"
import type { LoginChallengeResponse } from "@/lib/types"

export default function VerifyEmailAuthenticatorPage() {
  const router = useRouter()
  const { verifyEmailOtp, resendEmailOtp } = useSuperAdminAuth()

  const [challenge, setChallenge] = useState<LoginChallengeResponse | null>(null)
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 menit
  const [cooldown, setCooldown] = useState(60) // 60s sebelum kirim ulang
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Ambil challenge token dari sessionStorage
    const raw = sessionStorage.getItem("sa_challenge")
    if (!raw) {
      router.replace("/login")
      return
    }
    try {
      const parsed = JSON.parse(raw) as LoginChallengeResponse
      setChallenge(parsed)
      setTimeLeft(parsed.expiresInSeconds || 300)
    } catch {
      router.replace("/login")
    }
  }, [router])

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    // Auto advance focus
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").trim()
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split("")
      setOtp(digits)
      inputsRef.current[5]?.focus()
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = otp.join("")
    if (fullCode.length !== 6) {
      showError("Harap masukkan 6 digit kode verifikasi", "Kode Tidak Lengkap")
      return
    }

    if (!challenge) {
      showError("Sesi login telah kedaluwarsa, silakan login ulang", "Sesi Habis")
      router.replace("/login")
      return
    }

    setLoading(true)
    try {
      await verifyEmailOtp(challenge.challengeToken, fullCode)
      sessionStorage.removeItem("sa_challenge")
      await toast("Autentikasi Super Admin Berhasil", "success")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kode verifikasi salah atau telah kedaluwarsa"
      showError(msg, "Verifikasi Gagal")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || !challenge) return
    setResending(true)
    try {
      const res = await resendEmailOtp(challenge.challengeToken)
      setCooldown(60)
      setTimeLeft(300)
      showSuccess(res.message || "Kode baru telah dikirimkan ke email Anda", "Kode Terkirim")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim ulang kode"
      showError(msg, "Error")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-page)]">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-xl p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-md mb-2">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            Email Authenticator
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Tahap 2 dari 2: Verifikasi Kode Dua Langkah
          </p>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-[var(--text-secondary)] space-y-1">
          <p className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4" />
            <span>Kode Akses 6 Digit Telah Dikirim</span>
          </p>
          <p>
            Silakan periksa inbox email resmi Super Admin Anda:{" "}
            <span className="font-mono font-bold text-red-600 dark:text-red-400">
              {challenge?.emailMasked || "email terdaftar"}
            </span>
          </p>
          <p className="text-[11px] text-gray-500 pt-1">
            Masa berlaku kode:{" "}
            <span className="font-bold text-red-600">{formatTimer(timeLeft)}</span>
          </p>
        </div>

        {/* Form OTP Input */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputsRef.current[idx] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] text-[var(--text-primary)] focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition shadow-sm"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6 || timeLeft <= 0}
            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verifikasi & Masuk Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Resend & Back Actions */}
        <div className="flex items-center justify-between text-xs pt-2">
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Login</span>
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
            <span>{cooldown > 0 ? `Kirim Ulang (${cooldown}s)` : "Kirim Ulang Kode"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
