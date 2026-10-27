"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronLeft, Save, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";
import { toast } from "@mestakara/ui/sonner";
import { Spinner } from "@mestakara/ui/spinner";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { WizardSteps } from "@/components/shared/WizardSteps";
import { ApiError, apiPostForm, apiPutForm } from "@/lib/http-client";
import type { TerminationResource } from "@/types/api/employee-termination";

import {
  checkBasisStep,
  checkEmployeeStep,
  findCandidates,
  initialValues,
  newItem,
  PENONAKTIFAN_STEPS,
  stepOfError,
  toFormData,
  type PenonaktifanData,
  type PenonaktifanFormValues,
  type StepErrors,
} from "./penonaktifan-form-values";
import { PickActiveEmployeeDialog } from "./PickActiveEmployeeDialog";
import { StepDasarPenonaktifan } from "./StepDasarPenonaktifan";
import { StepPilihKaryawan } from "./StepPilihKaryawan";
import { StepPratinjauDampak } from "./StepPratinjauDampak";
import { StepTinjauPenonaktifan } from "./StepTinjauPenonaktifan";
import { useTerminationPreview } from "./useTerminationPreview";

export const PENONAKTIFAN_URL = "/dashboard/penonaktifan";
const LAST_STEP = PENONAKTIFAN_STEPS.length;

/** Pop-up yang sedang terbuka. */
type OpenDialog = "none" | "pick" | "confirm-save";

interface PenonaktifanWizardProps {
  /** Usulan Draf yang dilanjutkan. Kosongkan untuk usulan baru. */
  termination?: TerminationResource;
  data: PenonaktifanData;
}

/**
 * WIZARD PENONAKTIFAN KARYAWAN, 4 langkah:
 *
 *   1. Pilih Karyawan     karyawan Aktif (boleh beberapa)
 *   2. Dasar & Dokumen    jenis, TMT nonaktif, alasan / unit tujuan; dokumen WAJIB (kolektif / per orang)
 *   3. Pratinjau Dampak   jabatan diakhiri, bawahan dialihkan, regu ditinggalkan (hanya dilihat)
 *   4. Tinjau & Simpan    konfirmasi -> BERLAKU
 *
 * "Simpan sebagai Draf" bisa kapan saja.
 */
export function PenonaktifanWizard({ termination, data }: PenonaktifanWizardProps) {
  const router = useRouter();
  const [terminationId, setTerminationId] = useState<string | null>(termination?.id ?? null);
  const [values, setValues] = useState<PenonaktifanFormValues>(() => initialValues(termination));
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<StepErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState<OpenDialog>("none");
  const { preview, error: previewError } = useTerminationPreview(values.items);

  /** Periksa isian satu langkah. */
  function checkStep(stepNumber: number): StepErrors {
    if (stepNumber === 1) return checkEmployeeStep(values);
    if (stepNumber === 2) return checkBasisStep(values);
    return {};
  }

  function openStep(stepNumber: number) {
    setStep(stepNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Isian langkah ini yang belum benar. Selama masih ada, tombol "Lanjut" tidak bisa diklik.
  const stepErrors = checkStep(step);
  const missingMessages = [...new Set(Object.values(stepErrors))];
  const canGoNext = missingMessages.length === 0;
  // Pesan di bawah isian: error dari server + isian langkah ini yang belum benar.
  const shownErrors: StepErrors = { ...stepErrors, ...errors };

  /** Kirim ke server. Hasilnya usulan tersimpan, atau null kalau gagal (pesan ditampilkan). */
  async function send(action: "draft" | "submit"): Promise<TerminationResource | null> {
    setSaving(true);
    setFormError(null);
    try {
      const form = toFormData(values, action);
      const response = terminationId
        ? await apiPutForm<TerminationResource>(`/api/employee-terminations/${terminationId}`, form)
        : await apiPostForm<TerminationResource>("/api/employee-terminations", form);
      setTerminationId(response.data.id);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 422 && error.errors) {
        const serverErrors = Object.fromEntries(Object.entries(error.errors).map(([field, messages]) => [field, messages[0]]));
        setErrors(serverErrors);
        openStep(Math.min(...Object.keys(serverErrors).map(stepOfError)));
      }
      setFormError(error instanceof ApiError ? error.message : "Usulan gagal disimpan. Silakan coba lagi.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  /** "Simpan sebagai Draf" lalu buka detail usulan. */
  async function saveDraft() {
    const saved = await send("draft");
    if (!saved) return;
    toast.success("Draf usulan penonaktifan berhasil disimpan.");
    router.push(`${PENONAKTIFAN_URL}/${saved.id}`);
  }

  /** "Simpan & Berlakukan" di langkah terakhir: semua langkah diperiksa dulu. */
  function askToSubmit() {
    for (let stepNumber = 1; stepNumber < LAST_STEP; stepNumber++) {
      if (Object.keys(checkStep(stepNumber)).length > 0) {
        openStep(stepNumber);
        return;
      }
    }
    setOpenDialog("confirm-save");
  }

  async function submit() {
    setOpenDialog("none");
    const saved = await send("submit");
    if (!saved) return;
    toast.success(`Usulan penonaktifan berlaku untuk ${saved.items.length} karyawan.`);
    router.push(`${PENONAKTIFAN_URL}/${saved.id}`);
  }

  const stepProps = { values, setValues, errors: shownErrors, disabled: saving, data };

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex items-start gap-3">
        <Button variant="outline" size="icon" asChild className="shrink-0 rounded-full">
          <Link href={terminationId ? `${PENONAKTIFAN_URL}/${terminationId}` : PENONAKTIFAN_URL} aria-label="Kembali">
            <ChevronLeft />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="typo-h3 text-fg-heading">
            {terminationId ? "Lanjutkan Usulan Penonaktifan" : "Penonaktifan Karyawan"}
          </h1>
          <p className="mt-1 typo-body-m text-fg-secondary">
            Nonaktifkan satu atau beberapa karyawan sekaligus: pensiun, mengundurkan diri, PHK, kontrak berakhir, mutasi
            keluar, dan lainnya.
          </p>
        </div>
      </div>

      <Card>
        <CardContent>
          <WizardSteps steps={PENONAKTIFAN_STEPS} currentStep={step} onStepClick={openStep} />
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
            <StepPilihKaryawan
              {...stepProps}
              onPick={() => setOpenDialog("pick")}
              onRemove={(itemId) =>
                setValues((previous) => ({ ...previous, items: previous.items.filter((item) => item.id !== itemId) }))
              }
            />
          )}
          {step === 2 && <StepDasarPenonaktifan {...stepProps} />}
          {step === 3 && <StepPratinjauDampak values={values} data={data} preview={preview} previewError={previewError} />}
          {step === 4 && <StepTinjauPenonaktifan values={values} data={data} preview={preview} />}
        </CardContent>
      </Card>

      {/* Kenapa "Lanjut" belum bisa diklik */}
      {step < LAST_STEP && !canGoNext && (
        <p className="typo-body-s text-fg-secondary sm:text-right">
          Lengkapi dulu untuk melanjutkan: <span className="text-fg-warning">{missingMessages.join(" · ")}</span>
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={saveDraft} disabled={saving}>
          <Save />
          Simpan sebagai Draf
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => openStep(step - 1)} disabled={saving}>
              <ArrowLeft />
              Kembali
            </Button>
          )}
          {step < LAST_STEP ? (
            <Button
              type="button"
              onClick={() => {
                setErrors({});
                openStep(step + 1);
              }}
              disabled={saving || !canGoNext}
            >
              Lanjut
              <ArrowRight />
            </Button>
          ) : (
            <Button type="button" variant="destructive" onClick={askToSubmit} disabled={saving}>
              {saving && <Spinner />}
              Simpan &amp; Berlakukan
            </Button>
          )}
        </div>
      </div>

      <PickActiveEmployeeDialog
        open={openDialog === "pick"}
        candidates={findCandidates(data, values.items.map((item) => item.employee_id), terminationId)}
        onClose={() => setOpenDialog("none")}
        onPick={(employees) =>
          setValues((previous) => ({ ...previous, items: [...previous.items, ...employees.map(newItem)] }))
        }
      />

      {/* Pop-up konfirmasi sebelum usulan diberlakukan */}
      <ConfirmDialog
        open={openDialog === "confirm-save"}
        icon={TriangleAlert}
        tone="warning"
        title="Berlakukan usulan penonaktifan?"
        description={
          <>
            <p>
              <strong>{values.items.length} karyawan</strong> akan menjadi <strong>Nonaktif</strong> mulai TMT nonaktif
              masing-masing. Jabatan & keanggotaan regunya diakhiri, bawahannya dialihkan ke atasan berikutnya, dan akun
              loginnya dinonaktifkan.
            </p>
            <p className="mt-2">Setelah berlaku, usulan hanya bisa diganti dokumennya atau dibatalkan.</p>
          </>
        }
        cancelLabel="Periksa Lagi"
        confirmLabel="Ya, Berlakukan"
        onCancel={() => setOpenDialog("none")}
        onConfirm={submit}
      />
    </div>
  );
}
