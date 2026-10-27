import { Briefcase } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@mestakara/ui/card";

import { StatBarList } from "@/components/shared/StatBarList";
import type { DivisionResource } from "@/types/api/division";
import type { PositionResource } from "@/types/api/organization";

import { countByBrmLevel, countByDivision, countWithoutDivision } from "./position-stats";

interface JabatanStatsProps {
  positions: PositionResource[];
  divisions: DivisionResource[];
}

/**
 * Tiga kartu statistik di atas tabel jabatan:
 *
 *   ┌ Total Jabatan ┐ ┌ Jabatan per Level BRM ┐ ┌ Jabatan per Bidang ┐
 *   │     135       │ │ ● BRM-1 ▏          1  │ │ Operasional ▇▇▇ 62 │
 *   └───────────────┘ └───────────────────────┘ └────────────────────┘
 *
 * Angkanya dihitung ulang dari data, jadi ikut berubah setelah jabatan ditambah / dihapus.
 */
export function JabatanStats({ positions, divisions }: JabatanStatsProps) {
  const withoutDivision = countWithoutDivision(positions);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[15rem_minmax(0,1fr)_minmax(0,1.3fr)]">
      {/* 1. Total jabatan */}
      <Card className="md:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle>Total Jabatan</CardTitle>
          <CardAction>
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-subtle text-fg-brand">
              <Briefcase className="size-5" />
            </span>
          </CardAction>
        </CardHeader>
        <CardContent className="mt-auto">
          <p className="typo-display-l text-fg-brand">{positions.length}</p>
          <p className="typo-body-s text-fg-secondary">jabatan di {divisions.length} bidang</p>
        </CardContent>
      </Card>

      {/* 2. Per level BRM */}
      <Card>
        <CardHeader>
          <CardTitle>Jabatan per Level BRM</CardTitle>
          <CardDescription>BRM-1 = Manager, makin besar makin ke bawah</CardDescription>
        </CardHeader>
        <CardContent>
          <StatBarList items={countByBrmLevel(positions)} />
        </CardContent>
      </Card>

      {/* 3. Per bidang */}
      <Card>
        <CardHeader>
          <CardTitle>Jabatan per Bidang</CardTitle>
          <CardDescription>Sesuai master Bidang</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <StatBarList items={countByDivision(positions, divisions)} />
          {withoutDivision > 0 && (
            <p className="typo-body-s text-fg-tertiary">
              + {withoutDivision} jabatan BRM-1 tanpa bidang
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
