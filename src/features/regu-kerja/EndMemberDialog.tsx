"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { toast } from "@mestakara/ui/sonner";

import { FormDialog } from "@/components/shared/FormDialog";
import { DateField } from "@/components/shared/FormFields";
import { formatDate, toDateText } from "@/lib/date";
import { ApiError, apiPut } from "@/lib/http-client";
import type { GroupMemberResource } from "@/types/api/work-group";

interface EndMemberDialogProps {
  groupId: string;
  /** Anggota yang diakhiri. null = dialog tertutup. */
  member: GroupMemberResource | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Dialog AKHIRI KEANGGOTAAN:
 *
 *   Tanggal Terakhir Bertugas [📅]
 *   (i) Mulai hari berikutnya slotnya kosong sampai ada pengganti. Riwayat anggota tetap disimpan.
 *
 * Anggota yang SUDAH punya tanggal akhir (belum lewat) -> "Ubah Tanggal Terakhir", terisi tanggal lamanya.
 */
export function EndMemberDialog(props: EndMemberDialogProps) {
  if (!props.member) return null;
  return <EndMemberDialogContent key={props.member.id} {...props} member={props.member} />;
}

function EndMemberDialogContent({
  groupId,
  member,
  onClose,
  onSaved,
}: EndMemberDialogProps & { member: GroupMemberResource }) {
  const isChange = member.end_date !== null;
  const [endDate, setEndDate] = useState(() => member.end_date ?? toDateText(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!endDate) {
      setError("Pilih Tanggal Terakhir");
      return;
    }
    setSaving(true);
    try {
      const response = await apiPut(`/api/work-groups/${groupId}/members/${member.id}`, { end_date: endDate });
      toast.success(response.message);
      onSaved();
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? (saveError.errors?.end_date?.[0] ?? saveError.message)
          : "Keanggotaan gagal diakhiri.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDialog
      open
      title={isChange ? "Ubah Tanggal Terakhir" : "Akhiri Keanggotaan"}
      description={`${member.employee.name} · bergabung ${formatDate(member.start_date)}${
        isChange ? ` · terakhir saat ini ${formatDate(member.end_date)}` : ""
      }`}
      saveLabel={saving ? "Menyimpan..." : isChange ? "Simpan Tanggal" : "Akhiri Keanggotaan"}
      onSave={save}
      onClose={onClose}
    >
      <DateField
        id="end_date"
        label="Tanggal Terakhir Bertugas"
        required
        value={endDate}
        onChange={(value) => {
          setEndDate(value);
          setError(null);
        }}
        error={error ?? undefined}
        disabled={saving}
        placeholder="Pilih tanggal"
        fromYear={2020}
      />
      <Alert variant="info">
        <AlertDescription>
          <p>
            Mulai hari berikutnya slotnya <strong>kosong</strong> sampai ada anggota pengganti (lihat baris
            &ldquo;Shift kosong&rdquo; di pratinjau). Riwayat anggota tetap disimpan.
          </p>
        </AlertDescription>
      </Alert>
    </FormDialog>
  );
}
