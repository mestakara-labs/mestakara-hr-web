/** LAMPIRAN IX.5 — Fungsi: Pengembangan Bisnis */
import { DIVISION_IDS } from "./divisions";
import { position } from "./helpers";

const BIDANG = DIVISION_IDS.pengembanganBisnis;

const AREA_1 = "Bandung, Subang, Purwakarta, Garut, Tasik, Ciamis";
const AREA_2 = "Sukabumi, Cianjur, Bogor, Rangkasbitung, Lebak, Pandeglang";

export const pengembanganBisnisPositions = [
  position(BIDANG, { id: "am-pengembangan-bisnis", title: "Asisten Manager Pengembangan Bisnis", brm: 2, parents: ["manager"] }),

  position(BIDANG, { id: "asisten-pengembangan-bisnis-1", title: "Asisten Pengembangan Bisnis I", brm: 3, parents: ["am-pengembangan-bisnis"], description: AREA_1 }),
  position(BIDANG, { id: "pengawas-pengembangan-bisnis-1", title: "Pengawas Pengembangan Bisnis I", brm: 4, parents: ["asisten-pengembangan-bisnis-1"], description: AREA_1 }),

  position(BIDANG, { id: "asisten-pengembangan-bisnis-2", title: "Asisten Pengembangan Bisnis II", brm: 3, parents: ["am-pengembangan-bisnis"], description: AREA_2 }),
  position(BIDANG, { id: "pengawas-pengembangan-bisnis-2", title: "Pengawas Pengembangan Bisnis II", brm: 4, parents: ["asisten-pengembangan-bisnis-2"], description: AREA_2 }),

  // Di SK, Admin Pengembangan Bisnis bertanggung jawab ke DUA pengawas sekaligus.
  position(BIDANG, { id: "admin-pengembangan-bisnis", title: "Admin Pengembangan Bisnis", brm: 5, parents: ["pengawas-pengembangan-bisnis-1", "pengawas-pengembangan-bisnis-2"] }),
];
