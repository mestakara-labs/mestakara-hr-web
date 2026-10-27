"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronLeft, CircleHelp, Save, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";
import { toast } from "@mestakara/ui/sonner";
import { Spinner } from "@mestakara/ui/spinner";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { WizardSteps } from "@/components/shared/WizardSteps";
import { ApiError, apiPostForm, apiPutForm } from "@/lib/http-client";
import type { ActivationResource } from "@/types/api/employee-activation";

import {
  checkBasisStep,
  checkEmployeeStep,
  checkPlacementStep,
  countMissingDocuments,
  initialValues,
  newItem,
  PENAMBAHAN_STEPS,
  stepOfError,
  toFormData,
  type PenambahanData,
  type PenambahanFormValues,
  type StepErrors,
} from "./penambahan-form-values";
import { findCandidates, PickEmployeeDialog } from "./PickEmployeeDialog";
import { StepDasarDokumen } from "./StepDasarDokumen";
import { StepDataKaryawan } from "./StepDataKaryawan";
import { StepPenempatan } from "./StepPenempatan";
import { StepTinjau } from "./StepTinjau";

export const PENAMBAHAN_URL = "/dashboard/penambahan";
const LAST_STEP = PENAMBAHAN_STEPS.length;

/** Pop-up yang sedang terbuka. */
type OpenDialog = "none" | "pick" | "document-warning" | "confirm-save";

interface PenambahanWizardProps {
  /** Usulan Draf yang dilanjutkan. Kosongkan untuk usulan baru. */
  activation?: ActivationResource;
  data: PenambahanData;
  /** Langkah yang dibuka pertama kali (mis. kembali dari form karyawan = 1) */
  initialStep: number;
}

/**
 * WIZARD PENAMBAHAN KARYAWAN, 4 langkah:
 *
 *   1. Data Karyawan                tambah karyawan baru (halaman form) / pilih Belum Aktif & Nonaktif
 *   2. Dasar Penambahan & Dokumen   jenis, TMT, unit asal; dokumen kolektif / per orang (opsional)
 *   3. Penempatan                   rencana jabatan per karyawan (boleh dilewati)
 *   4. Tinjau & Simpan              peringatan dokumen kosong -> konfirmasi -> BERLAKU
 *
 * "Simpan sebagai Draf" bisa kapan saja. Sebelum membuka halaman form karyawan, usulan
 * otomatis disimpan sebagai Draf supaya tidak ada isian yang hilang.
 */
export function PenambahanWizard({ activation, data, initialStep }: PenambahanWizardProps) {
  const router = useRouter();
  const [activationId, setActivationId] = useState<string | null>(activation?.id ?? null);
  const [values, setValues] = useState<PenambahanFormValues>(() => initialValues(activation));
  const [step, setStep] = useState(initialStep);
  const [errors, setErrors] = useState<StepErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState<OpenDialog>("none");

  /** Periksa isian satu langkah. */
  function checkStep(stepNumber: number): StepErrors {
    if (stepNumber === 1) return checkEmployeeStep(values, data);
    if (stepNumber === 2) return checkBasisStep(values, data);
    if (stepNumber === 3) return checkPlacementStep(values, data);
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
  async function send(action: "draft" | "submit"): Promise<ActivationResource | null> {
    setSaving(true);
    setFormError(null);
    try {
      const form = toFormData(values, action);
      const response = activationId
        ? await apiPutForm<ActivationResource>(`/api/employee-activations/${activationId}`, form)
        : await apiPostForm<ActivationResource>("/api/employee-activations", form);
      setActivationId(response.data.id);
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
    toast.success("Draf usulan penambahan berhasil disimpan.");
    router.push(`${PENAMBAHAN_URL}/${saved.id}`);
  }

  /** Simpan Draf dulu, lalu buka halaman form karyawan (baru / ubah). */
  async function saveDraftAndOpen(path: (id: string) => string) {
    const saved = await send("draft");
    if (saved) router.push(path(saved.id));
  }

  /** "Simpan & Berlakukan" di langkah terakhir: semua langkah diperiksa dulu. */
  function askToSubmit() {
    for (let stepNumber = 1; stepNumber < LAST_STEP; stepNumber++) {
      if (Object.keys(checkStep(stepNumber)).length > 0) {
        openStep(stepNumber);
        return;
      }
    }
    setOpenDialog(countMissingDocuments(values) > 0 ? "document-warning" : "confirm-save");
  }

  async function submit() {
    setOpenDialog("none");
    const saved = await send("submit");
    if (!saved) return;
    toast.success(`Usulan penambahan berlaku untuk ${saved.items.length} karyawan.`);
    router.push(`${PENAMBAHAN_URL}/${saved.id}`);
  }

  const stepProps = { values, setValues, errors: shownErrors, disabled: saving, data };
  const missingDocumentCount = countMissingDocuments(values);

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex items-start gap-3">
        <Button variant="outline" size="icon" asChild className="shrink-0 rounded-full">
          <Link href={activationId ? `${PENAMBAHAN_URL}/${activationId}` : PENAMBAHAN_URL} aria-label="Kembali">
            <ChevronLeft />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="typo-h3 text-fg-heading">{activationId ? "Lanjutkan Usulan Penambahan" : "Penambahan Karyawan"}</h1>
          <p className="mt-1 typo-body-m text-fg-secondary">
            Tambahkan satu atau beberapa karyawan sekaligus: penerimaan baru, mutasi masuk, atau pengaktifan kembali.
          </p>
        </div>
      </div>

      <Card>
        <CardContent>
          <WizardSteps steps={PENAMBAHAN_STEPS} currentStep={step} onStepClick={openStep} />
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
            <StepDataKaryawan
              {...stepProps}
              onAddNew={() => saveDraftAndOpen((id) => `${PENAMBAHAN_URL}/${id}/karyawan/baru`)}
              onPick={() => setOpenDialog("pick")}
              onEdit={(employeeId) => saveDraftAndOpen((id) => `${PENAMBAHAN_URL}/${id}/karyawan/${employeeId}/edit`)}
              onRemove={(itemId) =>
                setValues((previous) => ({ ...previous, items: previous.items.filter((item) => item.id !== itemId) }))
              }
            />
          )}
          {step === 2 && <StepDasarDokumen {...stepProps} />}
          {step === 3 && <StepPenempatan {...stepProps} />}
          {step === 4 && <StepTinjau values={values} data={data} />}
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
              {step === 3 && values.items.every((item) => !item.has_placement) ? "Lewati" : "Lanjut"}
              <ArrowRight />
            </Button>
          ) : (
            <Button type="button" onClick={askToSubmit} disabled={saving}>
              {saving && <Spinner />}
              Simpan &amp; Berlakukan
            </Button>
          )}
        </div>
      </div>

      <PickEmployeeDialog
        open={openDialog === "pick"}
        candidates={findCandidates(data, values.items.map((item) => item.employee_id), activationId)}
        onClose={() => setOpenDialog("none")}
        onPick={(employees) =>
          setValues((previous) => ({ ...previous, items: [...previous.items, ...employees.map(newItem)] }))
        }
      />

      {/* Pop-up peringatan: dokumen dasar belum lengkap */}
      <ConfirmDialog
        open={openDialog === "document-warning"}
        icon={TriangleAlert}
        tone="warning"
        title="Dokumen dasar penambahan belum diunggah"
        description={
          <>
            <p>
              Dokumen dasar belum diunggah untuk <strong>{missingDocumentCount} karyawan</strong>. Dokumen (SK / Memo /
              Nota Dinas, dll.) sangat disarankan sebagai dasar penambahan karyawan.
            </p>
            <p className="mt-2">Dokumen bisa diunggah nanti dari halaman detail usulan. Tetap lanjutkan?</p>
          </>
        }
        cancelLabel="Lengkapi Dulu"
        confirmLabel="Tetap Lanjutkan"
        onCancel={() => {
          setOpenDialog("none");
          openStep(2);
        }}
        onConfirm={() => setOpenDialog("confirm-save")}
      />

      {/* Pop-up konfirmasi sebelum usulan diberlakukan */}
      <ConfirmDialog
        open={openDialog === "confirm-save"}
        icon={CircleHelp}
        tone="info"
        title="Berlakukan usulan penambahan?"
        description={
          <>
            <p>
              <strong>{values.items.length} karyawan</strong> akan menjadi <strong>Aktif</strong> mulai TMT Aktif
              masing-masing{values.items.some((item) => item.has_placement) && ", dan penugasan jabatannya dibuat"}.
            </p>
            <p className="mt-2">Setelah berlaku, usulan hanya bisa diunggah dokumennya atau dibatalkan.</p>
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
