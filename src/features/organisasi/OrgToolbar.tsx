import { ChevronsDownUp, ChevronsUpDown, ListTree, RotateCcw } from "lucide-react";
import { Button } from "@mestakara/ui/button";

import { formatDate } from "@/lib/date";

interface OrgToolbarProps {
  decreeNumber: string;
  /** Format "YYYY-MM-DD" */
  decreeDate: string;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onReset: () => void;
  /** Membuka daftar jabatan (khusus layar kecil, karena panel kiri disembunyikan). */
  onOpenPositionList: () => void;
}

/** Judul halaman, info SK, dan tombol pengatur tampilan bagan. */
export function OrgToolbar({
  decreeNumber,
  decreeDate,
  onExpandAll,
  onCollapseAll,
  onReset,
  onOpenPositionList,
}: OrgToolbarProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="typo-h3 text-fg-heading">Struktur Organisasi Unit Agrowisata</h1>
        <p className="typo-body-s text-fg-secondary">
          {/* SK struktur organisasi bisa belum ada (mis. database backend masih kosong). */}
          {decreeNumber
            ? `Berdasarkan SK No. ${decreeNumber}${decreeDate ? ` · ${formatDate(decreeDate)}` : ""}`
            : "SK struktur organisasi belum diisi."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Panel daftar jabatan hanya tampil otomatis di layar lebar */}
        <Button variant="outline" size="sm" onClick={onOpenPositionList} className="lg:hidden">
          <ListTree />
          Daftar Jabatan
        </Button>
        <Button variant="outline" size="sm" onClick={onExpandAll}>
          <ChevronsUpDown />
          Buka Semua
        </Button>
        <Button variant="outline" size="sm" onClick={onCollapseAll}>
          <ChevronsDownUp />
          Tutup Semua
        </Button>
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw />
          Atur Ulang
        </Button>
      </div>
    </div>
  );
}
