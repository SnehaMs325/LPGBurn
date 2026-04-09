"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 px-4 bg-background/50 backdrop-blur-sm">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex-1" />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 bg-transparent">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
