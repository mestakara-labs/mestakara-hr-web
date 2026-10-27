/** LAMPIRAN IX.6 — Operasional Wilayah I (Gunung Mas dan Sukabumi) */
import { DIVISION_IDS } from "./divisions";
import { position } from "./helpers";

const BIDANG = DIVISION_IDS.operasional;
const AREA = "Gunung Mas dan Sukabumi";

export const operasionalWilayah1Positions = [
  position(BIDANG, { id: "am-operasional-wilayah-1", title: "Asisten Manager Operasional Wilayah I", brm: 2, parents: ["manager"], description: AREA }),

  // Admin Operasional: di bawah Asisten Manager.
  position(BIDANG, { id: "admin-operasional-wilayah-1", title: "Admin Operasional Wilayah I", brm: 5, parents: ["am-operasional-wilayah-1"], holders: 4 }),

  // --- Asisten Operasional I ------------------------------------------------
  position(BIDANG, { id: "asisten-operasional-1", title: "Asisten Operasional I", brm: 3, parents: ["am-operasional-wilayah-1"], description: AREA }),

  position(BIDANG, { id: "pengawas-teknik-pemeliharaan-1", title: "Pengawas Teknik & Pemeliharaan I", brm: 4, parents: ["asisten-operasional-1"], holders: 4 }),
  position(BIDANG, { id: "pj-teknik-listrik-air-1", title: "Penanggung Jawab Teknik Instalasi Listrik & Air", brm: 5, parents: ["pengawas-teknik-pemeliharaan-1"], holders: 4 }),
  position(BIDANG, { id: "pelaksana-teknik-listrik-air-1", title: "Pelaksana Teknik Instalasi Listrik & Air", brm: 6, parents: ["pj-teknik-listrik-air-1"] }),
  position(BIDANG, { id: "pj-teknik-wahana-kendaraan-1", title: "Penanggung Jawab Teknik Wahana & Kendaraan", brm: 5, parents: ["pengawas-teknik-pemeliharaan-1"], holders: 4 }),
  position(BIDANG, { id: "pelaksana-teknik-wahana-kendaraan-1", title: "Pelaksana Teknik Wahana & Kendaraan", brm: 6, parents: ["pj-teknik-wahana-kendaraan-1"] }),
  position(BIDANG, { id: "pj-pemeliharaan-kebersihan-1", title: "Penanggung Jawab Pemeliharaan Kebersihan", brm: 5, parents: ["pengawas-teknik-pemeliharaan-1"] }),
  position(BIDANG, { id: "pelaksana-kebersihan-1", title: "Pelaksana Kebersihan", brm: 6, parents: ["pj-pemeliharaan-kebersihan-1"] }),
  position(BIDANG, { id: "pj-pemeliharaan-pertamanan-1", title: "Penanggung Jawab Pemeliharaan Pertamanan", brm: 5, parents: ["pengawas-teknik-pemeliharaan-1"] }),
  position(BIDANG, { id: "pelaksana-pertamanan-1", title: "Pelaksana Pertamanan", brm: 6, parents: ["pj-pemeliharaan-pertamanan-1"] }),
  position(BIDANG, { id: "pj-pemeliharaan-sipil-1", title: "Penanggung Jawab Pemeliharaan Sipil", brm: 5, parents: ["pengawas-teknik-pemeliharaan-1"] }),
  position(BIDANG, { id: "pelaksana-sipil-1", title: "Pelaksana Sipil", brm: 6, parents: ["pj-pemeliharaan-sipil-1"] }),

  position(BIDANG, { id: "pengawas-pelayanan-1", title: "Pengawas Pelayanan I", brm: 4, parents: ["asisten-operasional-1"] }),
  position(BIDANG, { id: "pj-ticketing-1", title: "Penanggung Jawab Ticketing", brm: 5, parents: ["pengawas-pelayanan-1"] }),
  position(BIDANG, { id: "pelaksana-ticketing-1", title: "Pelaksana Ticketing", brm: 6, parents: ["pj-ticketing-1"] }),
  position(BIDANG, { id: "pj-house-keeping-1", title: "Penanggung Jawab House Keeping", brm: 5, parents: ["pengawas-pelayanan-1"], holders: 4 }),
  position(BIDANG, { id: "pelaksana-house-keeping-1", title: "Pelaksana House Keeping", brm: 6, parents: ["pj-house-keeping-1"] }),
  position(BIDANG, { id: "pj-wahana-1", title: "Penanggung Jawab Wahana", brm: 5, parents: ["pengawas-pelayanan-1"], holders: 4 }),
  position(BIDANG, { id: "pelaksana-wahana-1", title: "Pelaksana Wahana", brm: 6, parents: ["pj-wahana-1"] }),

  // --- Asisten Tanaman I ----------------------------------------------------
  position(BIDANG, { id: "asisten-tanaman-1", title: "Asisten Tanaman I", brm: 3, parents: ["am-operasional-wilayah-1"], description: AREA }),

  position(BIDANG, { id: "mandor-1-tanaman-1", title: "Mandor I Tanaman I", brm: 4, parents: ["asisten-tanaman-1"] }),
  position(BIDANG, { id: "mandor-panen-1", title: "Mandor Panen", brm: 5, parents: ["mandor-1-tanaman-1"] }),
  position(BIDANG, { id: "pelaksana-panen-1", title: "Pelaksana Panen", brm: 6, parents: ["mandor-panen-1"] }),
  position(BIDANG, { id: "mandor-rawat-umum-1", title: "Mandor Rawat Umum", brm: 5, parents: ["mandor-1-tanaman-1"] }),
  position(BIDANG, { id: "pelaksana-rawat-umum-1", title: "Pelaksana Rawat Umum", brm: 6, parents: ["mandor-rawat-umum-1"] }),
  position(BIDANG, { id: "mandor-hama-penyakit-1", title: "Mandor Hama Penyakit", brm: 5, parents: ["mandor-1-tanaman-1"] }),
  position(BIDANG, { id: "pelaksana-hama-penyakit-1", title: "Pelaksana Hama Penyakit", brm: 6, parents: ["mandor-hama-penyakit-1"] }),

  position(BIDANG, { id: "admin-1-tanaman-1", title: "Admin I Tanaman I", brm: 4, parents: ["asisten-tanaman-1"] }),
  position(BIDANG, { id: "admin-tanaman-1", title: "Admin Tanaman", brm: 5, parents: ["admin-1-tanaman-1"], holders: 4 }),
];
