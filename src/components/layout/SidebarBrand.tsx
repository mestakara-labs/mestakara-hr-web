"use client";

import Image from "next/image";
import Link from "next/link";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@mestakara/ui/sidebar";

/** Logo + nama aplikasi di bagian paling atas sidebar. Diklik -> kembali ke dasbor. */
export function SidebarBrand() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link href="/dashboard">
            <div className="relative flex aspect-square size-8 items-center justify-center rounded-md bg-surface">
              <Image
                src="/images/logo-ptpn1.png"
                alt="Logo PTPN I"
                fill
                sizes="32px"
                className="object-contain p-1"
              />
            </div>
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
