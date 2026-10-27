/**
 * Menyusun KOTAK-KOTAK di bagan dan hubungan atasan–bawahannya.
 *
 * Aturan satu kotak:
 *   Bawahan sebuah kotak dikelompokkan PER JABATAN.
 *   - Jabatan dipegang 1 orang            -> 1 kotak.
 *   - Jabatan dipegang beberapa orang     -> digabung dalam 1 kotak (nama menumpuk ke bawah),
 *   - KECUALI setiap orang itu punya bawahan sendiri -> dipisah, 1 kotak per orang,
 *     supaya bawahan masing-masing tersambung ke atasannya sendiri.
 *
 *   Contoh:  4 Pengawas, masing-masing punya PJ    -> 4 kotak terpisah
 *            4 Admin Tata Buku, tanpa bawahan      -> 1 kotak berisi 4 nama
 *
 * Istilah:
 * - "atasan"  = kotak di `parentIds`
 * - "bawahan" = kotak yang menyebut kotak ini di `parentIds`-nya
 * - "dibuka"  = cabang kotak ini sedang terbuka (tombol + sudah diklik)
 */
import type { EmployeeResource, PositionResource } from "@/types/api/organization";

/** Satu kotak di bagan: satu jabatan + satu atau beberapa pegawai pemegangnya. */
export interface OrgCard {
  id: string;
  position: PositionResource;
  employees: EmployeeResource[];
  /** Kotak atasan langsung. Kosong untuk kotak paling atas. Bisa lebih dari satu. */
  parentIds: string[];
}

/** { "id-kotak": ["id-kotak-bawahan", ...], ... } — bawahan langsung setiap kotak. */
export type ChildrenMap = Map<string, string[]>;

/** Satu pegawai beserta jabatannya. */
export interface PersonWithPosition {
  employee: EmployeeResource;
  position: PositionResource;
}

/** Daftar semua pegawai beserta jabatannya (urutannya mengikuti urutan jabatan). */
export function buildPeople(positions: PositionResource[]): PersonWithPosition[] {
  return positions.flatMap((position) =>
    position.employees.map((employee) => ({ employee, position })),
  );
}

/**
 * Susun semua kotak, mulai dari pimpinan paling atas lalu turun ke bawahannya.
 *
 * Setiap "orang" di bagan sebenarnya satu PENUGASAN (`assignment_id`), karena satu
 * karyawan bisa memegang dua jabatan (mis. Definitif + Plt) dan muncul di dua kotak.
 *
 * Langkahnya untuk setiap kotak:
 *   1. Kumpulkan semua bawahan langsung dari orang-orang di kotak itu.
 *   2. Kelompokkan bawahan tersebut per jabatan.
 *   3. Setiap kelompok jadi 1 kotak, atau dipecah per orang (lihat aturan di atas).
 */
export function buildOrgCards(positions: PositionResource[]): OrgCard[] {
  // Daftar semua pegawai, dan siapa bawahan langsung setiap penugasan.
  const people = buildPeople(positions);
  const subordinatesOf = (assignmentId: string) =>
    people.filter((person) => person.employee.supervisor_assignment_ids.includes(assignmentId));

  const cards: OrgCard[] = [];
  /** Kotak tempat setiap penugasan berada: { "penugasan-0001": kotak, ... } */
  const cardOfAssignment = new Map<string, OrgCard>();

  /** Buat kotak baru untuk sekelompok pegawai, lalu catat. */
  function addCard(group: PersonWithPosition[], parentId: string | null): OrgCard {
    const firstAssignmentId = group[0].employee.assignment_id;
    const card: OrgCard = {
      // Kotak 1 orang memakai id penugasan; kotak gabungan memakai id jabatan + penugasan pertama.
      id: group.length === 1 ? firstAssignmentId : `${group[0].position.id}--${firstAssignmentId}`,
      position: group[0].position,
      employees: group.map((person) => person.employee),
      parentIds: parentId ? [parentId] : [],
    };

    cards.push(card);
    for (const person of group) cardOfAssignment.set(person.employee.assignment_id, card);

    return card;
  }

  // Mulai dari pimpinan paling atas (pegawai tanpa atasan).
  const queue: OrgCard[] = people
    .filter((person) => person.employee.supervisor_assignment_ids.length === 0)
    .map((person) => addCard([person], null));

  while (queue.length > 0) {
    const card = queue.shift()!;

    // Langkah 1: bawahan langsung dari semua orang di kotak ini.
    const subordinates = card.employees.flatMap((employee) => subordinatesOf(employee.assignment_id));

    // Langkah 2: kelompokkan per jabatan (urutannya mengikuti urutan data).
    const groups = new Map<string, PersonWithPosition[]>();

    for (const person of subordinates) {
      // Orang dengan dua atasan cukup dibuatkan kotak sekali; atasan keduanya
      // hanya ditambahkan sebagai garis tambahan.
      const existingCard = cardOfAssignment.get(person.employee.assignment_id);
      if (existingCard) {
        if (!existingCard.parentIds.includes(card.id)) existingCard.parentIds.push(card.id);
        continue;
      }

      const group = groups.get(person.position.id) ?? [];
      group.push(person);
      groups.set(person.position.id, group);
    }

    // Langkah 3: satu kotak per kelompok, atau dipecah per orang.
    for (const group of groups.values()) {
      const everyoneHasSubordinates = group.every(
        (person) => subordinatesOf(person.employee.assignment_id).length > 0,
      );

      if (group.length > 1 && everyoneHasSubordinates) {
        for (const person of group) queue.push(addCard([person], card.id));
      } else {
        queue.push(addCard(group, card.id));
      }
    }
  }

  return cards;
}

/** { "id-kotak": {...kotak}, ... } — supaya kotak mudah dicari berdasarkan id. */
export function buildCardsById(cards: OrgCard[]): Map<string, OrgCard> {
  return new Map(cards.map((card) => [card.id, card]));
}

/** Kumpulkan bawahan langsung setiap kotak. */
export function buildChildrenMap(cards: OrgCard[]): ChildrenMap {
  const childrenMap: ChildrenMap = new Map();

  for (const card of cards) {
    for (const parentId of card.parentIds) {
      const children = childrenMap.get(parentId) ?? [];
      children.push(card.id);
      childrenMap.set(parentId, children);
    }
  }

  return childrenMap;
}

/**
 * Kotak yang cabangnya langsung dibuka saat halaman pertama tampil: BRM-1 (Manager)
 * dan BRM-2 (Asisten Manager). Hasilnya, yang terlihat adalah
 * Manager, Asisten Manager, dan para Asisten di bawahnya.
 */
export function getInitialExpandedIds(cards: OrgCard[]): Set<string> {
  const expandedIds = new Set<string>();

  for (const card of cards) {
    if (card.position.brm_level <= 2) {
      expandedIds.add(card.id);
    }
  }

  return expandedIds;
}

/**
 * Cari kotak yang tampil di bagan.
 *
 * Aturannya:
 * 1. Kotak paling atas (tanpa atasan) selalu tampil.
 * 2. Kotak lain tampil kalau MINIMAL SATU atasannya tampil DAN cabangnya sedang dibuka.
 *    (Ada kotak dengan dua atasan, mis. Admin Pengembangan Bisnis.)
 */
export function findVisibleIds(
  cards: OrgCard[],
  childrenMap: ChildrenMap,
  expandedIds: Set<string>,
): Set<string> {
  const visibleIds = new Set<string>();

  // Mulai dari kotak paling atas.
  const queue: string[] = cards.filter((card) => card.parentIds.length === 0).map((card) => card.id);

  // Telusuri ke bawah, tapi hanya lewat cabang yang sedang dibuka.
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visibleIds.has(id)) continue;

    visibleIds.add(id);

    if (expandedIds.has(id)) {
      queue.push(...(childrenMap.get(id) ?? []));
    }
  }

  return visibleIds;
}

/**
 * Semua atasan sebuah kotak sampai ke puncak (atasan, atasannya atasan, dst).
 * Dipakai saat mencari jabatan: semua atasannya dibuka supaya kotak itu terlihat.
 */
export function findAncestorIds(cardId: string, cardsById: Map<string, OrgCard>): string[] {
  const ancestorIds: string[] = [];
  const queue = [...(cardsById.get(cardId)?.parentIds ?? [])];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (ancestorIds.includes(id)) continue;

    ancestorIds.push(id);
    queue.push(...(cardsById.get(id)?.parentIds ?? []));
  }

  return ancestorIds;
}
