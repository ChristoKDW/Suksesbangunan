// =============================================================================
// Centralized API client for communicating with the NestJS backend
// Auto-attaches JWT token and handles 401 redirects
// =============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"

class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, message: string, data?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("accessToken")
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }

  // Only set Content-Type for non-FormData bodies
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    ...options,
    headers,
  })

  // Handle 401 — token expired or invalid
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("userData")
      window.location.href = "/login"
      // Return a pending promise to halt execution and avoid unhandled rejection errors while redirecting
      return new Promise(() => {}) 
    }
    throw new ApiError(401, "Unauthorized")
  }

  // Handle other errors
  if (!response.ok) {
    let errorData: unknown = null
    try {
      errorData = await response.json()
    } catch {
      // Response is not JSON
    }
    const message =
      (errorData && typeof errorData === "object" && "message" in errorData
        ? String((errorData as { message: unknown }).message)
        : null) || response.statusText
    throw new ApiError(response.status, message, errorData)
  }

  // Handle 204 No Content or zero content-length
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T
  }

  const text = await response.text()
  if (!text || text.trim() === "") {
    return undefined as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

// ─── Convenience methods ────────────────────────────────────────────────────

export const api = {
  get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: "GET" })
  },

  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  },

  patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: "DELETE" })
  },
}

export { ApiError }

import type { User } from './types'
export type { User }

// ---------------------------------------------------------------------------
// USERS API (Admin/HRD/SPV)
// ---------------------------------------------------------------------------
export const userApi = {
  getAll: (): Promise<User[]> => api.get('user'),
  getById: (id: number): Promise<User> => api.get(`user/${id}`),
  create: (data: Partial<User>): Promise<User> => api.post('user', data),
  update: (id: number, data: Partial<User>): Promise<User> => api.patch(`user/${id}`, data),
  delete: (id: number): Promise<any> => api.delete(`user/${id}`),
}

// ---------------------------------------------------------------------------
// NOTIFICATIONS API
// ---------------------------------------------------------------------------
export interface NotificationItem {
  idNotification: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  getMyNotifications: (): Promise<NotificationItem[]> => api.get('notification'),
  getUnreadCount: (): Promise<number> => api.get('notification/unread-count'),
  markAsRead: (id: number): Promise<any> => api.patch(`notification/${id}/read`),
  markAllAsRead: (): Promise<any> => api.patch('notification/read-all'),
}
