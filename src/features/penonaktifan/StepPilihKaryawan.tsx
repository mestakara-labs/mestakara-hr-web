"use client";

import { Users, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@mestakara/ui/avatar";
import { Button } from "@mestakara/ui/button";
import { FieldError } from "@mestakara/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { getInitials } from "@/lib/initials";
import { formatJobGrade } from "@/lib/position-rules";

import { itemErrorKey, type PenonaktifanData, type PenonaktifanFormValues, type StepErrors } from "./penonaktifan-form-values";

interface StepPilihKaryawanProps {
  values: PenonaktifanFormValues;
  errors: StepErrors;
  disabled: boolean;
  data: PenonaktifanData;
  /** Buka dialog Pilih Karyawan (Aktif) */
  onPick: () => void;
  onRemove: (itemId: string) => void;
}

/**
 * LANGKAH 1 — PILIH KARYAWAN
 *
 *   [Pilih Karyawan Aktif]
 *   No | Karyawan          | Jabatan Sekarang      | Job Grade | Status Karyawan | Aksi
 *   1  | Asep (NIK ...)    | Asisten Verifikasi    | Karyawan Tetap  | [×]
 */
export function StepPilihKaryawan({ values, errors, disabled, data, onPick, onRemove }: StepPilihKaryawanProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button type="button" onClick={onPick} disabled={disabled}>
          <Users />
          Pilih Karyawan Aktif
        </Button>
      </div>
      <p className="typo-body-s text-fg-tertiary">
        Catatan: bisa memilih beberapa karyawan sekaligus; jenis dan TMT nonaktif boleh berbeda per orang.
      </p>

      {values.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-10 text-center typo-body-s text-fg-tertiary">
          Belum ada karyawan. Klik &ldquo;Pilih Karyawan Aktif&rdquo;.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table className="min-w-160">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Karyawan</TableHead>
                <TableHead>Jabatan Sekarang</TableHead>
                <TableHead>Job Grade</TableHead>
                <TableHead>Status Karyawan</TableHead>
                <TableHead className="w-px">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {values.items.map((item, index) => {
                const employee = data.employees.find((entry) => entry.id === item.employee_id);
                const error = errors[itemErrorKey(item.id, "employee_id")];

                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-fg-tertiary">{index + 1}</TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          {employee?.photo_url && <AvatarImage src={employee.photo_url} alt={`Foto ${employee.name}`} />}
                          <AvatarFallback>{getInitials(employee?.name ?? "-")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-fg-heading">{employee?.name ?? "-"}</p>
                          <p className="typo-body-s text-fg-tertiary">NIK {employee?.nik ?? "-"}</p>
                          {error && <p className="typo-body-s text-fg-danger">{error}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-fg-primary">{employee?.position?.title ?? "Belum ditempatkan"}</TableCell>
                    <TableCell className="text-fg-primary">{formatJobGrade(employee?.position?.job_grade)}</TableCell>
                    <TableCell className="text-fg-secondary">{employee?.employment_status ?? "-"}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onRemove(item.id)}
                        disabled={disabled}
                        aria-label={`Keluarkan ${employee?.name ?? "karyawan"} dari usulan`}
                        title="Keluarkan dari usulan"
                      >
                        <X />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <FieldError>{errors.items}</FieldError>
    </div>
  );
}
