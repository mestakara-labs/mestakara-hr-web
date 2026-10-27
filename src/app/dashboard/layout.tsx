import { DashboardShell } from "@/components/layout/DashboardShell";
import { RequireAuth } from "@/features/auth/RequireAuth";

/**
 * Semua halaman di bawah /dashboard:
 * 1. wajib login (RequireAuth), lalu
 * 2. ditampilkan di dalam kerangka sidebar + header (DashboardShell).
 */
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <RequireAuth>
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}
