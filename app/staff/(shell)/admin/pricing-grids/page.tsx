"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { searchGrilles, updateGrille } from "@/lib/api/tarification";
import type { GrilleTarifaire } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { extractItems, formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { CreateGrilleDialog } from "@/components/staff/CreateGrilleDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function GrilleRow({ grille, onChanged }: { grille: GrilleTarifaire; onChanged: (g: GrilleTarifaire) => void }) {
  async function toggleActif() {
    const updated = await updateGrille(grille.id, { actif: !grille.actif });
    onChanged(updated);
  }

  return (
    <TableRow>
      <TableCell className="font-semibold">{grille.categorie}</TableCell>
      <TableCell>
        <span
          className={`inline-block rounded-[6px] px-2.5 py-1 text-[11.5px] font-bold ${
            grille.calculMode === "FIXE"
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
          }`}
        >
          {grille.calculMode}
        </span>
      </TableCell>
      <TableCell className="font-semibold">
        {grille.calculMode === "FIXE" ? formatMoney(grille.prixParLb) : `${formatMoney(grille.prixParLb)}/lb`}
      </TableCell>
      <TableCell>{formatMoney(grille.fraisFixes)}</TableCell>
      <TableCell>{grille.taxes}%</TableCell>
      <TableCell>{formatDate(grille.dateEffet)}</TableCell>
      <TableCell>
        <button
          onClick={toggleActif}
          className={`rounded-[6px] px-2.5 py-1 text-[11.5px] font-bold transition-colors ${
            grille.actif ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {grille.actif ? "Active" : "Inactive"}
        </button>
      </TableCell>
    </TableRow>
  );
}

export default function TarificationPage() {
  const [grilles, setGrilles] = useState<GrilleTarifaire[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    searchGrilles({ taille: 100 })
      .then((res) => setGrilles(extractItems(res)))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de charger les grilles."));
  }, []);

  function updateInList(updated: GrilleTarifaire) {
    setGrilles((prev) => prev?.map((g) => (g.id === updated.id ? updated : g)) ?? null);
  }

  return (
    <div className="space-y-5">
      <PageHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-white">Grilles tarifaires</h1>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-4 py-2 text-[13px] font-bold text-white hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Nouvelle grille
          </button>
        </div>
      </PageHeader>

      {error && <p className="text-[14px] font-semibold text-red-400">{error}</p>}

      {!grilles ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-orange" size={28} />
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Calcul</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Frais fixes</TableHead>
                  <TableHead>Taxes</TableHead>
                  <TableHead>Date d&apos;effet</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grilles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-brand-grey py-10">
                      Aucune grille tarifaire disponible.
                    </TableCell>
                  </TableRow>
                ) : (
                  grilles.map((g) => (
                    <GrilleRow key={g.id} grille={g} onChanged={updateInList} />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <CreateGrilleDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={(newGrille) => setGrilles((prev) => (prev ? [newGrille, ...prev] : [newGrille]))}
      />
    </div>
  );
}
