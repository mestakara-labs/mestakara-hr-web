/**
 * ISIAN FORM KARYAWAN: bentuk datanya, isian awal, pemeriksaan, dan cara mengirimnya.
 *
 * Dipisah dari KaryawanForm.tsx supaya file tampilan tetap pendek.
 *
 * Dua cara menyimpan:
 *   - "full"  : semua isian wajib diperiksa (karyawan siap diaktifkan)
 *   - "draft" : cukup Nama + Status Karyawan (draf karyawan Belum Aktif dari wizard Penambahan);
 *               isian lain yang SUDAH diisi tetap diperiksa formatnya
 */
import type { FieldErrors } from "@/hooks/useFormSubmit";
import { isNikRequired } from "@/lib/employee-rules";
import { mustBeDigits, mustBeEmail, mustBePhone, requireSelection, requireText } from "@/lib/validation";
import type {
  EducationPayloadItem,
  EmployeeProfilePayload,
  EmployeeProfileResource,
  FamilyMemberPayloadItem,
  UploadedFileInfo,
} from "@/types/api/employee";

/**
 * Satu riwayat pendidikan di form: semua isian berupa teks ("" = kosong),
 * plus file ijazah (File = file baru, UploadedFileInfo = file lama dari server).
 */
export type EducationFormItem = Omit<EducationPayloadItem, "keep_certificate_file"> & {
  certificate_file: File | UploadedFileInfo | null;
};

/** Satu anggota batih di form: semua isian berupa teks ("" = kosong). */
export type FamilyFormItem = FamilyMemberPayloadItem;

/** Semua isian form karyawan. */
export interface KaryawanFormValues extends EmployeeProfilePayload {
  /** Foto BARU yang dipilih; null = tidak ada foto baru */
  photo: File | null;
  /** Gambar yang tampil: foto lama dari server, atau pratinjau foto baru; null = tanpa foto */
  photo_url: string | null;
  educations: EducationFormItem[];
  family_members: FamilyFormItem[];
}

/** Bekal setiap bagian form (biodata, tab pendidikan, dst.): nilai, cara mengubah, dan pesan error. */
export interface FormSectionProps {
  values: KaryawanFormValues;
  changeValue: <K extends keyof KaryawanFormValues>(key: K, value: KaryawanFormValues[K]) => void;
  errors: FieldErrors<KaryawanFormValues>;
  disabled: boolean;
}

/** Id sementara untuk baris BARU (belum tersimpan), mis. "baru-1a2b3c4d". Server menggantinya dengan id tetap. */
export function newRowId(): string {
  return `baru-${crypto.randomUUID().slice(0, 8)}`;
}

/** Riwayat pendidikan kosong, untuk dialog "Tambah Pendidikan". */
export function emptyEducation(): EducationFormItem {
  return {
    id: newRowId(),
    level: "",
    institution: "",
    major: "",
    city: "",
    start_year: "",
    graduation_year: "",
    gpa: "",
    title_front: "",
    title_back: "",
    certificate_number: "",
    certificate_file: null,
  };
}

/** Anggota batih kosong, untuk dialog "Tambah Anggota Batih". */
export function emptyFamilyMember(): FamilyFormItem {
  return {
    id: newRowId(),
    relationship: "",
    name: "",
    ktp_number: "",
    gender: "",
    birth_place: "",
    birth_date: "",
    occupation: "",
    dependent_status: "",
  };
}

/** Isian awal: kosong untuk karyawan baru, atau data lama untuk edit. */
export function initialValues(employee?: EmployeeProfileResource): KaryawanFormValues {
  return {
    name: employee?.name ?? "",
    employment_status: employee?.employment_status ?? "",
    nik: employee?.nik ?? "",
    registration_number: employee?.registration_number ?? "",
    ktp_number: employee?.ktp_number ?? "",
    gender: employee?.gender ?? "",
    birth_place: employee?.birth_place ?? "",
    birth_date: employee?.birth_date ?? "",
    hire_date: employee?.hire_date ?? "",
    religion: employee?.religion ?? "",
    marital_status: employee?.marital_status ?? "",
    phone: employee?.phone ?? "",
    whatsapp: employee?.whatsapp ?? "",
    email: employee?.email ?? "",
    address: employee?.address ?? "",
    photo: null,
    photo_url: employee?.photo_url ?? null,

    // Dari server isian kosong berupa null; di form diubah menjadi "".
    educations: (employee?.educations ?? []).map((education) => ({
      id: education.id,
      level: education.level,
      institution: education.institution ?? "",
      major: education.major ?? "",
      city: education.city ?? "",
      start_year: education.start_year ?? "",
      graduation_year: education.graduation_year,
      gpa: education.gpa ?? "",
      title_front: education.title_front ?? "",
      title_back: education.title_back ?? "",
      certificate_number: education.certificate_number ?? "",
      certificate_file: education.certificate_file,
    })),
    family_members: (employee?.family_members ?? []).map((member) => ({
      id: member.id,
      relationship: member.relationship,
      name: member.name,
      ktp_number: member.ktp_number ?? "",
      gender: member.gender,
      birth_place: member.birth_place ?? "",
      birth_date: member.birth_date,
      occupation: member.occupation ?? "",
      dependent_status: member.dependent_status,
    })),
  };
}

/** Cara menyimpan: "full" = semua isian wajib, "draft" = cukup Nama + Status Karyawan. */
export type SaveMode = "full" | "draft";

/**
 * Pemeriksaan di browser (aturan lengkapnya diperiksa lagi oleh server).
 * Draf: isian wajib selain Nama & Status Karyawan dilewati, tetapi format isian yang sudah diisi tetap diperiksa.
 */
export function validateKaryawanForm(form: KaryawanFormValues, mode: SaveMode): FieldErrors<KaryawanFormValues> {
  const full = mode === "full";
  // Aturan "wajib" hanya berlaku saat simpan lengkap.
  const required = (message: string | undefined) => (full ? message : undefined);

  return {
    name: requireText(form.name, "Nama Lengkap"),
    employment_status: requireSelection(form.employment_status, "Status Karyawan"),
    // NIK hanya wajib untuk karyawan tetap & PKWT
    nik: isNikRequired(form.employment_status) ? required(requireText(form.nik, "NIK Karyawan")) : undefined,
    ktp_number: required(requireText(form.ktp_number, "No. KTP")) ?? mustBeDigits(form.ktp_number, "No. KTP", 16),
    gender: required(requireSelection(form.gender, "Jenis Kelamin")),
    birth_place: required(requireText(form.birth_place, "Tempat Lahir")),
    birth_date: required(requireSelection(form.birth_date, "Tanggal Lahir")),
    hire_date:
      required(requireSelection(form.hire_date, "Tanggal Masuk")) ??
      (form.birth_date && form.hire_date && form.hire_date <= form.birth_date
        ? "Tanggal Masuk harus setelah Tanggal Lahir"
        : undefined),
    religion: required(requireSelection(form.religion, "Agama")),
    marital_status: required(requireSelection(form.marital_status, "Status Perkawinan")),
    phone: required(requireText(form.phone, "No. Telepon")) ?? (form.phone ? mustBePhone(form.phone, "No. Telepon") : undefined),
    whatsapp: mustBePhone(form.whatsapp, "No. WhatsApp"),
    email: mustBeEmail(form.email, "Email"),
    educations: full && form.educations.length === 0 ? "Isi minimal satu riwayat pendidikan" : undefined,
  };
}

/**
 * Isian form -> FormData (multipart) yang dikirim ke /api/employees:
 *   - isian teks biasa
 *   - educations & family_members sebagai teks JSON
 *   - file baru: photo, certificate_file_<id pendidikan>
 *   - penanda keep_* = file lama dipertahankan
 *   - save_mode ("draft" / "full") dan activation_id (usulan Penambahan, kalau dari wizard)
 */
export function toFormData(values: KaryawanFormValues, mode: SaveMode, activationId?: string): FormData {
  const { photo, photo_url, educations, family_members, ...textFields } = values;
  const form = new FormData();

  for (const [key, value] of Object.entries(textFields)) {
    form.append(key, value);
  }
  form.append("save_mode", mode);
  if (activationId) form.append("activation_id", activationId);

  // Foto: kirim file baru, atau beri tanda bahwa foto lama dipertahankan.
  if (photo) form.append("photo", photo);
  else if (photo_url) form.append("keep_photo", "1");

  // Riwayat pendidikan: teks JSON + file ijazah baru (kalau ada) per baris.
  const educationRows: EducationPayloadItem[] = educations.map(({ certificate_file, ...education }) => {
    if (certificate_file instanceof File) form.append(`certificate_file_${education.id}`, certificate_file);
    return { ...education, keep_certificate_file: certificate_file !== null && !(certificate_file instanceof File) };
  });
  form.append("educations", JSON.stringify(educationRows));

  form.append("family_members", JSON.stringify(family_members));

  return form;
}
