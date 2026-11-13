import Image from "next/image";
import { ShieldCheck } from "lucide-react";

import { CompanyName } from "@/components/shared/CompanyName";
import { MestakaraLogoTile } from "@/components/shared/MestakaraLogo";

/** Angka ringkas yang tampil di kartu kaca bagian bawah panel. */
const STATISTICS = [
  { value: "8", label: "Regional Unit Aktif" },
  { value: "500+", label: "Karyawan Terhubung" },
  { value: "5", label: "Destinasi", note: "Gunung Mas, Rancabali, Malabar" },
];

/**
 * Panel kiri halaman login: foto kebun, nama perusahaan, judul, dan statistik.
 * Hanya tampil di layar lebar (lg ke atas); di HP panel ini disembunyikan.
 */
export function LoginHeroPanel() {
  return (
    <aside className="relative hidden w-full max-w-xl flex-col justify-between overflow-hidden p-10 text-fg-on-brand lg:flex">
      {/* Foto latar + lapisan hijau gelap supaya tulisan putih tetap terbaca.
          sizes="576px": panel ini paling lebar 576px (max-w-xl), jadi browser
          cukup mengunduh satu ukuran gambar dan tidak menggantinya saat window di-resize. */}
      <Image
        src="/images/login-background.webp"
        alt=""
        fill
        preload
        sizes="576px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-b from-forest-900/80 via-forest-900/70 to-forest-900/95" />

      {/* Bagian atas: logo + nama perusahaan */}
      <div className="relative flex items-center gap-3">
        <MestakaraLogoTile className="size-12 border-white/20" />
        <div>
          <p className="typo-label-l">HR Dashboard</p>
          <p className="typo-body-s text-green-100">
            <CompanyName />
          </p>
        </div>
      </div>

      {/* Bagian tengah: judul + deskripsi + statistik */}
      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 typo-label-s text-green-100">
          <span className="size-1.5 rounded-full bg-green-400" />
          Portal Terpadu SDM
        </span>

        <h1 className="mt-5 font-display text-3xl leading-tight font-semibold xl:text-4xl">
          Monitoring & Sentralisasi Data SDM dalam Satu Dashboard.
        </h1>
        <p className="mt-4 typo-body-m text-green-100">
          Platform terpadu untuk memantau data karyawan, presensi, dan kinerja SDM PT. Perkebunan Nusantara I (Persero) Regional 2 - Unit
          Agrowisata secara terpusat, akurat, dan real-time.
        </p>

        {/* Kartu statistik bergaya kaca: latar putih transparan + garis tepi + bayangan.
            Sengaja TANPA backdrop-blur: efek blur di atas foto besar membuat browser
            menggambar ulang seluruh panel setiap kali window di-resize (terasa patah-patah). */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {STATISTICS.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-white/20 bg-white/15 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.28)]"
            >
              <p className="font-display text-3xl font-semibold">{item.value}</p>
              <p className="mt-1 typo-label-s text-green-100">{item.label}</p>
              {item.note && <p className="mt-0.5 text-xs text-green-100/70">{item.note}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Bagian bawah: catatan keamanan */}
      <p className="relative flex items-center gap-2 typo-body-s text-green-100/80">
        <ShieldCheck className="size-4 shrink-0 text-green-400" />
        Akses aman terenkripsi sesuai standar keamanan korporat BUMN
      </p>
    </aside>
  );
}
