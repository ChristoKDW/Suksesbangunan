"use client"
import { useState } from "react"
import { Building2, User, Lock, Check } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      await login(username, password)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] relative overflow-hidden">
      {/* Abstract geometric background shapes */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply pointer-events-none">
        <svg className="absolute top-0 left-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern height="40" id="grid" patternUnits="userSpaceOnUse" width="40">
              <circle cx="2" cy="2" fill="var(--border-default)" r="1"></circle>
            </pattern>
            <linearGradient id="grad1" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.05"></stop>
              <stop offset="100%" stopColor="var(--color-primary-hover)" stopOpacity="0.01"></stop>
            </linearGradient>
          </defs>
          <rect fill="url(#grid)" height="100%" width="100%"></rect>
          <path d="M-100,-100 L500,800 L1200,200 Z" fill="url(#grad1)"></path>
          <circle cx="80%" cy="80%" fill="url(#grad1)" r="400"></circle>
        </svg>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[var(--bg-surface)] p-10 shadow-lg rounded-xl flex flex-col gap-8 border border-[var(--border-default)]">
        
        {/* Header / Logo */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-[var(--color-primary)] rounded-2xl flex items-center justify-center shadow-md">
            <Building2 className="text-white h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">HR Core</h1>
            <p className="text-sm text-[var(--text-muted)]">Sign in to access the administrative panel</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5 w-full">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg flex items-center gap-2">
              <span className="font-semibold">Login gagal:</span> {error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-[var(--text-primary)] uppercase tracking-wider text-xs" htmlFor="username">
              Username
            </label>
            <div className="relative flex items-center bg-[var(--bg-page)] rounded-lg p-3 group focus-within:ring-2 focus-within:ring-[var(--color-primary)] transition-all border border-[var(--border-default)]">
              <User className="text-[var(--text-muted)] h-5 w-5 mr-3 group-focus-within:text-[var(--color-primary)] transition-colors" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="bg-transparent border-none outline-none w-full text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[var(--text-primary)] uppercase tracking-wider text-xs" htmlFor="password">
                Password
              </label>
            </div>
            <div className="relative flex items-center bg-[var(--bg-page)] rounded-lg p-3 group focus-within:ring-2 focus-within:ring-[var(--color-primary)] transition-all border border-[var(--border-default)]">
              <Lock className="text-[var(--text-muted)] h-5 w-5 mr-3 group-focus-within:text-[var(--color-primary)] transition-colors" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-transparent border-none outline-none w-full text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <label className="relative flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="peer sr-only" />
              <div className="w-4 h-4 rounded bg-[var(--border-default)] peer-checked:bg-[var(--color-primary)] flex items-center justify-center transition-colors">
                <Check className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-xs text-[var(--text-muted)] select-none">Remember me for 30 days</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-sm py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Signing in..." : "Secure Login"}
          </button>
        </form>

        {/* Footer info */}
        <div className="pt-6 mt-2 border-t border-[var(--border-default)] flex flex-col items-center justify-center gap-2">
          <p className="text-[10px] text-[var(--text-muted)]">Sukses Bangunan — HR Management System</p>
        </div>
      </div>
    </div>
  )
}
