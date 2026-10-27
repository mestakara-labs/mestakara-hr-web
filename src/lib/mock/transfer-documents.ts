/**
 * DOKUMEN CONTOH (MOCK) untuk usulan mutasi — pengganti dokumen yang nanti
 * dibuat otomatis oleh BACKEND dari template resmi.
 *
 *   - SK Kolektif  : satu dokumen, berisi daftar semua karyawan di usulan
 *   - Petikan SK   : satu dokumen per karyawan
 *
 * Format:
 *   - "pdf" -> PDF sederhana satu halaman (lihat sample-pdf.ts)
 *   - "doc" -> dokumen Word (.doc) berisi HTML. Word bisa membuka & menyuntingnya.
 *              Backend nanti menghasilkan .docx sungguhan.
 */
import { formatDate } from "@/lib/date";
import type { TransferItemResource, TransferResource } from "@/types/api/transfer";

import { createSamplePdf } from "./sample-pdf";

export interface GeneratedDocument {
  bytes: Uint8Array;
  type: string;
  name: string;
}

/** "2A44/P/2026.10.09-015" -> "2A44-P-2026.10.09-015" (aman untuk nama file). */
function safeFileName(text: string): string {
  return text.replace(/[^\w.-]+/g, "-");
}

/** "Rina Saepudin (NIK 20230001)" */
function employeeLine(item: TransferItemResource): string {
  return `${item.employee.name} (NIK ${item.employee.nik ?? "-"})`;
}

/** Tempat tugas baru: "Agrowisata Rancabali - Bungalow, Pondokan", atau sub unit saja kalau tanpa objek. */
function placeText(item: TransferItemResource): string {
  return [item.to.sub_unit_name, item.to.placement_object_names.join(", ")].filter(Boolean).join(" - ");
}

/** "Admin Gudang -> Admin Pengadaan (Definitif), Kantor Induk" */
function changeLine(item: TransferItemResource): string {
  const from = item.from ? item.from.position_title : "Belum memiliki jabatan";
  return `${from} -> ${item.to.position_title} (${item.to.assignment_status}), ${placeText(item)}`;
}

/**
 * Dokumen dasar yang dikutip di SK, mis. "Memo No. 2A44/M/2026.10.01-007 tanggal 1 Oktober 2026".
 * null = usulan tanpa dokumen dasar (bagian "Memperhatikan" tidak ditulis).
 */
function basisDocumentLine(transfer: TransferResource): string | null {
  if (!transfer.basis_document_type || !transfer.basis_document_number) return null;
  const date = formatDate(transfer.basis_document_date);
  return `${transfer.basis_document_type} No. ${transfer.basis_document_number}${date ? ` tanggal ${date}` : ""}`;
}

/** Baris-baris isi dokumen. `items` = semua karyawan (SK kolektif) atau satu karyawan (petikan). */
function documentLines(transfer: TransferResource, items: TransferItemResource[], title: string): string[] {
  const basisLine = basisDocumentLine(transfer);

  return [
    `${title} - DOKUMEN CONTOH (DATA MOCK)`,
    `Nomor   : ${transfer.decree_number ?? "-"}`,
    `Tanggal : ${formatDate(transfer.decree_date) || "-"}`,
    `Tentang : ${transfer.type} Karyawan`,
    "",
    ...(basisLine ? [`Memperhatikan: ${basisLine}`, ""] : []),
    "MEMUTUSKAN, menetapkan perubahan jabatan berikut,",
    `berlaku mulai ${formatDate(transfer.effective_date) || "-"}:`,
    "",
    ...items.flatMap((item, index) => [`${index + 1}. ${employeeLine(item)}`, `    ${changeLine(item)}`]),
    "",
    "Ditetapkan oleh,",
    transfer.signer ? `${transfer.signer.name} - ${transfer.signer.position_title}` : "-",
    "",
    "Dokumen ini dibuat otomatis oleh data mock. Backend nanti memakai template resmi.",
  ];
}

/** Dokumen Word (.doc) berisi HTML: judul, keterangan SK, tabel karyawan, dan penandatangan. */
function toWordDocument(transfer: TransferResource, items: TransferItemResource[], title: string): Uint8Array {
  const escape = (text: string) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const basisLine = basisDocumentLine(transfer);
  const rows = items
    .map(
      (item, index) => `<tr>
        <td>${index + 1}</td>
        <td>${escape(item.employee.name)}<br/>NIK ${escape(item.employee.nik ?? "-")}</td>
        <td>${escape(item.from?.position_title ?? "Belum memiliki jabatan")}</td>
        <td>${escape(item.to.position_title)} (${escape(item.to.assignment_status)})</td>
        <td>${escape(placeText(item))}</td>
      </tr>`,
    )
    .join("");

  const html = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"/>
<style>body{font-family:Arial;font-size:11pt}table{border-collapse:collapse;width:100%}td,th{border:1px solid #000;padding:4px}</style>
</head><body>
<h2 style="text-align:center">${escape(title)}</h2>
<p style="text-align:center">Nomor: ${escape(transfer.decree_number ?? "-")}<br/>Tentang: ${escape(transfer.type)} Karyawan</p>
${basisLine ? `<p>Memperhatikan: ${escape(basisLine)}</p>` : ""}
<p>Menetapkan perubahan jabatan berikut, berlaku mulai ${escape(formatDate(transfer.effective_date) || "-")}:</p>
<table><tr><th>No</th><th>Nama / NIK</th><th>Jabatan Lama</th><th>Jabatan Baru</th><th>Sub Unit / Objek</th></tr>${rows}</table>
<p>Ditetapkan tanggal ${escape(formatDate(transfer.decree_date) || "-")}</p>
<p><br/><br/><br/>${escape(transfer.signer?.name ?? "-")}<br/>${escape(transfer.signer?.position_title ?? "")}</p>
<p style="color:#888;font-size:9pt">Dokumen contoh (data mock). Backend nanti memakai template resmi.</p>
</body></html>`;

  return new TextEncoder().encode(html);
}

/**
 * Buat dokumen usulan mutasi.
 *
 * @param itemId  kosongkan untuk SK Kolektif; isi id item untuk Petikan SK karyawan itu
 * @param format  "pdf" atau "doc"
 */
export function generateTransferDocument(
  transfer: TransferResource,
  itemId: string | null,
  format: "pdf" | "doc",
): GeneratedDocument | null {
  const items = itemId ? transfer.items.filter((item) => item.id === itemId) : transfer.items;
  if (items.length === 0) return null;

  const title = itemId ? "PETIKAN SURAT KEPUTUSAN" : "SURAT KEPUTUSAN";
  const baseName = itemId
    ? `Petikan-SK-${safeFileName(transfer.decree_number ?? "draf")}-${safeFileName(items[0].employee.name)}`
    : `SK-${safeFileName(transfer.decree_number ?? "draf")}`;

  if (format === "doc") {
    return { bytes: toWordDocument(transfer, items, title), type: "application/msword", name: `${baseName}.doc` };
  }

  return { bytes: createSamplePdf(documentLines(transfer, items, title)), type: "application/pdf", name: `${baseName}.pdf` };
}
