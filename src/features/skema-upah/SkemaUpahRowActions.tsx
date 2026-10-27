"use client";

import { History, MoreVertical, Pencil } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mestakara/ui/dropdown-menu";

import type { WageEmployeeResource } from "@/types/api/wage";

interface SkemaUpahRowActionsProps {
  row: WageEmployeeResource;
  onEdit: (row: WageEmployeeResource) => void;
  onShowHistory: (row: WageEmployeeResource) => void;
}

/**
 * Tombol titik tiga di ujung baris tabel Skema Upah:
 *   - Ubah Skema (atau "Atur Skema" kalau belum diatur)
 *   - Riwayat Skema
 */
export function SkemaUpahRowActions({ row, onEdit, onShowHistory }: SkemaUpahRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Aksi untuk ${row.name}`}>
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(row)}>
          <Pencil />
          {row.wage_scheme ? "Ubah Skema" : "Atur Skema"}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onShowHistory(row)}>
          <History />
          Riwayat Skema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
