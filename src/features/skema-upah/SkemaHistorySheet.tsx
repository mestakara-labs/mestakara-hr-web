"use client";

import { Badge } from "@mestakara/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@mestakara/ui/empty";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@mestakara/ui/sheet";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { formatDate, formatDateTime } from "@/lib/date";
import { dailyRate, formatRupiah } from "@/lib/wage-rules";
import type { WageEmployeeResource, WageSchemeResource } from "@/types/api/wage";

interface SkemaHistorySheetProps {
  /** Karyawan yang dilihat riwayatnya. null = panel tertutup. */
  target: WageEmployeeResource | null;
  onClose: () => void;
}

/**
 * Panel samping RIWAYAT SKEMA UPAH satu karyawan, terbaru di atas. Hanya dilihat:
 * riwayat tidak bisa diubah atau dihapus (koreksi = tambah skema baru).
 *
 *   Berlaku mulai 1 Oktober 2026                         [Berlaku]
 *   Harian · Gaji Pokok Rp 2.375.000 · HKE 25 (Rp 95.000/hari) · maks. 20 hari
 *   Tunj. Operasional & Jabatan Rp 0 · Insentif Rp 0 · Uang makan Rp 15.000/hari
 *   Kelompok: Gunung Mas
 *   "Penyesuaian UMK 2026" — dicatat 1 Okt 2026, 08.00 oleh Admin SDM
 */
export function SkemaHistorySheet({ target, onClose }: SkemaHistorySheetProps) {
  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {target && (
          <>
            <SheetHeader>
              <SheetTitle>Riwayat Skema Upah</SheetTitle>
              <SheetDescription>
                {target.name} · {target.registration_number ?? "tanpa No. Registrasi"}
              </SheetDescription>
            </SheetHeader>

            {/* `key` = data diambil ulang setiap kali panel dibuka untuk karyawan lain. */}
            <HistoryList key={target.id} employeeId={target.id} currentId={target.wage_scheme?.id ?? null} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Daftar catatan skema satu karyawan. */
function HistoryList({ employeeId, currentId }: { employeeId: string; currentId: string | null }) {
  const { data: history, loading, error } = useApiGet<WageSchemeResource[]>(`/api/employees/${employeeId}/wage-schemes`);

  if (loading) return <PageLoading label="Memuat riwayat skema..." />;
  if (error || !history) return <PageError message={error ?? "Riwayat skema gagal dimuat."} />;

  if (history.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Belum ada skema upah</EmptyTitle>
          <EmptyDescription>Atur skema lewat menu Aksi › Ubah Skema, atau unggah Excel.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ol className="flex flex-col gap-3 px-4 pb-6">
      {history.map((scheme) => (
        <li key={scheme.id} className="flex flex-col gap-1 rounded-lg border border-border p-3 typo-body-s">
          <div className="flex items-center justify-between gap-2">
            <p className="typo-label-m text-fg-heading">Berlaku mulai {formatDate(scheme.effective_date)}</p>
            {scheme.id === currentId && <Badge variant="success">Berlaku</Badge>}
          </div>
          <p className="text-fg-primary">
            {scheme.wage_type} · Gaji Pokok {formatRupiah(scheme.base_salary)} · HKE {scheme.working_days} (
            {formatRupiah(dailyRate(scheme.base_salary, scheme.working_days))}/hari)
            {scheme.is_capped && ` · maks. ${scheme.cap_days} hari kerja`}
          </p>
          <p className="text-fg-secondary">
            Tunj. Operasional & Jabatan {formatRupiah(scheme.operational_position_allowance)} · Insentif{" "}
            {formatRupiah(scheme.incentive)} ·{" "}
            {scheme.has_meal_allowance ? `Uang makan ${formatRupiah(scheme.meal_allowance_per_day)}/hari` : "Tanpa uang makan"}
          </p>
          <p className="text-fg-secondary">Kelompok: {scheme.payroll_group?.name ?? "-"}</p>
          <p className="text-fg-tertiary">
            {scheme.notes && `"${scheme.notes}" — `}dicatat {formatDateTime(scheme.created_at)}
            {scheme.created_by && ` oleh ${scheme.created_by}`}
          </p>
        </li>
      ))}
    </ol>
  );
}
