/**
 * Tabel data (urut, cari, filter, halaman) berbasis TanStack Table v9.
 * Diadaptasi dari proyek ptpn1-agrowth-fe, disesuaikan dengan tema @mestakara/ui.
 *
 * Cara pakai di sebuah fitur:
 *   1. Tulis kolom-kolomnya dengan `createDataTableColumnHelper` + `defineTableConfig`
 *   2. Tampilkan dengan <DataTable config={...} data={...} />
 *
 * Contoh lengkap: src/features/bidang/BidangTable.tsx
 */
export { DataTable } from "./DataTable";
export { actionsColumn, jobGradeColumn, rowNumberColumn, selectColumn, toFilterOptions } from "./columnPresets";
export type { RowSelection } from "./DataTableContext";
export { createDataTableColumnHelper, type DataTableColumnMeta, type FilterOption } from "./dataTableFeatures";
export { defineTableConfig, type TableConfig } from "./tableConfig";
