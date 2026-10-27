"use client";

import { Badge } from "@mestakara/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@mestakara/ui/empty";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@mestakara/ui/sheet";

import { formatDateTime } from "@/lib/date";
import type { AttendanceImportConfig } from "@/lib/attendance-rules";
import type { AttendanceImportBatch } from "@/types/api/attendance";

interface ImportHistorySheetProps {
  /** Jenis unggahan yang dilihat riwayatnya. null = panel tertutup. */
  config: AttendanceImportConfig | null;
  /** Nama periode untuk judul, mis. "Oktober 2026" */
  periodLabel: string;
  batches: AttendanceImportBatch[];
  onClose: () => void;
}

/**
 * Panel samping RIWAYAT UNGGAHAN satu jenis (mis. Daftar Hadir) pada satu periode, terbaru di atas:
 *
 *   absensi-okt-revisi.xlsx                                   [Berlaku]
 *   25 Okt 2026, 10.15 · Admin SDM
 *   361 baris · 12 dibuat · 340 diubah · 3 dihapus · 2 konflik
 *
 *   absensi-okt.xlsx                                          [Diganti]
 *   ...
 */
export function ImportHistorySheet({ config, periodLabel, batches, onClose }: ImportHistorySheetProps) {
  return (
    <Sheet open={config !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {config && (
          <>
            <SheetHeader>
              <SheetTitle>Riwayat Unggahan {config.title}</SheetTitle>
              <SheetDescription>Periode {periodLabel}</SheetDescription>
            </SheetHeader>

            {batches.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Belum ada unggahan</EmptyTitle>
                  <EmptyDescription>File {config.title} periode ini belum pernah diunggah.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ol className="flex flex-col gap-3 px-4 pb-6">
                {batches.map((batch) => (
                  <li key={batch.id} className="flex flex-col gap-1 rounded-lg border border-border p-3 typo-body-s">
                    <div className="flex items-start justify-between gap-2">
                      <p className="typo-label-m break-all text-fg-heading">{batch.file_name}</p>
                      {/* "aktif" = data yang berlaku; "diganti" = sudah digantikan unggahan berikutnya. */}
                      {batch.status === "aktif" ? <Badge variant="success">Berlaku</Badge> : <Badge variant="neutral">Diganti</Badge>}
                    </div>
                    <p className="text-fg-tertiary">
                      {formatDateTime(batch.created_at)}
                      {batch.uploaded_by && ` · ${batch.uploaded_by}`}
                    </p>
                    <p className="text-fg-secondary">
                      {batch.total_rows} baris · {batch.created_count} dibuat · {batch.updated_count} diubah
                      {batch.deleted_count > 0 && ` · ${batch.deleted_count} dihapus`}
                      {batch.skipped_count > 0 && ` · ${batch.skipped_count} tetap`}
                      {batch.conflict_count > 0 && ` · ${batch.conflict_count} konflik`}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
