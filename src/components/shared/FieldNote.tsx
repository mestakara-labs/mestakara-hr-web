import type { ReactNode } from "react";
import { FieldDescription } from "@mestakara/ui/field";

/**
 * Catatan kecil di bawah isian form, selalu diawali "Catatan:".
 *
 *   <FieldNote>Kode tidak boleh sama dengan bidang lain.</FieldNote>
 *   -> "Catatan: Kode tidak boleh sama dengan bidang lain."  (huruf ukuran xs)
 */
export function FieldNote({ children }: { children: ReactNode }) {
  return <FieldDescription className="text-xs">Catatan: {children}</FieldDescription>;
}
