import { navigationConfig } from "@/config/navigation";

/** Satu link di menu sidebar beserta judul-judulnya untuk breadcrumb. */
export interface MenuLink {
  url: string;
  /** Contoh: ["Master Organisasi", "Bidang"], atau ["Dasbor"] untuk menu tanpa sub-menu. */
  titles: string[];
}

/**
 * Kumpulkan SEMUA link dari daftar menu (src/config/navigation.ts) menjadi satu daftar datar.
 *
 * Contoh hasil:
 *   { url: "/dashboard",           titles: ["Dasbor"] }
 *   { url: "/dashboard/organisasi/bidang",   titles: ["Master Organisasi", "Bidang"] }
 *   ...
 */
function getAllMenuLinks(): MenuLink[] {
  const links: MenuLink[] = [];

  for (const group of navigationConfig) {
    for (const item of group.items) {
      // Menu yang langsung berupa link, mis. "Dasbor"
      if (item.url) {
        links.push({ url: item.url, titles: [item.title] });
      }

      // Sub-menu di dalam menu yang bisa dibuka-tutup, mis. "Bidang"
      for (const subItem of item.items ?? []) {
        links.push({ url: subItem.url, titles: [item.title, subItem.title] });
      }
    }
  }

  return links;
}

/** Satu bagian breadcrumb. Tanpa `href` = hanya teks (tidak bisa diklik). */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

const DASHBOARD_URL = "/dashboard";

/**
 * Susun jejak navigasi (breadcrumb) dari alamat halaman.
 *
 * Contoh:
 *   /dashboard                              -> Dasbor
 *   /dashboard/karyawan                     -> Dasbor › Data Karyawan
 *   /dashboard/karyawan/12                  -> Dasbor › Data Karyawan › Detail Data Karyawan
 *   /dashboard/organisasi/jabatan           -> Dasbor › Master Organisasi › Jabatan
 *   /dashboard/organisasi/jabatan/create    -> Dasbor › Master Organisasi › Jabatan › Tambah Jabatan
 *   /dashboard/organisasi/bidang/12/edit    -> Dasbor › Master Organisasi › Bidang › Edit Bidang
 *   /dashboard/jadwal/shift                 -> Dasbor › Pengaturan Jadwal › Shift
 *
 * Bagian terakhir = halaman yang sedang dibuka, jadi tidak diberi link.
 * Menu induk yang bisa dibuka-tutup (mis. "Master Organisasi") hanya berupa teks,
 * karena menu itu tidak punya halaman sendiri.
 */
export function buildBreadcrumb(pathname: string): BreadcrumbItem[] {
  const menu = findActiveMenu(pathname);

  // Halaman Dasbor sendiri, atau halaman yang tidak ada di daftar menu.
  if (!menu || menu.url === DASHBOARD_URL) {
    return [{ label: "Dasbor" }];
  }

  const items: BreadcrumbItem[] = [{ label: "Dasbor", href: DASHBOARD_URL }];

  // Menu induk, mis. "Master Organisasi" untuk "Bidang".
  const parentTitles = menu.titles.slice(0, -1);
  for (const title of parentTitles) {
    items.push({ label: title });
  }

  // Menu yang sedang dibuka, mis. "Jabatan".
  const menuTitle = menu.titles[menu.titles.length - 1];
  const subPageLabel = getSubPageLabel(pathname, menu.url, menuTitle);

  if (subPageLabel) {
    // Di sub-halaman: nama menu bisa diklik untuk kembali ke daftarnya.
    items.push({ label: menuTitle, href: menu.url });
    items.push({ label: subPageLabel });
  } else {
    items.push({ label: menuTitle });
  }

  return items;
}

/**
 * Nama sub-halaman di bawah sebuah menu:
 *   ".../create"     -> "Tambah Jabatan"
 *   ".../{id}/edit"  -> "Edit Jabatan"
 *   ".../{id}"       -> "Detail Jabatan"
 *   ".../{id}/anggota" -> "Kelola Anggota Regu Kerja"
 * null kalau bukan sub-halaman yang dikenal.
 */
function getSubPageLabel(pathname: string, menuUrl: string, menuTitle: string): string | null {
  const rest = pathname.slice(menuUrl.length); // mis. "/create" atau "/12/edit"

  if (rest === "/create") return `Tambah ${menuTitle}`;
  if (rest.endsWith("/edit")) return `Edit ${menuTitle}`;
  if (rest.endsWith("/anggota")) return `Kelola Anggota ${menuTitle}`;
  // Satu bagian setelah alamat menu, mis. "/mutasi-12" -> halaman detail.
  if (/^\/[^/]+$/.test(rest)) return `Detail ${menuTitle}`;

  return null;
}

/**
 * Cari menu yang sedang dibuka berdasarkan alamat halaman (pathname).
 * Dipakai sidebar (menandai menu aktif) dan header (breadcrumb).
 *
 * Sebuah link dianggap cocok kalau:
 * - url-nya sama persis dengan pathname, atau
 * - pathname adalah sub-halamannya (mis. /dashboard/karyawan/12 termasuk "Data Karyawan").
 *
 * Kalau ada beberapa yang cocok, dipilih url yang PALING PANJANG (paling spesifik).
 * Contoh: /dashboard/organisasi/jabatan cocok dengan "/dashboard", "/dashboard/organisasi",
 * dan "/dashboard/organisasi/jabatan" -> yang dipilih "Jabatan".
 *
 * Hasilnya null kalau tidak ada menu yang cocok.
 */
export function findActiveMenu(pathname: string): MenuLink | null {
  let activeMenu: MenuLink | null = null;

  for (const link of getAllMenuLinks()) {
    const isMatch = pathname === link.url || pathname.startsWith(`${link.url}/`);
    if (!isMatch) continue;

    const isMoreSpecific = activeMenu === null || link.url.length > activeMenu.url.length;
    if (isMoreSpecific) {
      activeMenu = link;
    }
  }

  return activeMenu;
}
