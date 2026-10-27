"use client";

import { useEffect, useState } from "react";

import { apiGet } from "@/lib/http-client";
import type { OrganizationResource } from "@/types/api/organization";

/**
 * Ambil data struktur organisasi dari route handler BFF /api/organization.
 *
 *   const { organization, loading, error } = useOrganization();
 */
export function useOrganization() {
  const [organization, setOrganization] = useState<OrganizationResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Kalau halaman sudah ditinggalkan sebelum data datang, hasilnya diabaikan.
    let isCancelled = false;

    async function loadOrganization() {
      try {
        const { data } = await apiGet<OrganizationResource>("/api/organization");
        if (!isCancelled) setOrganization(data);
      } catch (loadError) {
        console.error("Gagal memuat struktur organisasi:", loadError);
        if (!isCancelled) setError("Struktur organisasi gagal dimuat. Silakan muat ulang halaman.");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadOrganization();

    return () => {
      isCancelled = true;
    };
  }, []);

  return { organization, loading, error };
}
