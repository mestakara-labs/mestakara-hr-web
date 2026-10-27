"use client";

import { History, MoreVertical, UserCog } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mestakara/ui/dropdown-menu";

import type { AssignmentResource } from "@/types/api/assignment";

interface AssignmentRowActionsProps {
  assignment: AssignmentResource;
  onChangeSupervisor: (assignment: AssignmentResource) => void;
  onShowHistory: (assignment: AssignmentResource) => void;
}

/**
 * Tombol titik tiga di ujung baris tabel Jabatan Karyawan:
 *   - Ubah Atasan     (hanya untuk penugasan yang masih aktif)
 *   - Riwayat Atasan
 */
export function AssignmentRowActions({ assignment, onChangeSupervisor, onShowHistory }: AssignmentRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Aksi untuk ${assignment.employee.name}`}>
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={!assignment.is_active} onSelect={() => onChangeSupervisor(assignment)}>
          <UserCog />
          Ubah Atasan
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onShowHistory(assignment)}>
          <History />
          Riwayat Atasan
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
