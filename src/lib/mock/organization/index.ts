/**
 * DATA CONTOH (MOCK) STRUKTUR ORGANISASI UNIT AGROWISATA — SEMENTARA.
 *
 * Susunan JABATAN diambil dari SK Direksi PTPN VIII
 * No. KEP/IV.2/1667/XI/2023 tanggal 9 November 2023 (Lampiran IX.1 – IX.9).
 * Data KARYAWAN (nama, NIK, biografi, kontak) hanya contoh / dummy — lihat employees.ts.
 * PENUGASAN JABATAN dibuat otomatis dari keduanya — lihat assignments.ts.
 *
 * Satu file = satu lampiran SK, supaya mudah dicocokkan dengan dokumen aslinya.
 * Isi di sini hanya DATA AWAL. Selama aplikasi berjalan, data dibaca dan diubah
 * lewat src/lib/mock/organization-store.ts.
 */

import { managerPositions } from "./01-manager";
import { administrasiKeuanganPositions } from "./02-administrasi-keuangan";
import { umumLegalPositions } from "./03-umum-legal";
import { infrastrukturSipilPositions } from "./04-infrastruktur-sipil";
import { pengembanganBisnisPositions } from "./05-pengembangan-bisnis";
import { operasionalWilayah1Positions } from "./06-operasional-wilayah-1";
import { operasionalWilayah2Positions } from "./07-operasional-wilayah-2";
import { foodBeveragePositions } from "./08-food-beverage";
import { marketingSalesPositions } from "./09-marketing-sales";
import { createSeedActivations } from "./activations";
import { createSeedAssignments } from "./assignments";
import { seedEmployees, seedHolders } from "./helpers";
import { createSeedTransfers } from "./transfers";

export { mockDivisions } from "./divisions";
export { mockPlacementCategories, mockPlacementObjects, mockSubUnits } from "./placements";

/** Semua karyawan contoh (dibuat bersama jabatannya, lihat helpers.ts). */
export const mockEmployees = seedEmployees;

/** Semua jabatan, urut sesuai lampiran SK. */
export const mockPositions = [
  ...managerPositions,
  ...administrasiKeuanganPositions,
  ...umumLegalPositions,
  ...infrastrukturSipilPositions,
  ...pengembanganBisnisPositions,
  ...operasionalWilayah1Positions,
  ...operasionalWilayah2Positions,
  ...foodBeveragePositions,
  ...marketingSalesPositions,
];

/** Semua penugasan jabatan contoh (dibuat SETELAH semua jabatan di atas terbaca). */
export const mockAssignments = createSeedAssignments(seedHolders);

/** Contoh usulan mutasi (memakai penugasan contoh di atas). */
export const mockTransfers = createSeedTransfers(mockAssignments);

/** Usulan Penambahan "data awal": semua karyawan contoh sudah aktif (lihat activations.ts). */
export const mockActivations = createSeedActivations(seedEmployees);

/** SK dasar struktur organisasi. */
export const mockDecree = {
  decree_number: "KEP/IV.2/1667/XI/2023",
  decree_date: "2023-11-09",
};
