"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FieldError, FieldLabel } from "@mestakara/ui/field";
import { Input } from "@mestakara/ui/input";
import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";
import { toast } from "@mestakara/ui/sonner";
import { Textarea } from "@mestakara/ui/textarea";

import { FieldNote } from "@/components/shared/FieldNote";
import { FormPageLayout } from "@/components/shared/FormPageLayout";
import { RequiredMark } from "@/components/shared/RequiredMark";
import { getBrmLevel } from "@/features/organisasi/brm-level";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { apiPost, apiPut } from "@/lib/http-client";
import { BRM_LEVEL_OPTIONS, checkJobGrade, JOB_GRADE_MAX, JOB_GRADE_MIN, needsDivision } from "@/lib/position-rules";
import { requireSelection, requireText } from "@/lib/validation";
import type { DivisionResource } from "@/types/api/division";
import type { PositionPayload, PositionResource } from "@/types/api/organization";

const LIST_URL = "/dashboard/organisasi/jabatan";

interface JabatanFormProps {
  /** Jabatan yang diubah. Kosongkan untuk menambah jabatan baru. */
  position?: PositionResource;
  /** Pilihan Bidang */
  divisions: DivisionResource[];
}

/**
 * Form tambah / ubah jabatan.
 *
 * Aturan isian (lihat src/lib/position-rules.ts):
 *   - Kode, Nama Jabatan, Level BRM  -> selalu wajib
 *   - Bidang                         -> wajib mulai BRM-2, boleh kosong untuk BRM-1
 *   - Keterangan                     -> boleh kosong
 *
 * Atasan langsung TIDAK diisi di sini, tapi per orang (lihat menu Jabatan Karyawan).
 */
export function JabatanForm({ position, divisions }: JabatanFormProps) {
  const router = useRouter();
  const isEdit = position !== undefined;

  const [values, setValues] = useState<PositionPayload>({
    code: position?.code ?? "",
    title: position?.title ?? "",
    brm_level: position?.brm_level ?? null,
    job_grade: position?.job_grade ?? null,
    division_id: position?.division_id ?? "",
    description: position?.description ?? "",
  });

  /** Ubah satu isian, isian lain tetap. */
  function changeValue<K extends keyof PositionPayload>(key: K, value: PositionPayload[K]) {
    setValues({ ...values, [key]: value });
  }

  const isDivisionRequired = needsDivision(values.brm_level);

  const { submit, saving, errors, formError } = useFormSubmit<PositionPayload>({
    validate: (form) => ({
      code: requireText(form.code, "Kode"),
      title: requireText(form.title, "Nama Jabatan"),
      brm_level: requireSelection(form.brm_level, "Level BRM"),
      job_grade: checkJobGrade(form.job_grade),
      division_id: isDivisionRequired ? requireSelection(form.division_id, "Bidang") : undefined,
    }),
    onSubmit: async (form) => {
      if (isEdit) {
        await apiPut(`/api/positions/${position.id}`, form);
        toast.success(`Jabatan "${form.title}" berhasil diperbarui`);
      } else {
        await apiPost("/api/positions", form);
        toast.success(`Jabatan "${form.title}" berhasil ditambahkan`);
      }

      router.push(LIST_URL);
    },
  });

  return (
    <FormPageLayout
      title={isEdit ? "Edit Jabatan" : "Tambah Jabatan"}
      description="Lengkapi kode, nama, level BRM, bidang, dan job grade jabatan."
      backHref={LIST_URL}
      formError={formError}
      saving={saving}
      submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Jabatan"}
      onSubmit={() => submit(values)}
    >
      {/* Mulai ukuran tablet, isian pendek dibuat berdampingan (2 kolom) */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Kode */}
        <Field data-invalid={Boolean(errors.code)}>
          <FieldLabel htmlFor="code">
            Kode <RequiredMark />
          </FieldLabel>
          <Input
            id="code"
            value={values.code}
            onChange={(event) => changeValue("code", event.target.value)}
            aria-invalid={Boolean(errors.code)}
            disabled={saving}
            placeholder="Cth. JAB-136"
          />
          <FieldError>{errors.code}</FieldError>
        </Field>

        {/* Level BRM */}
        <Field data-invalid={Boolean(errors.brm_level)}>
          <FieldLabel htmlFor="brm_level">
            Level BRM <RequiredMark />
          </FieldLabel>
          <NativeSelect
            id="brm_level"
            value={values.brm_level ?? ""}
            onChange={(event) => changeValue("brm_level", event.target.value ? Number(event.target.value) : null)}
            aria-invalid={Boolean(errors.brm_level)}
            disabled={saving}
            className="w-full"
          >
            <NativeSelectOption value="">Pilih level BRM</NativeSelectOption>
            {BRM_LEVEL_OPTIONS.map((level) => (
              <NativeSelectOption key={level} value={level}>
                {getBrmLevel(level).label} — {getBrmLevel(level).examples}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError>{errors.brm_level}</FieldError>
        </Field>

        {/* Nama jabatan */}
        <Field data-invalid={Boolean(errors.title)}>
          <FieldLabel htmlFor="title">
            Nama Jabatan <RequiredMark />
          </FieldLabel>
          <Input
            id="title"
            value={values.title}
            onChange={(event) => changeValue("title", event.target.value)}
            aria-invalid={Boolean(errors.title)}
            disabled={saving}
            placeholder="Cth. Asisten Personalia"
          />
          <FieldError>{errors.title}</FieldError>
        </Field>

        {/* Bidang */}
        <Field data-invalid={Boolean(errors.division_id)}>
          <FieldLabel htmlFor="division_id">
            Bidang {isDivisionRequired && <RequiredMark />}
          </FieldLabel>
          <NativeSelect
            id="division_id"
            value={values.division_id}
            onChange={(event) => changeValue("division_id", event.target.value)}
            aria-invalid={Boolean(errors.division_id)}
            disabled={saving}
            className="w-full"
          >
            <NativeSelectOption value="">{isDivisionRequired ? "Pilih bidang" : "Tanpa bidang"}</NativeSelectOption>
            {divisions.map((division) => (
              <NativeSelectOption key={division.id} value={division.id}>
                {division.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldNote>Wajib untuk BRM-2 ke bawah. Jabatan BRM-1 boleh tanpa bidang.</FieldNote>
          <FieldError>{errors.division_id}</FieldError>
        </Field>

        {/* Job Grade (opsional) */}
        <Field data-invalid={Boolean(errors.job_grade)}>
          <FieldLabel htmlFor="job_grade">Job Grade</FieldLabel>
          <Input
            id="job_grade"
            type="number"
            inputMode="numeric"
            min={JOB_GRADE_MIN}
            max={JOB_GRADE_MAX}
            step={1}
            value={values.job_grade ?? ""}
            // Kosong = null (belum diisi), selain itu angka.
            onChange={(event) => changeValue("job_grade", event.target.value === "" ? null : Number(event.target.value))}
            aria-invalid={Boolean(errors.job_grade)}
            disabled={saving}
            placeholder="Cth. 12"
          />
          <FieldNote>
            Opsional, angka bulat {JOB_GRADE_MIN}–{JOB_GRADE_MAX}. Boleh dikosongkan dulu; tampil &quot;-&quot; di tabel.
          </FieldNote>
          <FieldError>{errors.job_grade}</FieldError>
        </Field>
      </div>

      {/* Keterangan */}
      <Field data-invalid={Boolean(errors.description)}>
        <FieldLabel htmlFor="description">Keterangan</FieldLabel>
        <Textarea
          id="description"
          value={values.description}
          onChange={(event) => changeValue("description", event.target.value)}
          aria-invalid={Boolean(errors.description)}
          disabled={saving}
          placeholder="Cth. Wilayah Gunung Mas dan Sukabumi"
          rows={3}
        />
        <FieldNote>Pemegang jabatan diatur lewat menu Mutasi &amp; Penempatan.</FieldNote>
        <FieldError>{errors.description}</FieldError>
      </Field>
    </FormPageLayout>
  );
}
