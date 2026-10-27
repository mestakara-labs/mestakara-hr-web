/**
 * TEMPAT PENYIMPANAN DATA MOCK bidang, sub unit, kategori objek, objek penempatan, jabatan,
 * karyawan, penugasan jabatan, riwayat atasan, usulan mutasi, usulan penambahan, dan usulan penonaktifan,
 * di memori server.
 *
 * Semua file *-mock.ts dan bagan struktur organisasi membaca dan mengubah data
 * di SINI. Jadi kalau jabatan seorang karyawan berubah (lewat mutasi),
 * bagan organisasi dan statistik karyawan ikut berubah.
 *
 * Catatan: datanya kembali ke isi awal setiap kali server Next di-restart.
 */
import { DEFINITIVE_STATUS, getAssignmentPeriod, isAssignmentActive } from "@/lib/assignment-rules";
import { ACTIVATION_STATUS, EMPLOYEE_ACTIVE_STATUS } from "@/lib/activation-rules";
import { monthsSince, parseDate, toDateText } from "@/lib/date";
import { findHighestEducation, findMissingEmployeeFields, sortByHighestEducation } from "@/lib/employee-rules";
import type { AssignmentResource, AssignmentSupervisor } from "@/types/api/assignment";
import type { DivisionResource } from "@/types/api/division";
import type { EmployeeProfileResource } from "@/types/api/employee";
import type { EmployeeResource, PositionResource } from "@/types/api/organization";
import type { PlacementCategoryResource } from "@/types/api/placement-category";
import type { PlacementObjectResource } from "@/types/api/placement-object";
import type { SubUnitResource } from "@/types/api/sub-unit";
import type { SupervisorChangeResource } from "@/types/api/supervisor-change";

import {
  mockActivations,
  mockAssignments,
  mockDivisions,
  mockEmployees,
  mockPlacementCategories,
  mockPlacementObjects,
  mockPositions,
  mockSubUnits,
  mockTransfers,
} from "./organization";
import type { ActivationRecord } from "./organization/activations";
import type { AssignmentRecord } from "./organization/assignments";
import type { DivisionRecord } from "./organization/divisions";
import type { EmployeeRecord } from "./organization/employees";
import type { PositionRecord } from "./organization/helpers";
import type { PlacementCategoryRecord, PlacementObjectRecord, SubUnitRecord } from "./organization/placements";
import { mockSupervisorChanges, type SupervisorChangeRecord } from "./organization/supervisor-changes";
import { mockTerminations, type TerminationRecord } from "./organization/terminations";
import type { TransferRecord } from "./organization/transfers";

/**
 * Versi BENTUK data mock. Naikkan angka ini setiap kali bentuk data di bawah
 * diubah (mis. ada isian baru), supaya data lama di memori server dibuang dan
 * diisi ulang otomatis — tanpa perlu me-restart `npm run dev`.
 */
const STORE_VERSION = 40;

interface OrganizationStore {
  version: number;
  divisions: DivisionRecord[];
  subUnits: SubUnitRecord[];
  placementCategories: PlacementCategoryRecord[];
  placementObjects: PlacementObjectRecord[];
  positions: PositionRecord[];
  employees: EmployeeRecord[];
  assignments: AssignmentRecord[];
  supervisorChanges: SupervisorChangeRecord[];
  transfers: TransferRecord[];
  activations: ActivationRecord[];
  terminations: TerminationRecord[];
}

/**
 * Datanya disimpan di `globalThis` (objek global milik server), bukan di variabel
 * biasa. Alasannya: saat development, Next bisa memuat ulang file ini secara
 * terpisah untuk tiap route handler. Variabel biasa akan ikut ter-reset, sedangkan
 * `globalThis` tetap sama untuk semua route handler.
 */
const globalForMock = globalThis as typeof globalThis & {
  mockOrganizationStore?: OrganizationStore;
};

/** Ambil tempat penyimpanan. Diisi data awal saat pertama kali dipanggil, atau saat versinya berubah. */
export function getStore(): OrganizationStore {
  const currentStore = globalForMock.mockOrganizationStore;
  if (currentStore && currentStore.version === STORE_VERSION) return currentStore;

  // Belum ada, atau bentuknya sudah kedaluwarsa -> isi dengan data awal.
  const freshStore: OrganizationStore = {
    version: STORE_VERSION,
    // structuredClone = salinan lengkap, supaya data awal tidak ikut berubah.
    divisions: structuredClone(mockDivisions),
    subUnits: structuredClone(mockSubUnits),
    placementCategories: structuredClone(mockPlacementCategories),
    placementObjects: structuredClone(mockPlacementObjects),
    positions: structuredClone(mockPositions),
    employees: structuredClone(mockEmployees),
    assignments: structuredClone(mockAssignments),
    supervisorChanges: structuredClone(mockSupervisorChanges),
    transfers: structuredClone(mockTransfers),
    activations: structuredClone(mockActivations),
    terminations: structuredClone(mockTerminations),
  };
  globalForMock.mockOrganizationStore = freshStore;

  return freshStore;
}

/** Penugasan yang masih berjalan hari ini. */
export function getActiveAssignments(today: string = toDateText(new Date())): AssignmentRecord[] {
  return getStore().assignments.filter((assignment) => isAssignmentActive(assignment, parseDate(today)));
}

/**
 * Jabatan + nama bidang + pegawai pemegangnya, siap dikirim ke browser.
 * Pemegang jabatan = karyawan yang punya penugasan AKTIF di jabatan ini.
 */
export function toPositionResource(position: PositionRecord): PositionResource {
  const { divisions, employees, subUnits } = getStore();
  const activeAssignments = getActiveAssignments();
  const activeIds = new Set(activeAssignments.map((assignment) => assignment.id));
  const division = divisions.find((item) => item.id === position.division_id);

  const holders = activeAssignments
    .filter((assignment) => assignment.position_id === position.id)
    .flatMap((assignment): EmployeeResource[] => {
      const employee = employees.find((item) => item.id === assignment.employee_id);
      if (!employee) return [];

      return [
        {
          id: employee.id,
          assignment_id: assignment.id,
          assignment_status: assignment.assignment_status,
          nik: employee.nik ?? "-",
          name: employee.name,
          email: employee.email ?? "",
          phone: employee.phone ?? "",
          whatsapp: employee.whatsapp ?? employee.phone ?? "",
          sub_unit_name: subUnits.find((item) => item.id === assignment.sub_unit_id)?.name ?? "-",
          placement_object_names: toObjectNames(assignment.placement_object_ids),
          // Atasan yang penugasannya sudah selesai tidak digambar lagi di bagan.
          supervisor_assignment_ids: assignment.supervisor_assignment_ids.filter((id) => activeIds.has(id)),
        },
      ];
    });

  return { ...position, division_name: division?.name ?? null, employees: holders };
}

/**
 * Jabatan UTAMA seorang karyawan, dipakai untuk golongan (karpim/karpel) dan usia pensiun:
 * penugasan Definitif yang aktif, atau kalau tidak ada, penugasan aktif dengan level BRM tertinggi.
 * "Aktif" = berjalan pada tanggal `today` ("YYYY-MM-DD", bawaan hari ini). null = belum ditempatkan.
 */
function findMainPosition(employeeId: string, today: string): PositionRecord | null {
  const { positions } = getStore();
  const activePositions = getActiveAssignments(today)
    .filter((assignment) => assignment.employee_id === employeeId)
    .map((assignment) => ({
      assignment,
      position: positions.find((item) => item.id === assignment.position_id),
    }));

  const definitive = activePositions.find((item) => item.assignment.assignment_status === DEFINITIVE_STATUS);
  if (definitive?.position) return definitive.position;

  const highest = activePositions
    .flatMap((item) => (item.position ? [item.position] : []))
    .sort((a, b) => a.brm_level - b.brm_level)[0];

  return highest ?? null;
}

/**
 * Karyawan siap dikirim ke browser, ditambah isian yang dihitung:
 *   - `position`           = jabatan utama dari penugasan aktif (null = belum ditempatkan)
 *   - `education`, `major` = jenjang & jurusan TERTINGGI di riwayat pendidikan
 *   - `educations`         = diurutkan dari jenjang tertinggi, + alamat file ijazah
 *   - `active_status`      = Belum Aktif / Aktif / Nonaktif (lihat getEmployeeActiveStatus)
 *   - `inactive_since`     = TMT nonaktif terakhir (hanya kalau sedang Nonaktif)
 *   - `service_months`     = masa kerja dalam bulan, TANPA masa nonaktif
 *   - `missing_fields`     = isian wajib yang masih kosong (draf karyawan)
 *
 * `position`, `active_status`, `inactive_since`, dan `service_months` dihitung PADA TANGGAL `today`
 * ("YYYY-MM-DD", bawaan hari ini) — dipakai filter Periode Data. Biodata lainnya selalu data terbaru.
 */
export function toEmployeeProfileResource(
  employee: EmployeeRecord,
  today: string = toDateText(new Date()),
): EmployeeProfileResource {
  // Isi file (file_data) tidak ikut dikirim; yang dikirim alamatnya saja.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { file_data, ...rest } = employee;
  const position = findMainPosition(employee.id, today);
  const highestEducation = findHighestEducation(employee.educations);
  const fileUrl = (query: string) => `/api/employees/${employee.id}/files?${query}`;

  const activeStatus = getEmployeeActiveStatus(employee.id, today);
  const lastEvent = getStatusEvents(employee.id, today).at(-1);

  return {
    ...rest,
    active_status: activeStatus,
    inactive_since: activeStatus === EMPLOYEE_ACTIVE_STATUS.inactive ? (lastEvent?.date ?? null) : null,
    service_months: getServiceMonths(employee.id, today),
    missing_fields: findMissingEmployeeFields(employee),
    educations: sortByHighestEducation(employee.educations).map((education) => ({
      ...education,
      certificate_file_url: education.certificate_file ? fileUrl(`type=ijazah&education=${education.id}`) : null,
    })),
    education: highestEducation?.level ?? "-",
    major: highestEducation?.major ?? null,
    position: position
      ? { id: position.id, title: position.title, brm_level: position.brm_level, job_grade: position.job_grade }
      : null,
  };
}

/**
 * Penugasan siap dikirim ke browser: id-id diganti dengan nama karyawan,
 * jabatan, sub unit, objek, dan atasannya.
 */
export function toAssignmentResource(assignment: AssignmentRecord): AssignmentResource {
  const { divisions, employees, placementCategories, placementObjects, positions, subUnits, transfers } = getStore();

  const transfer = transfers.find((item) => item.id === assignment.transfer_id);
  const employee = employees.find((item) => item.id === assignment.employee_id);
  const position = positions.find((item) => item.id === assignment.position_id);
  const subUnit = subUnits.find((item) => item.id === assignment.sub_unit_id);
  const division = divisions.find((item) => item.id === position?.division_id);

  return {
    id: assignment.id,
    employee: {
      id: assignment.employee_id,
      name: employee?.name ?? "-",
      nik: employee?.nik ?? null,
      photo_url: employee?.photo_url ?? null,
    },
    position: {
      id: assignment.position_id,
      code: position?.code ?? "-",
      title: position?.title ?? "-",
      brm_level: position?.brm_level ?? 6,
      job_grade: position?.job_grade ?? null,
      division_name: division?.name ?? null,
    },
    sub_unit: { id: assignment.sub_unit_id, name: subUnit?.name ?? "-" },
    placement_objects: placementObjects
      .filter((item) => assignment.placement_object_ids.includes(item.id))
      .map((item) => ({
        id: item.id,
        name: item.name,
        category_name: placementCategories.find((category) => category.id === item.category_id)?.name ?? "-",
      })),
    assignment_status: assignment.assignment_status,
    supervisors: toSupervisorList(assignment.supervisor_assignment_ids),
    start_date: assignment.start_date,
    end_date: assignment.end_date,
    is_active: isAssignmentActive(assignment),
    period: getAssignmentPeriod(assignment),
    transfer: transfer ? { id: transfer.id, decree_number: transfer.decree_number ?? "-" } : null,
    decree_type: assignment.decree_type,
    decree_number: assignment.decree_number,
    decree_date: assignment.decree_date,
    decree_file: assignment.decree_file,
    decree_file_url: assignment.decree_file ? `/api/position-assignments/${assignment.id}/decree-file` : null,
    notes: assignment.notes,
  };
}

/**
 * Daftar id penugasan atasan -> nama karyawan & jabatannya, siap dikirim ke browser.
 * Id yang sudah tidak ada dilewati.
 */
export function toSupervisorList(supervisorAssignmentIds: string[]): AssignmentSupervisor[] {
  const { assignments, employees, positions } = getStore();

  return supervisorAssignmentIds.flatMap((supervisorId) => {
    const supervisor = assignments.find((item) => item.id === supervisorId);
    if (!supervisor) return [];

    return [
      {
        assignment_id: supervisor.id,
        employee_name: employees.find((item) => item.id === supervisor.employee_id)?.name ?? "-",
        position_title: positions.find((item) => item.id === supervisor.position_id)?.title ?? "-",
        assignment_status: supervisor.assignment_status,
      },
    ];
  });
}

/**
 * Daftar id objek penempatan -> namanya, urut sesuai master Objek Penempatan.
 * Id yang sudah tidak ada dilewati. Cth. ["obj-bungalow", "obj-pondokan"] -> ["Bungalow", "Pondokan"]
 */
export function toObjectNames(placementObjectIds: string[]): string[] {
  return getStore()
    .placementObjects.filter((item) => placementObjectIds.includes(item.id))
    .map((item) => item.name);
}

/** Satu catatan riwayat atasan, siap dikirim ke browser. */
export function toSupervisorChangeResource(change: SupervisorChangeRecord): SupervisorChangeResource {
  const { from_ids, to_ids, ...rest } = change;

  return { ...rest, from: toSupervisorList(from_ids), to: toSupervisorList(to_ids) };
}

/** Bidang + jumlah jabatan yang memakainya, siap dikirim ke browser. */
export function toDivisionResource(division: DivisionRecord): DivisionResource {
  const positionCount = getStore().positions.filter(
    (position) => position.division_id === division.id,
  ).length;

  return { ...division, position_count: positionCount };
}

/** Sub unit + jumlah penugasan aktif & jumlah objek yang tersedia di dalamnya, siap dikirim ke browser. */
export function toSubUnitResource(subUnit: SubUnitRecord): SubUnitResource {
  const assignmentCount = getActiveAssignments().filter(
    (assignment) => assignment.sub_unit_id === subUnit.id,
  ).length;
  const objectCount = getStore().placementObjects.filter((item) => item.sub_unit_ids.includes(subUnit.id)).length;

  return { ...subUnit, assignment_count: assignmentCount, object_count: objectCount };
}

/** Kategori objek + jumlah objek di dalamnya, siap dikirim ke browser. */
export function toPlacementCategoryResource(category: PlacementCategoryRecord): PlacementCategoryResource {
  const objectCount = getStore().placementObjects.filter((item) => item.category_id === category.id).length;

  return { ...category, object_count: objectCount };
}

/**
 * Objek penempatan siap dikirim ke browser: id kategori & sub unit ditambah namanya,
 * plus jumlah penugasan aktif di objek ini.
 */
export function toPlacementObjectResource(placementObject: PlacementObjectRecord): PlacementObjectResource {
  const { placementCategories, subUnits } = getStore();
  const { sub_unit_ids, ...rest } = placementObject;
  const assignmentCount = getActiveAssignments().filter(
    (assignment) => assignment.placement_object_ids.includes(placementObject.id),
  ).length;

  return {
    ...rest,
    category_name: placementCategories.find((item) => item.id === placementObject.category_id)?.name ?? "-",
    // Urutannya mengikuti urutan master Sub Unit.
    sub_units: subUnits
      .filter((subUnit) => sub_unit_ids.includes(subUnit.id))
      .map((subUnit) => ({ id: subUnit.id, name: subUnit.name })),
    assignment_count: assignmentCount,
  };
}

/** Satu kejadian status: menjadi aktif (Penambahan) atau nonaktif (Penonaktifan) pada TMT `date`. */
interface StatusEvent {
  date: string;
  isActive: boolean;
}

/**
 * Semua kejadian status seorang karyawan yang SUDAH TIBA (TMT <= today) dari usulan Berlaku,
 * urut dari yang paling lama. Pada tanggal yang sama, penambahan dihitung lebih dulu.
 */
function getStatusEvents(employeeId: string, today: string = toDateText(new Date())): StatusEvent[] {
  const { activations, terminations } = getStore();
  const eventsOf = (usulan: { status: string; items: { employee_id: string; effective_date: string }[] }[], isActive: boolean) =>
    usulan
      .filter((item) => item.status === ACTIVATION_STATUS.effective)
      .flatMap((item) => item.items)
      .filter((item) => item.employee_id === employeeId && item.effective_date && item.effective_date <= today)
      .map((item): StatusEvent => ({ date: item.effective_date, isActive }));

  return [...eventsOf(activations, true), ...eventsOf(terminations, false)].sort(
    (a, b) => a.date.localeCompare(b.date) || Number(b.isActive) - Number(a.isActive),
  );
}

/**
 * STATUS KEPEGAWAIAN seorang karyawan pada tanggal `today`, dari kejadian TERAKHIR yang sudah tiba:
 *   - Aktif       : terakhir diaktifkan (usulan Penambahan Berlaku, TMT <= hari ini)
 *   - Nonaktif    : terakhir dinonaktifkan (usulan Penonaktifan Berlaku, TMT <= hari ini)
 *   - Belum Aktif : belum pernah aktif (draf dari wizard, atau TMT-nya belum tiba)
 * Backend nanti mengubah status dengan job harian pada TMT; di mock dihitung saat dibaca.
 */
export function getEmployeeActiveStatus(employeeId: string, today: string = toDateText(new Date())): string {
  const last = getStatusEvents(employeeId, today).at(-1);
  if (!last) return EMPLOYEE_ACTIVE_STATUS.pending;
  return last.isActive ? EMPLOYEE_ACTIVE_STATUS.active : EMPLOYEE_ACTIVE_STATUS.inactive;
}

/**
 * MASA KERJA dalam bulan penuh = jumlah semua masa AKTIF (masa nonaktif tidak dihitung):
 *
 *   aktif 2010-01-01 ── nonaktif 2015-01-01 ·· aktif lagi 2020-01-01 ── hari ini 2026-01-01
 *        60 bulan                                       72 bulan            -> 132 bulan
 *
 * Dihitung sampai tanggal `today` ("YYYY-MM-DD").
 */
function getServiceMonths(employeeId: string, today: string): number {
  let total = 0;
  let activeSince: string | null = null;

  for (const event of getStatusEvents(employeeId, today)) {
    if (event.isActive && activeSince === null) activeSince = event.date;
    if (!event.isActive && activeSince !== null) {
      total += monthsSince(activeSince, parseDate(event.date));
      activeSince = null;
    }
  }
  if (activeSince !== null) total += monthsSince(activeSince, parseDate(today));

  return Math.max(total, 0);
}

/** Jumlah SEMUA penugasan (aktif maupun riwayat) yang cocok dengan `isUsed`. */
export function countAssignments(isUsed: (assignment: AssignmentRecord) => boolean): number {
  return getStore().assignments.filter(isUsed).length;
}

/** Buat id baru yang unik, mis. "jabatan-1a2b3c4d". */
export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
