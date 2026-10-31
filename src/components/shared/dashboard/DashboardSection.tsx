import type { ReactNode } from "react";

interface DashboardSectionProps {
  /** Nomor / label kecil di atas judul, mis. "Bagian 2" */
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
}

/**
 * SATU BAGIAN DASHBOARD:
 *
 *   BAGIAN 2
 *   Komposisi Tenaga Kerja
 *   Jumlah dan sebaran karyawan menurut status, bidang, dan demografi.
 *   (kartu-kartu)
 */
export function DashboardSection({ eyebrow, title, description, children }: DashboardSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        {eyebrow && <p className="typo-overline text-fg-brand">{eyebrow}</p>}
        <h2 className="typo-h3 text-fg-heading">{title}</h2>
        <p className="typo-body-m text-fg-secondary">{description}</p>
      </div>
      {children}
    </section>
  );
}
