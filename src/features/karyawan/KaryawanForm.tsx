"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CircleHelp, FilePen } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { FieldError, FieldLegend, FieldSeparator, FieldSet } from "@mestakara/ui/field";
import { toast } from "@mestakara/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mestakara/ui/tabs";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FieldNote } from "@/components/shared/FieldNote";
import { FormPageLayout } from "@/components/shared/FormPageLayout";
import { PhotoUploadField } from "@/components/shared/PhotoUploadField";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { EMPLOYEE_ACTIVE_STATUS } from "@/lib/activation-rules";
import { formatDate } from "@/lib/date";
import { findHighestEducation } from "@/lib/employee-rules";
import { apiPostForm, apiPutForm } from "@/lib/http-client";
import type { EmployeeProfileResource } from "@/types/api/employee";

import { BiodataFields } from "./BiodataFields";
import { EducationTab } from "./EducationTab";
import { FamilyTab } from "./FamilyTab";
import {
  initialValues,
  toFormData,
  validateKaryawanForm,
  type FormSectionProps,
  type KaryawanFormValues,
  type SaveMode,
} from "./karyawan-form-values";

const LIST_URL = "/dashboard/karyawan";

/** Nama tab di bawah biodata. */
type TabName = "pendidikan" | "batih";

interface KaryawanFormProps {
  /** Karyawan yang diubah. Kosongkan untuk karyawan baru. */
  employee?: EmployeeProfileResource;
  /**
   * Dibuka dari wizard PENAMBAHAN KARYAWAN: usulan (Draf) tempat karyawan ini berada
   * dan alamat kembali ke wizard setelah disimpan.
   */
  activation?: { id: string; returnHref: string };
}

/**
 * Form tambah / ubah karyawan (biodata, pendidikan, batih):
 *
 *   Foto (opsional)
 *   Data Biografi
 *   [Riwayat Pendidikan] [Data Batih]   ← tab bar
 *                  [Batal] [Simpan sebagai Draf] [Simpan]
 *
 * Karyawan BARU selalu ditambahkan lewat wizard Penambahan Karyawan (dasar penambahan,
 * dokumen, dan penempatan diatur di wizard itu). Form ini hanya mengurus biodatanya.
 *
 * Tombol:
 *   - "Simpan sebagai Draf" (karyawan baru / Belum Aktif): cukup Nama + Status Karyawan
 *   - "Simpan": semua isian wajib diperiksa -> pop-up KONFIRMASI -> dikirim
 * Setelah tersimpan: kembali ke wizard (kalau dari wizard), atau ke Data Karyawan.
 */
export function KaryawanForm({ employee, activation }: KaryawanFormProps) {
  const router = useRouter();
  const isEdit = employee !== undefined;
  // Draf hanya untuk karyawan yang belum aktif (baru, atau masih Belum Aktif).
  const canSaveDraft = !isEdit || employee.active_status === EMPLOYEE_ACTIVE_STATUS.pending;
  const returnHref = activation?.returnHref ?? LIST_URL;

  const [values, setValues] = useState<KaryawanFormValues>(() => initialValues(employee));
  const [isConfirming, setIsConfirming] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>("pendidikan");
  /** Cara menyimpan yang sedang berjalan (dibaca oleh validate & onSubmit). */
  const saveMode = useRef<SaveMode>("full");

  const { submit, check, clearError, saving, errors, formError } = useFormSubmit<KaryawanFormValues>({
    validate: (form) => validateKaryawanForm(form, saveMode.current),
    onSubmit: async (form) => {
      const formData = toFormData(form, saveMode.current, isEdit ? undefined : activation?.id);
      const response = isEdit
        ? await apiPutForm<EmployeeProfileResource>(`/api/employees/${employee.id}`, formData)
        : await apiPostForm<EmployeeProfileResource>("/api/employees", formData);

      toast.success(response.message);
      router.push(returnHref);
    },
  });

  /** Ubah satu isian (isian lain tetap), sekaligus hapus pesan error isian itu. */
  function changeValue<K extends keyof KaryawanFormValues>(key: K, value: KaryawanFormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
    clearError(key);
  }

  /** "Simpan": periksa semua isian wajib, lalu minta konfirmasi. */
  function handleSaveClick() {
    saveMode.current = "full";
    if (!check(values)) {
      // Error di tab yang tertutup tidak terlihat, jadi tab-nya langsung dibuka.
      if (values.educations.length === 0) setActiveTab("pendidikan");
      return;
    }
    setIsConfirming(true);
  }

  /** "Simpan sebagai Draf": cukup Nama + Status Karyawan, langsung dikirim. */
  function handleDraftClick() {
    saveMode.current = "draft";
    submit(values);
  }

  const sectionProps: FormSectionProps = { values, changeValue, errors, disabled: saving };
  const lastEducation = findHighestEducation(values.educations);

  return (
    <>
      <FormPageLayout
        title={isEdit ? "Edit Data Karyawan" : "Tambah Data Karyawan"}
        description={
          activation
            ? "Isi biodata karyawan untuk usulan Penambahan. Simpan sebagai Draf kalau datanya belum lengkap."
            : "Lengkapi data biografi karyawan. Penempatan jabatan diatur lewat Mutasi & Penempatan."
        }
        backHref={returnHref}
        formError={formError}
        saving={saving}
        submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Karyawan"}
        onSubmit={handleSaveClick}
        extraActions={
          canSaveDraft && (
            <Button type="button" variant="outline" size="lg" onClick={handleDraftClick} disabled={saving}>
              <FilePen />
              Simpan sebagai Draf
            </Button>
          )
        }
      >
        {/* ===== 1. Foto ===== */}
        <FieldSet>
          <FieldLegend>Foto Karyawan</FieldLegend>
          <FieldNote>foto bersifat opsional.</FieldNote>
          <PhotoUploadField
            id="photo"
            name={values.name}
            photoUrl={values.photo_url}
            disabled={saving}
            onChange={(file, previewUrl) =>
              setValues((previous) => ({ ...previous, photo: file, photo_url: previewUrl }))
            }
          />
          <FieldError>{errors.photo}</FieldError>
        </FieldSet>

        <FieldSeparator />

        {/* ===== 2. Data biografi ===== */}
        <BiodataFields {...sectionProps} />
        {canSaveDraft && (
          <FieldNote>
            Simpan sebagai Draf cukup dengan Nama Lengkap dan Status Karyawan. Isian wajib lainnya harus lengkap
            sebelum karyawan diaktifkan di wizard Penambahan.
          </FieldNote>
        )}

        <FieldSeparator />

        {/* ===== 3. Tab: pendidikan, batih ===== */}
        <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as TabName)}>
          <TabsList variant="line" className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="pendidikan">
              <TabLabel label="Riwayat Pendidikan" count={values.educations.length} hasError={Boolean(errors.educations)} />
            </TabsTrigger>
            <TabsTrigger value="batih">
              <TabLabel label="Data Batih" count={values.family_members.length} hasError={Boolean(errors.family_members)} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pendidikan" className="pt-4">
            <EducationTab {...sectionProps} />
          </TabsContent>
          <TabsContent value="batih" className="pt-4">
            <FamilyTab {...sectionProps} />
          </TabsContent>
        </Tabs>
      </FormPageLayout>

      {/* Pop-up konfirmasi terakhir sebelum data dikirim */}
      <ConfirmDialog
        open={isConfirming}
        icon={CircleHelp}
        tone="info"
        title={isEdit ? "Simpan perubahan data karyawan?" : "Simpan data karyawan baru?"}
        description={
          <>
            <p>Apakah data karyawan di atas sudah benar?</p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md bg-subtle p-3 text-left typo-body-s">
              <SummaryRow label="Nama">{values.name}</SummaryRow>
              <SummaryRow label="Status">{values.employment_status}</SummaryRow>
              <SummaryRow label="NIK">{values.nik || "-"}</SummaryRow>
              <SummaryRow label="No. Registrasi">{values.registration_number || "-"}</SummaryRow>
              <SummaryRow label="Lahir">
                {values.birth_place}, {formatDate(values.birth_date)}
              </SummaryRow>
              <SummaryRow label="Masuk">{formatDate(values.hire_date)}</SummaryRow>
              <SummaryRow label="Pendidikan">
                {values.educations.length} riwayat (terakhir {lastEducation?.level ?? "-"})
              </SummaryRow>
              <SummaryRow label="Batih">{values.family_members.length} orang</SummaryRow>
            </dl>
          </>
        }
        cancelLabel="Periksa Lagi"
        confirmLabel="Ya, Simpan"
        onCancel={() => setIsConfirming(false)}
        onConfirm={() => {
          setIsConfirming(false);
          submit(values);
        }}
      />
    </>
  );
}

/** Tulisan di tab: nama + jumlah data (kalau ada) + titik merah kalau ada isian yang salah. */
function TabLabel({ label, count, hasError }: { label: string; count?: number; hasError: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      {label}
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-subtle px-1.5 typo-label-s text-fg-secondary">{count}</span>
      )}
      {hasError && <span className="size-2 rounded-full bg-danger" aria-label="ada isian yang perlu diperbaiki" />}
    </span>
  );
}

/** Satu baris ringkasan di pop-up konfirmasi, mis. "Nama  Asep Saepudin". */
function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-fg-tertiary">{label}</dt>
      <dd className="font-medium text-fg-primary">{children}</dd>
    </>
  );
}
