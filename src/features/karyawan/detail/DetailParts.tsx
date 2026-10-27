import type { ReactNode } from "react";
import { FileText } from "lucide-react";

/**
 * POTONGAN TAMPILAN yang dipakai bersama oleh tab-tab detail karyawan.
 */

/**
 * Daftar "label di atas, isi di bawah" dalam tiga kolom (dua kolom di tablet, satu di HP):
 *
 *   Jenis Kelamin        Agama              Status Perkawinan
 *   Laki-laki            Islam              Kawin
 */
export function DetailList({ children }: { children: ReactNode }) {
  return <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>;
}

/** Satu isian di DetailList. Isi kosong (null / "") ditulis "-". */
export function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  const isEmpty = children === null || children === undefined || children === "";

  return (
    <div className="flex flex-col gap-1">
      <dt className="typo-body-m text-fg-tertiary">{label}</dt>
      <dd className="typo-body-l font-medium break-words text-fg-heading">{isEmpty ? "-" : children}</dd>
    </div>
  );
}

/** Link yang membuka file di tab baru, mis. "📄 SK-Pengangkatan.pdf". */
export function FileLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-medium text-fg-brand hover:underline"
    >
      <FileText className="size-4 shrink-0" />
      {label}
    </a>
  );
}

/** Tulisan abu-abu untuk tab yang belum ada datanya, mis. "Belum ada data batih." */
export function EmptyText({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center typo-body-s text-fg-tertiary">{children}</p>;
}
