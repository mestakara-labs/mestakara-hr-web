import { Badge } from "@mestakara/ui/badge";

import { readableTextColor } from "@/lib/color";
import { formatShiftTime } from "@/lib/shift-rules";

interface ShiftBadgeProps {
  shift: { code: string; name: string; start_time: string; end_time: string; color: string };
  /** true = tampilkan nama juga, mis. "[P] Pagi"; false = kode saja, mis. "[P]" (untuk kalender) */
  showName?: boolean;
}

/**
 * Penanda shift berwarna, mis. [P] untuk Pagi. Arahkan kursor untuk melihat nama dan jamnya.
 * Latar = warna shift (HEX); warna teks dipilih otomatis (hitam/putih) supaya kodenya tetap terbaca.
 * Dipakai di tabel shift, editor pola kerja, dan kalender jadwal.
 */
export function ShiftBadge({ shift, showName = false }: ShiftBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <Badge
        variant="outline"
        dot={false}
        title={`${shift.name} · ${formatShiftTime(shift.start_time, shift.end_time)}`}
        style={{ backgroundColor: shift.color, borderColor: shift.color, color: readableTextColor(shift.color) }}
      >
        {shift.code}
      </Badge>
      {showName && <span className="font-medium text-fg-heading">{shift.name}</span>}
    </span>
  );
}
