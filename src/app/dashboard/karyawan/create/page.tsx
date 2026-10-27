import { redirect } from "next/navigation";

/**
 * Alamat lama: /dashboard/karyawan/create. Karyawan baru sekarang ditambahkan lewat
 * wizard Penambahan Karyawan (dasar penambahan, dokumen, dan penempatan sekaligus).
 */
export default function TambahKaryawan() {
  redirect("/dashboard/penambahan/create");
}
