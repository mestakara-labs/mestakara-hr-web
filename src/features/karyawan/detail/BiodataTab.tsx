import { formatDate } from "@/lib/date";
import type { EmployeeProfileResource } from "@/types/api/employee";

import { DetailItem, DetailList } from "./DetailParts";

/**
 * Tab BIODATA di detail karyawan: data diri + kontak.
 *
 *   Status Karyawan, NIK, No. Registrasi, No. KTP, Jenis Kelamin, Tempat/Tgl Lahir, Tanggal Masuk,
 *   Agama, Status Perkawinan, Telepon, WhatsApp, Email, Alamat, Rekening Bank, Cost Center
 *   (tiga kolom; lihat DetailList). Rekening & cost center = yang berlaku; riwayatnya di tab Rekening & Cost Center.
 */
export function BiodataTab({ employee }: { employee: EmployeeProfileResource }) {
  return (
    <DetailList>
      <DetailItem label="Status Karyawan">{employee.employment_status}</DetailItem>
      <DetailItem label="NIK Karyawan">{employee.nik}</DetailItem>
      <DetailItem label="No. Registrasi">{employee.registration_number}</DetailItem>
      <DetailItem label="No. KTP">{employee.ktp_number}</DetailItem>
      <DetailItem label="Jenis Kelamin">{employee.gender}</DetailItem>
      <DetailItem label="Tempat, Tanggal Lahir">
        {[employee.birth_place, formatDate(employee.birth_date)].filter(Boolean).join(", ")}
      </DetailItem>
      <DetailItem label="Tanggal Masuk">{formatDate(employee.hire_date)}</DetailItem>
      <DetailItem label="Agama">{employee.religion}</DetailItem>
      <DetailItem label="Status Perkawinan">{employee.marital_status}</DetailItem>
      <DetailItem label="No. Telepon">{employee.phone}</DetailItem>
      {/* WhatsApp kosong ditulis "-" (tidak diganti nomor telepon) */}
      <DetailItem label="No. WhatsApp">{employee.whatsapp}</DetailItem>
      <DetailItem label="Email">{employee.email}</DetailItem>
      <DetailItem label="Alamat">{employee.address}</DetailItem>
      <DetailItem label="Rekening Bank">
        {employee.bank_account &&
          `${employee.bank_account.bank_name} ${employee.bank_account.account_number} a.n. ${employee.bank_account.account_holder}`}
      </DetailItem>
      <DetailItem label="Cost Center">
        {employee.cost_center && `${employee.cost_center.code} — ${employee.cost_center.name}`}
      </DetailItem>
    </DetailList>
  );
}
