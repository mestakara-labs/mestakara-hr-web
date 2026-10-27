import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Tombol di sebelah kanan judul, mis. "Tambah Bidang" */
  action?: ReactNode;
}

/**
 * Judul halaman + keterangan singkat + tombol aksi utama.
 * Di layar kecil tombolnya pindah ke bawah judul.
 */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="typo-h3 text-fg-heading">{title}</h1>
        {description && <p className="mt-1 typo-body-m text-fg-secondary">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
