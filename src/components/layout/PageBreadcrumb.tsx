"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@mestakara/ui/breadcrumb";
import { cn } from "cn";

import { buildBreadcrumb } from "@/lib/active-menu";

/** Di HP hanya bagian terakhir sebanyak ini yang tampil, supaya tidak sesak. */
const ITEMS_SHOWN_ON_MOBILE = 2;

/**
 * Jejak navigasi di header, mis. "Dasbor › Jabatan › Tambah Jabatan".
 * Isinya disusun otomatis dari alamat halaman (lihat buildBreadcrumb di src/lib/active-menu.ts).
 */
export function PageBreadcrumb() {
  const pathname = usePathname();
  const items = buildBreadcrumb(pathname);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLastItem = index === items.length - 1;
          const isHiddenOnMobile = index < items.length - ITEMS_SHOWN_ON_MOBILE;
          const hideOnMobile = isHiddenOnMobile && "hidden md:inline-flex";

          return (
            <Fragment key={item.label}>
              {/* Tanda ">" sebelum setiap bagian, kecuali yang pertama */}
              {index > 0 && <BreadcrumbSeparator className={cn(hideOnMobile)} />}

              <BreadcrumbItem className={cn(hideOnMobile)}>
                {isLastItem ? (
                  // Halaman yang sedang dibuka
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : item.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  // Menu induk tanpa halaman sendiri, mis. "Karyawan"
                  <span>{item.label}</span>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
