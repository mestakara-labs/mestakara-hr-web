import { FileLink } from "@/features/karyawan/detail/DetailParts";
import { formatDate } from "@/lib/date";
import { formatSigner } from "@/lib/signer-rules";
import type { StatusDocumentResource } from "@/types/api/employee-activation";

/**
 * Ringkasan SATU dokumen dasar (penambahan / penonaktifan):
 *
 *   SK No. 812/SDM/2026 · 1 Oktober 2026
 *   Ditandatangani Direktur SDM — Head Office
 *   📄 SK-812.pdf
 *
 * `document` null -> "Belum ada dokumen" (kuning).
 */
export function StatusDocumentSummary({ document }: { document: StatusDocumentResource | null }) {
  if (!document) return <span className="typo-body-s text-fg-warning">Belum ada dokumen</span>;

  return (
    <div className="flex flex-col gap-0.5 typo-body-s">
      <span className="font-medium text-fg-heading">
        {document.type} No. {document.number || "-"}
        {document.date && <span className="font-normal text-fg-secondary"> · {formatDate(document.date)}</span>}
      </span>
      {document.signer && (
        <span className="text-fg-tertiary">Ditandatangani {formatSigner(document.signer)}</span>
      )}
      {document.file && document.file_url ? (
        <FileLink href={document.file_url} label={document.file.name} />
      ) : (
        <span className="text-fg-warning">File belum diunggah</span>
      )}
    </div>
  );
}
