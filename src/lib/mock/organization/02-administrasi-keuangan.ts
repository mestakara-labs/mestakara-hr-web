/** LAMPIRAN IX.2 — Fungsi: Administrasi & Keuangan */
import { DIVISION_IDS } from "./divisions";
import { position } from "./helpers";

const BIDANG = DIVISION_IDS.administrasiKeuangan;

export const administrasiKeuanganPositions = [
  position(BIDANG, { id: "am-administrasi-keuangan", title: "Asisten Manager Administrasi dan Keuangan", brm: 2, parents: ["manager"] }),

  // Asisten Verifikasi: di Lampiran IX.1 bertanggung jawab langsung ke Manager (garis staffing).
  position(BIDANG, { id: "asisten-verifikasi", title: "Asisten Verifikasi", brm: 3, parents: ["manager"] }),
  position(BIDANG, { id: "admin-1-verifikasi", title: "Admin I Verifikasi", brm: 4, parents: ["asisten-verifikasi"] }),
  position(BIDANG, { id: "admin-verifikasi", title: "Admin Verifikasi", brm: 5, parents: ["admin-1-verifikasi"] }),

  position(BIDANG, { id: "asisten-tata-usaha", title: "Asisten Tata Usaha", brm: 3, parents: ["am-administrasi-keuangan"] }),
  position(BIDANG, { id: "admin-1-tata-usaha", title: "Admin I Tata Usaha", brm: 4, parents: ["asisten-tata-usaha"] }),
  position(BIDANG, { id: "admin-tata-buku", title: "Admin Tata Buku", brm: 5, parents: ["admin-1-tata-usaha"], holders: 4 }),
  position(BIDANG, { id: "admin-gudang", title: "Admin Gudang", brm: 5, parents: ["admin-1-tata-usaha"] }),
  position(BIDANG, { id: "karyawan-gudang", title: "Karyawan Gudang", brm: 6, parents: ["admin-gudang"], holders: 4 }),
  position(BIDANG, { id: "admin-pengadaan", title: "Admin Pengadaan", brm: 5, parents: ["admin-1-tata-usaha"], holders: 4 }),
  position(BIDANG, { id: "admin-1-kas-bank", title: "Admin I Kas Bank", brm: 4, parents: ["asisten-tata-usaha"] }),
  position(BIDANG, { id: "admin-kas-bank", title: "Admin Kas Bank", brm: 5, parents: ["admin-1-kas-bank"], holders: 4 }),

  position(BIDANG, { id: "asisten-personalia", title: "Asisten Personalia", brm: 3, parents: ["am-administrasi-keuangan"] }),
  position(BIDANG, { id: "admin-1-personalia-upah", title: "Admin I Personalia dan Upah", brm: 4, parents: ["asisten-personalia"] }),
  position(BIDANG, { id: "admin-personalia-upah", title: "Admin Personalia dan Upah", brm: 5, parents: ["admin-1-personalia-upah"], holders: 4 }),
];
