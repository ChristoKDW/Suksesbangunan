"use client"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/molecules"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Sedang memverifikasi email Anda...")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Token verifikasi tidak ditemukan.")
      return
    }

    const verifyToken = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://alfiyah.my.id").replace(/\/+$/, "")
        const res = await fetch(`${baseUrl}/auth/mobile/verify-email?token=${token}`)
        const data = await res.json()
        
        if (res.ok) {
          setStatus("success")
          setMessage("Email berhasil diverifikasi! Anda sekarang dapat menutup halaman ini dan login di aplikasi absensi.")
        } else {
          setStatus("error")
          setMessage(data.message || "Gagal memverifikasi email. Token mungkin tidak valid atau sudah kedaluwarsa.")
        }
      } catch (err) {
        setStatus("error")
        setMessage("Terjadi kesalahan jaringan saat memverifikasi email.")
      }
    }

    verifyToken()
  }, [token])

  return (
    <CardContent className="p-8 text-center space-y-6">
      <div className="flex justify-center">
        {status === "loading" && <Loader2 className="w-16 h-16 animate-spin text-[var(--color-primary)]" />}
        {status === "success" && <CheckCircle2 className="w-16 h-16 text-green-500" />}
        {status === "error" && <XCircle className="w-16 h-16 text-red-500" />}
      </div>
      
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {status === "loading" && "Verifikasi Email"}
          {status === "success" && "Verifikasi Berhasil"}
          {status === "error" && "Verifikasi Gagal"}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {message}
        </p>
      </div>
    </CardContent>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-root)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border border-[var(--border-default)]">
        <Suspense fallback={
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 animate-spin text-[var(--color-primary)]" />
            </div>
            <p className="text-[var(--text-secondary)]">Memuat verifikasi...</p>
          </CardContent>
        }>
          <VerifyEmailContent />
        </Suspense>
      </Card>
    </div>
  )
}
