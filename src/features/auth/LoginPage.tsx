import Image from "next/image";

import { CompanyName } from "@/components/shared/CompanyName";

import { LoginForm } from "./LoginForm";
import { LoginHeroPanel } from "./LoginHeroPanel";

/**
 * Tata letak halaman login:
 *
 *   ┌──────────────────┬────────────────────────────┐
 *   │ LoginHeroPanel   │ Judul "Selamat Datang"     │
 *   │ (foto + judul,   │ LoginForm                  │
 *   │  layar lebar     │ Bantuan helpdesk           │
 *   │  saja)           │ Footer                     │
 *   └──────────────────┴────────────────────────────┘
 *
 * Isian & logika login ada di LoginForm.tsx.
 */
export function LoginPage() {
  return (
    // Layar penuh: panel foto di kiri (maks. 576px, layar lebar saja), form mengisi sisanya.
    <div className="flex min-h-dvh bg-surface">
      <LoginHeroPanel />

      {/* Panel kanan: form login */}
      <main className="flex flex-1 flex-col px-6 py-12 sm:px-12 lg:px-24">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          {/* Identitas perusahaan khusus layar kecil (panel kiri disembunyikan di HP) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Image src="/images/logo-ptpn1.png" alt="Logo PTPN I" width={30} height={40} />
            <p className="typo-body-s text-fg-secondary">
              <CompanyName />
            </p>
          </div>

          <p className="typo-overline text-fg-accent">Portal Resmi SDM & Talenta BUMN</p>
          <h2 className="mt-2 typo-h2 text-fg-heading">Selamat Datang Kembali</h2>
          <p className="mt-2 typo-body-m text-fg-secondary">
            Silakan masukkan NIK / Email Perusahaan dan kata sandi Anda untuk mengakses portal
            HR Dashboard
          </p>

          <LoginForm />

          <p className="mt-6 text-center typo-body-s text-fg-tertiary">
            Mengalami kendala login?{" "}
            <a href="#" className="font-semibold text-fg-link hover:underline block sm:inline">
              Hubungi IT Helpdesk Agrowisata
            </a>
          </p>
        </div>

        {/* Footer */}
        <footer className="mx-auto mt-10 flex w-full max-w-md flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-fg-tertiary">
          <p>© <CompanyName />. Hak Cipta Dilindungi.</p>
          {/*<div className="flex flex-wrap items-center gap-x-4 gap-y-1 whitespace-nowrap">*/}
          {/*  <a href="#" className="hover:text-fg-secondary">*/}
          {/*    Kebijakan Privasi*/}
          {/*  </a>*/}
          {/*  <a href="#" className="hover:text-fg-secondary">*/}
          {/*    Panduan Sistem*/}
          {/*  </a>*/}
          {/*  <span className="flex items-center gap-1.5 text-fg-success">*/}
          {/*    <span className="size-1.5 rounded-full bg-success" />*/}
          {/*    Sistem Aktif*/}
          {/*  </span>*/}
          {/*</div>*/}
        </footer>
      </main>
    </div>
  );
}
