"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Badge } from "@mestakara/ui/badge";

import { ListSection, type ListColumn } from "@/components/shared/ListSection";
import { sortByHighestEducation } from "@/lib/employee-rules";

import { EducationDialog } from "./EducationDialog";
import { emptyEducation, type EducationFormItem, type FormSectionProps } from "./karyawan-form-values";

/** Kolom tabel riwayat pendidikan. */
const COLUMNS: ListColumn<EducationFormItem>[] = [
  { header: "Jenjang", cell: (item) => <Badge variant="brand" dot={false}>{item.level}</Badge> },
  {
    header: "Institusi",
    cell: (item) => (
      <>
        <p className="font-medium text-fg-heading">{item.institution || "-"}</p>
        {item.city && <p className="typo-body-s text-fg-tertiary">{item.city}</p>}
      </>
    ),
  },
  { header: "Jurusan", cell: (item) => item.major || "-" },
  { header: "Tahun", cell: (item) => (item.start_year ? `${item.start_year}–${item.graduation_year}` : item.graduation_year) },
  { header: "IPK / Nilai", cell: (item) => item.gpa || "-" },
  { header: "Gelar", cell: (item) => [item.title_front, item.title_back].filter(Boolean).join(", ") || "-" },
  {
    header: "Ijazah",
    cell: (item) =>
      item.certificate_file ? (
        <span className="flex items-center gap-1.5 text-fg-secondary">
          <FileText className="size-4 shrink-0" />
          <span className="max-w-36 truncate" title={item.certificate_file.name}>
            {item.certificate_file.name}
          </span>
        </span>
      ) : (
        item.certificate_number || "-"
      ),
  },
];

/**
 * Tab RIWAYAT PENDIDIKAN: semua pendidikan yang pernah ditempuh karyawan.
 *
 * Tambah / ubah lewat dialog (EducationDialog), lalu baris masuk ke tabel.
 * Pendidikan terakhir karyawan otomatis = jenjang tertinggi di daftar ini.
 */
export function EducationTab({ values, changeValue, errors, disabled }: FormSectionProps) {
  /** Riwayat yang sedang dibuka di dialog; null = dialog tertutup. */
  const [editing, setEditing] = useState<{ education: EducationFormItem; isNew: boolean } | null>(null);

  const educations = sortByHighestEducation(values.educations);

  /** Simpan hasil dialog: ganti baris lama (ubah) atau tambahkan baris baru. */
  function saveEducation(saved: EducationFormItem) {
    const isExisting = values.educations.some((item) => item.id === saved.id);
    changeValue(
      "educations",
      isExisting
        ? values.educations.map((item) => (item.id === saved.id ? saved : item))
        : [...values.educations, saved],
    );
    setEditing(null);
  }

  function deleteEducation(deleted: EducationFormItem) {
    changeValue("educations", values.educations.filter((item) => item.id !== deleted.id));
  }

  return (
    <>
      <ListSection
        description="Isi semua pendidikan yang pernah ditempuh. Pendidikan terakhir diambil otomatis dari jenjang tertinggi."
        addLabel="Tambah Pendidikan"
        emptyText="Belum ada riwayat pendidikan. Minimal satu riwayat wajib diisi."
        items={educations}
        columns={COLUMNS}
        itemLabel={(item) => `${item.level} ${item.institution}`.trim()}
        onAdd={() => setEditing({ education: emptyEducation(), isNew: true })}
        onEdit={(item) => setEditing({ education: item, isNew: false })}
        onDelete={deleteEducation}
        error={errors.educations}
        disabled={disabled}
      />

      {editing && (
        <EducationDialog
          key={editing.education.id}
          education={editing.education}
          isNew={editing.isNew}
          onSave={saveEducation}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
