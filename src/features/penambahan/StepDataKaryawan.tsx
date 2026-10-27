"use client";

import { CircleCheck, Pencil, UserPlus, Users, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@mestakara/ui/avatar";
import { Button } from "@mestakara/ui/button";
import { FieldError } from "@mestakara/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { EmployeeActiveStatusBadge } from "@/features/karyawan/EmployeeActiveStatusBadge";
import { getInitials } from "@/lib/initials";

import { itemErrorKey, type PenambahanData, type PenambahanFormValues, type StepErrors } from "./penambahan-form-values";

interface StepDataKaryawanProps {
  values: PenambahanFormValues;
  errors: StepErrors;
  disabled: boolean;
  data: PenambahanData;
  /** Simpan usulan sebagai Draf, lalu buka halaman form karyawan baru */
  onAddNew: () => void;
  /** Buka dialog Pilih Karyawan (Belum Aktif / Nonaktif) */
  onPick: () => void;
  /** Simpan usulan sebagai Draf, lalu buka halaman ubah data karyawan ini */
  onEdit: (employeeId: string) => void;
  onRemove: (itemId: string) => void;
}

/**
 * LANGKAH 1 — DATA KARYAWAN
 *
 *   [+ Tambah Karyawan Baru]  [Pilih Karyawan (Belum Aktif / Nonaktif)]
 *   No | Karyawan | Status Karyawan | Status | Kelengkapan          | Aksi
 *   1  | Asep ... | PKWT            | [Belum Aktif] | ⚠ Kurang 3 isian | [Ubah Data] [×]
 *
 * Form karyawan dibuka di halaman tersendiri (isiannya banyak); usulan otomatis disimpan
 * sebagai Draf dulu supaya tidak ada yang hilang. Lanjut hanya kalau semua data Lengkap.
 */
export function StepDataKaryawan({ values, errors, disabled, data, onAddNew, onPick, onEdit, onRemove }: StepDataKaryawanProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onAddNew} disabled={disabled}>
          <UserPlus />
          Tambah Karyawan Baru
        </Button>
        <Button type="button" variant="outline" onClick={onPick} disabled={disabled}>
          <Users />
          Pilih Karyawan (Belum Aktif / Nonaktif)
        </Button>
      </div>
      <p className="typo-body-s text-fg-tertiary">
        Catatan: data karyawan boleh disimpan sebagai draf dulu (cukup Nama + Status Karyawan), tetapi harus Lengkap
        sebelum lanjut ke langkah berikutnya.
      </p>

      {values.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-10 text-center typo-body-s text-fg-tertiary">
          Belum ada karyawan. Klik &ldquo;Tambah Karyawan Baru&rdquo; atau &ldquo;Pilih Karyawan&rdquo;.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table className="min-w-200">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Karyawan</TableHead>
                <TableHead>Status Karyawan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kelengkapan Data</TableHead>
                <TableHead className="w-px">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {values.items.map((item, index) => {
                const employee = data.employees.find((entry) => entry.id === item.employee_id);
                const missing = employee?.missing_fields ?? [];
                const error = errors[itemErrorKey(item.id, "employee_id")];

                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-fg-tertiary">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          {employee?.photo_url && <AvatarImage src={employee.photo_url} alt={`Foto ${employee.name}`} />}
                          <AvatarFallback>{getInitials(employee?.name ?? "-")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-fg-heading">{employee?.name ?? "-"}</p>
                          <p className="typo-body-s text-fg-tertiary">NIK {employee?.nik ?? "-"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-fg-primary">{employee?.employment_status || "-"}</TableCell>
                    <TableCell>{employee && <EmployeeActiveStatusBadge status={employee.active_status} />}</TableCell>
                    {/* Sel tabel bawaan tidak turun baris; daftar isian yang kurang dibuat turun baris
                        supaya tidak menimpa tombol di kolom Aksi. */}
                    <TableCell className="min-w-64 whitespace-normal">
                      {missing.length === 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-fg-success">
                          <CircleCheck className="size-4" />
                          Lengkap
                        </span>
                      ) : (
                        <div>
                          <p className="font-medium text-fg-warning">Kurang {missing.length} isian</p>
                          <p className="typo-body-s text-fg-tertiary">{missing.join(", ")}</p>
                        </div>
                      )}
                      {error && <p className="mt-1 typo-body-s text-fg-danger">{error}</p>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(item.employee_id)} disabled={disabled}>
                          <Pencil />
                          Ubah Data
                        </Button>
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
                      </div>
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
