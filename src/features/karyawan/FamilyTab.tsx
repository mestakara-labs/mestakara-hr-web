"use client";

import { useState } from "react";
import { Badge } from "@mestakara/ui/badge";

import { ListSection, type ListColumn } from "@/components/shared/ListSection";
import { formatDate, getAge } from "@/lib/date";

import { FamilyMemberDialog } from "./FamilyMemberDialog";
import { emptyFamilyMember, type FamilyFormItem, type FormSectionProps } from "./karyawan-form-values";

/** Kolom tabel data batih. */
const COLUMNS: ListColumn<FamilyFormItem>[] = [
  { header: "Hubungan", cell: (item) => <Badge variant="neutral" dot={false}>{item.relationship}</Badge> },
  {
    header: "Nama",
    cell: (item) => (
      <>
        <p className="font-medium text-fg-heading">{item.name}</p>
        {item.ktp_number && <p className="typo-body-s text-fg-tertiary">KTP {item.ktp_number}</p>}
      </>
    ),
  },
  { header: "Jenis Kelamin", cell: (item) => item.gender },
  {
    header: "Tempat, Tanggal Lahir",
    cell: (item) => (
      <>
        <p>{[item.birth_place, formatDate(item.birth_date)].filter(Boolean).join(", ")}</p>
        <p className="typo-body-s text-fg-tertiary">{getAge(item.birth_date)} tahun</p>
      </>
    ),
  },
  { header: "Pekerjaan", cell: (item) => item.occupation || "-" },
  {
    header: "Tanggungan",
    cell: (item) => (
      <Badge variant={item.dependent_status === "Ditanggung" ? "success" : "neutral"}>{item.dependent_status}</Badge>
    ),
  },
];

/** Urutan tampil: suami/istri dulu, lalu anak dari yang tertua. */
function sortFamily(members: FamilyFormItem[]): FamilyFormItem[] {
  return [...members].sort((a, b) => {
    const aIsChild = a.relationship === "Anak";
    const bIsChild = b.relationship === "Anak";
    if (aIsChild !== bIsChild) return aIsChild ? 1 : -1;
    return a.birth_date.localeCompare(b.birth_date);
  });
}

/**
 * Tab DATA BATIH: keluarga inti karyawan (suami/istri dan anak).
 * Tambah / ubah lewat dialog (FamilyMemberDialog), lalu baris masuk ke tabel.
 */
export function FamilyTab({ values, changeValue, errors, disabled }: FormSectionProps) {
  /** Anggota yang sedang dibuka di dialog; null = dialog tertutup. */
  const [editing, setEditing] = useState<{ member: FamilyFormItem; isNew: boolean } | null>(null);

  /** Simpan hasil dialog: ganti baris lama (ubah) atau tambahkan baris baru. */
  function saveMember(saved: FamilyFormItem) {
    const isExisting = values.family_members.some((item) => item.id === saved.id);
    changeValue(
      "family_members",
      isExisting
        ? values.family_members.map((item) => (item.id === saved.id ? saved : item))
        : [...values.family_members, saved],
    );
    setEditing(null);
  }

  function deleteMember(deleted: FamilyFormItem) {
    changeValue("family_members", values.family_members.filter((item) => item.id !== deleted.id));
  }

  return (
    <>
      <ListSection
        description="Isi data suami / istri dan anak karyawan. Kosongkan kalau karyawan belum berkeluarga."
        addLabel="Tambah Anggota Batih"
        emptyText="Belum ada anggota batih."
        items={sortFamily(values.family_members)}
        columns={COLUMNS}
        itemLabel={(item) => item.name}
        onAdd={() => setEditing({ member: emptyFamilyMember(), isNew: true })}
        onEdit={(item) => setEditing({ member: item, isNew: false })}
        onDelete={deleteMember}
        error={errors.family_members}
        disabled={disabled}
      />

      {editing && (
        <FamilyMemberDialog
          key={editing.member.id}
          member={editing.member}
          isNew={editing.isNew}
          onSave={saveMember}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
