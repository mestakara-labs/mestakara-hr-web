/**
 * PDF CONTOH untuk data mock: satu halaman A4 berisi beberapa baris teks.
 *
 * Dipakai untuk dokumen contoh yang tidak punya file sungguhan (mis. SK di data
 * penugasan awal), supaya link "Lihat dokumen" tetap bisa dicoba.
 *
 *   createSamplePdf(["DOKUMEN CONTOH", "SK KEP/IV.2/1667/XI/2023"])
 */

/** Teks di dalam PDF ditulis di antara tanda kurung, jadi \ ( ) harus di-escape. Huruf non-ASCII dibuang. */
function escapePdfText(text: string): string {
  return text
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

/** Buat file PDF sederhana. Baris pertama dicetak sebagai judul. */
export function createSamplePdf(lines: string[]): Uint8Array {
  const [title, ...rest] = lines.map(escapePdfText);
  const content = [
    "BT",
    "/F1 18 Tf 72 770 Td 26 TL",
    `(${title}) Tj T*`,
    "/F1 12 Tf 18 TL",
    ...rest.map((line) => `(${line}) Tj T*`),
    "ET",
  ].join("\n");

  // Isi PDF = daftar "objek" bernomor: katalog, daftar halaman, halaman, isi halaman, dan font.
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  // Tulis setiap objek sambil mencatat posisinya (byte ke berapa) untuk tabel "xref".
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return new TextEncoder().encode(pdf);
}
