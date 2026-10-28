import { io, Socket } from "socket.io-client"

let socketInstance: Socket | null = null

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  (typeof window !== "undefined" && window.location.hostname.includes("larasbysuksesbangunan.my.id")
    ? "https://api.larasbysuksesbangunan.my.id/realtime"
    : "http://localhost:3002/realtime")

export function getSocket(token?: string | null): Socket | null {
  if (typeof window === "undefined") return null

  const authToken = token || localStorage.getItem("superAdminToken")
  if (!authToken) {
    if (socketInstance) {
      socketInstance.disconnect()
      socketInstance = null
    }
    return null
  }

  if (!socketInstance) {
    socketInstance = io(WS_URL, {
      auth: { token: authToken },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socketInstance.on("connect", () => {
      console.log("[WebSocket] Realtime connection established:", socketInstance?.id)
      // Kirim heartbeat perdana
      socketInstance?.emit("client:heartbeat", { platform: "superadmin" })
    })

    socketInstance.on("disconnect", (reason) => {
      console.log("[WebSocket] Disconnected:", reason)
    })

    socketInstance.on("session_kicked", (data) => {
      console.warn("[WebSocket] Received session_kicked event:", data)
      localStorage.removeItem("superAdminToken")
      localStorage.removeItem("superAdminUser")
      document.cookie = "superAdminToken=; path=/; max-age=0; SameSite=Strict"
      window.location.href = "/login?kicked=1"
    })
  }

  return socketInstance
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}
