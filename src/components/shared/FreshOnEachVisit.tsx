"use client";

import { Fragment, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * Kosongkan ulang isinya setiap kali halaman DIBUKA LEWAT LINK.
 *
 * Kenapa perlu? Next.js versi ini tidak membuang halaman yang ditinggalkan,
 * tapi hanya menyembunyikannya. Akibatnya isian form ikut tersimpan: setelah
 * "Simpan Bidang", membuka "Tambah Bidang" lagi masih berisi data yang lama.
 *
 * `bfcacheId` berganti setiap kali halaman dibuka lewat link / router.push, jadi
 * dipakai sebagai `key` supaya isi form dibuat ulang dari awal. Saat user menekan
 * tombol Back browser, `bfcacheId` tetap sama sehingga isian sebelumnya tidak hilang.
 *
 * Pakai di halaman form:
 *   <FreshOnEachVisit>
 *     <BidangForm />
 *   </FreshOnEachVisit>
 */
export function FreshOnEachVisit({ children }: { children: ReactNode }) {
  const { bfcacheId } = useRouter();

  return <Fragment key={bfcacheId}>{children}</Fragment>;
}
