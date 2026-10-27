"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@mestakara/ui/spinner";

import { useAuth } from "./AuthProvider";

/** Menahan halaman yang butuh login; kalau belum login diarahkan ke /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-dvh items-center justify-center gap-2 bg-canvas text-fg-tertiary">
        <Spinner />
        <p className="typo-body-s">
          {loading ? "Memeriksa sesi..." : "Mengalihkan ke halaman login..."}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
