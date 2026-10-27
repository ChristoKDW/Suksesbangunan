"use client"

import type { SweetAlertIcon, SweetAlertOptions } from "sweetalert2"

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

export const showApiError = (err: unknown, fallback: string) =>
  showError(err instanceof Error && err.message ? err.message : fallback)

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
    confirmButtonText: options?.confirmText ?? "Ya, Lanjutkan",
    cancelButtonText: options?.cancelButtonText ?? "Batal",
    confirmButtonColor: options?.danger ? "#dc2626" : "#dc2626",
  })
  return result.isConfirmed
}
