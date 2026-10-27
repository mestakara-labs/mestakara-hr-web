"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, FileClock, UserCog, X } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";
import { Card, CardContent } from "@mestakara/ui/card";

import { PageHeader } from "@/components/shared/PageHeader";
import { PageError, PageLoading } from "@/components/shared/PageState";
import { usePendingTransferCount } from "@/features/mutasi/usePendingTransferCount";
import { useApiGet } from "@/hooks/useApiGet";
import type { AssignmentResource } from "@/types/api/assignment";
import type { DivisionResource } from "@/types/api/division";
import type { EmployeeProfileResource } from "@/types/api/employee";
import type { PositionResource } from "@/types/api/organization";
import type { PlacementObjectResource } from "@/types/api/placement-object";
import type { SubUnitResource } from "@/types/api/sub-unit";

import { JabatanKaryawanStats } from "./JabatanKaryawanStats";
import { JabatanKaryawanTable } from "./JabatanKaryawanTable";
import { SupervisorDialog } from "./SupervisorDialog";
import { SupervisorHistorySheet } from "./SupervisorHistorySheet";

/**
 * Halaman JABATAN KARYAWAN: siapa memegang jabatan apa, di mana, dan statusnya apa.
 *
 * Jabatannya sendiri tidak diubah di sini, tapi lewat menu Mutasi & Penempatan
 * (tombol "Mutasi & Penempatan" di kanan atas), supaya setiap perubahan punya SK.
 * Yang BISA diatur di sini hanya ATASAN langsung:
 *   - "Ubah Atasan" di menu Aksi satu baris, atau
 *   - centang beberapa baris -> "Ubah Atasan (N dipilih)"
 *   - "Riwayat Atasan" untuk melihat perubahan atasan sebelumnya
 *
 * Alurnya:
 *   1. Ambil penugasan, karyawan, jabatan, bidang, sub unit, dan objek penempatan
 *      (karyawan & jabatan dipakai untuk statistik; data master untuk pilihan filter tabel)
 *   2. Tampilkan kartu statistik dan tabel jabatan karyawan
 *   3. Setelah atasan diubah -> muat ulang penugasan, kosongkan centang
 */
export function JabatanKaryawanListPage() {
  const assignmentsRequest = useApiGet<AssignmentResource[]>("/api/position-assignments");
  const employeesRequest = useApiGet<EmployeeProfileResource[]>("/api/employees");
  const positionsRequest = useApiGet<PositionResource[]>("/api/positions");
  const divisionsRequest = useApiGet<DivisionResource[]>("/api/divisions");
  const subUnitsRequest = useApiGet<SubUnitResource[]>("/api/sub-units");
  const objectsRequest = useApiGet<PlacementObjectResource[]>("/api/placement-objects");

  const requests = [
    assignmentsRequest,
    employeesRequest,
    positionsRequest,
    divisionsRequest,
    subUnitsRequest,
    objectsRequest,
  ];
  const loading = requests.some((request) => request.loading);
  const error = requests.find((request) => request.error)?.error ?? null;

  const assignments = assignmentsRequest.data;
  const pendingTransfers = usePendingTransferCount();
  const employees = employeesRequest.data;
  const positions = positionsRequest.data;
  const divisions = divisionsRequest.data;
  const subUnits = subUnitsRequest.data;
  const placementObjects = objectsRequest.data;

  /** Id penugasan yang sedang dicentang */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  /** Penugasan yang sedang diubah atasannya (dialog terbuka kalau tidak kosong) */
  const [supervisorTargets, setSupervisorTargets] = useState<AssignmentResource[]>([]);
  /** Penugasan yang sedang dilihat riwayat atasannya (panel terbuka kalau tidak null) */
  const [historyTarget, setHistoryTarget] = useState<AssignmentResource | null>(null);

  // useCallback: fungsi tetap sama di setiap render, supaya tabel tidak menyusun ulang kolomnya.
  const openSupervisorDialog = useCallback((assignment: AssignmentResource) => setSupervisorTargets([assignment]), []);
  const openHistory = useCallback((assignment: AssignmentResource) => setHistoryTarget(assignment), []);

  // Hanya penugasan AKTIF yang bisa diubah atasannya, jadi hanya itu yang bisa dicentang.
  const activeIds = new Set(assignments?.filter((item) => item.is_active).map((item) => item.id));
  const selectedAssignments = assignments?.filter((item) => selectedIds.includes(item.id)) ?? [];

  return (
    <>
      <PageHeader
        title="Jabatan Karyawan"
        description="Jabatan yang dipegang setiap karyawan, beserta sub unit, status jabatan, dan atasan langsungnya."
        action={
          <Button asChild>
            <Link href="/dashboard/mutasi/create">
              <ArrowLeftRight />
              Mutasi &amp; Penempatan
            </Link>
          </Button>
        }
      />

      {/* Pengingat: usulan mutasi yang SK-nya belum diunggah, jadi jabatannya belum berubah */}
      {pendingTransfers > 0 && (
        <Alert variant="warning">
          <FileClock />
          <AlertDescription>
            <p>
              <strong>{pendingTransfers} usulan mutasi menunggu dokumen.</strong> Jabatan karyawan di usulan itu belum
              berubah sampai scan SK bertanda tangan diunggah.{" "}
              <Link href="/dashboard/mutasi" className="font-medium text-fg-brand underline">
                Lihat usulan
              </Link>
            </p>
          </AlertDescription>
        </Alert>
      )}

      {loading && <PageLoading label="Memuat data jabatan karyawan..." />}
      {error && <PageError message={error} />}

      {assignments && employees && positions && divisions && subUnits && placementObjects && (
        <>
          <JabatanKaryawanStats
            assignments={assignments}
            employeeCount={employees.length}
            positions={positions}
            subUnits={subUnits}
          />

          <Card>
            <CardContent className="flex flex-col gap-3">
              {/* Bilah aksi untuk baris yang dicentang */}
              {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-brand-subtle px-3 py-2">
                  <p className="typo-label-m text-fg-brand">{selectedIds.length} karyawan dipilih</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                      <X />
                      Batal Pilih
                    </Button>
                    <Button size="sm" onClick={() => setSupervisorTargets(selectedAssignments)}>
                      <UserCog />
                      Ubah Atasan
                    </Button>
                  </div>
                </div>
              )}

              <JabatanKaryawanTable
                assignments={assignments}
                selection={{ selectedIds, onChange: setSelectedIds, canSelect: (id) => activeIds.has(id) }}
                positions={positions}
                divisions={divisions}
                subUnits={subUnits}
                placementObjects={placementObjects}
                onChangeSupervisor={openSupervisorDialog}
                onShowHistory={openHistory}
              />
            </CardContent>
          </Card>

          <SupervisorDialog
            targets={supervisorTargets}
            assignments={assignments}
            onClose={() => setSupervisorTargets([])}
            onSaved={() => {
              setSelectedIds([]);
              assignmentsRequest.reload();
            }}
          />
        </>
      )}

      <SupervisorHistorySheet assignment={historyTarget} onClose={() => setHistoryTarget(null)} />
    </>
  );
}
