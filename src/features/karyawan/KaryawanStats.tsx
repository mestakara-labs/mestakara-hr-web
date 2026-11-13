import { CakeSlice, Mars, Users, Venus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mestakara/ui/card";

import { NumberCard } from "@/components/shared/NumberCard";
import { StatBarList } from "@/components/shared/StatBarList";
import { parseDate } from "@/lib/date";
import { RETIREMENT_AGE_KARPEL, RETIREMENT_AGE_KARPIM } from "@/lib/employee-rules";
import type { EmployeeProfileResource } from "@/types/api/employee";

import { calculateEmployeeStats, NEAR_RETIREMENT_YEARS, toPercent } from "./employee-stats";
import { EmployeeBreakdownCard } from "./EmployeeBreakdownCard";

/**
 * Kartu statistik di atas tabel karyawan:
 *
 *   [Total Karyawan] [Laki-laki] [Perempuan] [Rata-rata Usia]
 *   [Status Karyawan          ] [Kelompok Usia             ]
 *   [Pendidikan Terakhir      ] [Golongan & Masa Pensiun   ]
 *   [Sebaran Karyawan per Status Karyawan (tab, lebar penuh) ]
 *
 * Angkanya dihitung dari SEMUA karyawan (tidak ikut filter tabel).
 * Usia & pensiun dihitung pada `referenceDate` ("YYYY-MM-DD") = tanggal acuan Periode Data.
 */
export function KaryawanStats({ employees, referenceDate }: { employees: EmployeeProfileResource[]; referenceDate: string }) {
  const stats = calculateEmployeeStats(employees, parseDate(referenceDate));

  return (
    <div className="flex flex-col gap-4">
      {/* Baris 1: angka utama */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NumberCard
          title="Total Karyawan"
          icon={Users}
          value={stats.total}
          note={`Rasio L : P = ${formatRatio(stats.male, stats.female)}`}
        />
        <NumberCard
          title="Laki-laki"
          icon={Mars}
          value={stats.male}
          note={`${toPercent(stats.male, stats.total)} dari total karyawan`}
        />
        <NumberCard
          title="Perempuan"
          icon={Venus}
          value={stats.female}
          note={`${toPercent(stats.female, stats.total)} dari total karyawan`}
        />
        <NumberCard
          title="Rata-rata Usia"
          icon={CakeSlice}
          value={`${stats.averageAge.toLocaleString("id-ID")} th`}
          note="Usia rata-rata seluruh karyawan"
        />
      </div>

      {/* Baris 2 & 3: rincian (2 kartu per baris) */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Karyawan</CardTitle>
            <CardDescription>Jumlah dan rasio karyawan per status karyawan</CardDescription>
          </CardHeader>
          <CardContent>
            <StatBarList items={stats.employmentStatuses} showPercentage />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kelompok Usia</CardTitle>
            <CardDescription>Jumlah dan rasio karyawan per kelompok usia</CardDescription>
          </CardHeader>
          <CardContent>
            <StatBarList items={stats.ageGroups} showPercentage />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pendidikan Terakhir</CardTitle>
            <CardDescription>Jumlah dan rasio karyawan per jenjang pendidikan</CardDescription>
          </CardHeader>
          <CardContent>
            <StatBarList items={stats.educations} showPercentage />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Golongan &amp; Masa Pensiun</CardTitle>
            <CardDescription>Golongan jabatan, penempatan, dan masa pensiun</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <StatusRow label="Karpim (BRM-1 s.d. BRM-3)" value={stats.karpim} />
            <StatusRow label="Karpel (BRM-4 s.d. BRM-6)" value={stats.karpel} />
            <StatusRow label="Belum ditempatkan" value={stats.unplaced} />
            <StatusRow label={`Menjelang pensiun (≤ ${NEAR_RETIREMENT_YEARS} tahun)`} value={stats.nearRetirement} />
            <p className="text-xs text-fg-tertiary">
              Catatan: usia pensiun karpim {RETIREMENT_AGE_KARPIM} tahun, karpel {RETIREMENT_AGE_KARPEL} tahun.
              Karyawan Tetap yang belum ditempatkan belum dihitung pensiunnya.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Baris 4: sebaran per status karyawan, per Sub Unit / Bidang / Objek / ... (lebar penuh) */}
      <EmployeeBreakdownCard employees={employees} />
    </div>
  );
}

/** Satu baris "keterangan ........ angka" di kartu Golongan & Masa Pensiun. */
function StatusRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last-of-type:border-0">
      <span className="typo-body-s text-fg-primary">{label}</span>
      <span className="typo-label-m tabular-nums text-fg-heading">{value}</span>
    </div>
  );
}

/** Rasio dua angka, mis. 126 dan 84 -> "1,5 : 1". */
function formatRatio(first: number, second: number): string {
  if (second === 0) return `${first} : 0`;
  return `${(first / second).toLocaleString("id-ID", { maximumFractionDigits: 1 })} : 1`;
}
