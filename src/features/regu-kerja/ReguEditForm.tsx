"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";
import { toast } from "@mestakara/ui/sonner";

import { FormPageLayout } from "@/components/shared/FormPageLayout";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { toDateText } from "@/lib/date";
import { apiPut } from "@/lib/http-client";
import type { WorkGroupResource } from "@/types/api/work-group";

import { applyGroupChange, checkGroupStep, initialValues, toPayload, type ReguFormValues } from "./regu-form-values";
import { StepDataRegu } from "./StepDataRegu";
import { useReguFormData, type ReguFormData } from "./useReguFormData";

const LIST_URL = "/dashboard/jadwal/regu";

/**
 * Form EDIT REGU KERJA — hanya DATA REGU (nama, lokasi, pola, rotasi, Tanggal Mulai Berlaku Jadwal):
 *
 *   [←] Edit Regu Kerja                                  <- kembali ke DAFTAR regu
 *   (i) Anggota regu diatur di halaman Kelola Anggota.     [Edit Anggota Regu]
 *   isian Data Regu (StepDataRegu)
 *   [Batal] [Simpan Perubahan]                           <- setelah simpan kembali ke daftar regu
 */
export function ReguEditForm({ group }: { group: WorkGroupResource }) {
  const { data, loading, error } = useReguFormData();

  if (loading) return <PageLoading label="Memuat data pilihan..." />;
  if (error || !data) return <PageError message={error ?? "Data pilihan gagal dimuat."} />;

  return <ReguEditFormContent group={group} data={data} />;
}

function ReguEditFormContent({ group, data }: { group: WorkGroupResource; data: ReguFormData }) {
  const router = useRouter();
  const [values, setValues] = useState<ReguFormValues>(() => initialValues(group, toDateText(new Date())));

  const { submit, saving, errors, formError, clearError } = useFormSubmit<ReguFormValues>({
    validate: checkGroupStep,
    onSubmit: async (form) => {
      // Anggota tidak diubah di sini (members kosong).
      await apiPut(`/api/work-groups/${group.id}`, toPayload({ ...form, members: [] }, true));
      toast.success(`Regu "${form.name}" berhasil diperbarui`);
      router.push(LIST_URL);
    },
  });

  function change(key: keyof ReguFormValues, value: string) {
    setValues((previous) => applyGroupChange(previous, key, value, data.placementObjects));
    clearError(key);
  }

  return (
    <FormPageLayout
      title="Edit Regu Kerja"
      description="Ubah data regu: lokasi, pola kerja, dan rotasi."
      backHref={LIST_URL}
      formError={formError}
      saving={saving}
      submitLabel="Simpan Perubahan"
      onSubmit={() => submit(values)}
    >
      <Alert variant="info">
        <Users />
        <AlertDescription>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Anggota regu <strong>{group.name}</strong> ({group.active_member_count} orang) tidak diubah di sini.
              Untuk menambah anggota atau mengatur slotnya, buka halaman <strong>Kelola Anggota</strong>.
            </p>
            <Button type="button" size="sm" variant="outline" asChild className="shrink-0">
              <Link href={`${LIST_URL}/${group.id}/anggota?dari=edit`}>
                <Users />
                Edit Anggota Regu
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <StepDataRegu
        values={values}
        onChange={change}
        errors={errors as Record<string, string>}
        disabled={saving}
        data={data}
        hasActiveMembers={group.active_member_count > 0}
      />
    </FormPageLayout>
  );
}
