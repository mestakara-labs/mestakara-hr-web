"use client";

import Link from "next/link";
import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@mestakara/ui/dropdown-menu";

interface RowActionsProps {
  /** Dibacakan pembaca layar, mis. "Aksi untuk Operasional" */
  label: string;
  /** Opsional: menu "Lihat Detail" pindah ke halaman detail, mis. "/dashboard/karyawan/pegawai-0001" */
  viewHref?: string;
  /**
   * Isi SALAH SATU:
   *   - editHref: menu Edit pindah ke halaman edit, mis. "/dashboard/organisasi/bidang/operasional/edit"
   *   - onEdit:   menu Edit menjalankan fungsi, mis. membuka dialog
   */
  editHref?: string;
  onEdit?: () => void;
  onDelete: () => void;
}

/** Tombol titik tiga di ujung baris tabel, berisi menu (Lihat Detail), Edit, dan Hapus. */
export function RowActions({ label, viewHref, editHref, onEdit, onDelete }: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={label}>
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {viewHref && (
          <DropdownMenuItem asChild>
            <Link href={viewHref}>
              <Eye />
              Lihat Detail
            </Link>
          </DropdownMenuItem>
        )}
        {editHref ? (
          <DropdownMenuItem asChild>
            <Link href={editHref}>
              <Pencil />
              Edit
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil />
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 />
          Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
