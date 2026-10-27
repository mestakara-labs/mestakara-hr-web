/**
 * LAMPIRAN IX.1 — Struktur Organisasi Unit Agrowisata (puncak).
 *
 * Hanya berisi Manager. Asisten Manager dan para Asisten yang juga digambar
 * di Lampiran IX.1 ditulis di file fungsinya masing-masing (02 … 09),
 * karena tiap lampiran fungsi menggambar ulang Asisten Manager-nya.
 */
import { position } from "./helpers";

/** Manager tidak masuk bidang mana pun. */
const BIDANG = null;

export const managerPositions = [
  position(BIDANG, { id: "manager", title: "Manager", brm: 1 }),
];
