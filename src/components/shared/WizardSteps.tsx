import { Check } from "lucide-react";
import { cn } from "cn";

interface WizardStepsProps {
  /** Judul setiap langkah, urut dari langkah 1, mis. ["Data Regu", "Anggota & Slot"] */
  steps: string[];
  /** Langkah yang sedang dibuka, mulai dari 1 */
  currentStep: number;
  /** Klik langkah yang sudah dilewati untuk kembali ke sana */
  onStepClick: (step: number) => void;
}

/**
 * Penanda langkah di atas wizard (dipakai wizard Mutasi & Regu Kerja):
 *
 *   (✓)───────(2)───────(3)───────(4)
 *   Pilih     Atur      Dokumen   Tinjau &
 *   Karyawan  Penugasan           Simpan
 *
 * Langkah yang sudah lewat bisa diklik untuk kembali. Langkah berikutnya hanya
 * bisa dibuka lewat tombol "Lanjut" (supaya isiannya diperiksa dulu).
 */
export function WizardSteps({ steps, currentStep, onStepClick }: WizardStepsProps) {
  return (
    <ol className="flex items-start">
      {steps.map((title, index) => {
        const step = index + 1;
        const isDone = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <li key={title} className="flex flex-1 flex-col items-center gap-2 text-center">
            <div className="flex w-full items-center">
              {/* Garis ke langkah sebelumnya */}
              <span className={cn("h-0.5 flex-1", step === 1 ? "invisible" : isDone || isCurrent ? "bg-primary" : "bg-border")} />
              <button
                type="button"
                onClick={() => isDone && onStepClick(step)}
                disabled={!isDone}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border-2 typo-label-m",
                  isDone && "border-primary bg-primary text-fg-on-brand",
                  isCurrent && "border-primary bg-brand-subtle text-fg-brand",
                  !isDone && !isCurrent && "border-border bg-surface text-fg-tertiary",
                )}
              >
                {isDone ? <Check className="size-4" /> : step}
              </button>
              {/* Garis ke langkah berikutnya */}
              <span
                className={cn("h-0.5 flex-1", step === steps.length ? "invisible" : isDone ? "bg-primary" : "bg-border")}
              />
            </div>
            <span className={cn("typo-body-s", isCurrent ? "font-semibold text-fg-heading" : "text-fg-secondary")}>
              {title}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
