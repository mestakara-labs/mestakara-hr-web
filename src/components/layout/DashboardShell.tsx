import type { ReactNode } from "react";
import { Separator } from "@mestakara/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@mestakara/ui/sidebar";

import { AppSidebar } from "./AppSidebar";
import { PageBreadcrumb } from "./PageBreadcrumb";

/**
 * Kerangka semua halaman dashboard:
 *
 *   ┌────────────┬──────────────────────────────────┐
 *   │            │ [≡] | Karyawan > Data Karyawan   │  header
 *   │ AppSidebar ├──────────────────────────────────┤
 *   │            │ isi halaman (children)           │
 *   └────────────┴──────────────────────────────────┘
 *
 * Dipasang sekali di src/app/dashboard/layout.tsx, jadi setiap halaman di
 * /dashboard otomatis memakai kerangka ini.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />

      {/* min-w-0: tabel yang lebar digeser di dalam kartunya sendiri, bukan melebarkan seluruh halaman */}
      <SidebarInset className="min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            {/* Tombol buka/tutup sidebar (juga bisa dengan Ctrl+B) */}
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <PageBreadcrumb />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
