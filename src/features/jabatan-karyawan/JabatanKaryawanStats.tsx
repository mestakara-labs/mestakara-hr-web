import { Armchair, BriefcaseBusiness, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mestakara/ui/card";

import { NumberCard } from "@/components/shared/NumberCard";
import { StatBarList } from "@/components/shared/StatBarList";
import { toPercent } from "@/features/karyawan/employee-stats";
import type { AssignmentResource } from "@/types/api/assignment";
import type { PositionResource } from "@/types/api/organization";
import type { SubUnitResource } from "@/types/api/sub-unit";

import { calculateAssignmentStats } from "./assignment-stats";

interface JabatanKaryawanStatsProps {
  assignments: AssignmentResource[];
  employeeCount: number;
  positions: PositionResource[];
  subUnits: SubUnitResource[];
}

/**
 * Kartu statistik di atas tabel jabatan karyawan:
 *
 *   [Penugasan Aktif] [Sudah Ditempatkan] [Belum Ditempatkan] [Jabatan Kosong]
 *   [Status Jabatan              ] [Penugasan per Sub Unit      ]
 *
 * Angkanya dihitung dari SEMUA data (tidak ikut filter tabel).
 */
export function JabatanKaryawanStats({ assignments, employeeCount, positions, subUnits }: JabatanKaryawanStatsProps) {
  const stats = calculateAssignmentStats({ assignments, employeeCount, positions, subUnits });

  return (
    <div className="flex flex-col gap-4">
      {/* Baris 1: angka utama */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NumberCard
          title="Penugasan Aktif"
          icon={BriefcaseBusiness}
          value={stats.active}
          note={`+ ${stats.ended} riwayat penugasan yang sudah selesai`}
        />
        <NumberCard
          title="Sudah Ditempatkan"
          icon={UserCheck}
          value={stats.placedEmployees}
          note={`${toPercent(stats.placedEmployees, employeeCount)} dari ${employeeCount} karyawan`}
        />
        <NumberCard
          title="Belum Ditempatkan"
          icon={UserX}
          value={stats.unplacedEmployees}
          note="Karyawan tanpa penugasan aktif"
        />
        <NumberCard
          title="Jabatan Kosong"
          icon={Armchair}
          value={stats.vacantPositions}
          note={`dari ${positions.length} jabatan belum ada pemegangnya`}
        />
      </div>

      {/* Baris 2: rincian */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Jabatan</CardTitle>
            <CardDescription>Jumlah dan rasio penugasan aktif per status jabatan</CardDescription>
          </CardHeader>
          <CardContent>
            <StatBarList items={stats.statuses} showPercentage />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Penugasan per Sub Unit</CardTitle>
            <CardDescription>Jumlah dan rasio penugasan aktif di setiap sub unit</CardDescription>
          </CardHeader>
          <CardContent>
            <StatBarList items={stats.subUnits} showPercentage />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
