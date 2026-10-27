import { Mail, Phone } from "lucide-react";
import { Button } from "@mestakara/ui/button";

import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { emailLink, phoneLink, whatsAppLink } from "@/lib/contact-links";
import type { EmployeeResource } from "@/types/api/organization";

/** Data kontak yang dibutuhkan tombol-tombol ini. Email kosong ("") -> tombol Email tidak tampil. */
type ContactPerson = Pick<EmployeeResource, "name" | "phone" | "whatsapp" | "email">;

/**
 * Tiga tombol ikon untuk menghubungi pegawai: Telepon, Email, dan WhatsApp.
 * Dipakai di kartu pegawai pada bagan dan di halaman detail karyawan.
 */
export function EmployeeContactButtons({ employee }: { employee: ContactPerson }) {
  return (
    <div className="flex shrink-0 items-center">
      <Button variant="ghost" size="icon-sm" asChild>
        <a href={phoneLink(employee.phone)} title="Telepon" aria-label={`Telepon ${employee.name}`}>
          <Phone />
        </a>
      </Button>

      {employee.email && (
        <Button variant="ghost" size="icon-sm" asChild>
          <a href={emailLink(employee.email)} title="Email" aria-label={`Email ${employee.name}`}>
            <Mail />
          </a>
        </Button>
      )}

      <Button variant="ghost" size="icon-sm" asChild className="text-green-600 hover:text-green-700">
        <a
          href={whatsAppLink(employee.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          title="WhatsApp"
          aria-label={`WhatsApp ${employee.name}`}
        >
          <WhatsAppIcon className="size-4" />
        </a>
      </Button>
    </div>
  );
}
