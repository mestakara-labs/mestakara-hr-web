"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { toast } from "@mestakara/ui/sonner";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormDialog } from "@/components/shared/FormDialog";
import { SearchMultiSelectField, TextAreaField } from "@/components/shared/FormFields";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { needsSupervisor } from "@/lib/assignment-rules";
import { apiPost } from "@/lib/http-client";
import { requireAtLeastOne } from "@/lib/validation";
import type { AssignmentResource } from "@/types/api/assignment";
import type { SupervisorChangePayload } from "@/types/api/supervisor-change";

import { toSupervisorOptions, toSupervisorTarget, withStatus } from "./assignment-options";

interface SupervisorDialogProps {
  /** Penugasan yang atasannya diubah (satu atau beberapa). Kosong = dialog tertutup. */
  targets: AssignmentResource[];
  /** Semua penugasan, untuk pilihan atasan */
  assignments: AssignmentResource[];
  onClose: () => void;
  /** Dipanggil setelah atasan berhasil diubah (untuk memuat ulang tabel) */
  onSaved: () => void;
}

/** Isian dialog (selain daftar penugasan yang diubah). */
type SupervisorFormValues = Omit<SupervisorChangePayload, "assignment_ids">;

/**
 * Dialog UBAH ATASAN untuk satu atau beberapa karyawan sekaligus. Tidak butuh SK,
 * tapi perubahannya tercatat di Riwayat Atasan.
 *
 *   ┌ Ubah Atasan (3 karyawan) ─────────────────── × ┐
 *   │ Asep — Penanggung Jawab Wahana (atasan: Budi)   │  daftar karyawan yang dipilih
 *   │ Atasan Langsung Baru   [Rina — Pengawas ×] ...  │
 *   │ Keterangan (opsional)                            │
 *   │                              [Batal] [Simpan]    │
 *   └──────────────────────────────────────────────────┘
 *
 * Setelah "Simpan" muncul pop-up konfirmasi dulu, baru data dikirim.
 */
export function SupervisorDialog({ targets, assignments, onClose, onSaved }: SupervisorDialogProps) {
  // `key` di bawah membuat isian kembali kosong setiap kali dialog dibuka untuk karyawan lain.
  if (targets.length === 0) return null;

  return (
    <SupervisorDialogContent
      key={targets.map((target) => target.id).join(",")}
      targets={targets}
      assignments={assignments}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function SupervisorDialogContent({ targets, assignments, onClose, onSaved }: SupervisorDialogProps) {
  const [values, setValues] = useState<SupervisorFormValues>({
    // Kalau semua yang dipilih atasannya sama, atasan itu langsung terisi.
    supervisor_assignment_ids: sharedSupervisorIds(targets),
    notes: "",
  });
  const [isConfirming, setIsConfirming] = useState(false);

  const options = toSupervisorOptions(assignments, targets.map(toSupervisorTarget));
  const isRequired = targets.some((target) => needsSupervisor(target.position.brm_level));

  const { submit, check, clearError, saving, errors, formError } = useFormSubmit<SupervisorFormValues>({
    validate: (form) => ({
      supervisor_assignment_ids: isRequired
        ? requireAtLeastOne(form.supervisor_assignment_ids, "Atasan Langsung")
        : undefined,
    }),
    onSubmit: async (form) => {
      const payload: SupervisorChangePayload = { ...form, assignment_ids: targets.map((target) => target.id) };
      const response = await apiPost("/api/position-assignments/supervisors", payload);

      // Pesan dari server menyebut jumlah yang BENAR-BENAR berubah
      // (karyawan yang atasannya memang sudah sama dilewati).
      toast.success(response.message);
      onSaved();
      onClose();
    },
  });

  /** Ubah satu isian, sekaligus hapus pesan error isian itu. */
  function changeValue<K extends keyof SupervisorFormValues>(key: K, value: SupervisorFormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
    clearError(key);
  }

  const newSupervisorNames = options
    .filter((option) => values.supervisor_assignment_ids.includes(option.value))
    .map((option) => option.label);

  return (
    <>
      <FormDialog
        open
        title={targets.length === 1 ? "Ubah Atasan" : `Ubah Atasan (${targets.length} karyawan)`}
        description="Perubahan atasan tidak memerlukan SK, tapi tercatat di Riwayat Atasan."
        saveLabel={saving ? "Menyimpan..." : "Simpan"}
        onSave={() => check(values) && setIsConfirming(true)}
        onClose={onClose}
      >
        {formError && (
          <Alert variant="danger">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {/* Karyawan yang atasannya diubah */}
        <div>
          <p className="mb-2 typo-label-m text-fg-heading">Karyawan</p>
          <ul className="max-h-48 divide-y divide-border overflow-y-auto rounded-lg border border-border">
            {targets.map((target) => (
              <li key={target.id} className="px-3 py-2 typo-body-s">
                <p className="font-medium text-fg-primary">
                  {target.employee.name} — {withStatus(target.assignment_status, target.position.title)}
                </p>
                <p className="text-fg-tertiary">
                  Atasan sekarang:{" "}
                  {target.supervisors.length > 0
                    ? target.supervisors.map((supervisor) => supervisor.employee_name).join(", ")
                    : "-"}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <SearchMultiSelectField
          id="supervisor_assignment_ids"
          label="Atasan Langsung Baru"
          required={isRequired}
          options={options}
          value={values.supervisor_assignment_ids}
          onChange={(value) => changeValue("supervisor_assignment_ids", value)}
          error={errors.supervisor_assignment_ids}
          disabled={saving}
          placeholder="Cari nama atasan..."
          emptyMessage="Tidak ada calon atasan yang cocok."
          note={
            targets.length > 1
              ? "bisa lebih dari satu. Hanya atasan yang level BRM-nya lebih tinggi dari SEMUA karyawan yang dipilih."
              : "bisa lebih dari satu. Hanya karyawan dengan penugasan aktif di jabatan ber-level BRM lebih tinggi."
          }
        />

        <TextAreaField
          id="notes"
          label="Keterangan"
          value={values.notes}
          onChange={(value) => changeValue("notes", value)}
          error={errors.notes}
          disabled={saving}
          placeholder="Cth. Menyesuaikan pejabat Pengawas yang baru"
          note="opsional."
        />
      </FormDialog>

      {/* Pop-up konfirmasi sebelum data dikirim */}
      <ConfirmDialog
        open={isConfirming}
        icon={CircleHelp}
        tone="info"
        title="Simpan perubahan atasan?"
        description={
          <>
            <p>
              Atasan langsung <strong>{targets.length} karyawan</strong> akan diubah menjadi:
            </p>
            <p className="mt-2 font-medium text-fg-primary">
              {newSupervisorNames.length > 0 ? newSupervisorNames.join("; ") : "Tanpa atasan"}
            </p>
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

/** Atasan yang SAMA untuk semua karyawan yang dipilih; kosong kalau atasannya berbeda-beda. */
function sharedSupervisorIds(targets: AssignmentResource[]): string[] {
  const [first, ...rest] = targets.map((target) =>
    target.supervisors.map((supervisor) => supervisor.assignment_id).sort().join(","),
  );
  const isAllSame = rest.every((ids) => ids === first);

  return isAllSame && first ? first.split(",") : [];
}
