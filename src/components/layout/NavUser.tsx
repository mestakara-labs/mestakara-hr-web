"use client";

import { ChevronsUpDown, LogOut, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@mestakara/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@mestakara/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@mestakara/ui/sidebar";

import { useAuth } from "@/features/auth/AuthProvider";
import { getInitials } from "@/lib/initials";

/**
 * User yang login, di bagian paling bawah sidebar.
 * Diklik -> muncul menu "Profil Saya" dan "Keluar".
 */
export function NavUser() {
  const { user, logout } = useAuth();
  const { isMobile } = useSidebar();

  // Sidebar hanya tampil setelah login (lihat RequireAuth), jadi user pasti ada.
  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          {/* Tombol di sidebar: avatar + nama + jabatan */}
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-hover data-[state=open]:text-sidebar-fg"
            >
              <UserInfo name={user.name} detail={user.position} />
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {/* Isi menu yang muncul setelah tombol diklik */}
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-md"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5">
                <UserInfo name={user.name} detail={user.email} />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserRound />
              Profil Saya
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** Avatar berisi inisial + nama + satu baris keterangan (jabatan atau email). */
function UserInfo({ name, detail }: { name: string; detail: string }) {
  return (
    <>
      <Avatar size="sm" className="rounded-md">
        <AvatarFallback className="rounded-md">{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left typo-body-m">
        <span className="truncate font-medium">{name}</span>
        <span className="truncate typo-body-s">{detail}</span>
      </div>
    </>
  );
}

