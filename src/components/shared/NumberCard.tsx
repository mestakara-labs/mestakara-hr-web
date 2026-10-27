import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@mestakara/ui/card";

interface NumberCardProps {
  title: string;
  icon: LucideIcon;
  value: ReactNode;
  /** Keterangan kecil di bawah angka, mis. "34% dari total karyawan" (boleh berisi badge) */
  note: ReactNode;
  /** true = isinya teks (mis. nama jabatan), jadi hurufnya lebih kecil dari angka besar */
  textValue?: boolean;
}

/**
 * Kartu statistik berisi satu angka besar:
 *
 *   ┌ Total Karyawan        (ikon) ┐
 *   │ 210                          │
 *   │ Rasio L : P = 1,5 : 1        │
 *   └──────────────────────────────┘
 *
 * Dengan `textValue`, isinya boleh teks (mis. "54 tahun 11 bulan") dengan huruf lebih kecil.
 */
export function NumberCard({ title, icon: Icon, value, note, textValue = false }: NumberCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <span className="flex size-10 items-center justify-center rounded-full bg-brand-subtle text-fg-brand">
            <Icon className="size-5" />
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className={textValue ? "typo-h3 text-fg-brand" : "typo-display-m text-fg-brand"}>{value}</div>
        <div className="typo-body-s text-fg-secondary">{note}</div>
      </CardContent>
    </Card>
  );
}
