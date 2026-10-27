/** LAMPIRAN IX.9 — Fungsi: Marketing dan Sales */
import { DIVISION_IDS } from "./divisions";
import { position } from "./helpers";

const BIDANG = DIVISION_IDS.marketingSales;

export const marketingSalesPositions = [
  position(BIDANG, { id: "am-marketing-sales", title: "Asisten Manager Marketing dan Sales", brm: 2, parents: ["manager"] }),

  position(BIDANG, { id: "asisten-marketing", title: "Asisten Marketing", brm: 3, parents: ["am-marketing-sales"] }),
  // Di SK tertulis "Costumer Relation" dan "Creatif Design" (salah ketik), di sini sudah dikoreksi.
  position(BIDANG, { id: "customer-relation", title: "Customer Relation", brm: 4, parents: ["asisten-marketing"] }),
  position(BIDANG, { id: "social-media-specialist", title: "Social Media Specialist", brm: 4, parents: ["asisten-marketing"] }),
  position(BIDANG, { id: "creative-design", title: "Creative Design", brm: 4, parents: ["asisten-marketing"] }),

  position(BIDANG, { id: "asisten-sales", title: "Asisten Sales", brm: 3, parents: ["am-marketing-sales"] }),
  position(BIDANG, { id: "pengawas-sales-room", title: "Pengawas Sales Room", brm: 4, parents: ["asisten-sales"] }),
  position(BIDANG, { id: "karyawan-sales-room", title: "Karyawan Pelaksana Sales Room", brm: 6, parents: ["pengawas-sales-room"] }),
  position(BIDANG, { id: "pengawas-sales-event", title: "Pengawas Sales Event", brm: 4, parents: ["asisten-sales"] }),
  position(BIDANG, { id: "karyawan-sales-event", title: "Karyawan Pelaksana Sales Event", brm: 6, parents: ["pengawas-sales-event"] }),
  position(BIDANG, { id: "pengawas-front-office", title: "Pengawas Front Office", brm: 4, parents: ["asisten-sales"] }),
  position(BIDANG, { id: "karyawan-front-office", title: "Karyawan Pelaksana Front Office", brm: 6, parents: ["pengawas-front-office"] }),
];
