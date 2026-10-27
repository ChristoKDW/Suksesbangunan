export interface SuperAdminUser {
  idUser: number
  nama: string
  username: string
  email: string
  role: string
  isSuperAdmin: boolean
  fotoProfil?: string | null
}

export interface LoginChallengeResponse {
  step: "OTP_REQUIRED"
  challengeToken: string
  emailMasked: string
  expiresInSeconds: number
}

export interface VerifyOtpResponse {
  accessToken: string
  user: SuperAdminUser
}

export interface AuditLogItem {
  idAudit: number
  idUser?: number
  namaUser?: string
  role: string
  action: string
  entityName: string
  entityId?: string
  dataBefore?: Record<string, unknown> | null
  dataAfter?: Record<string, unknown> | null
  ipAddress: string
  userAgent?: string
  createdAt: string
}

export interface ServerHealthMetrics {
  cpuUsagePercent: number
  memoryUsedMb: number
  memoryTotalMb: number
  diskFreeGb: number
  diskTotalGb: number
  dbConnectionPoolActive: number
  dbConnectionPoolMax: number
  pm2Services: {
    name: string
    status: "online" | "stopping" | "stopped" | "errored"
    uptimeSeconds: number
    restarts: number
  }[]
}
