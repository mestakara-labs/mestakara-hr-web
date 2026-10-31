import { DashboardSection } from "@/components/shared/dashboard/DashboardSection";
import { DistributionChart } from "@/components/shared/dashboard/DistributionChart";
import { WidgetCard } from "@/components/shared/dashboard/WidgetCard";
import { ALL_DIMENSIONS } from "@/lib/dashboard-filters";
import type { DashboardWidget } from "@/types/api/dashboard";

/** Pilihan "Lihat per" grafik status karyawan. */
const STATUS_GROUP_BY = [
  { value: "division", label: "Bidang" },
  { value: "sub_unit", label: "Sub Unit" },
  { value: "segment", label: "Segmen" },
];

/**
 * Bagian 2 — KOMPOSISI TENAGA KERJA (posisi pada akhir periode):
 *
 *   [Total][Gender][Rata-rata Usia][Rata-rata Masa Kerja]
 *   [Status per Bidang/Sub Unit/Segmen (batang bertumpuk)          ]
 *   [Matriks Bidang × Status                                       ]
 *   [Gender (donat)][Kelompok Usia][Pendidikan]
 *   [Level BRM & Job Grade                                         ]
 */
export function WorkforceSection({ widgets }: { widgets: Record<string, DashboardWidget> }) {
  return (
    <DashboardSection
      eyebrow="Bagian 2"
      title="Komposisi Tenaga Kerja"
      description="Jumlah dan sebaran karyawan menurut status, organisasi, demografi, dan level jabatan pada akhir periode."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WidgetCard widgetKey="workforce.kpi_total" initial={widgets["workforce.kpi_total"]} title="Total Karyawan" />
        <WidgetCard widgetKey="workforce.kpi_gender" initial={widgets["workforce.kpi_gender"]} title="Laki-laki : Perempuan" />
        <WidgetCard widgetKey="workforce.kpi_age" initial={widgets["workforce.kpi_age"]} title="Rata-rata Usia" />
        <WidgetCard widgetKey="workforce.kpi_tenure" initial={widgets["workforce.kpi_tenure"]} title="Rata-rata Masa Kerja" />
      </div>

      <WidgetCard
        widgetKey="workforce.status_by_group"
        initial={widgets["workforce.status_by_group"]}
        title="Status Karyawan per Kelompok"
        description="Jumlah karyawan per status, ditumpuk per kelompok"
        filterDimensions={ALL_DIMENSIONS}
        groupByOptions={STATUS_GROUP_BY}
      />

      <WidgetCard
        widgetKey="workforce.matrix"
        initial={widgets["workforce.matrix"]}
        title="Matriks Bidang × Status Karyawan"
        description="Makin pekat warnanya, makin banyak karyawannya"
        filterDimensions={ALL_DIMENSIONS}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <WidgetCard
          widgetKey="workforce.demography_gender"
          initial={widgets["workforce.demography_gender"]}
          title="Jenis Kelamin"
          filterDimensions={ALL_DIMENSIONS}
        />
        <WidgetCard
          widgetKey="workforce.demography_age"
          initial={widgets["workforce.demography_age"]}
          title="Kelompok Usia"
          filterDimensions={ALL_DIMENSIONS}
          render={(widget) => widget.type === "distribution" && <DistributionChart data={widget.data} variant="bar" />}
        />
        <WidgetCard
          widgetKey="workforce.demography_education"
          initial={widgets["workforce.demography_education"]}
          title="Pendidikan Terakhir"
          filterDimensions={ALL_DIMENSIONS}
          render={(widget) => widget.type === "distribution" && <DistributionChart data={widget.data} variant="bar" />}
        />
      </div>

      <WidgetCard
        widgetKey="workforce.levels"
        initial={widgets["workforce.levels"]}
        title="Level BRM & Job Grade"
        description="Sebaran karyawan menurut level jabatan"
        filterDimensions={ALL_DIMENSIONS}
      />
    </DashboardSection>
  );
}
