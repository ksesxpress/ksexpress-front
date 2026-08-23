"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getMesFactures, getFacturePdfUrl } from "@/lib/api/factures";
import { apiFetch } from "@/lib/api/client";
import type { Facture, StatutFacture } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { extractItems, formatDate, formatMoney } from "@/lib/format";
import { FactureStatusBadge } from "@/components/app-shell/StatusBadge";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberedPagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUTS: { value: StatutFacture | "all"; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "OUVERTE", label: "Non payée" },
  { value: "PARTIELLE", label: "Partiellement payée" },
  { value: "PAYEE", label: "Payée" },
  { value: "ANNULEE", label: "Annulée" },
];

const TAILLE = 20;

async function downloadPdf(id: string, numero: string) {
  const blob = await apiFetch<Blob>(getFacturePdfUrl(id));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${numero}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PortailFacturesPage() {
  const [factures, setFactures] = useState<Facture[] | null>(null);
  const router = useRouter();
  const [statut, setStatut] = useState<StatutFacture | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getMesFactures({ statut: statut === "all" ? undefined : statut, page, taille: TAILLE })
      .then((res) => setFactures(extractItems(res)))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Impossible de charger vos factures."),
      );
  }, [statut, page]);

  return (
    <div className="space-y-5">
      <PageHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-white">Mes factures</h1>
        </div>
      </PageHeader>

      <div className="w-full sm:w-64">
        <Select
          value={statut}
          onValueChange={(val) => {
            setStatut(val as StatutFacture | "all");
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

      {!factures ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-orange" size={28} />
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Émise le</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {factures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-brand-grey py-10">
                      Aucune facture trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  factures.map((f) => (
                    <TableRow key={f.id} className="cursor-pointer" onClick={() => router.push(`/portal/invoices/${f.id}`)}>
                      <TableCell>
                        <span className="font-semibold text-brand-orange">{f.numero}</span>
                      </TableCell>
                      <TableCell>{formatDate(f.dateEmission)}</TableCell>
                      <TableCell className="font-bold">{formatMoney(f.total)}</TableCell>
                      <TableCell className="font-semibold text-emerald-400">{formatMoney(f.montantPaye)}</TableCell>
                      <TableCell>
                        <FactureStatusBadge statut={f.statut} />
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPdf(f.id, f.numero);
                          }}
                          className="text-[12.5px] font-semibold text-brand-orange-text underline hover:opacity-80"
                        >
                          Télécharger
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
              totalPages={factures.length < TAILLE && page === 1 ? 1 : Math.max(1, page + (factures.length === TAILLE ? 1 : 0))}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
