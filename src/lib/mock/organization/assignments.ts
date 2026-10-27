/**
 * PENUGASAN JABATAN CONTOH (DUMMY).
 *
 * Dibuat otomatis dari jabatan & karyawan contoh (lihat helpers.ts):
 *   1. Setiap pemegang jabatan mendapat satu penugasan Definitif sejak SK struktur organisasi.
 *   2. Atasan langsung diambil dari jabatan atasan di SK, dibagi RATA BERGILIRAN ke para
 *      pemegangnya. Contoh: 11 Penanggung Jawab di bawah 4 Pengawas -> 3, 3, 3, 2.
 *   3. Sebagian kecil penugasan diberi status lain (Plt, Plh, Pj, Penugasan) sebagai contoh.
 *   4. Ditambah contoh penugasan rangkap (Ptr, Plh) dan riwayat penugasan yang sudah selesai.
 *
 * Isinya dibuat dengan POLA TETAP (bukan acak), jadi datanya selalu sama
 * setiap kali server dijalankan.
 */
import type { UploadedFileInfo } from "@/types/api/employee";

import type { SeedHolders } from "./helpers";
import { mockPlacementObjects, PLACEMENT_OBJECT_IDS, SUB_UNIT_IDS } from "./placements";

/**
 * Penugasan seperti yang DISIMPAN: hanya id karyawan, jabatan, sub unit, dst.
 * Nama-namanya ditempelkan saat dibaca (lihat toAssignmentResource() di organization-store.ts).
 */
export interface AssignmentRecord {
  id: string;
  employee_id: string;
  position_id: string;
  sub_unit_id: string;
  /** Objek penempatan, bisa lebih dari satu. [] = tanpa objek. */
  placement_object_ids: string[];
  assignment_status: string;
  /** Id PENUGASAN atasan langsung */
  supervisor_assignment_ids: string[];
  start_date: string;
  end_date: string | null;
  decree_type: string | null;
  decree_number: string | null;
  decree_date: string | null;
  decree_file: UploadedFileInfo | null;
  /**
   * Isi file dokumen dasar dalam bentuk teks base64 (khusus data mock, supaya file
   * bisa dibuka lagi). null untuk dokumen contoh -> ditampilkan sebagai PDF contoh.
   */
  decree_file_data: string | null;
  notes: string | null;
  /** Usulan mutasi yang membuat penugasan ini. null = data awal. */
  transfer_id: string | null;
}

/** SK struktur organisasi — dasar semua penugasan Definitif contoh. */
const ORGANIZATION_DECREE = {
  decree_type: "SK",
  decree_number: "KEP/IV.2/1667/XI/2023",
  decree_date: "2023-11-09",
  decree_file: { name: "SK-KEP-IV.2-1667-XI-2023.pdf", size: 1_240_000, type: "application/pdf" },
  decree_file_data: null,
};

/** Surat penugasan contoh untuk status selain Definitif. */
const ASSIGNMENT_LETTER = {
  decree_type: "Surat Penugasan",
  decree_number: "SP/AGRO/017/VII/2025",
  decree_date: "2025-07-01",
  decree_file: null,
  decree_file_data: null,
};

/** Buat semua penugasan contoh dari daftar pemegang jabatan. */
export function createSeedAssignments(holders: SeedHolders[]): AssignmentRecord[] {
  const assignments: AssignmentRecord[] = [];
  /** Penugasan setiap jabatan: { "asisten-umum": [penugasan, ...], ... } */
  const assignmentsOfPosition = new Map<string, AssignmentRecord[]>();

  // Langkah 1: satu penugasan per pemegang jabatan.
  for (const holder of holders) {
    const list = holder.employeeIds.map((employeeId, holderIndex): AssignmentRecord => {
      const counter = assignments.length + holderIndex + 1;
      const status = holder.brmLevel >= 4 ? dummyStatus(counter) : "Definitif";
      const subUnitId = dummySubUnit(holder.positionId, holder.brmLevel, holderIndex);

      return {
        id: `penugasan-${String(counter).padStart(4, "0")}`,
        employee_id: employeeId,
        position_id: holder.positionId,
        sub_unit_id: subUnitId,
        placement_object_ids: dummyPlacementObjects(holder.positionId, subUnitId, holderIndex),
        assignment_status: status,
        supervisor_assignment_ids: [],
        start_date: status === "Definitif" ? "2023-11-09" : "2025-07-01",
        // Plh bersifat sementara, jadi contohnya diberi TMT Selesai.
        end_date: status === "Plh" ? "2026-12-31" : null,
        ...(status === "Definitif" ? ORGANIZATION_DECREE : ASSIGNMENT_LETTER),
        notes: null,
        transfer_id: null,
      };
    });

    assignments.push(...list);
    assignmentsOfPosition.set(holder.positionId, list);
  }

  // Langkah 2: atasan langsung, dibagi rata bergiliran ke para pemegang jabatan atasan.
  //
  //   Pengawas A   Pengawas B   Pengawas C   Pengawas D
  //   PJ 1, PJ 5   PJ 2, PJ 6   PJ 3, PJ 7   PJ 4, PJ 8   ... dst.
  const nextTurn = new Map<string, number>();

  for (const holder of holders) {
    for (const assignment of assignmentsOfPosition.get(holder.positionId) ?? []) {
      for (const parentId of holder.parentPositionIds) {
        const parentAssignments = assignmentsOfPosition.get(parentId) ?? [];
        if (parentAssignments.length === 0) continue;

        const turn = nextTurn.get(parentId) ?? 0;
        assignment.supervisor_assignment_ids.push(parentAssignments[turn % parentAssignments.length].id);
        nextTurn.set(parentId, turn + 1);
      }
    }
  }

  // Langkah 3: contoh penugasan rangkap — karyawan yang sama memegang jabatan kedua.
  const firstOf = (positionId: string) => assignmentsOfPosition.get(positionId)?.[0];

  function addExtra(fromPositionId: string, toPositionId: string, status: string, endDate: string | null, notes: string) {
    const from = firstOf(fromPositionId);
    const target = firstOf(toPositionId);
    if (!from || !target) return;

    assignments.push({
      ...target,
      id: `penugasan-${String(assignments.length + 1).padStart(4, "0")}`,
      employee_id: from.employee_id,
      assignment_status: status,
      supervisor_assignment_ids: [...target.supervisor_assignment_ids],
      start_date: "2026-03-02",
      end_date: endDate,
      ...ASSIGNMENT_LETTER,
      notes,
    });
  }

  addExtra("asisten-pengembangan-bisnis-1", "asisten-pengembangan-bisnis-2", "Ptr", null, "Merangkap jabatan");
  addExtra("asisten-marketing", "asisten-sales", "Plh", "2026-12-31", "Selama Asisten Sales menjalani cuti panjang");

  // Langkah 4: contoh riwayat — para Asisten (BRM-3) dulu menjabat Plt sebelum didefinitifkan.
  for (const holder of holders.filter((item) => item.brmLevel === 3)) {
    const current = firstOf(holder.positionId);
    if (!current) continue;

    assignments.push({
      ...current,
      id: `penugasan-${String(assignments.length + 1).padStart(4, "0")}`,
      assignment_status: "Plt",
      supervisor_assignment_ids: [...current.supervisor_assignment_ids],
      start_date: "2022-01-03",
      end_date: "2023-11-08",
      ...ASSIGNMENT_LETTER,
      decree_number: "SP/AGRO/002/I/2022",
      decree_date: "2022-01-03",
      notes: "Digantikan penugasan Definitif sesuai SK struktur organisasi",
    });
  }

  return assignments;
}

/** Status contoh untuk BRM-4 ke bawah: sebagian besar Definitif, sesekali status lain. */
function dummyStatus(counter: number): string {
  if (counter % 23 === 5) return "Plt";
  if (counter % 29 === 7) return "Penugasan";
  if (counter % 31 === 9) return "Pj";
  if (counter % 37 === 11) return "Plh";
  return "Definitif";
}

/**
 * Sub unit contoh, dilihat dari id jabatannya:
 *   - Manager & Asisten Manager            -> Kantor Induk
 *   - jabatan Wilayah I  (id berakhiran -1) -> Agrowisata Gunung Mas
 *   - jabatan Wilayah II (id berakhiran -2) -> Rancabali dan Malabar bergantian
 *   - lainnya                               -> Kantor Induk
 */
function dummySubUnit(positionId: string, brmLevel: number, holderIndex: number): string {
  if (brmLevel <= 2) return SUB_UNIT_IDS.kantorInduk;
  if (positionId.endsWith("-1")) return SUB_UNIT_IDS.gunungMas;
  if (positionId.endsWith("-2")) return holderIndex % 2 === 0 ? SUB_UNIT_IDS.rancabali : SUB_UNIT_IDS.malabar;
  return SUB_UNIT_IDS.kantorInduk;
}

/** Calon objek contoh menurut kata di id jabatannya, mis. jabatan "pj-wahana-1" -> objek wahana. */
const OBJECTS_BY_KEYWORD: Record<string, string[]> = {
  wahana: [PLACEMENT_OBJECT_IDS.atv, PLACEMENT_OBJECT_IDS.flyingFox, PLACEMENT_OBJECT_IDS.teaBridge],
  "house-keeping": [PLACEMENT_OBJECT_IDS.glamping, PLACEMENT_OBJECT_IDS.bungalow, PLACEMENT_OBJECT_IDS.pondokan],
  "resto-cafe": [PLACEMENT_OBJECT_IDS.restoran, PLACEMENT_OBJECT_IDS.cafe],
  panen: [PLACEMENT_OBJECT_IDS.kebunTeh],
};

/** Jabatan yang memegang SEMUA calon objeknya sekaligus, mis. House Keeping -> Bungalow + Pondokan. */
const MULTI_OBJECT_KEYWORDS = ["house-keeping"];

/**
 * Objek penempatan contoh: dipilih dari calon objek jabatannya, tapi HANYA yang
 * tersedia di sub unit penugasannya. [] = tanpa objek.
 *   - House Keeping -> semua objek penginapan di sub unitnya (contoh objek lebih dari satu)
 *   - lainnya       -> satu objek, bergiliran antarpemegang jabatan
 */
function dummyPlacementObjects(positionId: string, subUnitId: string, holderIndex: number): string[] {
  const keyword = Object.keys(OBJECTS_BY_KEYWORD).find((word) => positionId.includes(word));
  if (!keyword) return [];

  const available = OBJECTS_BY_KEYWORD[keyword].filter((objectId) =>
    mockPlacementObjects.find((item) => item.id === objectId)?.sub_unit_ids.includes(subUnitId),
  );
  if (available.length === 0) return [];
  if (MULTI_OBJECT_KEYWORDS.includes(keyword)) return available;

  return [available[holderIndex % available.length]];
}
