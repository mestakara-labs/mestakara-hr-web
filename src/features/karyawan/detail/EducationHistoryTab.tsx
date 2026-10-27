import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mestakara/ui/table";

import type { EducationResource } from "@/types/api/employee";

import { EmptyText, FileLink } from "./DetailParts";

/**
 * Tab RIWAYAT PENDIDIKAN di detail karyawan, jenjang tertinggi di atas:
 *
 *   Jenjang | Institusi & Kota | Jurusan & Gelar | Masuk – Lulus | IPK | No. Ijazah | Ijazah
 */
export function EducationHistoryTab({ educations }: { educations: EducationResource[] }) {
  if (educations.length === 0) return <EmptyText>Belum ada riwayat pendidikan.</EmptyText>;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table className="min-w-200">
        <TableHeader>
          <TableRow>
            <TableHead>Jenjang</TableHead>
            <TableHead>Institusi</TableHead>
            <TableHead>Jurusan</TableHead>
            <TableHead>Tahun</TableHead>
            <TableHead>IPK / Nilai</TableHead>
            <TableHead>No. Ijazah</TableHead>
            <TableHead>Ijazah</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {educations.map((education) => (
            <TableRow key={education.id}>
              <TableCell className="font-medium text-fg-heading">{education.level}</TableCell>
              <TableCell>
                <p className="text-fg-primary">{education.institution ?? "-"}</p>
                {education.city && <p className="typo-body-s text-fg-tertiary">{education.city}</p>}
              </TableCell>
              <TableCell>
                <p className="text-fg-primary">{education.major ?? "-"}</p>
                {/* Gelar depan & belakang, mis. "Gelar: Ir., S.E." */}
                {(education.title_front || education.title_back) && (
                  <p className="typo-body-s text-fg-tertiary">
                    Gelar: {[education.title_front, education.title_back].filter(Boolean).join(", ")}
                  </p>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-fg-secondary">
                {education.start_year ? `${education.start_year} – ${education.graduation_year}` : `Lulus ${education.graduation_year}`}
              </TableCell>
              <TableCell className="text-fg-secondary">{education.gpa ?? "-"}</TableCell>
              <TableCell className="whitespace-nowrap text-fg-secondary">{education.certificate_number ?? "-"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {education.certificate_file && education.certificate_file_url ? (
                  <FileLink href={education.certificate_file_url} label="Lihat ijazah" />
                ) : (
                  <span className="typo-body-s text-fg-tertiary">Belum diunggah</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
