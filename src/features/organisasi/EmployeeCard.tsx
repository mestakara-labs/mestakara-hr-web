import { Avatar, AvatarFallback } from "@mestakara/ui/avatar";

import { DEFINITIVE_STATUS } from "@/lib/assignment-rules";
import { getInitials } from "@/lib/initials";
import type { EmployeeResource } from "@/types/api/organization";

import { EMPLOYEE_ROW_HEIGHT } from "./node-size";
import { EmployeeContactButtons } from "./EmployeeContactButtons";

interface EmployeeCardProps {
  employee: EmployeeResource;
  /** Dipanggil saat nama pegawai diklik (membuka panel detail). */
  onClick: () => void;
}

/**
 * Satu baris pegawai di dalam kotak jabatan:
 *   [Avatar] Nama Pegawai          📞 ✉️ WA
 *            NIK 20230001            (atau "Plt · NIK 20230001" kalau bukan Definitif)
 */
export function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  return (
    <div
      className="flex items-center gap-1 border-t border-border px-2"
      style={{ height: EMPLOYEE_ROW_HEIGHT }}
    >
      {/* Bagian kiri bisa diklik untuk membuka detail pegawai */}
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 text-left hover:bg-subtle"
      >
        <Avatar size="sm">
          <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
        </Avatar>
        <span className="grid min-w-0">
          <span className="truncate typo-label-m text-fg-primary">{employee.name}</span>
          <span className="truncate typo-body-s text-fg-tertiary">
            {employee.assignment_status !== DEFINITIVE_STATUS && (
              <span className="font-semibold text-fg-warning">{employee.assignment_status} · </span>
            )}
            NIK {employee.nik}
          </span>
        </span>
      </button>

      <EmployeeContactButtons employee={employee} />
    </div>
  );
}
