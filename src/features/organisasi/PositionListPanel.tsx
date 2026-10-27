"use client";

import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Badge } from "@mestakara/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@mestakara/ui/collapsible";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@mestakara/ui/input-group";

import type { PositionResource } from "@/types/api/organization";

interface PositionListPanelProps {
  positions: PositionResource[];
  /** Dipanggil saat sebuah jabatan diklik: bagan digeser ke jabatan itu. */
  onSelectPosition: (positionId: string) => void;
}

/**
 * Panel daftar jabatan (sebelah kiri bagan):
 * - kotak pencarian: cari berdasarkan nama jabatan ATAU nama pegawai
 * - jabatan dikelompokkan per bidang (master Bidang), lengkap dengan jumlahnya
 */
export function PositionListPanel({ positions, onSelectPosition }: PositionListPanelProps) {
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const isSearching = query.trim() !== "";
  const matchingPositions = positions.filter((position) => matchesQuery(position, query));
  const groups = groupByDivision(matchingPositions);

  function toggleGroup(bidang: string) {
    if (openGroups.includes(bidang)) {
      setOpenGroups(openGroups.filter((name) => name !== bidang));
    } else {
      setOpenGroups([...openGroups, bidang]);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Pencarian */}
      <div className="border-b border-border p-3">
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari jabatan atau pegawai"
            aria-label="Cari jabatan atau pegawai"
          />
        </InputGroup>
      </div>

      {/* Daftar per bidang */}
      <div className="flex-1 overflow-y-auto p-2">
        {groups.length === 0 && (
          <p className="p-3 text-center typo-body-s text-fg-tertiary">Tidak ada hasil.</p>
        )}

        {groups.map((group) => (
          <Collapsible
            key={group.bidang}
            // Saat mencari, semua kelompok terbuka supaya hasilnya langsung terlihat.
            open={isSearching || openGroups.includes(group.bidang)}
            onOpenChange={() => toggleGroup(group.bidang)}
          >
            <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left typo-label-m text-fg-primary hover:bg-subtle">
              <ChevronRight className="size-4 shrink-0 text-fg-tertiary transition-transform group-data-[state=open]:rotate-90" />
              <span className="flex-1">{group.bidang}</span>
              <Badge variant="neutral" dot={false}>
                {group.positions.length}
              </Badge>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <ul className="mb-2 ml-4 border-l border-border pl-2">
                {group.positions.map((position) => (
                  <li key={position.id}>
                    <button
                      type="button"
                      onClick={() => onSelectPosition(position.id)}
                      className="w-full rounded-md px-2 py-1.5 text-left hover:bg-subtle"
                    >
                      <span className="block typo-body-s font-medium text-fg-primary">
                        {position.title}
                      </span>
                      <span className="block truncate typo-body-s text-fg-tertiary">
                        {describeHolders(position)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}

/** Cocokkan kata pencarian dengan nama jabatan atau nama salah satu pegawainya. */
function matchesQuery(position: PositionResource, query: string): boolean {
  const keyword = query.trim().toLowerCase();
  if (keyword === "") return true;

  const titleMatches = position.title.toLowerCase().includes(keyword);
  const employeeMatches = position.employees.some((employee) =>
    employee.name.toLowerCase().includes(keyword),
  );

  return titleMatches || employeeMatches;
}

/** Nama kelompok untuk jabatan tanpa bidang, mis. Manager (BRM-1). */
const NO_DIVISION_GROUP = "Pimpinan";

/** Kelompokkan jabatan per bidang, urutannya mengikuti urutan data. */
function groupByDivision(positions: PositionResource[]) {
  const groups: { bidang: string; positions: PositionResource[] }[] = [];

  for (const position of positions) {
    const bidang = position.division_name ?? NO_DIVISION_GROUP;
    let group = groups.find((item) => item.bidang === bidang);

    if (!group) {
      group = { bidang, positions: [] };
      groups.push(group);
    }

    group.positions.push(position);
  }

  return groups;
}

/** "Asep Saepudin" kalau satu orang, "4 orang" kalau lebih. */
function describeHolders(position: PositionResource): string {
  // Bagan digambar per orang, jadi jabatan tanpa pegawai belum muncul di bagan.
  if (position.employees.length === 0) return "Belum ada pegawai";
  if (position.employees.length === 1) return position.employees[0].name;
  return `${position.employees.length} orang`;
}
