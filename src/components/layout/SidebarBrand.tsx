"use client";

import Link from "next/link";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@mestakara/ui/sidebar";

import { MestakaraLogoTile } from "@/components/shared/MestakaraLogo";

/** Logo + nama aplikasi di bagian paling atas sidebar. Diklik -> kembali ke dasbor. */
export function SidebarBrand() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link href="/dashboard">
            <MestakaraLogoTile className="size-8" />
            <div className="grid flex-1 text-left typo-body-m">
              <span className="truncate font-medium">HR Dashboard</span>
              <span className="truncate typo-body-s">PTPN I Regional 2 - Agrowisata</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
