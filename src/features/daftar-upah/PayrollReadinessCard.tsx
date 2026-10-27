import Link from "next/link";
import { CircleCheck, TriangleAlert } from "lucide-react";

import { readinessItems } from "@/lib/payroll-rules";
import type { PayrollReadiness } from "@/types/api/payroll";

/**
 * Kotak KESIAPAN sebelum periode dikunci:
 *
 *   ✓ Daftar hadir sudah diunggah
 *   ⚠ 2 karyawan belum punya skema upah  →
 *   ...
 *
 * Hanya peringatan (tidak menghalangi kunci); setiap baris bertautan ke halaman untuk membereskannya.
 */
export function PayrollReadinessCard({ readiness }: { readiness: PayrollReadiness }) {
  const items = readinessItems(readiness);
  const problems = items.filter((item) => !item.ok).length;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <p className="typo-label-m text-fg-heading">
        Kesiapan {problems === 0 ? "— semua beres" : `— ${problems} hal perlu diperiksa`}
      </p>
      <ul className="grid gap-x-6 gap-y-1.5 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.text} className="flex items-start gap-2 typo-body-s">
            {item.ok ? (
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-fg-success" />
            ) : (
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-fg-warning" />
            )}
            {!item.ok && item.href ? (
              <Link href={item.href} className="text-fg-primary underline-offset-2 hover:underline">
                {item.text}
              </Link>
            ) : (
              <span className={item.ok ? "text-fg-secondary" : "text-fg-primary"}>{item.text}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
