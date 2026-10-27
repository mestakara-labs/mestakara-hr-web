"use client";

import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";
import { FieldGroup } from "@mestakara/ui/field";
import { Spinner } from "@mestakara/ui/spinner";

interface FormPageLayoutProps {
  title: string;
  description?: string;
  /** Tujuan tombol kembali (panah) dan tombol Batal */
  backHref: string;
  /** Pesan error yang tidak menempel ke isian mana pun (dari `useFormSubmit`) */
  formError: string | null;
  /** true selama data dikirim ke server */
  saving: boolean;
  /** Tulisan tombol simpan, mis. "Simpan Bidang" */
  submitLabel: string;
  onSubmit: () => void;
  /** Tombol tambahan di antara Batal dan Simpan, mis. "Simpan sebagai Draf" (opsional) */
  extraActions?: ReactNode;
  /** Isian form: susun dengan <Field> dari @mestakara/ui/field */
  children: ReactNode;
}

/**
 * Kerangka halaman form tambah / ubah data:
 *
 *   [<]  Tambah Bidang                 judul + tombol kembali
 *        Lengkapi data bidang ...
 *   ┌──────────────────────────────┐
 *   │ (pesan error dari server)    │
 *   │ isian form (children)        │
 *   └──────────────────────────────┘
 *                   [Batal] (tombol tambahan) [Simpan]
 */
export function FormPageLayout({
  title,
  description,
  backHref,
  formError,
  saving,
  submitLabel,
  onSubmit,
  extraActions,
  children,
}: FormPageLayoutProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Judul + tombol kembali */}
      <div className="flex items-start gap-3">
        <Button variant="outline" size="icon" asChild className="shrink-0 rounded-full">
          <Link href={backHref} aria-label="Kembali">
            <ChevronLeft />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="typo-h3 text-fg-heading">{title}</h1>
          {description && <p className="mt-1 typo-body-m text-fg-secondary">{description}</p>}
        </div>
      </div>

      {/* noValidate: pengecekan lewat `validate` di useFormSubmit supaya pesannya seragam */}
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Card>
          <CardContent className="flex flex-col gap-5">
            {formError && (
              <Alert variant="danger">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <FieldGroup>{children}</FieldGroup>
          </CardContent>
        </Card>

        {/* Di HP tombolnya selebar layar, tombol Simpan paling atas */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="lg" asChild>
            <Link href={backHref}>Batal</Link>
          </Button>
          {extraActions}
          <Button type="submit" size="lg" disabled={saving}>
            {saving && <Spinner />}
            {saving ? "Menyimpan..." : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
