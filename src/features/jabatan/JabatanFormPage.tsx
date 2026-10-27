"use client";

import { PageError, PageLoading } from "@/components/shared/PageState";
import { useApiGet } from "@/hooks/useApiGet";
import type { DivisionResource } from "@/types/api/division";
import type { PositionResource } from "@/types/api/organization";

import { JabatanForm } from "./JabatanForm";

/**
 * Halaman tambah / edit jabatan.
 * Ambil dulu daftar bidang (untuk pilihan di form) dan daftar jabatan, lalu tampilkan form.
 *
 * @param positionId  id jabatan yang diedit. Kosongkan untuk menambah jabatan baru.
 */
export function JabatanFormPage({ positionId }: { positionId?: string }) {
  const positionsRequest = useApiGet<PositionResource[]>("/api/positions");
  const divisionsRequest = useApiGet<DivisionResource[]>("/api/divisions");

  const positions = positionsRequest.data;
  const divisions = divisionsRequest.data;

  if (positionsRequest.loading || divisionsRequest.loading) {
    return <PageLoading label="Memuat data jabatan..." />;
  }

  if (!positions || !divisions) {
    return <PageError message={positionsRequest.error ?? divisionsRequest.error ?? "Data gagal dimuat."} />;
  }

  // Mode tambah
  if (positionId === undefined) {
    return <JabatanForm divisions={divisions} />;
  }

  // Mode edit: cari jabatan yang diedit di daftar jabatan
  const position = positions.find((item) => item.id === positionId);
  if (!position) return <PageError message="Jabatan tidak ditemukan." />;

  return <JabatanForm position={position} divisions={divisions} />;
}
