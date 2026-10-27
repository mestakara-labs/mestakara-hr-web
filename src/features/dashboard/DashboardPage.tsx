"use client";

import { useAuth } from "@/features/auth/AuthProvider";

/**
 * Isi halaman Dasbor — SEMENTARA.
 * Kotak abu-abu di bawah hanya penanda tempat (seperti block sidebar-07);
 * nanti diganti kartu statistik dan grafik SDM yang sebenarnya.
 */
export function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      <div>
        <h1 className="typo-h3 text-fg-heading">Halo, {user?.name}</h1>
        <p className="typo-body-m text-fg-secondary">
          {user?.position} · {user?.unitName}
        </p>
      </div>

      {/* Tempat kartu statistik */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-lg bg-subtle" />
        <div className="aspect-video rounded-lg bg-subtle" />
        <div className="aspect-video rounded-lg bg-subtle" />
      </div>

      {/* Tempat grafik / tabel */}
      <div className="min-h-[100vh] flex-1 rounded-lg bg-subtle md:min-h-min" />
    </>
  );
}
