"use client"

import { Sidebar } from "@/components/organisms/Sidebar"
import { TopBar } from "@/components/organisms/TopBar"
import { SidebarProvider } from "@/lib/sidebar-context"

export interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
        <Sidebar />
        <TopBar />
        <main
          className="min-h-screen transition-[padding] duration-200 md:pl-[var(--sidebar-width)]"
          style={{
            paddingTop: "var(--topbar-height)",
          }}
        >
          <div className="mx-auto max-w-7xl p-3 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
