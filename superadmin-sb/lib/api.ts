const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname.includes("larasbysuksesbangunan.my.id")
    ? "https://api.larasbysuksesbangunan.my.id"
    : "http://localhost:3002")

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message)
    this.name = "ApiError"
  }
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("superAdminToken")
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers = new Headers(options.headers || {})

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const cleanPath = path.replace(/^\/?api\//, "/").replace(/^\//, "")
  const url = path.startsWith("http") ? path : `${BASE_URL.replace(/\/$/, "")}/${cleanPath}`

  const res = await fetch(url, { ...options, headers })

  if (res.status === 401 && typeof window !== "undefined") {
    // If on dashboard, force redirect to login
    if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/verify-email-authenticator")) {
      localStorage.removeItem("superAdminToken")
      localStorage.removeItem("superAdminUser")
      window.location.href = "/login?expired=1"
    }
  }

  if (!res.ok) {
    let errMsg = `Request gagal (${res.status})`
    let errData: unknown
    try {
      errData = await res.json()
      if (errData && typeof errData === "object" && "message" in errData) {
        const msg = (errData as { message: unknown }).message
        errMsg = Array.isArray(msg) ? msg.join(", ") : String(msg)
      }
    } catch {
      // ignore
    }
    throw new ApiError(res.status, errMsg, errData)
  }

  if (res.status === 204) {
    return {} as T
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
}
