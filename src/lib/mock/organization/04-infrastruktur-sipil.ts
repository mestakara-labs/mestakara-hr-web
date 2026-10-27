/** LAMPIRAN IX.4 — Fungsi: Infrastruktur dan Sipil */
import { DIVISION_IDS } from "./divisions";
import { position } from "./helpers";

const BIDANG = DIVISION_IDS.infrastrukturSipil;

export const infrastrukturSipilPositions = [
  position(BIDANG, { id: "am-infrastruktur-sipil", title: "Asisten Manager Infrastruktur dan Sipil", brm: 2, parents: ["manager"] }),

  position(BIDANG, { id: "asisten-it", title: "Asisten IT", brm: 3, parents: ["am-infrastruktur-sipil"] }),
  position(BIDANG, { id: "pengawas-it", title: "Pengawas IT", brm: 4, parents: ["asisten-it"] }),

  // Di SK tertulis "Admin I"; ditambah nama fungsinya supaya mudah dicari.
  position(BIDANG, { id: "admin-1-infrastruktur-sipil", title: "Admin I Infrastruktur dan Sipil", brm: 4, parents: ["am-infrastruktur-sipil"] }),
  // Di bawah Admin I (garis staffing).
  position(BIDANG, { id: "karyawan-infrastruktur-sipil", title: "Karyawan Infrastruktur & Sipil", brm: 6, parents: ["admin-1-infrastruktur-sipil"] }),

  position(BIDANG, { id: "asisten-infrastruktur-sipil", title: "Asisten Infrastruktur & Sipil", brm: 3, parents: ["am-infrastruktur-sipil"] }),
  position(BIDANG, { id: "pengawas-sipil", title: "Pengawas Sipil", brm: 4, parents: ["asisten-infrastruktur-sipil"] }),
  position(BIDANG, { id: "pengawas-infrastruktur", title: "Pengawas Infrastruktur", brm: 4, parents: ["asisten-infrastruktur-sipil"] }),

  position(BIDANG, { id: "asisten-teknik", title: "Asisten Teknik", brm: 3, parents: ["am-infrastruktur-sipil"] }),
  position(BIDANG, { id: "pengawas-teknik", title: "Pengawas Teknik Mesin, Instalasi Air & Listrik, Kendaraan", brm: 4, parents: ["asisten-teknik"] }),
];
