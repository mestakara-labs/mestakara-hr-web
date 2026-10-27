/**
 * DATA CONTOH (MOCK) JABATAN KARYAWAN (penugasan jabatan) — pengganti backend selama AUTH_MOCK=true.
 *
 * Dipanggil oleh route handler src/app/api/position-assignments/**. Setiap fungsi
 * mengembalikan `{ status, body }` (lihat mock-response.ts).
 *
 * Di sini hanya ada fungsi MEMBACA. Penugasan dibuat, diakhiri, dan dibatalkan
 * lewat menu Mutasi & Penempatan, supaya setiap perubahan jabatan punya SK.
 *
 * File dokumen bisa dibuka lagi lewat mockGetDecreeFile (link "Lihat dokumen" di tabel).
 */
import type { AssignmentResource } from "@/types/api/assignment";

import { failure, success, type MockResult } from "./mock-response";
import { getStore, toAssignmentResource } from "./organization-store";
import { createSamplePdf } from "./sample-pdf";

/**
 * Pengganti backend `GET /position-assignments`. Terbaru (TMT mulai paling akhir) di atas.
 * `employeeId` diisi = hanya penugasan karyawan itu (aktif maupun riwayat).
 */
export function mockListAssignments(employeeId: string | null = null): MockResult<AssignmentResource[]> {
  const assignments = getStore()
    .assignments.filter((item) => employeeId === null || item.employee_id === employeeId)
    .sort((a, b) => b.start_date.localeCompare(a.start_date));

  return success("Daftar penugasan jabatan", assignments.map(toAssignmentResource));
}

/** Pengganti backend `GET /position-assignments/{id}`. */
export function mockGetAssignment(id: string): MockResult<AssignmentResource | null> {
  const assignment = getStore().assignments.find((item) => item.id === id);
  if (!assignment) return failure(404, "Penugasan jabatan tidak ditemukan.");

  return success("Detail penugasan jabatan", toAssignmentResource(assignment));
}

/** File dokumen dasar yang siap dikirim ke browser: isi file, jenis, dan namanya. */
export interface DecreeFileContent {
  bytes: Uint8Array;
  type: string;
  name: string;
}

/**
 * Pengganti backend `GET /position-assignments/{id}/decree-file`: isi file dokumen dasar.
 * Dokumen contoh (tanpa file sungguhan) diganti dengan PDF contoh berisi nomor dokumennya.
 * null = penugasan tidak ditemukan, atau belum punya file dokumen.
 */
export function mockGetDecreeFile(id: string): DecreeFileContent | null {
  const assignment = getStore().assignments.find((item) => item.id === id);
  if (!assignment?.decree_file) return null;

  const { name, type } = assignment.decree_file;

  if (assignment.decree_file_data) {
    return { bytes: Buffer.from(assignment.decree_file_data, "base64"), type, name };
  }

  const { employee, position } = toAssignmentResource(assignment);
  const bytes = createSamplePdf([
    "DOKUMEN CONTOH (DATA MOCK)",
    `${assignment.decree_type ?? "Dokumen"} No. ${assignment.decree_number ?? "-"}`,
    `Tanggal: ${assignment.decree_date ?? "-"}`,
    "",
    `Karyawan : ${employee.name} (NIK ${employee.nik ?? "-"})`,
    `Jabatan  : ${assignment.assignment_status} ${position.title}`,
    `TMT      : ${assignment.start_date}`,
    "",
    "File ini dibuat otomatis karena data contoh tidak punya file aslinya.",
  ]);

  return { bytes, type: "application/pdf", name };
}
