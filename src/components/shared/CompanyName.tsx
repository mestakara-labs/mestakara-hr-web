/**
 * Nama resmi perusahaan. Pakai komponen ini di mana pun nama perusahaan ditampilkan,
 * supaya penulisannya selalu seragam.
 *
 * - Layar mobile (lebar di bawah 640px): versi singkat  -> "PTPN I (Persero) ..."
 * - Layar 640px ke atas                : versi lengkap  -> "PT. Perkebunan Nusantara I (Persero) ..."
 *
 * Warna dan ukuran huruf mengikuti elemen pembungkusnya, contoh:
 *   <p className="typo-body-s text-fg-secondary"><CompanyName /></p>
 */
export function CompanyName() {
  return (
    <>
      <span className="sm:hidden">PTPN I (Persero) Regional 2 - Unit Agrowisata</span>
      <span className="hidden sm:inline">
        PT. Perkebunan Nusantara I (Persero) Regional 2 - Unit Agrowisata
      </span>
    </>
  );
}
