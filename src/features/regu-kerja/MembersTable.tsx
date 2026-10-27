"use client";

import { UserMinus } from "lucide-react";
import { Badge } from "@mestakara/ui/badge";
import { Button } from "@mestakara/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import { formatDate } from "@/lib/date";
import type { GroupMemberResource } from "@/types/api/work-group";

/** Warna badge status keanggotaan. */
const PERIOD_BADGE = { Aktif: "success", "Akan Datang": "info", Selesai: "neutral" } as const;

interface MembersTableProps {
  members: GroupMemberResource[];
  onEnd: (member: GroupMemberResource) => void;
}

/**
 * Tabel ANGGOTA REGU (aktif di atas, lalu riwayat):
 *
 *   Karyawan | Slot Awal | Slot Hari Ini | Bergabung | Sampai | Status | [Akhiri]
 *
 * Tombol [Akhiri] ada selama keanggotaan BELUM selesai (Aktif / Akan Datang), termasuk anggota
 * yang sudah punya tanggal akhir di masa depan (tanggalnya bisa diubah, mis. keluar lebih cepat).
 */
export function MembersTable({ members, onEnd }: MembersTableProps) {
  if (members.length === 0) {
    return <p className="py-6 text-center typo-body-s text-fg-tertiary">Belum ada anggota. Klik &ldquo;Kelola Anggota&rdquo;.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table className="min-w-200">
        <TableHeader>
          <TableRow>
            <TableHead>Karyawan</TableHead>
            <TableHead>Slot Awal</TableHead>
            <TableHead>Slot Hari Ini</TableHead>
            <TableHead>Bergabung</TableHead>
            <TableHead>Sampai</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-16">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <p className="font-medium text-fg-heading">{member.employee.name}</p>
                <p className="typo-body-s text-fg-tertiary">NIK {member.employee.nik ?? "-"}</p>
              </TableCell>
              <TableCell className="text-fg-secondary">
                <strong className="text-fg-heading">{member.start_slot.code}</strong> {member.start_slot.name}
              </TableCell>
              <TableCell>
                {member.current_slot_code ? (
                  <Badge variant="info" dot={false}>
                    {member.current_slot_code}
                  </Badge>
                ) : (
                  <span className="text-fg-tertiary">-</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-fg-secondary">{formatDate(member.start_date)}</TableCell>
              <TableCell className="whitespace-nowrap text-fg-secondary">
                {member.end_date ? formatDate(member.end_date) : "sekarang"}
              </TableCell>
              <TableCell>
                <Badge variant={PERIOD_BADGE[member.period]}>{member.period}</Badge>
              </TableCell>
              <TableCell>
                {member.period !== "Selesai" && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEnd(member)}
                    title={member.end_date ? "Ubah tanggal terakhir keanggotaan" : "Akhiri keanggotaan"}
                    aria-label={`${member.end_date ? "Ubah tanggal terakhir" : "Akhiri keanggotaan"} ${member.employee.name}`}
                  >
                    <UserMinus />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
