/** LAMPIRAN IX.8 — Fungsi: Food & Beverage */
import { DIVISION_IDS } from "./divisions";
import { position } from "./helpers";

const BIDANG = DIVISION_IDS.foodBeverage;

const AREA_1 = "Bogor, Sukabumi";
const AREA_2 = "Bandung, Subang";

export const foodBeveragePositions = [
  position(BIDANG, { id: "am-food-beverage", title: "Asisten Manager Food and Beverage", brm: 2, parents: ["manager"] }),

  position(BIDANG, { id: "asisten-marketing-fnb", title: "Asisten Marketing Food and Beverage", brm: 3, parents: ["am-food-beverage"] }),
  position(BIDANG, { id: "karyawan-marketing-fnb", title: "Karyawan Marketing Food and Beverage", brm: 5, parents: ["asisten-marketing-fnb"] }),

  // --- Wilayah I (Bogor, Sukabumi) -------------------------------------------
  position(BIDANG, { id: "asisten-operasional-fnb-1", title: "Asisten Operasional FNB Wilayah I", brm: 3, parents: ["am-food-beverage"], description: AREA_1 }),
  position(BIDANG, { id: "pengawas-resto-cafe-1", title: "Pengawas Resto Cafe Wilayah I", brm: 4, parents: ["asisten-operasional-fnb-1"], description: AREA_1 }),
  position(BIDANG, { id: "pj-resto-cafe-1", title: "Penanggung Jawab Resto Cafe", brm: 5, parents: ["pengawas-resto-cafe-1"], description: AREA_1, holders: 4 }),
  position(BIDANG, { id: "karyawan-resto-cafe-1", title: "Karyawan Pelaksana Resto Cafe", brm: 6, parents: ["pj-resto-cafe-1"], description: AREA_1 }),
  position(BIDANG, { id: "pengawas-catering-1", title: "Pengawas Catering Wilayah I", brm: 4, parents: ["asisten-operasional-fnb-1"], description: AREA_1 }),
  position(BIDANG, { id: "karyawan-catering-1", title: "Karyawan Pelaksana Catering", brm: 6, parents: ["pengawas-catering-1"], description: AREA_1 }),

  // --- Wilayah II (Bandung, Subang) ------------------------------------------
  position(BIDANG, { id: "asisten-operasional-fnb-2", title: "Asisten Operasional FNB Wilayah II", brm: 3, parents: ["am-food-beverage"], description: AREA_2 }),
  position(BIDANG, { id: "pengawas-resto-cafe-2", title: "Pengawas Resto Cafe Wilayah II", brm: 4, parents: ["asisten-operasional-fnb-2"], description: AREA_2 }),
  position(BIDANG, { id: "pj-resto-cafe-2", title: "Penanggung Jawab Resto Cafe", brm: 5, parents: ["pengawas-resto-cafe-2"], description: AREA_2, holders: 4 }),
  position(BIDANG, { id: "karyawan-resto-cafe-2", title: "Karyawan Pelaksana Resto Cafe", brm: 6, parents: ["pj-resto-cafe-2"], description: AREA_2 }),
  position(BIDANG, { id: "pengawas-catering-2", title: "Pengawas Catering Wilayah II", brm: 4, parents: ["asisten-operasional-fnb-2"], description: AREA_2 }),
  position(BIDANG, { id: "karyawan-catering-2", title: "Karyawan Pelaksana Catering", brm: 6, parents: ["pengawas-catering-2"], description: AREA_2 }),

  // --- Admin langsung di bawah Asisten Manager -------------------------------
  position(BIDANG, { id: "admin-1-keuangan-fnb", title: "Admin I Keuangan", brm: 4, parents: ["am-food-beverage"] }),
  position(BIDANG, { id: "admin-purchasing-fnb", title: "Admin Purchasing", brm: 5, parents: ["admin-1-keuangan-fnb"] }),
  position(BIDANG, { id: "admin-1-personalia-fnb", title: "Admin I Personalia", brm: 4, parents: ["am-food-beverage"] }),
];
