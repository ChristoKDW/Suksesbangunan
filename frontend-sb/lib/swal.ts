"use client"

import type { SweetAlertIcon, SweetAlertOptions } from "sweetalert2"

// SweetAlert2 dimuat on-demand (dynamic import) agar tidak membebani bundle awal.
const loadSwal = () => import("sweetalert2").then(m => m.default)

const base: SweetAlertOptions = {
  confirmButtonColor: "#dc2626",
  cancelButtonColor: "#6b7280",
  reverseButtons: true,
  heightAuto: false,
  customClass: { popup: "swal-laras" },
}

const fire = async (icon: SweetAlertIcon, title: string, message: string) => {
  if (typeof window === "undefined") return
  const Swal = await loadSwal()
  await Swal.fire({ ...base, icon, title, text: message, confirmButtonText: "OK" })
}

export const showSuccess = (message: string, title = "Berhasil") => fire("success", title, message)

export const showError = (message: string, title = "Gagal") => fire("error", title, message)

export const showWarning = (message: string, title = "Perhatian") => fire("warning", title, message)

export const showInfo = (message: string, title = "Informasi") => fire("info", title, message)

/** Pesan error standar dari exception (ApiError / Error / unknown). */
export const showApiError = (err: unknown, fallback: string) =>
  showError(err instanceof Error && err.message ? err.message : fallback)

/** Toast kecil di pojok kanan atas, otomatis hilang. */
export const toast = async (message: string, icon: SweetAlertIcon = "success") => {
  if (typeof window === "undefined") return
  const Swal = await loadSwal()
  await Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title: message,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  })
}

export const confirmDialog = async (
  message: string,
  options?: {
    title?: string
    confirmText?: string
    cancelButtonText?: string
    icon?: SweetAlertIcon
    danger?: boolean
  },
): Promise<boolean> => {
  if (typeof window === "undefined") return false
  const Swal = await loadSwal()
  const result = await Swal.fire({
    ...base,
    icon: options?.icon ?? (options?.danger ? "warning" : "question"),
    title: options?.title ?? "Konfirmasi",
    text: message,
    showCancelButton: true,
    confirmButtonText: options?.confirmText ?? "Ya, lanjutkan",
    cancelButtonText: options?.cancelButtonText ?? "Batal",
    confirmButtonColor: options?.danger === false ? "#16a34a" : "#dc2626",
    focusCancel: options?.danger ?? false,
  })
  return result.isConfirmed
}

/** Konfirmasi hapus data (tombol merah, fokus default di "Batal"). */
export const confirmDelete = (message: string, title = "Hapus data?") =>
  confirmDialog(message, { title, confirmText: "Ya, hapus", icon: "warning", danger: true })

/** Konfirmasi keluar dari aplikasi. */
export const confirmLogout = () =>
  confirmDialog("Sesi Anda akan diakhiri dan Anda perlu login kembali.", {
    title: "Keluar dari aplikasi?",
    confirmText: "Ya, keluar",
    icon: "question",
    danger: true,
  })
