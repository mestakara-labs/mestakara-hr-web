/** Satu baris di daftar statistik, mis. { label: "BRM-3", count: 21, color: "..." } */
export interface StatItem {
  label: string;
  count: number;
  /** Warna batang. Kosong = warna utama tema. */
  color?: string;
}

interface StatBarListProps {
  items: StatItem[];
  /** Tampilkan juga persentase dari total semua baris, mis. "21 (15%)" */
  showPercentage?: boolean;
}

/**
 * Daftar "nama — batang — jumlah" untuk kartu statistik:
 *
 *   ● BRM-3    ▇▇▇▇▇▇▇▇▇▇▇▇            21
 *   ● BRM-4    ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇    34
 *
 * Panjang batang dibandingkan dengan jumlah TERBESAR di daftar itu.
 *
 * Dipakai kartu statistik di halaman Jabatan dan Data Karyawan.
 *
 * Daftarnya berupa satu grid 3 kolom (nama | batang | jumlah). Setiap <li> memakai
 * `contents`, jadi isinya ikut kolom grid induk dan semua batang mulai di garis yang sama.
 */
export function StatBarList({ items, showPercentage = false }: StatBarListProps) {
  const largestCount = Math.max(...items.map((item) => item.count), 1);
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <ul className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="contents">
          <span className="flex max-w-44 min-w-0 items-center gap-2 typo-body-s text-fg-primary">
            {item.color && (
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            )}
            <span className="truncate" title={item.label}>
              {item.label}
            </span>
          </span>

          {/* Batang: wadah abu-abu + isi berwarna selebar persentasenya */}
          <span className="h-2 overflow-hidden rounded-full bg-subtle">
            <span
              className="block h-full rounded-full bg-primary"
              style={{
                width: `${(item.count / largestCount) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </span>

          <span className="text-right typo-label-m whitespace-nowrap tabular-nums text-fg-heading">
            {item.count}
            {showPercentage && (
              <span className="ml-1 typo-body-s text-fg-tertiary">({toPercent(item.count, totalCount)})</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** 21 dari 135 -> "16%". */
function toPercent(count: number, total: number): string {
  return total === 0 ? "0%" : `${Math.round((count / total) * 100)}%`;
}
