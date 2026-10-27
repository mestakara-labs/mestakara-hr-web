"use client";

import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
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
import { Spinner } from "@mestakara/ui/spinner";

interface ConfirmDeleteDialogProps {
  /** Dialog terbuka kalau true */
  open: boolean;
  /** Judul, mis. 'Hapus bidang "Operasional"?' */
  title: string;
  /** Penjelasan; boleh berisi teks tebal */
  description?: ReactNode;
  /** true selama permintaan hapus berjalan */
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Dialog "Yakin mau menghapus?" sebelum data dihapus.
 * Dipakai bersama hook `useDeleteConfirm` (lihat src/hooks/useDeleteConfirm.ts).
 */
export function ConfirmDeleteDialog({
  open,
  title,
  description = "Data yang sudah dihapus tidak bisa dikembalikan.",
  deleting,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={(event) => {
              // Jangan langsung tutup dialog; tunggu sampai server selesai menghapus.
              event.preventDefault();
              onConfirm();
            }}
          >
            {deleting && <Spinner />}
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
