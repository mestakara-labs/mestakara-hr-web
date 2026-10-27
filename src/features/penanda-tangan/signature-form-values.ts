/**
 * ISIAN EDITOR PENANDA TANGAN: bentuk form, cara mengisinya dari data server, cara mengubahnya
 * menjadi data kirim, dan pemeriksaannya.
 *
 * Dipisah dari file tampilan (SignatureSectionsEditor.tsx) supaya file tampilan tetap pendek.
 */
import type { SignatureSection, SignerPayload, SignerResource, SignerSource } from "@/types/api/signature";

/** Satu orang di form. `key` hanya untuk React (urutan bisa berubah). */
export interface SignerForm {
  key: string;
  source: SignerSource;
  /** Diisi kalau source "karyawan" */
  employee_id: string;
  /** Diisi kalau source "manual" */
  name: string;
  position: string;
}

/** Satu bagian di form. */
export interface SectionForm {
  key: string;
  label: string;
  signers: SignerForm[];
}

/** Kunci unik sederhana untuk baris baru. */
function newKey(): string {
  return crypto.randomUUID();
}

/** Orang baru: bawaan dipilih dari daftar karyawan. */
export function newSigner(): SignerForm {
  return { key: newKey(), source: "karyawan", employee_id: "", name: "", position: "" };
}

/** Bagian baru berisi satu orang kosong. */
export function newSection(label = ""): SectionForm {
  return { key: newKey(), label, signers: [newSigner()] };
}

/** Data server -> isian form. */
export function toSectionsForm(sections: SignatureSection<SignerResource>[]): SectionForm[] {
  return sections.map((section) => ({
    key: newKey(),
    label: section.label,
    signers: section.signers.map((signer) => ({
      key: newKey(),
      source: signer.source,
      employee_id: signer.employee_id ?? "",
      // Nama & jabatan karyawan selalu dari data karyawan, jadi tidak disimpan di form.
      name: signer.source === "manual" ? signer.name : "",
      position: signer.source === "manual" ? signer.position : "",
    })),
  }));
}

/** Isian form -> data yang dikirim ke server. */
export function toSectionsPayload(sections: SectionForm[]): SignatureSection<SignerPayload>[] {
  return sections.map((section) => ({
    label: section.label.trim(),
    signers: section.signers.map((signer): SignerPayload =>
      signer.source === "karyawan"
        ? { source: "karyawan", employee_id: signer.employee_id }
        : { source: "manual", name: signer.name.trim(), position: signer.position.trim() },
    ),
  }));
}

/**
 * Periksa satu susunan. Hasilnya pesan pertama yang ditemukan (undefined = benar), mis.
 * "Bagian 2: pilih karyawan untuk orang ke-1".
 */
export function checkSections(sections: SectionForm[]): string | undefined {
  if (sections.length === 0) return "Tambahkan minimal satu bagian tanda tangan";

  for (const [index, section] of sections.entries()) {
    const prefix = `Bagian ${index + 1}`;
    if (!section.label.trim()) return `${prefix}: nama bagian wajib diisi`;
    if (section.signers.length === 0) return `${prefix}: tambahkan minimal satu orang`;

    for (const [order, signer] of section.signers.entries()) {
      const who = `orang ke-${order + 1}`;
      if (signer.source === "karyawan" && !signer.employee_id) return `${prefix}: pilih karyawan untuk ${who}`;
      if (signer.source === "manual" && (!signer.name.trim() || !signer.position.trim())) {
        return `${prefix}: nama dan jabatan ${who} wajib diisi`;
      }
    }
  }

  return undefined;
}
