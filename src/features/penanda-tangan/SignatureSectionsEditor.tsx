"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Field, FieldLabel } from "@mestakara/ui/field";
import { Input } from "@mestakara/ui/input";
import { NativeSelect, NativeSelectOption } from "@mestakara/ui/native-select";

import { SearchSelect, type SearchOption } from "@/components/shared/SearchSelect";
import { SECTION_LABEL_EXAMPLES } from "@/lib/signature-rules";
import type { SignerSource } from "@/types/api/signature";

import { newSection, newSigner, type SectionForm, type SignerForm } from "./signature-form-values";

interface SignatureSectionsEditorProps {
  /** Awalan id isian supaya unik, mis. "payroll" atau "spkl" */
  idPrefix: string;
  sections: SectionForm[];
  onChange: (sections: SectionForm[]) => void;
  /** Pesan kesalahan susunan ini (dari checkSections) */
  error?: string;
  disabled: boolean;
  /** Calon penanda tangan dari daftar karyawan (lihat useSignerEmployees) */
  employeeOptions: SearchOption[];
  /** Jabatan karyawan terpilih, untuk ditampilkan (tidak bisa diubah) */
  positionOf: (employeeId: string) => string;
}

/**
 * EDITOR SUSUNAN PENANDA TANGAN (dipakai halaman Umum, per Kelompok, per Bidang):
 *
 *   ┌ Nama Bagian 1 [Dibuat Oleh            ]                        [↑][↓][🗑] ┐
 *   │ 1. [Karyawan ▾] [Cari karyawan...      ]  Jabatan: Admin Personalia  [🗑] │
 *   │ 2. [Manual   ▾] Nama [..........] Jabatan [..........]               [🗑] │
 *   │ [+ Tambah Orang]                                                          │
 *   └───────────────────────────────────────────────────────────────────────────┘
 *   [+ Tambah Bagian]
 *
 * Urutan bagian di sini = urutan blok tanda tangan di dokumen (kiri ke kanan).
 */
export function SignatureSectionsEditor({
  idPrefix,
  sections,
  onChange,
  error,
  disabled,
  employeeOptions,
  positionOf,
}: SignatureSectionsEditorProps) {
  /** Ubah satu bagian. */
  function changeSection(sectionKey: string, patch: Partial<SectionForm>) {
    onChange(sections.map((section) => (section.key === sectionKey ? { ...section, ...patch } : section)));
  }

  /** Ubah satu orang di satu bagian. */
  function changeSigner(section: SectionForm, signerKey: string, patch: Partial<SignerForm>) {
    changeSection(section.key, {
      signers: section.signers.map((signer) => (signer.key === signerKey ? { ...signer, ...patch } : signer)),
    });
  }

  /** Geser bagian ke atas (-1) atau ke bawah (+1). */
  function moveSection(index: number, step: -1 | 1) {
    const next = [...sections];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section, index) => (
        <div key={section.key} className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div className="flex items-end gap-2">
            <Field className="flex-1">
              <FieldLabel htmlFor={`${idPrefix}-section-${section.key}`}>Nama Bagian {index + 1}</FieldLabel>
              <Input
                id={`${idPrefix}-section-${section.key}`}
                value={section.label}
                onChange={(event) => changeSection(section.key, { label: event.target.value })}
                placeholder={`Cth. ${SECTION_LABEL_EXAMPLES[index % SECTION_LABEL_EXAMPLES.length]}`}
                disabled={disabled}
              />
            </Field>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Geser bagian ke atas"
              onClick={() => moveSection(index, -1)}
              disabled={disabled || index === 0}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Geser bagian ke bawah"
              onClick={() => moveSection(index, 1)}
              disabled={disabled || index === sections.length - 1}
            >
              <ArrowDown />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Hapus bagian ${index + 1}`}
              onClick={() => onChange(sections.filter((item) => item.key !== section.key))}
              disabled={disabled}
            >
              <Trash2 />
            </Button>
          </div>

          {section.signers.map((signer, order) => (
            <div key={signer.key} className="grid items-start gap-2 md:grid-cols-[1.5rem_9rem_1fr_auto]">
              <span className="pt-2 typo-body-s text-fg-tertiary">{order + 1}.</span>
              <NativeSelect
                aria-label={`Asal orang ke-${order + 1}`}
                value={signer.source}
                onChange={(event) => changeSigner(section, signer.key, { source: event.target.value as SignerSource })}
                disabled={disabled}
              >
                <NativeSelectOption value="karyawan">Karyawan</NativeSelectOption>
                <NativeSelectOption value="manual">Manual</NativeSelectOption>
              </NativeSelect>

              {signer.source === "karyawan" ? (
                <div className="flex flex-col gap-1">
                  <SearchSelect
                    id={`${idPrefix}-signer-${signer.key}`}
                    options={employeeOptions}
                    value={signer.employee_id}
                    onChange={(value) => changeSigner(section, signer.key, { employee_id: value })}
                    disabled={disabled}
                    placeholder="Cari nama / no. reg..."
                    emptyMessage="Karyawan tidak ditemukan."
                  />
                  {signer.employee_id && (
                    <p className="typo-body-s text-fg-tertiary">Jabatan: {positionOf(signer.employee_id)} (mengikuti data karyawan)</p>
                  )}
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    aria-label={`Nama orang ke-${order + 1}`}
                    value={signer.name}
                    onChange={(event) => changeSigner(section, signer.key, { name: event.target.value })}
                    placeholder="Nama lengkap"
                    disabled={disabled}
                  />
                  <Input
                    aria-label={`Jabatan orang ke-${order + 1}`}
                    value={signer.position}
                    onChange={(event) => changeSigner(section, signer.key, { position: event.target.value })}
                    placeholder="Jabatan, mis. Admin I Umum"
                    disabled={disabled}
                  />
                </div>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Hapus orang ke-${order + 1}`}
                onClick={() => changeSection(section.key, { signers: section.signers.filter((item) => item.key !== signer.key) })}
                disabled={disabled || section.signers.length === 1}
              >
                <Trash2 />
              </Button>
            </div>
          ))}

          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => changeSection(section.key, { signers: [...section.signers, newSigner()] })}
              disabled={disabled}
            >
              <Plus />
              Tambah Orang
            </Button>
          </div>
        </div>
      ))}

      <div>
        <Button type="button" variant="outline" onClick={() => onChange([...sections, newSection()])} disabled={disabled}>
          <Plus />
          Tambah Bagian
        </Button>
      </div>
      {error && <p className="typo-body-s text-fg-danger">{error}</p>}
    </div>
  );
}
