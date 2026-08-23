"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Loader2, Plus, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchColis } from "@/lib/api/colis";
import type { Colis, StatutColis } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { extractItems, extractTotal, formatWeight } from "@/lib/format";
import { ColisStatusBadge, COLIS_STATUT_OPTIONS } from "@/components/app-shell/StatusBadge";
import { useAuth } from "@/lib/auth/auth-context";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { NumberedPagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { CreatePackageDialog } from "@/components/staff/CreatePackageDialog";

// Colonnes Catégorie/Poids/Client/Action masquables via le menu « Colonnes »
// (voir ColumnsMenu) — Tracking et Statut restent toujours visibles : ce
// sont les 2 colonnes fusionnées par l'en-tête d'un groupe de lot (voir
// LotSummaryRow, colSpan={2}), les rendre masquables casserait cette
// fusion pour un gain d'usage marginal (identité du colis).
const HIDEABLE_COLUMNS: { id: string; label: string }[] = [
  { id: "categorie", label: "Catégorie" },
  { id: "poids", label: "Poids" },
  { id: "client", label: "Client" },
  { id: "action", label: "Action" },
];

const STATUTS: { value: StatutColis | ""; label: string }[] = [
  { value: "", label: "Tous les statuts" },
  ...COLIS_STATUT_OPTIONS,
];

const TAILLE = 20;

function clientLabel(c: Colis): string {
  if (!c.client) return c.nomDestinataireBrut ? `${c.nomDestinataireBrut} (non rattaché)` : "—";
  return c.client.prenom ? `${c.client.prenom} ${c.client.nom}` : c.client.nom;
}

// Une ligne de lot regroupe tous les colis de la page courante partageant le
// même lotId — le client d'un lot est toujours le même (règle interne : un
// lot = un seul client), donc l'étiquette client du groupe vient du premier
// colis. Poids affiché = somme des colis du groupe, pas celui d'un seul.
interface LotGroup {
  kind: "lot";
  lotId: string;
  reference: string;
  colisList: Colis[];
}
interface ColisRow {
  kind: "colis";
  colis: Colis;
}
type Row = LotGroup | ColisRow;

function buildRows(colis: Colis[]): Row[] {
  const rows: Row[] = [];
  const lotIndex = new Map<string, number>();
  for (const c of colis) {
    if (c.lotId && c.lot) {
      const existingIndex = lotIndex.get(c.lotId);
      if (existingIndex !== undefined) {
        (rows[existingIndex] as LotGroup).colisList.push(c);
      } else {
        lotIndex.set(c.lotId, rows.length);
        rows.push({ kind: "lot", lotId: c.lotId, reference: c.lot.reference, colisList: [c] });
      }
    } else {
      rows.push({ kind: "colis", colis: c });
    }
  }
  return rows;
}

function LotSummaryRow({
  group,
  expanded,
  onToggle,
  hidden,
}: {
  group: LotGroup;
  expanded: boolean;
  onToggle: () => void;
  hidden: Set<string>;
}) {
  const poidsTotal = group.colisList.reduce((sum, c) => sum + (c.poidsLb ? Number(c.poidsLb) : 0), 0);
  const categories = Array.from(new Set(group.colisList.map((c) => c.categorie).filter(Boolean))) as string[];
  const client = clientLabel(group.colisList[0]);

  return (
    <TableRow className={cn("group cursor-pointer hover:bg-muted/50", expanded && "bg-muted/30")} onClick={onToggle}>
      <TableCell className="px-4 py-3" colSpan={2}>
        <div className="flex items-center gap-1.5 text-left">
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          <span className="font-bold">Lot {group.reference}</span>
          <span className="text-muted-foreground">({group.colisList.length} colis)</span>
        </div>
      </TableCell>
      {!hidden.has("categorie") && (
        <TableCell className="px-4 py-3">
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-block rounded-[6px] bg-white/10 px-2 py-0.5 text-[11px] font-semibold border border-white/20"
                >
                  {cat}
                </span>
              ))}
            </div>
          ) : (
            "—"
          )}
        </TableCell>
      )}
      {!hidden.has("poids") && (
        <TableCell className="font-semibold">{formatWeight(poidsTotal)}</TableCell>
      )}
      {!hidden.has("client") && <TableCell>{client}</TableCell>}
      {!hidden.has("action") && (
        <TableCell>
          <Link
            href={`/staff/lots/${group.lotId}`}
            className="rounded-[8px] bg-white/10 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-white/20 border border-white/10"
          >
            Voir le lot
          </Link>
        </TableCell>
      )}
    </TableRow>
  );
}

function LotChildRow({ colis, hidden }: { colis: Colis; hidden: Set<string> }) {
  return (
    <TableRow className="bg-white/5 border-l-2 border-l-brand-orange">
      <TableCell className="pl-10">
        <Link
          href={`/staff/packages/${colis.id}`}
          className="font-semibold text-brand-orange hover:underline"
        >
          {colis.tracking ?? "(sans tracking)"}
        </Link>
      </TableCell>
      <TableCell>
        <ColisStatusBadge statut={colis.statut} />
      </TableCell>
      {!hidden.has("categorie") && <TableCell>{colis.categorie ?? "—"}</TableCell>}
      {!hidden.has("poids") && <TableCell>{formatWeight(colis.poidsLb)}</TableCell>}
      {!hidden.has("client") && <TableCell>{clientLabel(colis)}</TableCell>}
      {!hidden.has("action") && <TableCell className="text-brand-grey">—</TableCell>}
    </TableRow>
  );
}

function StandaloneColisRow({ colis, hidden }: { colis: Colis; hidden: Set<string> }) {
  return (
    <TableRow className="cursor-pointer hover:bg-white/5 transition-colors">
      <TableCell>
        <Link
          href={`/staff/packages/${colis.id}`}
          className="font-semibold text-brand-orange hover:underline"
        >
          {colis.tracking ?? "(sans tracking)"}
        </Link>
      </TableCell>
      <TableCell>
        <ColisStatusBadge statut={colis.statut} />
      </TableCell>
      {!hidden.has("categorie") && <TableCell>{colis.categorie ?? "—"}</TableCell>}
      {!hidden.has("poids") && <TableCell>{formatWeight(colis.poidsLb)}</TableCell>}
      {!hidden.has("client") && <TableCell>{clientLabel(colis)}</TableCell>}
      {!hidden.has("action") && <TableCell className="text-brand-grey">—</TableCell>}
    </TableRow>
  );
}

export default function EspaceColisPage() {
  const { user } = useAuth();
  const canCreate = user?.isStaff;

  const [colis, setColis] = useState<Colis[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [tracking, setTracking] = useState("");
  const [codeKse, setCodeKse] = useState("");
  const [nom, setNom] = useState("");
  const [statut, setStatut] = useState<StatutColis | "">("");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchColis({
        tracking: tracking || undefined,
        codeKse: codeKse || undefined,
        nom: nom || undefined,
        statut: statut || undefined,
        page,
        taille: TAILLE,
      })
        .then((res) => {
          setColis(extractItems(res));
          setTotal(extractTotal(res));
        })
        .catch((err) =>
          setError(err instanceof ApiError ? err.message : "Impossible de charger les colis."),
        );
    }, 300);
    return () => clearTimeout(timeout);
  }, [tracking, codeKse, nom, statut, page, refreshKey]);

  const rows = useMemo(() => (colis ? buildRows(colis) : []), [colis]);

  function toggleLot(lotId: string) {
    setExpandedLots((prev) => {
      const next = new Set(prev);
      if (next.has(lotId)) next.delete(lotId);
      else next.add(lotId);
      return next;
    });
  }

  function toggleColumn(id: string, visible: boolean) {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (visible) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-white">Colis</h1>
          {canCreate && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-4 py-2 text-[13px] font-bold text-white hover:opacity-90"
            >
              <Plus size={16} />
              Ajouter un colis
            </button>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-4">
        <Input
          value={tracking}
          onChange={(e) => {
            setTracking(e.target.value);
            setPage(1);
          }}
          placeholder="Tracking"
          className="h-10 rounded-[10px] border-[1.5px] border-white/20 bg-white/80 backdrop-blur-xl px-3 text-[13.5px] shadow-none"
        />
        <Input
          value={codeKse}
          onChange={(e) => {
            setCodeKse(e.target.value);
            setPage(1);
          }}
          placeholder="Code KSE"
          className="h-10 rounded-[10px] border-[1.5px] border-white/20 bg-white/80 backdrop-blur-xl px-3 text-[13.5px] shadow-none"
        />
        <Input
          value={nom}
          onChange={(e) => {
            setNom(e.target.value);
            setPage(1);
          }}
          placeholder="Nom client"
          className="h-10 rounded-[10px] border-[1.5px] border-white/20 bg-white/80 backdrop-blur-xl px-3 text-[13.5px] shadow-none"
        />
        <Select
          value={statut || "all"}
          onValueChange={(val) => {
            setStatut(val === "all" ? "" : (val as StatutColis));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full !h-10 rounded-[10px] border-[1.5px] border-white/20 bg-white/80 backdrop-blur-xl px-3 text-[13.5px] shadow-none">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent className="bg-white/80 backdrop-blur-xl border-white/40">
            {STATUTS.map((s) => (
              <SelectItem key={s.value || "all"} value={s.value || "all"}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-[14px] font-semibold text-red-600">{error}</p>}

      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-white/20 bg-white/80 backdrop-blur-xl px-3.5 py-2 text-[12.5px] font-semibold text-brand-dark hover:bg-white/90">
            <SlidersHorizontal size={13} />
            Colonnes
            <ChevronDown size={13} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white/80 backdrop-blur-xl border-white/40">
            {HIDEABLE_COLUMNS.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={!hiddenColumns.has(col.id)}
                onCheckedChange={(checked) => toggleColumn(col.id, checked)}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!colis ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-orange" size={28} />
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Statut</TableHead>
                  {!hiddenColumns.has("categorie") && (
                    <TableHead>Catégorie</TableHead>
                  )}
                  {!hiddenColumns.has("poids") && (
                    <TableHead>Poids</TableHead>
                  )}
                  {!hiddenColumns.has("client") && (
                    <TableHead>Client</TableHead>
                  )}
                  {!hiddenColumns.has("action") && (
                    <TableHead>Action</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {colis.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6 - hiddenColumns.size} className="text-center text-brand-grey py-10">
                      Aucun colis trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) =>
                    row.kind === "lot" ? (
                      <Fragment key={row.lotId}>
                        <LotSummaryRow
                          group={row}
                          expanded={expandedLots.has(row.lotId)}
                          onToggle={() => toggleLot(row.lotId)}
                          hidden={hiddenColumns}
                        />
                        {expandedLots.has(row.lotId) &&
                          row.colisList.map((c) => (
                            <LotChildRow key={c.id} colis={c} hidden={hiddenColumns} />
                          ))}
                      </Fragment>
                    ) : (
                      <StandaloneColisRow key={row.colis.id} colis={row.colis} hidden={hiddenColumns} />
                    ),
                  )
                )}
              </TableBody>
            </Table>
          </div>
          <div className="shrink-0 pt-4">
            <NumberedPagination
              page={page}
              totalPages={total !== null ? Math.max(1, Math.ceil(total / TAILLE)) : page}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {canCreate && (
        <CreatePackageDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSuccess={() => {
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
