"use client";

import { useEffect, useState } from "react";
import { Loader2, Eye } from "lucide-react";
import { getMesColis } from "@/lib/api/colis";
import type { Colis, StatutColis } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { extractItems, formatDate, formatWeight } from "@/lib/format";
import { ColisStatusBadge, COLIS_STATUT_OPTIONS } from "@/components/app-shell/StatusBadge";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberedPagination } from "@/components/ui/pagination";
import { ColisDetailsDialog } from "@/components/staff/ColisDetailsDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUTS: { value: StatutColis | "all"; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  ...COLIS_STATUT_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
];

const TAILLE = 20;

export default function PortailColisPage() {
  const [colis, setColis] = useState<Colis[] | null>(null);
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);
  const [statut, setStatut] = useState<StatutColis | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getMesColis({ statut: statut === "all" ? undefined : statut, page, taille: TAILLE })
      .then((res) => setColis(extractItems(res)))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Impossible de charger vos colis."),
      );
  }, [statut, page]);

  return (
    <div className="space-y-5">
      <PageHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-white">Mes colis</h1>
        </div>
      </PageHeader>

      <div className="w-full sm:w-64">
        <Select
          value={statut}
          onValueChange={(val) => {
            setStatut(val as StatutColis | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="!h-10 w-full rounded-[8px] border-[1.5px] border-white/20 bg-white/80 backdrop-blur-xl px-3 text-[13.5px] shadow-none">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent className="bg-white/80 backdrop-blur-xl border-white/40">
            {STATUTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-[14px] font-semibold text-red-400">{error}</p>}

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
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Poids</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Reçu le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colis.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-brand-grey py-10">
                      Aucun colis trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  colis.map((c) => (
                    <TableRow
                      key={c.id}
                      onClick={() => setSelectedColis(c)}
                      className="cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <TableCell>
                        <span className="font-semibold text-brand-orange hover:underline">
                          {c.tracking ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>{c.categorie ?? "—"}</TableCell>
                      <TableCell className="font-medium">{c.poidsLb ? formatWeight(c.poidsLb) : "—"}</TableCell>
                      <TableCell>
                        <ColisStatusBadge statut={c.statut} />
                      </TableCell>
                      <TableCell className="text-brand-grey">{formatDate(c.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedColis(c);
                          }}
                          className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-orange-text hover:underline"
                        >
                          <Eye size={15} />
                          Détails
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="shrink-0 pt-4">
            <NumberedPagination
              page={page}
              totalPages={colis.length < TAILLE && page === 1 ? 1 : Math.max(1, page + (colis.length === TAILLE ? 1 : 0))}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      <ColisDetailsDialog
        colis={selectedColis}
        open={!!selectedColis}
        onOpenChange={(open) => !open && setSelectedColis(null)}
      />
    </div>
  );
}
