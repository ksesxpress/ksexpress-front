"use client";

import { useState, type ReactNode } from "react";
import {
  type ColumnDef,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

// Table générique réutilisée par les pages de listes (Colis, Factures,
// Clients, Lots, Admin/Utilisateurs, Admin/Audit) — porte le look shadcn
// "Data Table" (voir docs.shadcn.com/docs/components/data-table), mais en
// mode « manuel » : toutes ces pages font déjà leur recherche/pagination
// côté backend (RF-*, debounce 300ms), donc pas de tri/filtrage client sur
// des données partielles qui induirait l'utilisateur en erreur — seule la
// visibilité des colonnes est gérée ici, côté client (données déjà là).
// Le tri/filtrage réel nécessiterait des paramètres de requête backend
// dédiés (hors périmètre de ce changement, purement visuel).
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyMessage?: string;
  // Libellés lisibles pour le menu « Colonnes » — sinon on retombe sur
  // l'id technique de la colonne (voir ColumnDef.id).
  columnLabels?: Record<string, string>;
  toolbar?: ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "Aucun résultat.",
  columnLabels = {},
  toolbar,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: { columnVisibility },
  });

  const hideableColumns = table.getAllColumns().filter((column) => column.getCanHide());

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">{toolbar}</div>
        {hideableColumns.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full border border-[#eadfcf] bg-white px-3.5 py-2 text-[12.5px] font-semibold text-brand-dark hover:bg-brand-light">
              <SlidersHorizontal size={13} />
              Colonnes
              <ChevronDown size={13} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hideableColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(checked) => column.toggleVisibility(checked)}
                >
                  {columnLabels[column.id] ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Hauteur maximale + scroll vertical À L'INTÉRIEUR du tableau (pas de
          toute la page) dès qu'il y a beaucoup de lignes — le thead reste
          visible en haut grâce à `sticky top-0` sur CHAQUE `<th>` (TableHead),
          pas sur le `<thead>` (TableHeader) : `position: sticky` n'a aucun
          effet posé directement sur `<thead>` dans Chromium/Firefox (limite
          CSS connue — un `<thead>` ne fait pas partie du flux "stickable"),
          il doit être appliqué cellule par cellule (voir aussi PageHeader.tsx
          pour le même principe au niveau page, où ça fonctionne car c'est un
          `<div>` normal, pas un `<thead>`). */}
      <div className="max-h-[60vh] overflow-y-auto rounded-[16px] border border-[#f2e6d6] bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-[#f2e6d6] hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="sticky top-0 z-10 bg-white px-4 py-3 text-[12px] uppercase tracking-wide text-brand-grey"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-[#f2e6d6] hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-24 text-center text-[13px] text-brand-grey">
                  Chargement…
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-[#f2e6d6]">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 text-[13.5px] whitespace-normal">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="border-[#f2e6d6] hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-24 text-center text-[13px] text-brand-grey">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
