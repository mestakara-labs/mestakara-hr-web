/**
 * Isi awal master SUB UNIT, KATEGORI OBJEK, dan OBJEK PENEMPATAN.
 *
 *   Kategori Objek (Wahana) -> Objek Penempatan (Flying Fox) -> tersedia di Sub Unit (Gunung Mas, Rancabali)
 *
 * `id` di bawah ini dipakai assignments.ts untuk menandai tempat tugas
 * setiap penugasan contoh.
 */
import type { PlacementCategoryResource } from "@/types/api/placement-category";
import type { SubUnitResource } from "@/types/api/sub-unit";

/** Sub unit tanpa jumlah-jumlahnya — jumlah penugasan & objek dihitung saat data dibaca. */
export type SubUnitRecord = Omit<SubUnitResource, "assignment_count" | "object_count">;

/** Kategori tanpa `object_count` — jumlah objek dihitung saat data dibaca. */
export type PlacementCategoryRecord = Omit<PlacementCategoryResource, "object_count">;

/**
 * Objek penempatan seperti yang DISIMPAN: kategori & sub unit hanya disimpan id-nya.
 * Namanya ditempelkan saat dibaca (lihat toPlacementObjectResource() di organization-store.ts).
 */
export interface PlacementObjectRecord {
  id: string;
  name: string;
  category_id: string;
  /** Sub unit tempat objek ini tersedia */
  sub_unit_ids: string[];
  description: string | null;
}

// ---------------------------------------------------------------------------
// Sub unit
// ---------------------------------------------------------------------------

export const SUB_UNIT_IDS = {
  kantorInduk: "kantor-induk",
  gunungMas: "agrowisata-gunung-mas",
  rancabali: "agrowisata-rancabali",
  malabar: "agrowisata-malabar",
};

export const mockSubUnits: SubUnitRecord[] = [
  { id: SUB_UNIT_IDS.kantorInduk, name: "Kantor Induk", afdeling_code: "AFD02", description: "Kantor pusat Unit Agrowisata" },
  { id: SUB_UNIT_IDS.gunungMas, name: "Agrowisata Gunung Mas", afdeling_code: "AFD03", description: "Bogor" },
  // Kode afdeling Rancabali & Malabar belum diketahui; diisi lewat form Edit Sub Unit.
  { id: SUB_UNIT_IDS.rancabali, name: "Agrowisata Rancabali", afdeling_code: null, description: "Ciwidey, Kabupaten Bandung" },
  { id: SUB_UNIT_IDS.malabar, name: "Agrowisata Malabar", afdeling_code: null, description: "Pangalengan, Kabupaten Bandung" },
];

// ---------------------------------------------------------------------------
// Kategori objek
// ---------------------------------------------------------------------------

const CATEGORY_IDS = {
  penginapan: "penginapan",
  wahana: "wahana",
  restoran: "restoran",
  cafe: "cafe",
  wisataAlam: "wisata-alam",
  lainnya: "lainnya",
};

export const mockPlacementCategories: PlacementCategoryRecord[] = [
  { id: CATEGORY_IDS.penginapan, name: "Penginapan", description: "Glamping, bungalow, pondokan, dll." },
  { id: CATEGORY_IDS.wahana, name: "Wahana", description: "Wahana permainan & petualangan" },
  { id: CATEGORY_IDS.restoran, name: "Restoran", description: null },
  { id: CATEGORY_IDS.cafe, name: "Cafe", description: null },
  { id: CATEGORY_IDS.wisataAlam, name: "Wisata Alam", description: "Kebun teh, jembatan, jalur alam" },
  { id: CATEGORY_IDS.lainnya, name: "Lainnya", description: null },
];

// ---------------------------------------------------------------------------
// Objek penempatan
// ---------------------------------------------------------------------------

export const PLACEMENT_OBJECT_IDS = {
  atv: "wahana-atv",
  flyingFox: "flying-fox",
  teaBridge: "tea-bridge",
  kebunTeh: "kebun-teh-petik",
  glamping: "glamping",
  bungalow: "bungalow",
  pondokan: "pondokan",
  restoran: "restoran-utama",
  cafe: "cafe-tea-corner",
};

const { gunungMas, rancabali, malabar } = SUB_UNIT_IDS;

export const mockPlacementObjects: PlacementObjectRecord[] = [
  { id: PLACEMENT_OBJECT_IDS.atv, name: "Wahana ATV", category_id: CATEGORY_IDS.wahana, sub_unit_ids: [gunungMas, rancabali, malabar], description: null },
  { id: PLACEMENT_OBJECT_IDS.flyingFox, name: "Flying Fox", category_id: CATEGORY_IDS.wahana, sub_unit_ids: [gunungMas, rancabali], description: null },
  { id: PLACEMENT_OBJECT_IDS.teaBridge, name: "Tea Bridge", category_id: CATEGORY_IDS.wisataAlam, sub_unit_ids: [gunungMas, malabar], description: "Jembatan gantung di atas kebun teh" },
  { id: PLACEMENT_OBJECT_IDS.kebunTeh, name: "Kebun Teh Petik", category_id: CATEGORY_IDS.wisataAlam, sub_unit_ids: [gunungMas, malabar], description: null },
  { id: PLACEMENT_OBJECT_IDS.glamping, name: "Glamping", category_id: CATEGORY_IDS.penginapan, sub_unit_ids: [gunungMas], description: null },
  { id: PLACEMENT_OBJECT_IDS.bungalow, name: "Bungalow", category_id: CATEGORY_IDS.penginapan, sub_unit_ids: [rancabali], description: null },
  { id: PLACEMENT_OBJECT_IDS.pondokan, name: "Pondokan", category_id: CATEGORY_IDS.penginapan, sub_unit_ids: [rancabali, malabar], description: null },
  { id: PLACEMENT_OBJECT_IDS.restoran, name: "Restoran Utama", category_id: CATEGORY_IDS.restoran, sub_unit_ids: [gunungMas, rancabali], description: null },
  { id: PLACEMENT_OBJECT_IDS.cafe, name: "Cafe Tea Corner", category_id: CATEGORY_IDS.cafe, sub_unit_ids: [gunungMas, malabar], description: null },
];
