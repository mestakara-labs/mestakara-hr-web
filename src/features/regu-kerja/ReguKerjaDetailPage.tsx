"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, Pencil, Users } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@mestakara/ui/card";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import { formatDate, formatDayName } from "@/lib/date";
import { ROTATION_MODE } from "@/lib/schedule-rules";
import type { HolidayResource } from "@/types/api/holiday";
import type { ShiftResource } from "@/types/api/shift";
import type { GroupMemberResource, WorkGroupResource } from "@/types/api/work-group";
import type { WorkPatternResource } from "@/types/api/work-pattern";

import { EndMemberDialog } from "./EndMemberDialog";
import { MembersTable } from "./MembersTable";
import { RotationPreview } from "./RotationPreview";

const LIST_URL = "/dashboard/jadwal/regu";

/**
 * Halaman DETAIL REGU KERJA:
 *
 *   [←] Nama Regu                                              [✎ Edit]
 *   Info regu: lokasi, pola, mode rotasi, Tanggal Mulai Berlaku Jadwal, ketua
 *   Anggota (aktif & riwayat)                        [Kelola Anggota] -> /regu/{id}/anggota
 *   Pratinjau Rotasi 4 Minggu (proyeksi + shift kosong)
 */
export function ReguKerjaDetailPage({ id }: { id: string }) {
  const groupRequest = useApiGet<WorkGroupResource>(`/api/work-groups/${id}`);
  const patterns = useApiGet<WorkPatternResource[]>("/api/work-patterns");
  const shifts = useApiGet<ShiftResource[]>("/api/shifts");
  const holidays = useApiGet<HolidayResource[]>("/api/holidays");
  const requests = [groupRequest, patterns, shifts, holidays];

  const [endingMember, setEndingMember] = useState<GroupMemberResource | null>(null);

  if (requests.some((request) => request.loading)) return <PageLoading label="Memuat data regu kerja..." />;
  const group = groupRequest.data;
  const pattern = patterns.data?.find((item) => item.id === group?.work_pattern.id);
  const failed = requests.find((request) => request.error);
  if (failed || !group || !pattern || !shifts.data || !holidays.data) {
    return <PageError message={failed?.error ?? "Regu kerja tidak ditemukan."} />;
  }

  // Kunci pratinjau: berubah setiap kali anggota berubah, supaya proyeksinya dihitung ulang.
  const previewKey = group.members.map((member) => `${member.id}:${member.end_date}`).join("|");

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" asChild className="shrink-0 rounded-full">
            <Link href={LIST_URL} aria-label="Kembali">
              <ChevronLeft />
            </Link>
          </Button>
          <div>
            <h1 className="typo-h3 text-fg-heading">{group.name}</h1>
            <p className="mt-1 typo-body-m text-fg-secondary">
              {group.sub_unit.name}
              {group.placement_object && ` · ${group.placement_object.name}`} · {group.active_member_count} anggota aktif / akan datang
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`${LIST_URL}/${group.id}/edit`}>
            <Pencil />
            Edit
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Pola Kerja">
              {pattern.name}
              <span className="block typo-body-s font-normal text-fg-tertiary">
                {pattern.slots.length} slot · siklus {pattern.cycle_days} hari
              </span>
            </Info>
            <Info label="Mode Rotasi">
              {group.rotation_mode === ROTATION_MODE.rotating
                ? `Bergilir tiap ${group.rotate_every_days} hari`
                : "Tetap"}
            </Info>
            <Info label="Tanggal Mulai Berlaku Jadwal">
              {formatDate(group.anchor_date)}
              <span className="block typo-body-s font-normal text-fg-tertiary">
                {formatDayName(group.anchor_date)} · Hari ke-1 pola
              </span>
            </Info>
            <Info label="Ketua Regu">{group.leader?.name ?? "-"}</Info>
          </dl>
          {group.description && <p className="mt-4 typo-body-s text-fg-secondary">{group.description}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anggota</CardTitle>
          <CardDescription>
            Slot awal = slot saat bergabung. Untuk mengganti orang: akhiri keanggotaan yang lama, lalu lewat Kelola
            Anggota tambahkan pengganti di slot yang kosong.
          </CardDescription>
          <CardAction>
            <Button size="sm" asChild>
              <Link href={`${LIST_URL}/${group.id}/anggota`}>
                <Users />
                Kelola Anggota
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <MembersTable members={group.members} onEnd={setEndingMember} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pratinjau Rotasi 4 Minggu</CardTitle>
          <CardDescription>Dihitung dari pola, mode rotasi, dan anggota regu. Hari libur ditandai merah.</CardDescription>
        </CardHeader>
        <CardContent>
          <RotationPreview key={previewKey} groupId={group.id} shifts={shifts.data} holidays={holidays.data} />
        </CardContent>
      </Card>

      <EndMemberDialog
        groupId={group.id}
        member={endingMember}
        onClose={() => setEndingMember(null)}
        onSaved={groupRequest.reload}
      />
    </div>
  );
}

/** Satu isian info regu: label kecil di atas, isi di bawah. */
function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="typo-body-s text-fg-tertiary">{label}</dt>
      <dd className="typo-body-m font-medium text-fg-heading">{children}</dd>
    </div>
  );
}
