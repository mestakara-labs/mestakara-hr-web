/** LAMPIRAN IX.3 — Fungsi: Umum dan Legal */
import { DIVISION_IDS } from "./divisions";
import { position } from "./helpers";

const BIDANG = DIVISION_IDS.umumLegal;

export const umumLegalPositions = [
  position(BIDANG, { id: "am-umum-legal", title: "Asisten Manager Umum dan Legal", brm: 2, parents: ["manager"] }),

  position(BIDANG, { id: "asisten-umum", title: "Asisten Umum", brm: 3, parents: ["am-umum-legal"] }),
  position(BIDANG, { id: "admin-1-umum", title: "Admin I Umum", brm: 4, parents: ["asisten-umum"] }),
  position(BIDANG, { id: "admin-asuransi-kesehatan", title: "Admin Asuransi & Kesehatan", brm: 5, parents: ["admin-1-umum"] }),
  position(BIDANG, { id: "admin-umum", title: "Admin Umum", brm: 5, parents: ["admin-1-umum"], holders: 4 }),
  position(BIDANG, { id: "pelayan-kantor", title: "Pelayan Kantor", brm: 6, parents: ["admin-umum"] }),
  position(BIDANG, { id: "danton", title: "Danton", brm: 5, parents: ["admin-1-umum"], holders: 4 }),
  position(BIDANG, { id: "satpam", title: "Satpam", brm: 6, parents: ["danton"], holders: 4 }),

  position(BIDANG, { id: "asisten-legal", title: "Asisten Legal", brm: 3, parents: ["am-umum-legal"] }),
  position(BIDANG, { id: "admin-1-legal", title: "Admin I Legal", brm: 4, parents: ["asisten-legal"] }),
  position(BIDANG, { id: "admin-legal", title: "Admin Legal", brm: 5, parents: ["admin-1-legal"], holders: 4 }),
];
