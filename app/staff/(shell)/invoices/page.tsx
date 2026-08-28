"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, Plus, Printer } from "lucide-react";
import { searchFactures, mergeFactures } from "@/lib/api/factures";
import type { Facture, StatutFacture } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { extractItems, extractTotal, formatDate, formatMoney } from "@/lib/format";
import { FactureStatusBadge } from "@/components/app-shell/StatusBadge";
import { useAuth } from "@/lib/auth/auth-context";
import { NumberedPagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { PrintReportHeader } from "@/components/staff/PrintReportHeader";
import { CreateInvoiceDialog } from "@/components/staff/CreateInvoiceDialog";
import { Button } from "@/components/ui/button";
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

export default function EspaceFacturesPage() {
  const { user } = useAuth();
  const canCreate = user?.isStaff;

  const [factures, setFactures] = useState<Facture[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  const router = useRouter();
  const [statut, setStatut] = useState<StatutFacture | "all">("all");
  const [recherche, setRecherche] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [selectedFactures, setSelectedFactures] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchFactures({
        statut: statut === "all" ? undefined : statut,
        recherche: recherche.trim() || undefined,
        page,
        taille: TAILLE,
      })
        .then((res) => {
          setFactures(extractItems(res));
          setTotal(extractTotal(res));
          setSelectedFactures([]);
        })
        .catch((err) =>
          setError(err instanceof ApiError ? err.message : "Impossible de charger les factures."),
        );
    }, 300);
    return () => clearTimeout(timeout);
  }, [statut, recherche, page, refresh]);

  function toggleFacture(facture: Facture) {
    if (selectedFactures.includes(facture.id)) {
      setSelectedFactures((prev) => prev.filter((id) => id !== facture.id));
    } else {
      if (selectedFactures.length > 0) {
        const firstSelected = factures?.find((f) => f.id === selectedFactures[0]);
        if (firstSelected && firstSelected.clientId !== facture.clientId) {
          setAlertMessage("Vous ne pouvez fusionner que des factures appartenant au même client.");
          return;
        }
      }
      setSelectedFactures((prev) => [...prev, facture.id]);
    }
  }

  async function handleMergeFactures() {
    if (selectedFactures.length < 2) return;
    setIsMerging(true);
    try {
      await mergeFactures(selectedFactures);
      setRefresh((r) => r + 1);
    } catch (err) {
      setAlertMessage(err instanceof ApiError ? err.message : "Erreur lors de la fusion.");
    } finally {
      setIsMerging(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col min-w-0 print:bg-white print:text-black">
      <div className="space-y-5 print:hidden">
      <PageHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => window.print()}
              className="bg-brand-orange text-white hover:bg-brand-orange/90 font-bold shadow-md rounded-[8px]"
            >
              <Printer className="h-4 w-4 mr-2" />
              IMPRIMER LE RAPPORT
            </Button>
            {canCreate && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-1.5 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-4 py-2 text-[13px] font-bold text-white hover:opacity-90 transition-opacity"
              >
                <Plus size={16} />
                Nouvelle facture
              </button>
            )}
          </div>
        </div>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] max-w-md flex items-center gap-2 rounded-[8px] border-[1.5px] border-white/20 bg-white/80 backdrop-blur-xl px-3 py-1.5 shadow-none focus-within:border-brand-orange">
          <Search size={18} className="text-brand-grey shrink-0" />
          <input
            type="text"
            value={recherche}
            onChange={(e) => {
              setRecherche(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par N° facture, Nom client ou Code KSE..."
            className="w-full bg-transparent text-[13.5px] font-medium text-brand-dark outline-none placeholder:text-brand-grey/60"
          />
        </div>

        <div className="w-full sm:w-56">
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
      </div>
      </div>

      <PrintReportHeader 
        title="Rapport des Factures" 
        subtitle={`Filtres : ${statut === "all" ? "Tous les statuts" : STATUTS.find(s => s.value === statut)?.label}${recherche ? ` | Recherche : "${recherche}"` : ""}`} 
      />

      {error && <p className="text-[14px] font-semibold text-red-400 print:hidden">{error}</p>}

      {!factures ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-orange" size={28} />
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex-1">
            {selectedFactures.length > 1 && (
              <div className="mb-3">
                <Button
                  onClick={handleMergeFactures}
                  disabled={isMerging}
                  className="h-8 rounded-[6px] bg-brand-orange hover:bg-brand-orange-dark px-4 text-[12px] font-bold text-white shadow-none"
                >
                  {isMerging ? <Loader2 className="mr-2 animate-spin" size={14} /> : null}
                  Fusionner les factures sélectionnées ({selectedFactures.length})
                </Button>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center"></TableHead>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Émise le</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payé</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {factures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-brand-grey py-10">
                      Aucune facture trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  factures.map((facture) => {
                    const clientName = facture.client ? (facture.client.prenom ? `${facture.client.prenom} ${facture.client.nom}` : facture.client.nom) : "—";
                    const isOuverte = facture.statut === "OUVERTE";
                    return (
                      <TableRow key={facture.id} className="cursor-pointer" onClick={() => router.push(`/staff/invoices/${facture.id}`)}>
                        <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                          {isOuverte ? (
                            <input
                              type="checkbox"
                              checked={selectedFactures.includes(facture.id)}
                              onChange={() => toggleFacture(facture)}
                              className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/5 accent-brand-orange"
                            />
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-brand-orange">
                            {facture.numero}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">{clientName}</TableCell>
                        <TableCell>{formatDate(facture.dateEmission) || "—"}</TableCell>
                        <TableCell className="font-bold">{formatMoney(facture.total)}</TableCell>
                        <TableCell className="font-semibold text-emerald-400">{formatMoney(facture.montantPaye)}</TableCell>
                        <TableCell>
                          <FactureStatusBadge statut={facture.statut} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="shrink-0 pt-4 print:hidden">
            <NumberedPagination
              page={page}
              totalPages={total !== null ? Math.max(1, Math.ceil(total / TAILLE)) : page}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {canCreate && (
        <CreateInvoiceDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />
      )}

      <Dialog open={!!alertMessage} onOpenChange={(open) => !open && setAlertMessage(null)}>
        <DialogContent className="max-w-md bg-[#13111C] border border-white/10 p-6 text-white sm:rounded-[12px]">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-bold text-white">Attention</DialogTitle>
            <DialogDescription className="text-[14px] text-white/70 mt-2">
              {alertMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button
              onClick={() => setAlertMessage(null)}
              className="bg-brand-orange hover:bg-brand-orange-dark text-white font-bold h-10 px-6 rounded-[8px]"
            >
              Compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
