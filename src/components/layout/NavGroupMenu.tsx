"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@mestakara/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@mestakara/ui/sidebar";

import type { NavGroup, NavItem } from "@/config/navigation";

/**
 * Satu kelompok menu di sidebar, mis. "Menu Utama".
 * Setiap menu ditampilkan sebagai:
 * - NavLink        -> kalau menunya langsung berupa link (mis. "Dasbor")
 * - NavCollapsible -> kalau menunya berisi sub-menu (mis. "Usulan Kepegawaian")
 *
 * `badges` = angka kecil di ujung menu, mis. { "/dashboard/mutasi": 3 } (0 = tidak tampil).
 * Berlaku untuk menu langsung maupun sub-menu di dalam dropdown.
 */
export function NavGroupMenu({
  group,
  activeUrl,
  badges,
}: {
  group: NavGroup;
  activeUrl: string | null;
  badges: Record<string, number>;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarMenu>
        {group.items.map((item) =>
          item.items ? (
            <NavCollapsible key={item.title} item={item} activeUrl={activeUrl} badges={badges} />
          ) : (
            <NavLink key={item.title} item={item} activeUrl={activeUrl} badge={badges[item.url ?? ""] ?? 0} />
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

/** Menu yang langsung berupa link, mis. "Dasbor". `badge` > 0 = tampilkan angka di ujung menu. */
function NavLink({ item, activeUrl, badge }: { item: NavItem; activeUrl: string | null; badge: number }) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title} isActive={item.url === activeUrl}>
        {/* Di HP sidebar tampil sebagai laci; tutup lacinya setelah menu diklik. */}
        <Link href={item.url ?? "#"} onClick={() => setOpenMobile(false)}>
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
      {badge > 0 && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
    </SidebarMenuItem>
  );
}

/**
 * Menu yang bisa dibuka-tutup dan berisi beberapa sub-menu, mis. "Usulan Kepegawaian":
 *
 *   ▣ Usulan Kepegawaian  (3) >     <- tertutup: badge = jumlah badge semua sub-menunya
 *   ▣ Usulan Kepegawaian      v     <- terbuka: badge pindah ke sub-menunya masing-masing
 *       Penambahan Karyawan
 *       Mutasi & Penempatan  (3)
 *
 * Otomatis terbuka kalau salah satu sub-menunya sedang dibuka (juga saat pindah halaman).
 */
function NavCollapsible({
  item,
  activeUrl,
  badges,
}: {
  item: NavItem;
  activeUrl: string | null;
  badges: Record<string, number>;
}) {
  const { setOpenMobile } = useSidebar();
  const subItems = item.items ?? [];
  const hasActiveSubItem = subItems.some((subItem) => subItem.url === activeUrl);
  const totalBadge = subItems.reduce((sum, subItem) => sum + (badges[subItem.url] ?? 0), 0);

  const [open, setOpen] = useState(hasActiveSubItem);

  // Begitu salah satu sub-menu menjadi halaman yang dibuka (mis. lewat link di halaman lain),
  // buka dropdown-nya supaya menu aktifnya terlihat. User tetap bebas menutupnya lagi.
  const [wasActive, setWasActive] = useState(hasActiveSubItem);
  if (hasActiveSubItem !== wasActive) {
    setWasActive(hasActiveSubItem);
    if (hasActiveSubItem) setOpen(true);
  }

  return (
    <Collapsible asChild open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            <item.icon />
            <span>{item.title}</span>
            {/* Panah ">" berputar ke bawah saat menu terbuka */}
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {/* right-8: digeser ke kiri supaya tidak menutupi panah */}
        {!open && totalBadge > 0 && <SidebarMenuBadge className="right-8">{totalBadge}</SidebarMenuBadge>}

        <CollapsibleContent>
          <SidebarMenuSub>
            {subItems.map((subItem) => {
              const badge = badges[subItem.url] ?? 0;

              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton asChild isActive={subItem.url === activeUrl}>
                    {/* Di HP sidebar tampil sebagai laci; tutup lacinya setelah menu diklik. */}
                    <Link href={subItem.url} onClick={() => setOpenMobile(false)}>
                      <span>{subItem.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                  {badge > 0 && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
