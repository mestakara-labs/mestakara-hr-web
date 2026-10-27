"use client";

import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@mestakara/ui/sidebar";

import { navigationConfig } from "@/config/navigation";
import { usePendingTransferCount } from "@/features/mutasi/usePendingTransferCount";
import { findActiveMenu } from "@/lib/active-menu";

import { NavGroupMenu } from "./NavGroupMenu";
import { NavUser } from "./NavUser";
import { SidebarBrand } from "./SidebarBrand";

/**
 * Sidebar dashboard (mengikuti block "sidebar-07" dari @mestakara/ui):
 *
 *   ┌───────────────┐
 *   │ Logo + nama   │  SidebarBrand
 *   ├───────────────┤
 *   │ Menu Utama    │  NavGroupMenu (isi menu dari src/config/navigation.ts)
 *   │ Lainnya       │
 *   ├───────────────┤
 *   │ User + Keluar │  NavUser
 *   └───────────────┘
 *
 * collapsible="icon": di layar lebar sidebar bisa dilipat jadi deretan ikon saja.
 */
export function AppSidebar() {
  const pathname = usePathname();
  // Url menu yang sedang dibuka, untuk menandai menu aktif (null kalau tidak ada).
  const activeUrl = findActiveMenu(pathname)?.url ?? null;

  // Badge angka di menu: { url menu: angka }. Diambil ulang setiap pindah halaman.
  const pendingTransfers = usePendingTransferCount(pathname);
  const badges: Record<string, number> = { "/dashboard/mutasi": pendingTransfers };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarBrand />
      </SidebarHeader>
      <SidebarContent>
        {navigationConfig.map((group) => (
          <NavGroupMenu key={group.label} group={group} activeUrl={activeUrl} badges={badges} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
