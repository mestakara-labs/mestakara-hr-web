/**
 * DATA CONTOH (MOCK) MASTER KARYAWAN — pengganti backend selama AUTH_MOCK=true.
 *
 * Dipanggil oleh route handler src/app/api/employees/**. Setiap fungsi
 * mengembalikan `{ status, body }` (lihat mock-response.ts).
 *
 * Form karyawan dikirim sebagai `multipart/form-data` (karena ada file), jadi
 * fungsi tambah & ubah menerima `FormData`:
 *   - isian teks: nik, name, ktp_number, ... (lihat EmployeeProfilePayload)
 *   - daftar:     educations, family_members (teks JSON; lihat employee-lists-mock.ts)
 *   - file:       photo, certificate_file_<id> (hanya kalau user memilih file baru)
 *   - penanda:    keep_photo = "1" kalau foto lama dipertahankan (saat ubah)
 *   - save_mode:  "draft" = cukup Nama + Status Karyawan (karyawan Belum Aktif dari wizard Penambahan)
 *   - activation_id: usulan Penambahan (Draf) tempat karyawan BARU ini langsung dimasukkan
 *
 * Dasar penambahan (dokumen) TIDAK lagi di sini, tetapi di usulan Penambahan (activation-mock.ts).
 * Isi file ijazah disimpan di `file_data` supaya bisa dibuka lagi lewat GET /employees/{id}/files.
 */
import { ACTIVATION_STATUS, ACTIVATION_TYPE, EMPLOYEE_ACTIVE_STATUS, isActivationEditable } from "@/lib/activation-rules";
import { checkFile, PHOTO_RULE } from "@/lib/file-rules";
import { parseDate, toDateText } from "@/lib/date";
import { isFuturePeriod, parsePeriodParam, periodReferenceDate } from "@/lib/period-rules";
import {
  DRAFT_EMPLOYEE_FIELDS,
  EMPLOYMENT_STATUS_OPTIONS,
  GENDER_OPTIONS,
  isNikRequired,
  REQUIRED_EMPLOYEE_FIELDS,
} from "@/lib/employee-rules";
import type { EmployeeProfilePayload, EmployeeProfileResource } from "@/types/api/employee";

import { readEducations, readFamilyMembers } from "./employee-lists-mock";
import { failure, success, type MockResult } from "./mock-response";
import { createSamplePdf } from "./sample-pdf";
import { EMPTY_DOCUMENT } from "./organization/activations";
import type { EmployeeRecord } from "./organization/employees";
import {
  countAssignments,
  createId,
  getEmployeeActiveStatus,
  getStore,
  toEmployeeProfileResource,
} from "./organization-store";

/**
 * Pengganti backend `GET /employees?period=YYYY-MM`.
 *
 * `period` (opsional) = Periode Data. Status, jabatan utama, dan masa kerja dihitung pada TANGGAL ACUAN
 * periode itu (akhir bulan; bulan berjalan = hari ini, lihat lib/period-rules.ts).
 * Tanpa `period` = keadaan hari ini.
 */
export function mockListEmployees(period: string | null): MockResult<EmployeeProfileResource[] | null> {
  let referenceDate = toDateText(new Date());

  if (period) {
    const parsed = parsePeriodParam(period);
    if (!parsed) {
      return failure(422, "Periode belum benar.", { period: ["Periode harus berformat YYYY-MM, mis. 2026-09."] });
    }
    if (isFuturePeriod(parsed)) {
      return failure(422, "Periode belum benar.", { period: ["Periode tidak boleh bulan yang belum tiba."] });
    }
    referenceDate = periodReferenceDate(parsed);
  }

  const employees = getStore().employees.map((employee) => toEmployeeProfileResource(employee, referenceDate));
  return success("Daftar karyawan", employees);
}

/** Pengganti backend `GET /employees/{id}`. */
export function mockGetEmployee(id: string): MockResult<EmployeeProfileResource | null> {
  const employee = getStore().employees.find((item) => item.id === id);
  if (!employee) return failure(404, "Karyawan tidak ditemukan.");

  return success("Detail karyawan", toEmployeeProfileResource(employee));
}

/**
 * Pengganti backend `POST /employees`. Karyawan baru berstatus BELUM AKTIF sampai usulan
 * Penambahannya Berlaku. Kalau `activation_id` dikirim, karyawan langsung dimasukkan ke usulan itu.
 */
export async function mockCreateEmployee(form: FormData): Promise<MockResult<EmployeeProfileResource | null>> {
  const payload = readPayload(form);
  const educations = readEducations(form, []);
  const familyMembers = readFamilyMembers(form);
  const activationId = String(form.get("activation_id") ?? "");

  const errors = validateEmployee(
    payload,
    form,
    null,
    withEducationMinimum(educations, isDraft(form)),
    familyMembers.errors,
    isDraft(form),
  );
  if (errors) return failure(422, "Isian karyawan belum benar.", errors);

  const activation = getStore().activations.find((item) => item.id === activationId);
  if (activationId && (!activation || !isActivationEditable(activation.status))) {
    return failure(409, "Usulan Penambahan tidak ditemukan atau sudah tidak bisa diubah.");
  }

  const employee: EmployeeRecord = {
    id: createId("pegawai"),
    ...cleanPayload(payload),
    educations: educations.items,
    family_members: familyMembers.items,
    photo_url: await readPhoto(form, null),
    file_data: {},
  };
  employee.file_data = await collectFileData(employee, {}, educations.newCertificateFiles);
  getStore().employees.push(employee);

  // Masuk ke usulan Penambahan (dasar & TMT bawaan; bisa diubah di langkah 2 wizard).
  activation?.items.push({
    ...EMPTY_DOCUMENT,
    id: createId("penambahan-item"),
    employee_id: employee.id,
    type: ACTIVATION_TYPE.newHire,
    effective_date: employee.hire_date ?? "",
    origin_unit: null,
    position_id: null,
    assignment_status: null,
    sub_unit_id: null,
    placement_object_ids: [],
    supervisor_assignment_ids: [],
    assignment_end_date: null,
    new_assignment_id: null,
    notes: null,
  });

  const message = isDraft(form) ? "Draf karyawan berhasil disimpan." : "Karyawan berhasil ditambahkan.";
  return success(message, toEmployeeProfileResource(employee), 201);
}

/** Pengganti backend `PUT /employees/{id}`. */
export async function mockUpdateEmployee(
  id: string,
  form: FormData,
): Promise<MockResult<EmployeeProfileResource | null>> {
  const employee = getStore().employees.find((item) => item.id === id);
  if (!employee) return failure(404, "Karyawan tidak ditemukan.");

  const payload = readPayload(form);
  const educations = readEducations(form, employee.educations);
  const familyMembers = readFamilyMembers(form);

  // Draf hanya boleh untuk karyawan yang belum aktif.
  const draft = isDraft(form) && getEmployeeActiveStatus(id) === EMPLOYEE_ACTIVE_STATUS.pending;
  const errors = validateEmployee(payload, form, id, withEducationMinimum(educations, draft), familyMembers.errors, draft);
  if (errors) return failure(422, "Isian karyawan belum benar.", errors);

  Object.assign(employee, cleanPayload(payload), {
    educations: educations.items,
    family_members: familyMembers.items,
    photo_url: await readPhoto(form, employee.photo_url),
  });
  employee.file_data = await collectFileData(employee, employee.file_data, educations.newCertificateFiles);

  return success(
    draft ? "Draf karyawan berhasil disimpan." : "Data karyawan berhasil diperbarui.",
    toEmployeeProfileResource(employee),
  );
}

/**
 * Pengganti backend `DELETE /employees/{id}`. Hanya DRAF karyawan yang boleh dihapus permanen:
 * belum pernah masuk usulan Penambahan yang Berlaku, dan tidak punya penugasan jabatan.
 * Karyawan yang pernah aktif tidak dihapus (riwayatnya tetap ada); pakai Penonaktifan.
 * Draf yang terhapus ikut dikeluarkan dari usulan Penambahan (Draf) tempatnya berada.
 */
export function mockDeleteEmployee(id: string): MockResult<null> {
  const store = getStore();
  const employee = store.employees.find((item) => item.id === id);
  if (!employee) return failure(404, "Karyawan tidak ditemukan.");

  const wasEverActive = store.activations.some(
    (activation) =>
      activation.status !== ACTIVATION_STATUS.draft && activation.items.some((item) => item.employee_id === id),
  );
  const assignmentCount = countAssignments((assignment) => assignment.employee_id === id);
  if (wasEverActive || assignmentCount > 0) {
    return failure(
      409,
      `"${employee.name}" pernah aktif atau punya riwayat jabatan, jadi tidak bisa dihapus. Gunakan Penonaktifan Karyawan.`,
    );
  }

  store.employees = store.employees.filter((item) => item.id !== id);
  for (const activation of store.activations) {
    if (activation.status === ACTIVATION_STATUS.draft) {
      activation.items = activation.items.filter((item) => item.employee_id !== id);
    }
  }

  return success("Draf karyawan berhasil dihapus.", null);
}

/** File karyawan yang siap dikirim ke browser. */
export interface EmployeeFile {
  bytes: Uint8Array;
  type: string;
  name: string;
}

/**
 * Pengganti backend `GET /employees/{id}/files`:
 *   type=ijazah&education={id}     file ijazah satu riwayat pendidikan
 * null = file tidak ada. File contoh tanpa isi dibuka sebagai PDF contoh.
 * (Dokumen dasar penambahan dibuka lewat GET /employee-activations/{id}/files.)
 */
export function mockGetEmployeeFile(id: string, type: string, educationId: string | null): EmployeeFile | null {
  const employee = getStore().employees.find((item) => item.id === id);
  if (!employee) return null;

  if (type === "ijazah") {
    const education = employee.educations.find((item) => item.id === educationId);
    if (!education) return null;
    return storedFile(
      education.certificate_file,
      employee.file_data[certificateKey(education.id)],
      `Ijazah ${education.level} - ${employee.name}`,
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Alat bantu
// ---------------------------------------------------------------------------

/** Kunci isi file ijazah di `file_data`: "ijazah-<id pendidikan>". */
function certificateKey(educationId: string): string {
  return `ijazah-${educationId}`;
}

/**
 * Isi file yang disimpan setelah form disimpan:
 *   - file BARU          -> isinya disimpan
 *   - file lama dipakai  -> isi lamanya tetap
 *   - file dihapus       -> isinya dibuang
 */
async function collectFileData(
  employee: Pick<EmployeeRecord, "educations">,
  previous: Record<string, string>,
  newCertificateFiles: Map<string, File>,
): Promise<Record<string, string>> {
  const data: Record<string, string> = {};
  const toBase64 = async (file: File) => Buffer.from(await file.arrayBuffer()).toString("base64");

  for (const education of employee.educations) {
    const key = certificateKey(education.id);
    const newFile = newCertificateFiles.get(education.id);

    if (newFile) data[key] = await toBase64(newFile);
    else if (education.certificate_file && previous[key]) data[key] = previous[key];
  }

  return data;
}

/** File tersimpan -> siap dikirim. Tanpa isi (data contoh) -> PDF contoh bertuliskan `sampleLabel`. */
function storedFile(
  info: EmployeeRecord["educations"][number]["certificate_file"],
  data: string | undefined,
  sampleLabel: string,
): EmployeeFile | null {
  if (!info) return null;
  if (data) return { bytes: Buffer.from(data, "base64"), type: info.type, name: info.name };

  return {
    bytes: createSamplePdf(["DOKUMEN CONTOH (DATA MOCK)", sampleLabel]),
    type: "application/pdf",
    name: info.name,
  };
}

/** Ambil isian teks dari FormData. Isian yang tidak dikirim dianggap kosong. */
function readPayload(form: FormData): EmployeeProfilePayload {
  const text = (key: keyof EmployeeProfilePayload) => String(form.get(key) ?? "").trim();

  return {
    employment_status: text("employment_status"),
    nik: text("nik"),
    registration_number: text("registration_number"),
    name: text("name"),
    ktp_number: text("ktp_number"),
    gender: text("gender"),
    birth_place: text("birth_place"),
    birth_date: text("birth_date"),
    hire_date: text("hire_date"),
    religion: text("religion"),
    marital_status: text("marital_status"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    email: text("email"),
    address: text("address"),
  };
}

/** Isian form -> bentuk yang disimpan (isian opsional yang kosong jadi null). */
function cleanPayload(payload: EmployeeProfilePayload) {
  return {
    ...payload,
    gender: payload.gender as EmployeeRecord["gender"],
    nik: payload.nik || null,
    registration_number: payload.registration_number || null,
    whatsapp: payload.whatsapp || null,
    email: payload.email || null,
    address: payload.address || null,
  };
}

/** Ambil file dari FormData. null kalau tidak ada file yang dikirim. */
function fileOf(form: FormData, key: string): File | null {
  const value = form.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

/**
 * Foto karyawan. Di mode mock, foto disimpan sebagai "data URL" (isi gambar
 * dalam bentuk teks) supaya bisa langsung ditampilkan tanpa server file.
 */
async function readPhoto(form: FormData, currentPhotoUrl: string | null): Promise<string | null> {
  const photo = fileOf(form, "photo");
  if (photo) {
    const base64 = Buffer.from(await photo.arrayBuffer()).toString("base64");
    return `data:${photo.type};base64,${base64}`;
  }

  return form.get("keep_photo") === "1" ? currentPhotoUrl : null;
}

/** Pesan error riwayat pendidikan + aturan "minimal satu riwayat" (tidak berlaku untuk draf). */
function withEducationMinimum(educations: { items: unknown[]; errors: string[] }, draft: boolean): string[] {
  if (draft || educations.items.length > 0) return educations.errors;
  return ["Isi minimal satu riwayat pendidikan", ...educations.errors];
}

/** Disimpan sebagai draf (cukup Nama + Status Karyawan)? */
function isDraft(form: FormData): boolean {
  return form.get("save_mode") === "draft";
}

/**
 * Periksa isian karyawan. Hasilnya pesan error per isian, atau null kalau semua benar.
 * `currentId` = id karyawan yang sedang diubah (null saat tambah baru).
 * `draft` = cukup Nama + Status Karyawan; isian lain yang SUDAH diisi tetap diperiksa formatnya.
 */
function validateEmployee(
  payload: EmployeeProfilePayload,
  form: FormData,
  currentId: string | null,
  educationErrors: string[],
  familyErrors: string[],
  draft = false,
): Record<string, string[]> | null {
  const errors: Record<string, string[]> = {};

  // Isian wajib (draf: hanya Nama + Status Karyawan)
  for (const [key, label] of REQUIRED_EMPLOYEE_FIELDS) {
    if (draft && !DRAFT_EMPLOYEE_FIELDS.includes(key)) continue;
    if (!payload[key]) errors[key] = [`${label} wajib diisi`];
  }

  // NIK karyawan tidak boleh kembar
  // Status karyawan & NIK: NIK wajib untuk karyawan tetap & PKWT, dan tidak boleh kembar.
  if (payload.employment_status && !EMPLOYMENT_STATUS_OPTIONS.includes(payload.employment_status)) {
    errors.employment_status = ["Status Karyawan tidak dikenal"];
  }
  if (!draft && !payload.nik && isNikRequired(payload.employment_status)) {
    errors.nik = [`NIK Karyawan wajib diisi untuk ${payload.employment_status}`];
  }
  const isNikUsed = getStore().employees.some((item) => item.id !== currentId && item.nik === payload.nik);
  if (payload.nik && isNikUsed) errors.nik = [`NIK "${payload.nik}" sudah dipakai karyawan lain`];
  const isRegistrationUsed = getStore().employees.some(
    (item) => item.id !== currentId && item.registration_number === payload.registration_number,
  );
  if (payload.registration_number && isRegistrationUsed) {
    errors.registration_number = [`No. Registrasi "${payload.registration_number}" sudah dipakai karyawan lain`];
  }

  // Format
  if (payload.ktp_number && !/^\d{16}$/.test(payload.ktp_number)) errors.ktp_number = ["No. KTP harus 16 digit angka"];
  if (payload.gender && !GENDER_OPTIONS.includes(payload.gender)) errors.gender = ["Jenis Kelamin tidak dikenal"];
  if (payload.birth_date && parseDate(payload.birth_date) > new Date()) {
    errors.birth_date = ["Tanggal Lahir tidak boleh melewati hari ini"];
  }
  // Tanggal Masuk = tanggal masuk PERUSAHAAN pertama; boleh di masa depan (karyawan baru yang belum mulai).
  if (payload.hire_date && payload.birth_date && payload.hire_date <= payload.birth_date) {
    errors.hire_date = ["Tanggal Masuk harus setelah Tanggal Lahir"];
  }
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.email = ["Format Email tidak valid"];
  if (payload.whatsapp && !/^\+?[\d\s-]{8,20}$/.test(payload.whatsapp)) errors.whatsapp = ["Format No. WhatsApp tidak valid"];

  // File
  const photo = fileOf(form, "photo");
  const photoError = photo ? checkFile(photo, PHOTO_RULE) : undefined;
  if (photoError) errors.photo = [photoError];

  // Daftar riwayat pendidikan & data batih (diperiksa di employee-lists-mock.ts)
  if (educationErrors.length > 0) errors.educations = educationErrors;
  if (familyErrors.length > 0) errors.family_members = familyErrors;

  return Object.keys(errors).length > 0 ? errors : null;
}
