import { DashboardSection } from "@/components/shared/dashboard/DashboardSection";
import { WidgetCard } from "@/components/shared/dashboard/WidgetCard";
import type { DashboardWidget } from "@/types/api/dashboard";

/**
 * Bagian 1 — RINGKASAN EKSEKUTIF (kartu tanpa filter dimensi; periode per kartu):
 *
 *   [Tenaga Kerja     ][Biaya Upah Casual & DW]  [Perlu Tindakan   ]
 *   [Kehadiran        ][Lembur                ]  [  (daftar)       ]
 */
export function SummarySection({ widgets }: { widgets: Record<string, DashboardWidget> }) {
  return (
    <DashboardSection
      eyebrow="Bagian 1"
      title="Ringkasan Eksekutif"
      description="Gambaran utuh unit: tenaga kerja, biaya upah, kehadiran, lembur, dan hal yang perlu segera ditindaklanjuti."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <WidgetCard
            widgetKey="summary.workforce"
            initial={widgets["summary.workforce"]}
            title="Tenaga Kerja"
            description="Karyawan aktif pada akhir periode, per status"
          />
          <WidgetCard
            widgetKey="summary.payroll"
            initial={widgets["summary.payroll"]}
            title="Biaya Upah Casual & DW"
            description="Upah diterima, dijumlah sepanjang periode"
            goodWhenUp={false}
          />
          <WidgetCard
            widgetKey="summary.attendance"
            initial={widgets["summary.attendance"]}
            title="Kehadiran Casual & DW"
            description="Tingkat hadir = hari K ÷ hari aktif"
          />
          <WidgetCard
            widgetKey="summary.overtime"
            initial={widgets["summary.overtime"]}
            title="Lembur"
            description="Jam lembur reguler + DW dan pelanggaran batas"
            goodWhenUp={false}
          />
        </div>
        <WidgetCard
          widgetKey="summary.actions"
          initial={widgets["summary.actions"]}
          title="Perlu Tindakan"
          description="Klik untuk membuka halaman terkait"
        />
      </div>
    </DashboardSection>
  );
}
