"use client";

import type { FormEvent, ReactNode } from "react";
import { Button } from "@mestakara/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mestakara/ui/dialog";
import { FieldGroup } from "@mestakara/ui/field";

import { SEARCH_SELECT_LIST } from "./SearchSelect";

interface FormDialogProps {
  open: boolean;
  title: string;
  description: string;
  /** Tulisan tombol simpan, mis. "Simpan Pendidikan" */
  saveLabel: string;
  /** Dipanggil saat tombol simpan diklik (atau Enter ditekan) */
  onSave: () => void;
  onClose: () => void;
  /** Isian form: susun dengan TextField, SelectField, dst. */
  children: ReactNode;
}

/**
 * Dialog berisi form kecil, mis. "Tambah Pendidikan":
 *
 *   ┌ Tambah Pendidikan ─────────────── × ┐
 *   │ isian form (children)               │
 *   │                     [Batal] [Simpan] │
 *   └─────────────────────────────────────┘
 */
export function FormDialog({ open, title, description, saveLabel, onSave, onClose, children }: FormDialogProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // PENTING: dialog ini berada di dalam form karyawan. Tanpa baris ini, menekan
    // "Simpan" di dialog juga ikut mengirim form karyawan.
    event.stopPropagation();
    onSave();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        // Dialog berisi form hanya ditutup lewat tombol Batal / × / Escape, BUKAN karena
        // klik atau fokus di luar kotaknya — supaya isian tidak hilang tak sengaja, dan
        // supaya daftar pilihan isian yang bisa dicari (yang tampil di luar kotak dialog) bisa dipakai.
        onInteractOutside={(event) => event.preventDefault()}
        // Escape saat daftar pilihan sedang terbuka cukup menutup daftarnya, bukan dialognya.
        onEscapeKeyDown={(event) => {
          if (document.querySelector(SEARCH_SELECT_LIST)) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>{children}</FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit">{saveLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
