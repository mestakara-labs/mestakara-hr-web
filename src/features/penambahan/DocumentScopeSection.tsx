"use client";

import { RadioGroup, RadioGroupItem } from "@mestakara/ui/radio-group";
import { cn } from "cn";

import type { SearchOption } from "@/components/shared/SearchSelect";
import { DOCUMENT_SCOPE } from "@/lib/activation-rules";

import { StatusDocumentFields, type StatusDocumentFormValues } from "./StatusDocumentFields";

/** Pilihan cara dokumen: satu untuk semua, atau per karyawan. */
const SCOPE_OPTIONS = [
  { value: DOCUMENT_SCOPE.collective, title: "Kolektif", description: "Satu dokumen untuk semua karyawan di usulan ini." },
  { value: DOCUMENT_SCOPE.perPerson, title: "Per Orang", description: "Setiap karyawan punya dokumennya sendiri." },
];

/** Satu karyawan + dokumen per orangnya. */
type DocumentItem = StatusDocumentFormValues & { id: string };

interface DocumentScopeSectionProps<T extends DocumentItem> {
  /** "Kolektif" atau "Per Orang" */
  scope: string;
  onScopeChange: (scope: string) => void;
  /** Dokumen kolektif */
  collective: StatusDocumentFormValues;
  onCollectiveChange: (document: StatusDocumentFormValues) => void;
  /** Dokumen per orang (isian item) */
  items: T[];
  onItemChange: (itemId: string, document: StatusDocumentFormValues) => void;
  /** Nama karyawan satu item, untuk judul kotak dokumen per orang */
  labelOf: (item: T) => string;
  /** Pesan error: "document_number" (kolektif) atau "items.<id>.document_number" (per orang) */
  errors: Record<string, string>;
  /** Dokumen wajib (Penonaktifan). Bawaan: opsional (Penambahan). */
  required?: boolean;
  disabled: boolean;
  signerOptions: SearchOption[];
}

/**
 * DOKUMEN DASAR USULAN (Penambahan & Penonaktifan):
 *
 *   ○ Kolektif  ○ Per Orang
 *   Kolektif  : satu isian dokumen
 *   Per Orang : satu isian dokumen untuk setiap karyawan
 */
export function DocumentScopeSection<T extends DocumentItem>({
  scope,
  onScopeChange,
  collective,
  onCollectiveChange,
  items,
  onItemChange,
  labelOf,
  errors,
  required = false,
  disabled,
  signerOptions,
}: DocumentScopeSectionProps<T>) {
  /** Error satu item tanpa awalan "items.<id>.", mis. { document_number: "..." } */
  const errorsOf = (itemId: string) => {
    const prefix = `items.${itemId}.`;
    return Object.fromEntries(
      Object.entries(errors)
        .filter(([field]) => field.startsWith(prefix))
        .map(([field, message]) => [field.slice(prefix.length), message]),
    );
  };

  return (
    <>
      <RadioGroup value={scope} onValueChange={onScopeChange} disabled={disabled} className="grid gap-3 sm:grid-cols-2">
        {SCOPE_OPTIONS.map((option) => (
          <label
            key={option.value}
            htmlFor={`scope-${option.value}`}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
              scope === option.value ? "border-primary bg-brand-subtle" : "border-border hover:bg-subtle",
            )}
          >
            <RadioGroupItem id={`scope-${option.value}`} value={option.value} className="mt-0.5" />
            <span>
              <span className="block typo-label-m text-fg-heading">{option.title}</span>
              <span className="block typo-body-s text-fg-secondary">{option.description}</span>
            </span>
          </label>
        ))}
      </RadioGroup>

      {scope === DOCUMENT_SCOPE.collective ? (
        <StatusDocumentFields
          idPrefix="kolektif"
          values={collective}
          onChange={onCollectiveChange}
          errors={errors}
          required={required}
          disabled={disabled}
          signerOptions={signerOptions}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-lg border border-border p-4">
              <p className="typo-label-m text-fg-heading">{labelOf(item)}</p>
              <StatusDocumentFields
                idPrefix={item.id}
                values={item}
                onChange={(document) => onItemChange(item.id, document)}
                errors={errorsOf(item.id)}
                required={required}
                disabled={disabled}
                signerOptions={signerOptions}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
