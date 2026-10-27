/**
 * Isi awal master BIDANG — satu bidang per Asisten Manager (BRM-2) di SK.
 *
 * Operasional Wilayah I (Lampiran IX.6) dan Operasional Wilayah II (Lampiran IX.7)
 * digabung menjadi SATU bidang "Operasional". Pembagian wilayahnya tetap terlihat
 * dari nama jabatan dan isian Keterangan di setiap jabatan.
 *
 * `id` di bawah ini dipakai oleh file lampiran (02 … 09) untuk menandai bidang jabatannya.
 */
import type { DivisionResource } from "@/types/api/division";

/** Bidang tanpa `position_count` — jumlah jabatan dihitung saat data dibaca. */
export type DivisionRecord = Omit<DivisionResource, "position_count">;

export const DIVISION_IDS = {
  administrasiKeuangan: "administrasi-keuangan",
  umumLegal: "umum-legal",
  infrastrukturSipil: "infrastruktur-sipil",
  pengembanganBisnis: "pengembangan-bisnis",
  operasional: "operasional",
  foodBeverage: "food-beverage",
  marketingSales: "marketing-sales",
};

export const mockDivisions: DivisionRecord[] = [
  { id: DIVISION_IDS.administrasiKeuangan, code: "ADK", name: "Administrasi & Keuangan", description: "Lampiran IX.2" },
  { id: DIVISION_IDS.umumLegal, code: "UML", name: "Umum dan Legal", description: "Lampiran IX.3" },
  { id: DIVISION_IDS.infrastrukturSipil, code: "INS", name: "Infrastruktur dan Sipil", description: "Lampiran IX.4" },
  { id: DIVISION_IDS.pengembanganBisnis, code: "PBS", name: "Pengembangan Bisnis", description: "Lampiran IX.5" },
  { id: DIVISION_IDS.operasional, code: "OPS", name: "Operasional", description: "Lampiran IX.6 (Wilayah I) dan IX.7 (Wilayah II)" },
  { id: DIVISION_IDS.foodBeverage, code: "FNB", name: "Food & Beverage", description: "Lampiran IX.8" },
  { id: DIVISION_IDS.marketingSales, code: "MKS", name: "Marketing dan Sales", description: "Lampiran IX.9" },
];
