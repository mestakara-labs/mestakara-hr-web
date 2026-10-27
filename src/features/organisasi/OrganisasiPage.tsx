"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { Alert, AlertDescription } from "@mestakara/ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@mestakara/ui/sheet";
import { Spinner } from "@mestakara/ui/spinner";

import type { EmployeeResource, OrganizationResource, PositionResource } from "@/types/api/organization";

import { buildOrgChart } from "./build-org-chart";
import { EmployeeDetailSheet, type SelectedEmployee } from "./EmployeeDetailSheet";
import { NODE_WIDTH } from "./node-size";
import { OrgChart } from "./OrgChart";
import { buildCardsById, buildOrgCards, findAncestorIds, getInitialExpandedIds } from "./org-tree";
import { OrgToolbar } from "./OrgToolbar";
import { PositionListPanel } from "./PositionListPanel";
import { useOrganization } from "./useOrganization";

/**
 * Halaman Struktur Organisasi.
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │ OrgToolbar (judul, info SK, Buka/Tutup/Atur Ulang)   │
 *   ├────────────────────┬─────────────────────────────────┤
 *   │ PositionListPanel  │ OrgChart (bagan React Flow)     │
 *   │ (layar lebar saja) │                                 │
 *   └────────────────────┴─────────────────────────────────┘
 *   + EmployeeDetailSheet (panel samping saat kartu pegawai diklik)
 *
 * Komponen ini hanya mengurus loading/error. Isi halamannya ada di OrganisasiContent.
 */
export function OrganisasiPage() {
  const { organization, loading, error } = useOrganization();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-fg-tertiary">
        <Spinner />
        <p className="typo-body-s">Memuat struktur organisasi...</p>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <Alert variant="danger">
        <AlertDescription>{error ?? "Data struktur organisasi kosong."}</AlertDescription>
      </Alert>
    );
  }

  return (
    // ReactFlowProvider supaya tombol di luar bagan (toolbar, daftar jabatan)
    // bisa ikut menggerakkan bagan lewat useReactFlow().
    <ReactFlowProvider>
      <OrganisasiContent organization={organization} />
    </ReactFlowProvider>
  );
}

/** Zoom tampilan awal: cukup besar supaya tulisan di kotak terbaca. */
const READABLE_ZOOM = 0.8;
/** Jarak kotak paling atas (Manager) dari tepi atas bagan pada tampilan awal (px). */
const TOP_MARGIN = 48;

function OrganisasiContent({ organization }: { organization: OrganizationResource }) {
  const positions = organization.positions;
  /** Kotak-kotak di bagan (aturan penggabungan/pemisahan ada di org-tree.ts). */
  const cards = useMemo(() => buildOrgCards(positions), [positions]);
  const { getNodes, setCenter } = useReactFlow();
  /** Area bagan, untuk mengetahui tingginya di layar. */
  const chartAreaRef = useRef<HTMLDivElement>(null);
  /** Jabatan terakhir yang sudah dituju (lihat useEffect di bawah). */
  const lastCenteredId = useRef<string | null>(null);

  // --- State halaman --------------------------------------------------------
  /** Kotak yang cabang bawahannya sedang dibuka. */
  const [expandedIds, setExpandedIds] = useState(() => getInitialExpandedIds(cards));
  /** Jabatan yang sedang disorot (dipilih dari daftar jabatan); semua pemegangnya ikut disorot. */
  const [highlightedPositionId, setHighlightedPositionId] = useState<string | null>(null);
  /** Pegawai yang sedang dibuka di panel detail. */
  const [selectedEmployee, setSelectedEmployee] = useState<SelectedEmployee | null>(null);
  /** Daftar jabatan versi layar kecil (dibuka lewat tombol "Daftar Jabatan"). */
  const [isListOpen, setIsListOpen] = useState(false);

  // --- Aksi -----------------------------------------------------------------
  // toggleBranch & selectEmployee dikirim ke setiap kotak, jadi dibungkus useCallback
  // supaya fungsinya tetap sama di setiap render (lihat bagian "Bagan" di bawah).

  /** Buka / tutup cabang bawahan sebuah kotak. */
  const toggleBranch = useCallback((cardId: string) => {
    setExpandedIds((currentIds) => {
      const next = new Set(currentIds);

      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }

      return next;
    });
  }, []);

  /** Buka panel detail pegawai. */
  const selectEmployee = useCallback((employee: EmployeeResource, position: PositionResource) => {
    setSelectedEmployee({ employee, position });
  }, []);

  /**
   * Dari daftar jabatan: buka semua atasan dari SETIAP kotak jabatan itu,
   * sorot kotak-kotaknya, lalu geser bagan ke kotak pertama.
   */
  function goToPosition(positionId: string) {
    const cardsById = buildCardsById(cards);
    const positionCards = cards.filter((card) => card.position.id === positionId);
    const ancestorIds = positionCards.flatMap((card) => findAncestorIds(card.id, cardsById));

    setExpandedIds(new Set([...expandedIds, ...ancestorIds]));
    setHighlightedPositionId(positionId);
    lastCenteredId.current = null;
    setIsListOpen(false);
  }

  function expandAll() {
    setExpandedIds(new Set(cards.map((card) => card.id)));
    showTopOfChartAfterRedraw();
  }

  function collapseAll() {
    setExpandedIds(new Set());
    clearHighlight();
    showTopOfChartAfterRedraw();
  }

  function resetView() {
    setExpandedIds(getInitialExpandedIds(cards));
    clearHighlight();
    showTopOfChartAfterRedraw();
  }

  /** Tunggu bagan selesai digambar ulang, baru digeser ke posisi awal (Manager di atas). */
  function showTopOfChartAfterRedraw() {
    setTimeout(() => showTopOfChart(500), 50);
  }

  function clearHighlight() {
    setHighlightedPositionId(null);
    lastCenteredId.current = null;
  }

  /**
   * Tampilan awal bagan: kotak paling atas (Manager) di tengah-atas,
   * dengan zoom yang cukup besar untuk dibaca. Bagian lain bisa dilihat
   * dengan menggeser bagan atau lewat minimap.
   */
  function showTopOfChart(duration = 0) {
    const topCard = cards.find((card) => card.parentIds.length === 0);
    const topNode = getNodes().find((node) => node.id === topCard?.id);
    if (!topNode) return;

    const areaHeight = chartAreaRef.current?.clientHeight ?? 600;

    // setCenter menaruh titik (x, y) di TENGAH layar. Supaya Manager tampil di ATAS,
    // titik tengahnya digeser ke bawah setengah tinggi layar (dikurangi TOP_MARGIN).
    setCenter(
      topNode.position.x + NODE_WIDTH / 2,
      topNode.position.y + (areaHeight / 2 - TOP_MARGIN) / READABLE_ZOOM,
      { zoom: READABLE_ZOOM, duration },
    );
  }

  // --- Bagan ----------------------------------------------------------------
  // useMemo: bagan HANYA dihitung ulang kalau isinya berubah (cabang dibuka/ditutup atau
  // sorotan pencarian). Kalau dihitung ulang di setiap render (mis. saat membuka panel
  // detail), React Flow mengukur ulang semua kotak dan garis berkedip hilang sesaat.
  const { nodes, edges } = useMemo(
    () =>
      buildOrgChart(positions, {
        expandedIds,
        highlightedPositionId,
        onToggle: toggleBranch,
        onSelectEmployee: selectEmployee,
      }),
    [positions, expandedIds, highlightedPositionId, toggleBranch, selectEmployee],
  );

  // Setelah memilih jabatan dari daftar, geser bagan ke kotak pertama jabatan itu (sekali saja).
  useEffect(() => {
    if (!highlightedPositionId || lastCenteredId.current === highlightedPositionId) return;

    const node = nodes.find((item) => item.data.card.position.id === highlightedPositionId);
    if (!node) return;

    lastCenteredId.current = highlightedPositionId;
    setCenter(node.position.x + NODE_WIDTH / 2, node.position.y + (node.height ?? 0) / 2, {
      zoom: 1,
      duration: 600,
    });
  }, [highlightedPositionId, nodes, setCenter]);

  // --- Tampilan -------------------------------------------------------------
  return (
    // Tinggi = layar dikurangi header dashboard (4rem) dan jarak bawah (1rem).
    <div className="flex h-[calc(100dvh-5rem)] flex-col gap-4">
      <OrgToolbar
        decreeNumber={organization.decree_number}
        decreeDate={organization.decree_date}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onReset={resetView}
        onOpenPositionList={() => setIsListOpen(true)}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface">
        {/* Daftar jabatan: panel tetap di layar lebar */}
        <aside className="hidden w-72 shrink-0 border-r border-border lg:block">
          <PositionListPanel positions={positions} onSelectPosition={goToPosition} />
        </aside>

        <div ref={chartAreaRef} className="min-w-0 flex-1 bg-canvas">
          <OrgChart nodes={nodes} edges={edges} onReady={() => showTopOfChart()} />
        </div>
      </div>

      {/* Daftar jabatan: laci samping di layar kecil */}
      <Sheet open={isListOpen} onOpenChange={setIsListOpen}>
        <SheetContent side="left" className="w-full p-0 sm:max-w-sm">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Daftar Jabatan</SheetTitle>
          </SheetHeader>
          <PositionListPanel positions={positions} onSelectPosition={goToPosition} />
        </SheetContent>
      </Sheet>

      <EmployeeDetailSheet
        selected={selectedEmployee}
        positions={positions}
        onClose={() => setSelectedEmployee(null)}
      />
    </div>
  );
}
