import type { Metadata } from "next";
import { Toaster } from "@mestakara/ui/sonner";

// Font bawaan design system Mestakara: Plus Jakarta Sans (teks) dan Fraunces (judul).
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/fraunces";
import "./globals.css";

import { AuthProvider } from "@/features/auth/AuthProvider";

export const metadata: Metadata = {
  title: "HR Monitoring | PTPN I Regional 2 - Unit Agrowisata",
  description: "Dashboard monitoring dan sentralisasi data SDM Unit Agrowisata PTPN I Regional 2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-canvas">
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
