import { Badge } from "@mestakara/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { formatDate, getAge } from "@/lib/date";
import type { FamilyMemberItem } from "@/types/api/employee";

import { EmptyText } from "./DetailParts";

/**
 * Tab DATA BATIH di detail karyawan (hanya lihat; ubahnya lewat form Edit):
 *
 *   Hubungan | Nama & No. KTP | Jenis Kelamin | Tempat, Tgl Lahir (usia) | Pekerjaan | Tanggungan
 */
export function FamilyHistoryTab({ members }: { members: FamilyMemberItem[] }) {
  if (members.length === 0) return <EmptyText>Belum ada data batih.</EmptyText>;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table className="min-w-200">
        <TableHeader>
          <TableRow>
            <TableHead>Hubungan</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Jenis Kelamin</TableHead>
            <TableHead>Tempat, Tanggal Lahir</TableHead>
            <TableHead>Pekerjaan</TableHead>
            <TableHead>Tanggungan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <Badge variant="neutral" dot={false}>
                  {member.relationship}
                </Badge>
              </TableCell>
              <TableCell>
                <p className="font-medium text-fg-heading">{member.name}</p>
                <p className="typo-body-s text-fg-tertiary">KTP {member.ktp_number ?? "-"}</p>
              </TableCell>
              <TableCell className="text-fg-secondary">{member.gender}</TableCell>
              <TableCell>
                <p className="text-fg-primary">
                  {member.birth_place ? `${member.birth_place}, ` : ""}
                  {formatDate(member.birth_date)}
                </p>
                <p className="typo-body-s text-fg-tertiary">{getAge(member.birth_date)} tahun</p>
              </TableCell>
              <TableCell className="text-fg-secondary">{member.occupation ?? "-"}</TableCell>
              <TableCell>
                <Badge variant={member.dependent_status === "Ditanggung" ? "success" : "neutral"}>
                  {member.dependent_status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
