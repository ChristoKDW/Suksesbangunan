"use client"

// ponytail: Native browser alert/confirm - zero external bundle dependency & instant execution
export const showSuccess = (message: string, title = "Berhasil") => {
  if (typeof window !== "undefined") window.alert(`${title}: ${message}`)
}

export const showError = (message: string, title = "Gagal") => {
  if (typeof window !== "undefined") window.alert(`${title}: ${message}`)
}

export const showWarning = (message: string, title = "Perhatian") => {
  if (typeof window !== "undefined") window.alert(`${title}: ${message}`)
}

export const confirmDialog = async (
  message: string,
  _options?: { title?: string; confirmText?: string; cancelButtonText?: string },
) => {
  if (typeof window === "undefined") return false
  return window.confirm(message)
}
