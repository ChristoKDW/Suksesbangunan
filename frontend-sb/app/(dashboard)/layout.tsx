import { DashboardLayout } from "@/components/templates"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AppDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}

