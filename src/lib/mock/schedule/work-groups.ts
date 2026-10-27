/**
 * REGU KERJA CONTOH (data awal mock). Anggotanya karyawan contoh yang sudah ada
 * di data organisasi (lihat organization/employees.ts).
 *
 *   1. House Keeping Gunung Mas : pola 3 shift + tengah, 4 orang, BERGILIR tiap 7 hari
 *   2. Keamanan Kantor Induk    : pola 24 jam, 4 orang, TETAP (siklusnya sendiri sudah bergantian)
 *   3. Administrasi Kantor Induk: pola Reguler Kantor, 4 orang di slot yang sama
 */
import { PLACEMENT_OBJECT_IDS, SUB_UNIT_IDS } from "../organization/placements";
import { PATTERN_IDS } from "./work-patterns";

/** Regu seperti yang DISIMPAN. */
export interface WorkGroupRecord {
  id: string;
  name: string;
  sub_unit_id: string;
  placement_object_id: string | null;
  work_pattern_id: string;
  leader_employee_id: string | null;
  rotation_mode: string;
  rotate_every_days: number;
  anchor_date: string;
  description: string | null;
}

/** Anggota regu seperti yang DISIMPAN (riwayat tidak dihapus; keanggotaan diakhiri dengan end_date). */
export interface GroupMemberRecord {
  id: string;
  group_id: string;
  employee_id: string;
  start_slot_id: string;
  start_date: string;
  end_date: string | null;
}

export const GROUP_IDS = {
  houseKeeping: "regu-hk-gunung-mas",
  keamanan: "regu-keamanan-kantor",
  administrasi: "regu-admin-kantor",
};

export const mockWorkGroups: WorkGroupRecord[] = [
  {
    id: GROUP_IDS.houseKeeping,
    name: "House Keeping Gunung Mas",
    sub_unit_id: SUB_UNIT_IDS.gunungMas,
    placement_object_id: PLACEMENT_OBJECT_IDS.glamping,
    work_pattern_id: PATTERN_IDS.tigaShiftTengah,
    leader_employee_id: "pegawai-0100",
    rotation_mode: "Bergilir",
    rotate_every_days: 7,
    anchor_date: "2026-09-07",
    description: "Setiap Senin semua anggota maju satu posisi.",
  },
  {
    id: GROUP_IDS.keamanan,
    name: "Keamanan Kantor Induk",
    sub_unit_id: SUB_UNIT_IDS.kantorInduk,
    placement_object_id: null,
    work_pattern_id: PATTERN_IDS.duaPuluhEmpatJam,
    leader_employee_id: "pegawai-0041",
    rotation_mode: "Tetap",
    rotate_every_days: 7,
    anchor_date: "2026-09-02",
    description: null,
  },
  {
    id: GROUP_IDS.administrasi,
    name: "Administrasi Kantor Induk",
    sub_unit_id: SUB_UNIT_IDS.kantorInduk,
    placement_object_id: null,
    work_pattern_id: PATTERN_IDS.reguler,
    leader_employee_id: "pegawai-0007",
    rotation_mode: "Tetap",
    rotate_every_days: 7,
    anchor_date: "2026-09-07",
    description: null,
  },
];

/** Satu anggota contoh yang bergabung sejak Tanggal Mulai Berlaku Jadwal regunya. */
function member(groupId: string, employeeId: string, slotId: string, startDate: string): GroupMemberRecord {
  return {
    id: `anggota-${groupId}-${employeeId}`,
    group_id: groupId,
    employee_id: employeeId,
    start_slot_id: slotId,
    start_date: startDate,
    end_date: null,
  };
}

export const mockGroupMembers: GroupMemberRecord[] = [
  member(GROUP_IDS.houseKeeping, "pegawai-0100", "slot-tst-a", "2026-09-07"),
  member(GROUP_IDS.houseKeeping, "pegawai-0101", "slot-tst-b", "2026-09-07"),
  member(GROUP_IDS.houseKeeping, "pegawai-0103", "slot-tst-c", "2026-09-07"),
  member(GROUP_IDS.houseKeeping, "pegawai-0104", "slot-tst-d", "2026-09-07"),

  member(GROUP_IDS.keamanan, "pegawai-0045", "slot-24-a", "2026-09-02"),
  member(GROUP_IDS.keamanan, "pegawai-0046", "slot-24-b", "2026-09-02"),
  member(GROUP_IDS.keamanan, "pegawai-0047", "slot-24-c", "2026-09-02"),
  member(GROUP_IDS.keamanan, "pegawai-0048", "slot-24-d", "2026-09-02"),

  member(GROUP_IDS.administrasi, "pegawai-0005", "slot-reguler", "2026-09-07"),
  member(GROUP_IDS.administrasi, "pegawai-0007", "slot-reguler", "2026-09-07"),
  member(GROUP_IDS.administrasi, "pegawai-0009", "slot-reguler", "2026-09-07"),
  member(GROUP_IDS.administrasi, "pegawai-0011", "slot-reguler", "2026-09-07"),
];
