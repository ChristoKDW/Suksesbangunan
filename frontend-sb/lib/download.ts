"use client"

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "https://api.larasbysuksesbangunan.my.id").replace(/\/+$/, "")

/** Ambil nama file dari header Content-Disposition (fallback ke nama default). */
function filenameFrom(res: Response, fallback: string) {
  const cd = res.headers.get("content-disposition") || ""
  const match = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
  return match ? decodeURIComponent(match[1]) : fallback
}

/**
 * Unduh file laporan dari backend dengan token login, lalu simpan via browser.
 * Pesan error JSON dari backend (mis. "Slip gaji belum dibuat") diteruskan apa adanya.
 */
export async function downloadReport(endpoint: string, fallbackName: string) {
  const token = localStorage.getItem("accessToken")
  const res = await fetch(`${BASE_URL}/${endpoint.replace(/^\/+/, "")}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (res.status === 401) {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("userData")
    window.location.href = "/login"
    return
  }
  if (!res.ok) {
    let message = `Gagal mengunduh laporan (HTTP ${res.status})`
    try {
      const data = await res.json()
      if (data?.message) message = Array.isArray(data.message) ? data.message.join(", ") : String(data.message)
    } catch {
      // bukan JSON
    }
    throw new Error(message)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filenameFrom(res, fallbackName)
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Query string dari objek, abaikan nilai kosong. */
export function qs(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v))
  }
  const s = search.toString()
  return s ? `?${s}` : ""
}
