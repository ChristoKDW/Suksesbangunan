"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { SuperAdminUser, LoginChallengeResponse } from "@/lib/types"
import { api } from "@/lib/api"
import { getSocket, disconnectSocket } from "@/lib/socket"

interface AuthContextValue {
  user: SuperAdminUser | null
  token: string | null
  challenge: LoginChallengeResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password?: string) => Promise<LoginChallengeResponse>
  loginHardcoded: (username: string, password?: string) => Promise<void>
  verifyEmailOtp: (challengeToken: string, otp: string) => Promise<void>
  resendEmailOtp: (challengeToken: string) => Promise<{ message: string; challengeToken: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const DEFAULT_SUPERADMIN_USER: SuperAdminUser = {
  idUser: 1,
  nama: "Christo KDW (Owner)",
  username: "superadmin",
  email: "owner@suksesbangunindo.com",
  role: "SUPER_ADMIN",
  isSuperAdmin: true,
  fotoProfil: null,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<SuperAdminUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<LoginChallengeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem("superAdminToken")
    const savedUser = localStorage.getItem("superAdminUser")

    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser) as SuperAdminUser)
        document.cookie = `superAdminToken=${savedToken}; path=/; max-age=86400; SameSite=Strict`
      } catch {
        localStorage.removeItem("superAdminToken")
        localStorage.removeItem("superAdminUser")
      }
    } else {
      // Default: set authenticated directly for ease of demonstration if needed, or wait for login
    }
    setIsLoading(false)
  }, [])

  // Real-time WebSocket + Redis Heartbeat Watchdog
  useEffect(() => {
    if (!token || !user) {
      disconnectSocket()
      return
    }

    const socket = getSocket(token)

    // Interval Heartbeat Redis via WebSocket (tiap 10 detik)
    const heartbeatTimer = setInterval(() => {
      if (socket && socket.connected) {
        socket.emit("client:heartbeat", {
          platform: "superadmin",
          meta: { username: user.username },
        })
      }
    }, 10000)

    // HTTP Heartbeat Fallback (tiap 10 detik)
    const checkInterval = setInterval(async () => {
      try {
        await api.get("/super-admin/auth/session-status")
      } catch (err: any) {
        if (err.status === 401) {
          console.warn("[AuthContext] Sesi Super Admin telah diputuskan oleh server:", err)
          localStorage.removeItem("superAdminToken")
          localStorage.removeItem("superAdminUser")
          document.cookie = "superAdminToken=; path=/; max-age=0; SameSite=Strict"
          disconnectSocket()
          setToken(null)
          setUser(null)
          window.location.href = "/login?kicked=1"
        }
      }
    }, 10000)

    return () => {
      clearInterval(heartbeatTimer)
      clearInterval(checkInterval)
    }
  }, [token, user])

  const login = useCallback(
    async (username: string, password?: string): Promise<LoginChallengeResponse> => {
      const res = await api.post<LoginChallengeResponse>("/super-admin/auth/login", {
        username: username.trim(),
        password,
      })

      if (res && res.challengeToken) {
        setChallenge(res)
        sessionStorage.setItem("sa_challenge", JSON.stringify(res))
        router.push("/verify-email-authenticator")
        return res
      }
      throw new Error("Respon autentikasi tidak valid dari server")
    },
    [router]
  )

  const loginHardcoded = useCallback(async (username: string, _password?: string) => {
    // Mode Hardcode cadangan
    const mockUser: SuperAdminUser = {
      ...DEFAULT_SUPERADMIN_USER,
      username: username || "superadmin",
    }
    const mockToken = "superadmin-mock-token-" + Date.now()

    localStorage.setItem("superAdminToken", mockToken)
    localStorage.setItem("superAdminUser", JSON.stringify(mockUser))
    document.cookie = `superAdminToken=${mockToken}; path=/; max-age=86400; SameSite=Strict`

    setToken(mockToken)
    setUser(mockUser)
    setChallenge(null)

    router.replace("/")
  }, [router])

  const verifyEmailOtp = useCallback(
    async (challengeToken: string, otp: string) => {
      const res = await api.post<{ accessToken: string; user: SuperAdminUser }>(
        "/super-admin/auth/verify-otp",
        {
          challengeToken,
          otp: otp.trim(),
        }
      )

      if (res && res.accessToken) {
        localStorage.setItem("superAdminToken", res.accessToken)
        localStorage.setItem("superAdminUser", JSON.stringify(res.user))
        document.cookie = `superAdminToken=${res.accessToken}; path=/; max-age=86400; SameSite=Strict`

        setToken(res.accessToken)
        setUser(res.user)
        setChallenge(null)
        sessionStorage.removeItem("sa_challenge")

        router.replace("/")
        return
      }
      throw new Error("Verifikasi OTP gagal")
    },
    [router]
  )

  const resendEmailOtp = useCallback(async (challengeToken: string) => {
    const res = await api.post<{ message: string; challengeToken: string; emailMasked?: string }>(
      "/super-admin/auth/resend-otp",
      {
        challengeToken,
      }
    )
    return res
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("superAdminToken")
    localStorage.removeItem("superAdminUser")
    document.cookie = "superAdminToken=; path=/; max-age=0; SameSite=Strict"
    disconnectSocket()
    setToken(null)
    setUser(null)
    setChallenge(null)
    router.replace("/login")
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        challenge,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        loginHardcoded,
        verifyEmailOtp,
        resendEmailOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useSuperAdminAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useSuperAdminAuth must be used within an AuthProvider")
  }
  return ctx
}
