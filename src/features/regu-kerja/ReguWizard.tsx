"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronLeft, Save } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";
import { toast } from "@mestakara/ui/sonner";
import { Spinner } from "@mestakara/ui/spinner";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { WizardSteps } from "@/components/shared/WizardSteps";
import { toDateText } from "@/lib/date";
import { ApiError, apiPost } from "@/lib/http-client";
import type { WorkGroupResource } from "@/types/api/work-group";

import {
  applyGroupChange,
  checkGroupStep,
  checkMembersStep,
  firstMessages,
  initialValues,
  MISSING_SLOT_MESSAGE,
  REGU_WIZARD_STEPS,
  stepOfError,
  toPayload,
  type ReguFormValues,
  type StepErrors,
} from "./regu-form-values";
import { StepAnggotaSlot } from "./StepAnggotaSlot";
import { StepDataRegu } from "./StepDataRegu";
import { useReguFormData, type ReguFormData } from "./useReguFormData";

const LIST_URL = "/dashboard/jadwal/regu";

/**
 * WIZARD TAMBAH REGU KERJA, 2 langkah — data pilihan diambil dulu:
 *
 *   1. Data Regu        nama, lokasi, pola, rotasi, Tanggal Mulai Berlaku Jadwal
 *   2. Anggota & Slot   centang karyawan + pilih slot masing-masing (boleh dilewati)
 *
 * Mengubah regu yang sudah ada TIDAK lewat wizard ini:
 *   data regu -> ReguEditForm (/edit),  anggota -> ReguAnggotaPage (/anggota).
 */
export function ReguWizard() {
  const { data, loading, error } = useReguFormData();

  if (loading) return <PageLoading label="Memuat data pilihan..." />;
  if (error || !data) return <PageError message={error ?? "Data pilihan gagal dimuat."} />;

  return <ReguWizardContent data={data} />;
}

/**
 * Isi wizard. Tombol:
 *   - "Lanjut" (langkah 1) TIDAK BISA DIKLIK selama isian wajib belum benar
 *   - "Simpan" (langkah 2) "Lewati, Simpan Tanpa Anggota" kalau belum ada karyawan yang dipilih
 * Kalau server menolak, langkah yang isiannya bermasalah langsung dibuka.
 * Setelah tersimpan kembali ke daftar regu.
 */
function ReguWizardContent({ data }: { data: ReguFormData }) {
  const router = useRouter();
  const [values, setValues] = useState<ReguFormValues>(() => initialValues(undefined, toDateText(new Date())));
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<StepErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pattern = data.patterns.find((item) => item.id === values.work_pattern_id);
  const nameOf = (employeeId: string) => data.employees.find((item) => item.id === employeeId)?.name ?? "-";

  const groupErrors = checkGroupStep(values);
  // Regu baru: belum ada anggota lama, semua bergabung pada Tanggal Mulai Berlaku.
  const memberErrors = checkMembersStep(values, pattern, [], false, nameOf);
  // Isian yang belum benar. Selama masih ada, tombol Lanjut / Simpan tidak bisa diklik.
  const missingMessages = [...new Set(Object.values(step === 1 ? groupErrors : memberErrors))];

  /** Buka sebuah langkah, mulai dari atas halaman. */
  function openStep(stepNumber: number) {
    setStep(stepNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function change(key: keyof ReguFormValues, value: string) {
    setValues((previous) => applyGroupChange(previous, key, value, data.placementObjects));
    setErrors(({ [key]: _removed, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars
  }

  /** Kirim ke server, lalu kembali ke daftar regu. */
  async function save() {
    setSaving(true);
    setFormError(null);
    try {
      const response = await apiPost<WorkGroupResource>("/api/work-groups", toPayload(values, false));
      toast.success(response.message);
      router.push(LIST_URL);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422 && error.errors) {
        // Pesan pertama setiap isian ditempel ke isiannya; langkah yang bermasalah dibuka.
        const serverErrors = firstMessages(error.errors);
        setErrors(serverErrors);
        openStep(Math.min(...Object.keys(serverErrors).map(stepOfError)));
      }
      setFormError(error instanceof ApiError ? error.message : "Regu kerja gagal disimpan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  // Pesan di bawah isian: error dari server + (langkah 2) slot bentrok.
  // "Pilih Slot" tidak ditempel merah per baris; cukup disebut di petunjuk bawah.
  const shownErrors: StepErrors = {
    ...errors,
    ...(step === 2
      ? Object.fromEntries(Object.entries(memberErrors).filter(([, message]) => message !== MISSING_SLOT_MESSAGE))
      : {}),
  };

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Judul + tombol kembali (ke daftar regu) */}
      <div className="flex items-start gap-3">
        <Button variant="outline" size="icon" asChild className="shrink-0 rounded-full">
          <Link href={LIST_URL} aria-label="Kembali">
            <ChevronLeft />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="typo-h3 text-fg-heading">Tambah Regu Kerja</h1>
          <p className="mt-1 typo-body-m text-fg-secondary">
            Regu = kelompok karyawan yang bergantian mengisi shift dengan satu pola kerja.
          </p>
        </div>
      </div>

      <Card>
        <CardContent>
          <WizardSteps steps={REGU_WIZARD_STEPS} currentStep={step} onStepClick={openStep} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-5">
          {formError && (
            <Alert variant="danger">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <StepDataRegu
              values={values}
              onChange={change}
              errors={shownErrors}
              disabled={saving}
              data={data}
              hasActiveMembers={false}
            />
          )}
          {step === 2 && pattern && (
            <StepAnggotaSlot
              values={values}
              setValues={setValues}
              errors={shownErrors}
              disabled={saving}
              data={data}
              pattern={pattern}
              oldHolders={[]}
              joinDate={values.anchor_date}
            />
          )}
        </CardContent>
      </Card>

      {/* Kenapa tombol belum bisa diklik */}
      {missingMessages.length > 0 && (
        <p className="typo-body-s text-fg-secondary sm:text-right">
          Lengkapi dulu untuk melanjutkan: <span className="text-fg-warning">{missingMessages.join(" · ")}</span>
        </p>
      )}

      {/* Tombol bawah */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        {step === 2 && (
          <Button type="button" variant="outline" onClick={() => openStep(1)} disabled={saving}>
            <ArrowLeft />
            Kembali
          </Button>
        )}
        {step === 1 ? (
          <Button
            type="button"
            onClick={() => {
              setErrors({});
              openStep(2);
            }}
            disabled={saving || missingMessages.length > 0}
          >
            Lanjut
            <ArrowRight />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={save}
            disabled={saving || Object.keys(groupErrors).length > 0 || missingMessages.length > 0}
          >
            {saving ? <Spinner /> : <Save />}
            {values.members.length > 0
              ? `Simpan dengan ${values.members.length} Anggota`
              : "Lewati, Simpan Tanpa Anggota"}
          </Button>
        )}
      </div>
    </div>
  );
}
