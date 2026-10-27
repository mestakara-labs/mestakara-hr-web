"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@mestakara/ui/alert-dialog";
import { cn } from "cn";

interface ConfirmDialogProps {
  open: boolean;
  /** Ikon di atas judul, mis. TriangleAlert untuk peringatan */
  icon: LucideIcon;
  /** "warning" = kuning (peringatan), "info" = hijau (konfirmasi biasa) */
  tone: "warning" | "info";
  title: string;
  /** Penjelasan; boleh berisi daftar atau teks tebal */
  description: ReactNode;
  /** Tulisan tombol lanjut, mis. "Ya, Simpan" */
  confirmLabel: string;
  /** Tulisan tombol batal, mis. "Periksa Lagi" */
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Pop-up "yakin mau lanjut?" sebelum sebuah aksi dijalankan, mis. sebelum
 * menyimpan data. Untuk konfirmasi HAPUS, pakai ConfirmDeleteDialog.
 *
 * @example
 * <ConfirmDialog
 *   open={isOpen}
 *   icon={CircleHelp}
 *   tone="info"
 *   title="Simpan data karyawan?"
 *   description="Pastikan data di atas sudah benar."
 *   confirmLabel="Ya, Simpan"
 *   cancelLabel="Periksa Lagi"
 *   onConfirm={simpan}
 *   onCancel={() => setIsOpen(false)}
 * />
 */
export function ConfirmDialog({
  open,
  icon: Icon,
  tone,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia
            className={cn(tone === "warning" ? "bg-warning-subtle text-fg-warning" : "bg-brand-subtle text-fg-brand")}
          >
            <Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              // Jangan biarkan dialog menutup sendiri (itu akan memanggil onCancel).
              // Yang menentukan dialog berikutnya adalah onConfirm.
              event.preventDefault();
              onConfirm();
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
