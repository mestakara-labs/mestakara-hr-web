import Link from "next/link";
import { ChevronRight, CircleCheck, TriangleAlert } from "lucide-react";

import type { ListData } from "@/types/api/dashboard";

/**
 * Daftar PERLU TINDAKAN di Ringkasan Eksekutif:
 *
 *   ⚠ Pensiun ≤ 6 bulan                     4  ›
 *   ⚠ Data karyawan belum lengkap          27  ›
 *   ✓ Usulan masih draf                     0
 *
 * Baris berjumlah > 0 bertautan ke halaman untuk menindaklanjutinya.
 */
export function ActionList({ data }: { data: ListData }) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {data.items.map((item) => {
        const content = (
          <>
            {item.count > 0 ? (
              <TriangleAlert className="size-4 shrink-0 text-fg-warning" />
            ) : (
              <CircleCheck className="size-4 shrink-0 text-fg-success" />
            )}
            <span className="flex-1 typo-body-s text-fg-primary">{item.label}</span>
            <span className={item.count > 0 ? "typo-label-m text-fg-heading" : "typo-body-s text-fg-tertiary"}>
              {item.count.toLocaleString("id-ID")}
            </span>
            {item.count > 0 && <ChevronRight className="size-4 text-fg-tertiary" />}
          </>
        );

        return (
          <li key={item.key}>
            {item.count > 0 ? (
              <Link href={item.href} className="flex items-center gap-2 py-2 hover:bg-subtle">
                {content}
              </Link>
            ) : (
              <div className="flex items-center gap-2 py-2">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
