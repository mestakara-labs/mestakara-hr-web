import { DashboardSection } from "@/components/shared/dashboard/DashboardSection";
import { SeriesChart } from "@/components/shared/dashboard/SeriesChart";
import { WidgetCard } from "@/components/shared/dashboard/WidgetCard";
import { ALL_DIMENSIONS } from "@/lib/dashboard-filters";
import type { DashboardWidget } from "@/types/api/dashboard";

/** Pilihan "Lihat per" grafik biaya upah per kelompok. */
const PAYROLL_GROUP_BY = [
  { value: "payroll_group", label: "Kelompok Daftar Upah" },
  { value: "division", label: "Bidang" },
  { value: "cost_center", label: "Cost Center" },
  { value: "segment", label: "Segmen" },
];

/**
 * Bagian 3 — BIAYA UPAH & LEMBUR karyawan Casual & DW (dijumlah sepanjang periode; angka = Daftar Upah):
 *
 *   [Upah Diterima][Rata-rata per Karyawan][Porsi Lembur][Potongan]
 *   [Tren per bulan: gaji / lembur / tunjangan + garis diterima        ]
 *   [Biaya per Kelompok / Bidang / Cost Center / Segmen ][10 Cost Center terbesar]
 *   [Matriks Kelompok × komponen upah                                  ]
 */
export function PayrollSection({ widgets }: { widgets: Record<string, DashboardWidget> }) {
  return (
    <DashboardSection
      eyebrow="Bagian 3"
      title="Biaya Upah & Lembur"
      description="Biaya upah karyawan Casual & Daily Worker, sama dengan Daftar Upah: gaji, lembur, tunjangan, potongan, dan upah diterima."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WidgetCard widgetKey="payroll.kpi_net" initial={widgets["payroll.kpi_net"]} title="Upah Diterima" goodWhenUp={false} />
        <WidgetCard
          widgetKey="payroll.kpi_average"
          initial={widgets["payroll.kpi_average"]}
          title="Rata-rata per Karyawan"
          goodWhenUp={false}
        />
        <WidgetCard
          widgetKey="payroll.kpi_overtime_share"
          initial={widgets["payroll.kpi_overtime_share"]}
          title="Porsi Lembur"
          description="Lembur ÷ jumlah upah & tunjangan"
          goodWhenUp={false}
        />
        <WidgetCard widgetKey="payroll.kpi_deductions" initial={widgets["payroll.kpi_deductions"]} title="Total Potongan" />
      </div>

      <WidgetCard
        widgetKey="payroll.trend"
        initial={widgets["payroll.trend"]}
        title="Tren Biaya Upah per Bulan"
        description="Batang: gaji, lembur, tunjangan · Garis: upah diterima"
        filterDimensions={ALL_DIMENSIONS}
        render={(widget) => widget.type === "series" && <SeriesChart data={widget.data} layout="vertical" />}
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <WidgetCard
          className="xl:col-span-3"
          widgetKey="payroll.by_group"
          initial={widgets["payroll.by_group"]}
          title="Biaya Upah per Kelompok"
          description="Upah diterima, urut dari yang terbesar"
          filterDimensions={ALL_DIMENSIONS}
          groupByOptions={PAYROLL_GROUP_BY}
          render={(widget) => widget.type === "series" && <SeriesChart data={widget.data} layout="horizontal" />}
        />
        <WidgetCard
          className="xl:col-span-2"
          widgetKey="payroll.top_cost_center"
          initial={widgets["payroll.top_cost_center"]}
          title="10 Cost Center Terbesar"
          filterDimensions={ALL_DIMENSIONS}
        />
      </div>

      <WidgetCard
        widgetKey="payroll.matrix"
        initial={widgets["payroll.matrix"]}
        title="Matriks Kelompok Daftar Upah × Komponen Upah"
        description="Rincian komponen upah setiap kelompok"
        filterDimensions={ALL_DIMENSIONS}
      />
    </DashboardSection>
  );
}
