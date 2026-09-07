"use client"

import Link from "next/link"
import { Search, ChevronDown, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { NotificationDropdown } from "./NotificationDropdown"

export function TopBar() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ nama: "", username: "", password: "", fotoProfil: "" })

  useEffect(() => {
    setMounted(true)
    if (user) {
      setProfileForm(prev => ({ ...prev, nama: user.nama, username: user.username || "", fotoProfil: user.fotoProfil || "" }))
    }
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran foto maksimal 2 MB")
      e.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setProfileForm(prev => ({ ...prev, fotoProfil: event.target?.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    try {
      const { api } = await import('@/lib/api');
      const body: Record<string, string> = { nama: profileForm.nama, username: profileForm.username }
      if (profileForm.password) {
        body.password = profileForm.password
      }
      if (profileForm.fotoProfil) {
        body.fotoProfil = profileForm.fotoProfil
      }
      
      // Update data di server (gunakan endpoint /user/profile yang bisa diakses non-Admin)
      await api.patch(`user/profile`, body)
      
      // Update session storage secara lokal supaya langsung terlihat tanpa login ulang
      const savedUserStr = localStorage.getItem("userData")
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr)
        const updatedUser = { ...savedUser, ...body }
        try {
          localStorage.setItem("userData", JSON.stringify(updatedUser))
        } catch (err) {
          console.warn("localStorage quota exceeded on profile update, stripping fotoProfil")
          delete updatedUser.fotoProfil
          localStorage.setItem("userData", JSON.stringify(updatedUser))
        }
      }

      alert("Profil berhasil diperbarui. Halaman akan dimuat ulang.")
      setIsProfileModalOpen(false)
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan profil")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const userInitials = user?.nama
    ? user.nama.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "??"

  return (
    <>
      <header
        className="fixed right-0 top-0 z-30 flex items-center justify-between px-6 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10"
        style={{
          height: "var(--topbar-height)",
          left: "var(--sidebar-width)",
        }}
      >
        {/* Search */}
        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 w-full bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/10"
          >
            <Search
              className="flex-shrink-0 text-slate-500 dark:text-slate-400"
              style={{ width: "0.875rem", height: "0.875rem" }}
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Quick search...
            </span>
            <span
              className="ml-auto text-xs rounded px-1.5 py-0.5 flex-shrink-0 bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400"
              style={{
                fontFamily: "monospace",
              }}
            >
              ⌘K
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          {mounted && (
            <button
              className="relative flex items-center justify-center rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              style={{
                width: "2.25rem",
                height: "2.25rem",
              }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun style={{ width: "1.125rem", height: "1.125rem" }} />
              ) : (
                <Moon style={{ width: "1.125rem", height: "1.125rem" }} />
              )}
            </button>
          )}

          {/* Notification bell */}
          <NotificationDropdown />

          {/* Divider */}
          <div
            className="h-6 w-px mx-1 bg-slate-200 dark:bg-white/10"
          />

          {/* User dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors text-slate-900 dark:text-slate-50 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-semibold flex-shrink-0 bg-red-600 dark:bg-red-500 overflow-hidden"
              >
                {user?.fotoProfil ? (
                  <img src={user.fotoProfil} alt="Profil" className="h-full w-full object-cover" />
                ) : (
                  userInitials
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium leading-tight text-slate-900 dark:text-slate-50">
                  {user?.nama || "Unknown"}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.role || "—"}
                </div>
              </div>
              <ChevronDown
                className="hidden sm:block text-slate-500 dark:text-slate-400"
                style={{ width: "0.875rem", height: "0.875rem" }}
              />
            </button>

            {/* User Menu Dropdown */}
            {isUserMenuOpen && (
              <>
                {/* Overlay for clicking outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-md bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden">
                  <div className="py-1">
                    <div className="block px-4 py-2 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-white/5 mb-1">
                      Akun Saya
                    </div>
                    {user?.role !== 'Admin' && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                      >
                        Pengaturan Profil
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      Keluar (Logout)
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Profile Settings Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#0B0F17] w-full max-w-md rounded-xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-semibold text-slate-900 dark:text-slate-50">Pengaturan Profil</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-50">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-4 space-y-4">
              <div className="flex justify-center mb-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer group">
                  {profileForm.fotoProfil ? (
                    <img src={profileForm.fotoProfil} alt="Pratinjau" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <span className="text-[10px] mt-1 font-medium">Foto</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-white text-xs font-semibold">Ubah</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Nama Lengkap</label>
                <input required type="text" value={profileForm.nama} onChange={e => setProfileForm({...profileForm, nama: e.target.value})} className="w-full bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-red-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Username</label>
                <input required type="text" value={profileForm.username} onChange={e => setProfileForm({...profileForm, username: e.target.value})} className="w-full bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-red-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Password Baru <span className="text-slate-400 font-normal">(Kosongkan jika tidak ingin diubah)</span></label>
                <input type="password" value={profileForm.password} onChange={e => setProfileForm({...profileForm, password: e.target.value})} className="w-full bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-red-500" placeholder="••••••••" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent">Batal</button>
                <button type="submit" disabled={isUpdatingProfile} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors">
                  {isUpdatingProfile ? "Menyimpan..." : "Simpan Profil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
