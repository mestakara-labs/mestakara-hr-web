"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";
import { toast } from "@mestakara/ui/sonner";
import { Spinner } from "@mestakara/ui/spinner";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { toDateText } from "@/lib/date";
import { ApiError, apiPut } from "@/lib/http-client";
import type { WorkGroupResource } from "@/types/api/work-group";

import { oldSlotHolders } from "./group-members";
import {
  checkMembersStep,
  firstMessages,
  initialValues,
  MISSING_SLOT_MESSAGE,
  toPayload,
  type ReguFormValues,
  type StepErrors,
} from "./regu-form-values";
import { StepAnggotaSlot } from "./StepAnggotaSlot";
import { useReguFormData, type ReguFormData } from "./useReguFormData";

const LIST_URL = "/dashboard/jadwal/regu";

/**
 * Halaman KELOLA ANGGOTA REGU:
 *
 *   [←] Kelola Anggota · House Keeping Gunung Mas
 *   Tanggal Bergabung Anggota Baru, tabel pilih karyawan,
 *   daftar slot (anggota saat ini + karyawan baru)
 *   [Batal] [Simpan dengan 2 Anggota Baru]
 *
 * Tombol kembali, Batal, dan setelah simpan menuju halaman ASAL (`returnTo`):
 *   - "detail" : dibuka dari tombol Kelola Anggota di detail regu  -> detail regu
 *   - "edit"   : dibuka dari tombol Edit Anggota Regu di form edit -> form Edit Regu
 *
 * Data regu (nama, pola, rotasi) tidak diubah di sini; itu di halaman Edit Regu.
 */
/** Halaman asal yang dituju saat kembali. */
type ReturnTo = "detail" | "edit";

export function ReguAnggotaPage({ id, returnTo }: { id: string; returnTo: ReturnTo }) {
  const groupRequest = useApiGet<WorkGroupResource>(`/api/work-groups/${id}`);
  const { data, loading, error } = useReguFormData();

  if (loading || groupRequest.loading) return <PageLoading label="Memuat data anggota regu..." />;
  if (error || groupRequest.error || !data || !groupRequest.data) {
    return <PageError message={error ?? groupRequest.error ?? "Regu kerja tidak ditemukan."} />;
  }

  return <ReguAnggotaContent group={groupRequest.data} data={data} returnTo={returnTo} />;
}

function ReguAnggotaContent({
  group,
  data,
  returnTo,
}: {
  group: WorkGroupResource;
  data: ReguFormData;
  returnTo: ReturnTo;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ReguFormValues>(() => initialValues(group, toDateText(new Date())));
  const [serverErrors, setServerErrors] = useState<StepErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const backHref = returnTo === "edit" ? `${LIST_URL}/${group.id}/edit` : `${LIST_URL}/${group.id}`;
  const pattern = data.patterns.find((item) => item.id === values.work_pattern_id);
  const joinDate = values.members_start_date;
  const oldHolders = oldSlotHolders(group, values, pattern, joinDate);
  const nameOf = (employeeId: string) => data.employees.find((item) => item.id === employeeId)?.name ?? "-";

  const memberErrors = checkMembersStep(values, pattern, oldHolders, true, nameOf);
  // Isian yang belum benar. Selama masih ada, tombol Simpan tidak bisa diklik.
  const missingMessages = [...new Set(Object.values(memberErrors))];
  // Pesan di bawah isian: error server + slot bentrok ("Pilih Slot" cukup disebut di petunjuk bawah).
  const shownErrors: StepErrors = {
    ...serverErrors,
    ...Object.fromEntries(Object.entries(memberErrors).filter(([, message]) => message !== MISSING_SLOT_MESSAGE)),
  };

  async function save() {
    setSaving(true);
    setFormError(null);
    try {
      const response = await apiPut<WorkGroupResource>(`/api/work-groups/${group.id}`, toPayload(values, true));
      toast.success(response.message);
      router.push(backHref);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422 && error.errors) {
        setServerErrors(firstMessages(error.errors));
      }
      setFormError(error instanceof ApiError ? error.message : "Anggota gagal disimpan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  if (!pattern) return <PageError message="Pola kerja regu ini tidak ditemukan." />;

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex items-start gap-3">
        <Button variant="outline" size="icon" asChild className="shrink-0 rounded-full">
          <Link href={backHref} aria-label={returnTo === "edit" ? "Kembali ke edit regu" : "Kembali ke detail regu"}>
            <ChevronLeft />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="typo-h3 text-fg-heading">Kelola Anggota · {group.name}</h1>
          <p className="mt-1 typo-body-m text-fg-secondary">
            Tambahkan karyawan ke regu dan tentukan slot masing-masing.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5">
          {formError && (
            <Alert variant="danger">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <StepAnggotaSlot
            values={values}
            setValues={setValues}
            errors={shownErrors}
            disabled={saving}
            data={data}
            group={group}
            pattern={pattern}
            oldHolders={oldHolders}
            joinDate={joinDate}
          />
        </CardContent>
      </Card>

      {missingMessages.length > 0 && (
        <p className="typo-body-s text-fg-secondary sm:text-right">
          Lengkapi dulu untuk menyimpan: <span className="text-fg-warning">{missingMessages.join(" · ")}</span>
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" asChild>
          <Link href={backHref}>Batal</Link>
        </Button>
        <Button
          type="button"
          onClick={save}
          disabled={saving || values.members.length === 0 || missingMessages.length > 0}
        >
          {saving ? <Spinner /> : <Save />}
          {values.members.length > 0 ? `Simpan dengan ${values.members.length} Anggota Baru` : "Pilih Karyawan Baru Dulu"}
        </Button>
      </div>
    </div>
  );
}
