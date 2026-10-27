"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@mestakara/ui/button";
import { Checkbox } from "@mestakara/ui/checkbox";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@mestakara/ui/input-group";

import type { FilterOption } from "./dataTableFeatures";

interface FilterChecklistProps {
  options: FilterOption[];
  /** Nilai yang sedang dicentang */
  selected: string[];
  onChange: (values: string[]) => void;
}

/**
 * Daftar centang ala filter Excel:
 *
 *   [🔍 Cari nilai...        ]
 *   Pilih semua (6)     Kosongkan
 *   ☑ BRM-1
 *   ☐ BRM-2
 *   ...
 */
export function FilterChecklist({ options, selected, onChange }: FilterChecklistProps) {
  const [query, setQuery] = useState("");

  const keyword = query.trim().toLowerCase();
  const matchingOptions = options.filter((option) => option.label.toLowerCase().includes(keyword));

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  /** Centang semua nilai yang sedang tampil (hasil pencarian). */
  function selectAllMatching() {
    const matchingValues = matchingOptions.map((option) => option.value);
    onChange([...new Set([...selected, ...matchingValues])]);
  }

  return (
    <div className="flex flex-col gap-3">
      <InputGroup>
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nilai..."
          aria-label="Cari nilai filter"
        />
      </InputGroup>

      <div className="flex items-center justify-between">
        <Button variant="link" size="sm" className="h-auto px-0" disabled={matchingOptions.length === 0} onClick={selectAllMatching}>
          Pilih semua{keyword ? " hasil" : ""} ({matchingOptions.length})
        </Button>
        <Button variant="link" size="sm" className="h-auto px-0 text-fg-secondary" disabled={selected.length === 0} onClick={() => onChange([])}>
          Kosongkan
        </Button>
      </div>

      <div className="max-h-72 overflow-y-auto rounded-md border border-border py-1">
        {matchingOptions.length === 0 && (
          <p className="px-3 py-4 text-center typo-body-s text-fg-tertiary">Tidak ada yang cocok</p>
        )}

        {matchingOptions.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2.5 px-3 py-2 typo-body-m text-fg-primary hover:bg-subtle"
          >
            <Checkbox checked={selected.includes(option.value)} onCheckedChange={() => toggle(option.value)} />
            <span className="truncate">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
