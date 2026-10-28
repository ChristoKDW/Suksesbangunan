"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { SWRConfig, mutate as globalMutate } from "swr"
import { api } from "@/lib/api"
import type { AuthUser, LoginResponse } from "@/lib/types"

// ─── Context shape ──────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ─── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("accessToken")
    const savedUser = localStorage.getItem("userData")

    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser) as AuthUser)
        document.cookie = `accessToken=${savedToken}; path=/; max-age=2592000; SameSite=Lax`
      } catch {
        // Corrupted data — clear
        localStorage.removeItem("accessToken")
        localStorage.removeItem("userData")
        document.cookie = "accessToken=; path=/; max-age=0; SameSite=Lax"
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(
    async (username: string, password: string) => {
      const data = await api.post<LoginResponse>("auth/web/login", {
        username,
        password,
      })

      // Persist to localStorage and cookie
      localStorage.setItem("accessToken", data.accessToken)
      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=2592000; SameSite=Lax`
      try {
        localStorage.setItem("userData", JSON.stringify(data.user))
      } catch (err) {
        console.warn("localStorage quota exceeded on login, stripping fotoProfil")
        const userWithoutFoto = { ...data.user, fotoProfil: "" }
        localStorage.setItem("userData", JSON.stringify(userWithoutFoto))
      }

      // Update state
      setToken(data.accessToken)
      setUser(data.user)

      // Redirect to dashboard
      router.push("/")
    },
    [router]
  )

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("userData")
    document.cookie = "accessToken=; path=/; max-age=0; SameSite=Lax"
    // ponytail: Bersihkan seluruh cache SWR saat logout dalam 1 baris
    globalMutate(() => true, undefined, { revalidate: false })
    setToken(null)
    setUser(null)
    router.push("/login")
  }, [router])

  // Session Watchdog: periksa keaktifan sesi web secara berkala ke backend
  useEffect(() => {
    if (!token || !user) return

    const sessionInterval = setInterval(async () => {
      try {
        await api.get("auth/web/session-status")
      } catch (err: any) {
        if (err.status === 401) {
          console.warn("[AuthContext Web] Sesi diputuskan oleh Super Administrator:", err)
          logout()
        }
      }
    }, 8000)

    return () => clearInterval(sessionInterval)
  }, [token, user, logout])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {/* ponytail: Global SWR Config - zero boilerplate fetcher & instant cache revalidation */}
      <SWRConfig
        value={{
          fetcher: (url: string) => api.get(url),
          revalidateOnFocus: true,
          dedupingInterval: 5000,
        }}
      >
        {children}
      </SWRConfig>
    </AuthContext.Provider>
  )
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
