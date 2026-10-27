import { ArrowRight } from "lucide-react";
import { Badge } from "@mestakara/ui/badge";

import type { TransferPersonRef, TransferSupervisorChange } from "@/types/api/transfer";

interface SupervisorChangeListProps {
  changes: TransferSupervisorChange[];
  /** Tulisan kalau tidak ada perubahan atasan */
  emptyText: string;
}

/**
 * Daftar PERUBAHAN ATASAN OTOMATIS karena usulan mutasi:
 *
 *   Ujang Firmansyah (Penanggung Jawab Wahana)
 *   Iwan Suryani (Pengawas Pelayanan I)  →  Iwan Lestari (Pengawas Pelayanan I) [baru]
 *   Atasan dimutasi, dialihkan ke pemegang baru jabatan tersebut
 */
export function SupervisorChangeList({ changes, emptyText }: SupervisorChangeListProps) {
  if (changes.length === 0) return <p className="typo-body-s text-fg-tertiary">{emptyText}</p>;

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {changes.map((change) => (
        <li key={change.assignment_id} className="flex flex-col gap-1 px-3 py-2 typo-body-s">
          <p className="font-medium text-fg-heading">
            {change.employee_name} <span className="font-normal text-fg-tertiary">({change.position_title})</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 text-fg-primary">
            <PersonNames people={change.from} />
            <ArrowRight className="size-4 shrink-0 text-fg-tertiary" aria-label="menjadi" />
            <PersonNames people={change.to} />
          </div>
          <p className="text-fg-tertiary">{change.reason}</p>
        </li>
      ))}
    </ul>
  );
}

/** "Nama (Jabatan)" untuk satu atau beberapa atasan; penugasan baru diberi tanda "baru". */
function PersonNames({ people }: { people: TransferPersonRef[] }) {
  if (people.length === 0) return <span className="text-fg-tertiary">Tanpa atasan</span>;

  return (
    <span className="flex flex-wrap items-center gap-1">
      {people.map((person, index) => (
        <span key={`${person.name}-${index}`} className="inline-flex items-center gap-1">
          {person.name} <span className="text-fg-tertiary">({person.position_title})</span>
          {person.is_new && (
            <Badge variant="info" dot={false}>
              baru
            </Badge>
          )}
          {index < people.length - 1 && ","}
        </span>
      ))}
    </span>
  );
}
