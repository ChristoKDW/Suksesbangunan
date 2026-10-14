"use client"

import Swal from "sweetalert2"

const confirmButtonColor = "#2563eb"
const cancelButtonColor = "#64748b"

export const showSuccess = (message: string, title = "Berhasil") =>
  Swal.fire({ icon: "success", title, text: message, confirmButtonColor })

export const showError = (message: string, title = "Gagal") =>
  Swal.fire({ icon: "error", title, text: message, confirmButtonColor })

export const showWarning = (message: string, title = "Perhatian") =>
  Swal.fire({ icon: "warning", title, text: message, confirmButtonColor })

export const confirmDialog = async (
  message: string,
  { title = "Konfirmasi", confirmText = "Ya", cancelText = "Batal" } = {},
) => {
  const result = await Swal.fire({
    icon: "question",
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor,
    cancelButtonColor,
  })
  return result.isConfirmed
}
