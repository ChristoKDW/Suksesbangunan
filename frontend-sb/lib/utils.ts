import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Lama bekerja sejak tanggal masuk, mis. "2 tahun 3 bulan" atau "15 hari". */
export function masaKerja(tanggalMasuk?: string | null): string {
  if (!tanggalMasuk) return "—"
  const [y, m, d] = tanggalMasuk.split("T")[0].split("-").map(Number)
  const now = new Date()
  if (new Date(y, m - 1, d) > now) return "Belum mulai"
  let bulan = (now.getFullYear() - y) * 12 + (now.getMonth() - (m - 1))
  if (now.getDate() < d) bulan--
  if (bulan < 1) {
    const hari = Math.floor((now.getTime() - new Date(y, m - 1, d).getTime()) / 86400000)
    return `${hari} hari`
  }
  const tahun = Math.floor(bulan / 12)
  const sisa = bulan % 12
  return [tahun && `${tahun} tahun`, sisa && `${sisa} bulan`].filter(Boolean).join(" ")
}
