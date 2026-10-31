"use client";

import Link from "next/link";
import { ChartNoAxesCombined } from "lucide-react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Button } from "@mestakara/ui/button";

import { FilterOptionsProvider } from "@/components/shared/dashboard/FilterOptionsContext";
import { PageLoading } from "@/components/shared/PageState";
import { useAuth } from "@/features/auth/AuthProvider";
import { useApiGet } from "@/hooks/useApiGet";
import { defaultRange, rangeToParams } from "@/lib/period-range";
import type { DashboardResource, DashboardWidget } from "@/types/api/dashboard";

import { PayrollSection } from "./PayrollSection";
import { SummarySection } from "./SummarySection";
import { WorkforceSection } from "./WorkforceSection";

/** Alamat semua widget dengan periode bawaan (awal tahun s.d. hari ini), dihitung sekali saat halaman dibuka. */
const DASHBOARD_PATH = `/api/dashboard?${new URLSearchParams(rangeToParams(defaultRange()))}`;

/**
 * Halaman DASBOR (manajemen). Setiap kartu & grafik berdiri sendiri: periode dan filternya diatur di kartu itu.
 *
 *   Halo, <nama>                                                    [Analitik SDM →]
 *   Bagian 1  Ringkasan Eksekutif
 *   Bagian 2  Komposisi Tenaga Kerja
 *   Bagian 3  Biaya Upah & Lembur
 *   (Bagian 4–7 — Kehadiran & Lembur, Pergerakan, Regenerasi & Pensiun, Organisasi — menyusul di Tahap B)
 *
 * Alurnya:
 *   1. GET /api/dashboard sekali -> semua kartu dengan pilihan bawaan
 *   2. Periode / filter satu kartu diubah -> hanya kartu itu yang diambil ulang (lihat useDashboardWidget)
 */
export function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error } = useApiGet<DashboardResource>(DASHBOARD_PATH);
  // Daftar widget -> dicari lewat kuncinya, mis. widgets["payroll.trend"].
  // Kalau ringkasan sekaligus gagal (kosong), setiap kartu tetap mengambil datanya sendiri.
  const widgets: Record<string, DashboardWidget> = Object.fromEntries((data?.widgets ?? []).map((widget) => [widget.key, widget]));

  return (
    <FilterOptionsProvider>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="typo-h2 text-fg-heading">Halo, {user?.name}</h1>
          <p className="typo-body-m text-fg-secondary">
            Dasbor SDM {user?.unitName}. Setiap kartu bisa diatur periodenya sendiri; grafik juga bisa difilter.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/analitik">
            <ChartNoAxesCombined />
            Analitik SDM
          </Link>
        </Button>
      </div>

      {loading ? (
        <PageLoading label="Memuat dasbor..." />
      ) : (
        <div className="flex flex-col gap-10">
          {error && (
            <Alert variant="warning">
              <AlertDescription>Ringkasan dasbor gagal dimuat ({error}). Setiap kartu mencoba memuat datanya sendiri.</AlertDescription>
            </Alert>
          )}
          <SummarySection widgets={widgets} />
          <WorkforceSection widgets={widgets} />
          <PayrollSection widgets={widgets} />
        </div>
      )}
    </FilterOptionsProvider>
  );
}
