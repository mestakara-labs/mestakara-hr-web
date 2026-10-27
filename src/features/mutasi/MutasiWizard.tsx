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
import { DOCUMENT_MODE } from "@/lib/transfer-rules";
import type { TransferResource } from "@/types/api/transfer";

import { initialValues, toFormData, type MutasiFormValues, type WizardData, type WizardPreset } from "./mutasi-form-values";
import {
  checkAssignmentStep,
  checkDocumentStep,
  checkEmployeeStep,
  stepOfError,
  type StepErrors,
} from "./mutasi-validation";
import { StepDokumen } from "./StepDokumen";
import { StepPenugasanBaru } from "./StepPenugasanBaru";
import { StepPilihKaryawan } from "./StepPilihKaryawan";
import { StepTinjau } from "./StepTinjau";
import { useTransferPreview } from "./useTransferPreview";

const LIST_URL = "/dashboard/mutasi";
/** Judul setiap langkah wizard, urut dari langkah 1. */
const WIZARD_STEPS = ["Pilih Karyawan", "Atur Penugasan Baru", "Dokumen", "Tinjau & Simpan"];
const LAST_STEP = WIZARD_STEPS.length;
const DOCUMENT_STEP = 3;

/** Pop-up yang sedang terbuka saat "Simpan Usulan". */
type OpenDialog = "none" | "basis-document-warning" | "confirm-save";

interface MutasiWizardProps {
  /** Usulan yang diubah (Draf / Menunggu Dokumen). Kosongkan untuk usulan baru. */
  transfer?: TransferResource;
  data: WizardData;
  preset: WizardPreset;
}

/**
 * WIZARD MUTASI & PENEMPATAN, 4 langkah:
 *
 *   1. Pilih Karyawan       jenis mutasi + centang karyawan
 *   2. Atur Penugasan Baru  TMT + jabatan lama -> jabatan baru setiap karyawan
 *   3. Dokumen              data SK + unggah scan / buat dari template
 *   4. Tinjau & Simpan      ringkasan + perubahan atasan otomatis
 *
 * Tombol:
 *   - "Lanjut"              TIDAK BISA DIKLIK selama isian wajib langkah ini belum benar;
 *                           di sebelahnya tertulis apa saja yang masih kurang
 *   - "Simpan sebagai Draf" bisa kapan saja (cukup jenis mutasi & karyawan)
 *   - "Simpan Usulan"       di langkah 4:
 *        1. file dokumen dasar belum diunggah -> pop-up PERINGATAN
 *             "Lengkapi Dulu"   -> kembali ke langkah 3 (Dokumen)
 *             "Tetap Lanjutkan" -> lanjut ke pop-up konfirmasi
 *        2. pop-up KONFIRMASI -> dikirim
 * Kalau server menolak, langkah yang isiannya bermasalah langsung dibuka.
 */
export function MutasiWizard({ transfer, data, preset }: MutasiWizardProps) {
  const router = useRouter();
  const isEdit = transfer !== undefined;

  const [values, setValues] = useState<MutasiFormValues>(() => initialValues(transfer, preset, data.assignments));
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<StepErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState<OpenDialog>("none");

  const preview = useTransferPreview(values.items);

  /** Periksa isian satu langkah. */
  function checkStep(stepNumber: number): StepErrors {
    if (stepNumber === 1) return checkEmployeeStep(values);
    if (stepNumber === 2) return checkAssignmentStep(values, data.positions);
    if (stepNumber === 3) return checkDocumentStep(values);
    return {};
  }

  /** Buka sebuah langkah, mulai dari atas halaman. */
  function openStep(stepNumber: number) {
    setStep(stepNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Isian langkah ini yang belum benar. Selama masih ada, tombol "Lanjut" tidak bisa diklik.
  // Pesan yang sama (mis. "Pilih Jabatan" untuk beberapa karyawan) cukup ditulis sekali.
  const missingMessages = [...new Set(Object.values(checkStep(step)))];
  const canGoNext = missingMessages.length === 0;

  /** "Lanjut": hanya bisa diklik kalau isian langkah ini sudah benar. */
  function goNext() {
    setErrors({});
    openStep(step + 1);
  }

  /**
   * "Simpan Usulan" di langkah terakhir: semua langkah diperiksa, lalu
   * pop-up peringatan dokumen dasar (kalau file-nya belum diunggah) atau langsung pop-up konfirmasi.
   */
  function askToSubmit() {
    for (let stepNumber = 1; stepNumber < LAST_STEP; stepNumber++) {
      const stepErrors = checkStep(stepNumber);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        openStep(stepNumber);
        return;
      }
    }
    setOpenDialog(values.basis_document_file ? "confirm-save" : "basis-document-warning");
  }

  /** "Simpan sebagai Draf": cukup jenis mutasi & minimal satu karyawan. */
  function saveDraft() {
    const stepErrors = checkEmployeeStep(values);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      openStep(1);
      return;
    }
    save("draft");
  }

  /** Kirim ke server, lalu buka halaman detail usulan. */
  async function save(action: "draft" | "submit") {
    setSaving(true);
    setFormError(null);

    try {
      const form = toFormData(values, action);
      const response = isEdit
        ? await apiPutForm<TransferResource>(`/api/transfers/${transfer.id}`, form)
        : await apiPostForm<TransferResource>("/api/transfers", form);

      toast.success(response.message);
      router.push(`${LIST_URL}/${response.data.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422 && error.errors) {
        // Pesan pertama setiap isian ditempel ke isiannya; langkah yang bermasalah dibuka.
        const serverErrors = Object.fromEntries(
          Object.entries(error.errors).map(([field, messages]) => [field, messages[0]]),
        );
        setErrors(serverErrors);
        openStep(Math.min(...Object.keys(serverErrors).map(stepOfError)));
        setFormError(error.message);
      } else {
        setFormError(error instanceof ApiError ? error.message : "Usulan gagal disimpan. Silakan coba lagi.");
      }
    } finally {
      setSaving(false);
    }
  }

  const stepProps = { values, setValues, errors, disabled: saving, data };

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Judul + tombol kembali */}
      <div className="flex items-start gap-3">
        <Button variant="outline" size="icon" asChild className="shrink-0 rounded-full">
          <Link href={isEdit ? `${LIST_URL}/${transfer.id}` : LIST_URL} aria-label="Kembali">
            <ChevronLeft />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="typo-h3 text-fg-heading">{isEdit ? "Ubah Usulan Mutasi" : "Usulan Mutasi & Penempatan"}</h1>
          <p className="mt-1 typo-body-m text-fg-secondary">
            Pindahkan atau tempatkan satu atau beberapa karyawan sekaligus dengan satu SK.
          </p>
        </div>
      </div>

      <Card>
        <CardContent>
          <WizardSteps steps={WIZARD_STEPS} currentStep={step} onStepClick={openStep} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-5">
          {formError && (
            <Alert variant="danger">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {step === 1 && <StepPilihKaryawan {...stepProps} transferId={transfer?.id ?? null} />}
          {step === 2 && <StepPenugasanBaru {...stepProps} preview={preview} />}
          {step === 3 && <StepDokumen {...stepProps} />}
          {step === 4 && <StepTinjau values={values} data={data} preview={preview} />}
        </CardContent>
      </Card>

      {/* Kenapa "Lanjut" belum bisa diklik */}
      {step < LAST_STEP && !canGoNext && (
        <p className="typo-body-s text-fg-secondary sm:text-right">
          Lengkapi dulu untuk melanjutkan: <span className="text-fg-warning">{missingMessages.join(" · ")}</span>
        </p>
      )}

      {/* Tombol bawah */}
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
            <Button type="button" onClick={goNext} disabled={saving || !canGoNext}>
              Lanjut
              <ArrowRight />
            </Button>
          ) : (
            <Button type="button" onClick={askToSubmit} disabled={saving}>
              {saving && <Spinner />}
              Simpan Usulan
            </Button>
          )}
        </div>
      </div>

      {/* Pop-up peringatan: file dokumen dasar belum diunggah */}
      <ConfirmDialog
        open={openDialog === "basis-document-warning"}
        icon={TriangleAlert}
        tone="warning"
        title="Dokumen dasar belum diunggah"
        description={
          <>
            <p>
              Dokumen dasar mutasi & penempatan (Memo / Nota Dinas / Disposisi) sangat disarankan sebagai dasar
              pertanggungjawaban.
            </p>
            <p className="mt-2">
              Abaikan peringatan ini jika SK yang diunggah sudah dapat dijadikan dasar mutasi/penempatan. Apakah tetap
              ingin melanjutkan tanpa dokumen dasar?
            </p>
          </>
        }
        cancelLabel="Lengkapi Dulu"
        confirmLabel="Tetap Lanjutkan"
        onCancel={() => {
          setOpenDialog("none");
          openStep(DOCUMENT_STEP);
        }}
        onConfirm={() => setOpenDialog("confirm-save")}
      />

      {/* Pop-up konfirmasi sebelum usulan dikirim */}
      <ConfirmDialog
        open={openDialog === "confirm-save"}
        icon={CircleHelp}
        tone="info"
        title="Simpan usulan mutasi?"
        description={
          <>
            <p>
              Apakah data usulan <strong>{values.type}</strong> untuk <strong>{values.items.length} karyawan</strong>{" "}
              di atas sudah benar?
            </p>
            <p className="mt-2">
              {values.document_mode === DOCUMENT_MODE.upload
                ? "Usulan akan langsung BERLAKU setelah disimpan."
                : "Usulan akan MENUNGGU DOKUMEN sampai scan SK yang ditandatangani diunggah."}
            </p>
          </>
        }
        cancelLabel="Periksa Lagi"
        confirmLabel="Ya, Simpan"
        onCancel={() => setOpenDialog("none")}
        onConfirm={() => {
          setOpenDialog("none");
          save("submit");
        }}
      />
    </div>
  );
}
