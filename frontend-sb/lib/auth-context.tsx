"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
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
      } catch {
        // Corrupted data — clear
        localStorage.removeItem("accessToken")
        localStorage.removeItem("userData")
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

      // Persist to localStorage
      localStorage.setItem("accessToken", data.accessToken)
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
    setToken(null)
    setUser(null)
    router.push("/login")
  }, [router])

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
      {children}
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
