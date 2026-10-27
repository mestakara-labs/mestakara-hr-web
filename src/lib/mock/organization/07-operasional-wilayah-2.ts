/** LAMPIRAN IX.7 — Operasional Wilayah II (Ciwidey, Pangalengan, Sukawana dan Ciater) */
import { DIVISION_IDS } from "./divisions";
import { position } from "./helpers";

const BIDANG = DIVISION_IDS.operasional;
const AREA = "Ciwidey, Pangalengan, Sukawana dan Ciater";

export const operasionalWilayah2Positions = [
  position(BIDANG, { id: "am-operasional-wilayah-2", title: "Asisten Manager Operasional Wilayah II", brm: 2, parents: ["manager"], description: AREA }),

  // Admin Operasional: di bawah Asisten Manager.
  position(BIDANG, { id: "admin-operasional-wilayah-2", title: "Admin Operasional Wilayah II", brm: 5, parents: ["am-operasional-wilayah-2"], holders: 4 }),

  // --- Asisten Operasional II ----------------------------------------------
  position(BIDANG, { id: "asisten-operasional-2", title: "Asisten Operasional II", brm: 3, parents: ["am-operasional-wilayah-2"], description: AREA }),

  position(BIDANG, { id: "pengawas-teknik-pemeliharaan-2", title: "Pengawas Teknik & Pemeliharaan II", brm: 4, parents: ["asisten-operasional-2"], holders: 4 }),
  position(BIDANG, { id: "pj-teknik-listrik-air-2", title: "Penanggung Jawab Teknik Instalasi Listrik & Air", brm: 5, parents: ["pengawas-teknik-pemeliharaan-2"], holders: 4 }),
  position(BIDANG, { id: "pelaksana-teknik-listrik-air-2", title: "Pelaksana Teknik Instalasi Listrik & Air", brm: 6, parents: ["pj-teknik-listrik-air-2"] }),
  position(BIDANG, { id: "pj-teknik-wahana-kendaraan-2", title: "Penanggung Jawab Teknik Wahana & Kendaraan", brm: 5, parents: ["pengawas-teknik-pemeliharaan-2"], holders: 4 }),
  position(BIDANG, { id: "pelaksana-teknik-wahana-kendaraan-2", title: "Pelaksana Teknik Wahana & Kendaraan", brm: 6, parents: ["pj-teknik-wahana-kendaraan-2"] }),
  position(BIDANG, { id: "pj-pemeliharaan-kebersihan-2", title: "Penanggung Jawab Pemeliharaan Kebersihan", brm: 5, parents: ["pengawas-teknik-pemeliharaan-2"] }),
  position(BIDANG, { id: "pelaksana-kebersihan-2", title: "Pelaksana Kebersihan", brm: 6, parents: ["pj-pemeliharaan-kebersihan-2"] }),
  position(BIDANG, { id: "pj-pemeliharaan-pertamanan-2", title: "Penanggung Jawab Pemeliharaan Pertamanan", brm: 5, parents: ["pengawas-teknik-pemeliharaan-2"] }),
  position(BIDANG, { id: "pelaksana-pertamanan-2", title: "Pelaksana Pertamanan", brm: 6, parents: ["pj-pemeliharaan-pertamanan-2"] }),
  position(BIDANG, { id: "pj-pemeliharaan-sipil-2", title: "Penanggung Jawab Pemeliharaan Sipil", brm: 5, parents: ["pengawas-teknik-pemeliharaan-2"] }),
  position(BIDANG, { id: "pelaksana-sipil-2", title: "Pelaksana Sipil", brm: 6, parents: ["pj-pemeliharaan-sipil-2"] }),

  position(BIDANG, { id: "pengawas-pelayanan-2", title: "Pengawas Pelayanan II", brm: 4, parents: ["asisten-operasional-2"] }),
  position(BIDANG, { id: "pj-ticketing-2", title: "Penanggung Jawab Ticketing", brm: 5, parents: ["pengawas-pelayanan-2"] }),
  position(BIDANG, { id: "pelaksana-ticketing-2", title: "Pelaksana Ticketing", brm: 6, parents: ["pj-ticketing-2"] }),
  position(BIDANG, { id: "pj-house-keeping-2", title: "Penanggung Jawab House Keeping", brm: 5, parents: ["pengawas-pelayanan-2"], holders: 4 }),
  position(BIDANG, { id: "pelaksana-house-keeping-2", title: "Pelaksana House Keeping", brm: 6, parents: ["pj-house-keeping-2"] }),
  position(BIDANG, { id: "pj-wahana-2", title: "Penanggung Jawab Wahana", brm: 5, parents: ["pengawas-pelayanan-2"], holders: 4 }),
  position(BIDANG, { id: "pelaksana-wahana-2", title: "Pelaksana Wahana", brm: 6, parents: ["pj-wahana-2"] }),

  // --- Asisten Tanaman II --------------------------------------------------
  position(BIDANG, { id: "asisten-tanaman-2", title: "Asisten Tanaman II", brm: 3, parents: ["am-operasional-wilayah-2"], description: AREA }),

  position(BIDANG, { id: "mandor-1-tanaman-2", title: "Mandor I Tanaman II", brm: 4, parents: ["asisten-tanaman-2"] }),
  position(BIDANG, { id: "mandor-panen-2", title: "Mandor Panen", brm: 5, parents: ["mandor-1-tanaman-2"] }),
  position(BIDANG, { id: "pelaksana-panen-2", title: "Pelaksana Panen", brm: 6, parents: ["mandor-panen-2"] }),
  position(BIDANG, { id: "mandor-rawat-umum-2", title: "Mandor Rawat Umum", brm: 5, parents: ["mandor-1-tanaman-2"] }),
  position(BIDANG, { id: "pelaksana-rawat-umum-2", title: "Pelaksana Rawat Umum", brm: 6, parents: ["mandor-rawat-umum-2"] }),
  position(BIDANG, { id: "mandor-hama-penyakit-2", title: "Mandor Hama Penyakit", brm: 5, parents: ["mandor-1-tanaman-2"] }),
  position(BIDANG, { id: "pelaksana-hama-penyakit-2", title: "Pelaksana Hama Penyakit", brm: 6, parents: ["mandor-hama-penyakit-2"] }),

  position(BIDANG, { id: "admin-1-tanaman-2", title: "Admin I Tanaman II", brm: 4, parents: ["asisten-tanaman-2"] }),
  position(BIDANG, { id: "admin-tanaman-2", title: "Admin Tanaman", brm: 5, parents: ["admin-1-tanaman-2"], holders: 4 }),
];
