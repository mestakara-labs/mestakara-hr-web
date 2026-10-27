"use client";

import type { ReactNode } from "react";
import { Mail, Phone } from "lucide-react";
import { Avatar, AvatarFallback } from "@mestakara/ui/avatar";
import { Button } from "@mestakara/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@mestakara/ui/sheet";

import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { DEFINITIVE_STATUS, getAssignmentStatusLabel } from "@/lib/assignment-rules";
import { emailLink, phoneLink, whatsAppLink } from "@/lib/contact-links";
import { getInitials } from "@/lib/initials";
import type { EmployeeResource, PositionResource } from "@/types/api/organization";

import { getBrmLevel } from "./brm-level";
import { buildPeople, type PersonWithPosition } from "./org-tree";

/** Pegawai yang sedang dibuka detailnya, beserta jabatannya. */
export interface SelectedEmployee {
  employee: EmployeeResource;
  position: PositionResource;
}

interface EmployeeDetailSheetProps {
  /** null = panel tertutup */
  selected: SelectedEmployee | null;
  /** Semua jabatan, untuk mencari nama atasan dan bawahan. */
  positions: PositionResource[];
  onClose: () => void;
}

/**
 * Panel samping berisi detail pegawai:
 * 1. Nama, jabatan, dan tombol Telepon / Email / WhatsApp
 * 2. Data pegawai (NIK, email, telepon)
 * 3. Data jabatan (status, bidang, sub unit, level BRM, atasan, bawahan, rekan sejabatan)
 */
export function EmployeeDetailSheet({ selected, positions, onClose }: EmployeeDetailSheetProps) {
  return (
    <Sheet open={selected !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {selected && <EmployeeDetail selected={selected} positions={positions} />}
      </SheetContent>
    </Sheet>
  );
}

function EmployeeDetail({ selected, positions }: { selected: SelectedEmployee; positions: PositionResource[] }) {
  const { employee, position } = selected;
  const brmLevel = getBrmLevel(position.brm_level);

  // Atasan & bawahan dihitung per ORANG, mis. "Siti Saepudin (Manager)".
  const people = buildPeople(positions);
  const describe = (person: PersonWithPosition) => `${person.employee.name} (${person.position.title})`;

  const supervisors = people
    .filter((person) => employee.supervisor_assignment_ids.includes(person.employee.assignment_id))
    .map(describe);
  const subordinates = people
    .filter((person) => person.employee.supervisor_assignment_ids.includes(employee.assignment_id))
    .map(describe);
  const colleagues = position.employees.filter((item) => item.assignment_id !== employee.assignment_id);
  // Status selain Definitif ditulis di depan nama jabatan, mis. "Plt Asisten Umum".
  const positionTitle = withStatus(employee.assignment_status, position.title);

  return (
    <>
      {/* 1. Nama, jabatan, tombol kontak */}
      <SheetHeader>
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <SheetTitle>{employee.name}</SheetTitle>
            <SheetDescription>{positionTitle}</SheetDescription>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={phoneLink(employee.phone)}>
              <Phone />
              Telepon
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={emailLink(employee.email)}>
              <Mail />
              Email
            </a>
          </Button>
          <Button size="sm" asChild>
            <a href={whatsAppLink(employee.whatsapp)} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="size-4" />
              WhatsApp
            </a>
          </Button>
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-6 px-4 pb-6">
        {/* 2. Data pegawai */}
        <DetailSection title="Data Pegawai">
          <DetailRow label="NIK" value={employee.nik} />
          <DetailRow label="Email" value={employee.email} />
          <DetailRow label="Telepon" value={employee.phone} />
          <DetailRow label="WhatsApp" value={employee.whatsapp} />
        </DetailSection>

        {/* 3. Data jabatan */}
        <DetailSection title="Jabatan">
          <DetailRow label="Jabatan" value={position.title} />
          <DetailRow label="Status Jabatan" value={getAssignmentStatusLabel(employee.assignment_status)} />
          <DetailRow label="Bidang" value={position.division_name ?? "-"} />
          <DetailRow label="Sub Unit" value={employee.sub_unit_name} />
          {employee.placement_object_names.length > 0 && (
            <DetailRow label="Objek Penempatan" value={employee.placement_object_names.join(", ")} />
          )}
          <DetailRow
            label="Level"
            value={
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-xs" style={{ backgroundColor: brmLevel.color }} />
                {brmLevel.label}
              </span>
            }
          />
          {position.description && <DetailRow label="Keterangan" value={position.description} />}
          <DetailRow label="Atasan langsung" value={<TitleList titles={supervisors} />} />
          <DetailRow label="Bawahan langsung" value={<TitleList titles={subordinates} />} />
        </DetailSection>

        {colleagues.length > 0 && (
          <DetailSection title={`Rekan Sejabatan (${colleagues.length})`}>
            {colleagues.map((colleague) => (
              <DetailRow
                key={colleague.assignment_id}
                label={colleague.name}
                value={withStatus(colleague.assignment_status, `NIK ${colleague.nik}`)}
              />
            ))}
          </DetailSection>
        )}
      </div>
    </>
  );
}

/** Satu bagian dengan judul kecil, mis. "Data Pegawai". */
function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 typo-overline text-fg-tertiary">{title}</h3>
      <dl className="divide-y divide-border rounded-lg border border-border">{children}</dl>
    </section>
  );
}

/** Satu baris "Label : Isi". */
function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 px-3 py-2 typo-body-s">
      <dt className="text-fg-tertiary">{label}</dt>
      <dd className="text-fg-primary">{value}</dd>
    </div>
  );
}

/** ("Plt", "Asisten Umum") -> "Plt Asisten Umum". Status Definitif tidak ditulis. */
function withStatus(status: string, text: string): string {
  return status === DEFINITIVE_STATUS ? text : `${status} ${text}`;
}

/** Daftar judul jabatan, atau "-" kalau kosong. */
function TitleList({ titles }: { titles: string[] }) {
  if (titles.length === 0) return <>-</>;

  return (
    <ul className="flex flex-col gap-0.5">
      {titles.map((title) => (
        <li key={title}>{title}</li>
      ))}
    </ul>
  );
}
