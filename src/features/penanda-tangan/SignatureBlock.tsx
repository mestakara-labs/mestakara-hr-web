import type { ReactNode } from "react";

interface SignatureBlockProps {
  /** Mis. "Penanda Tangan Daftar Upah" */
  title: string;
  /** Keterangan kecil di bawah judul (opsional) */
  description?: string;
  /** Kontrol di kanan judul (opsional), mis. pilihan "Pakai penanda tangan Umum" */
  action?: ReactNode;
  children: ReactNode;
}

/** Satu blok di halaman penanda tangan: judul (+ keterangan & kontrol) lalu isinya. */
export function SignatureBlock({ title, description, action, children }: SignatureBlockProps) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="typo-label-m text-fg-heading">{title}</p>
          {description && <p className="typo-body-s text-fg-tertiary">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
