import { DashboardLayout } from "@/components/templates"

export default function AppDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}

