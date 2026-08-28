"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateGrille } from "@/lib/api/tarification";
import type { GrilleTarifaire, ModeCalculTarif } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fieldClass = "!h-10 w-full rounded-[8px] border-[1.5px] border-[#eadfcf] shadow-none px-3 text-[13.5px]";
const labelClass = "mb-1 block text-[12.5px] font-bold ";

export function EditGrilleDialog({
  grille,
  open,
  onOpenChange,
  onUpdated,
}: {
  grille: GrilleTarifaire | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (grille: GrilleTarifaire) => void;
}) {
  const [calculMode, setCalculMode] = useState<ModeCalculTarif>("POIDS");
  const [prixParLb, setPrixParLb] = useState("");
  const [fraisFixes, setFraisFixes] = useState("");
  const [taxes, setTaxes] = useState("");
  const [dateEffet, setDateEffet] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && grille) {
      setCalculMode(grille.calculMode);
      setPrixParLb(String(grille.prixParLb));
      setFraisFixes(grille.fraisFixes ? String(grille.fraisFixes) : "");
      setTaxes(grille.taxes ? String(grille.taxes) : "");
      // Format date to YYYY-MM-DD for input type="date"
      setDateEffet(new Date(grille.dateEffet).toISOString().split('T')[0]);
      setError(null);
    }
  }, [open, grille]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!grille) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const updated = await updateGrille(grille.id, {
        calculMode,
        prixParLb: Number(prixParLb),
        fraisFixes: fraisFixes ? Number(fraisFixes) : undefined,
        taxes: taxes ? Number(taxes) : undefined,
        dateEffet: new Date(dateEffet).toISOString(),
      });
      onUpdated(updated);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!grille) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-brand-light">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-bold text-brand-dark">Modifier la grille: {grille.categorie}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className={labelClass}>Mode de calcul</Label>
              <Select value={calculMode} onValueChange={(v) => setCalculMode(v as ModeCalculTarif)}>
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Mode de calcul" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POIDS">Au Poids (lb)</SelectItem>
                  <SelectItem value="FIXE">Prix Fixe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={labelClass}>{calculMode === "FIXE" ? "Prix Fixe" : "Prix par livre (lb)"}</Label>
              <InputGroup className={fieldClass}>
                <div className="flex h-full items-center px-3 text-brand-grey font-bold text-[13px]">$</div>
                <InputGroupInput
                  type="number"
                  step="0.01"
                  required
                  value={prixParLb}
                  onChange={(e) => setPrixParLb(e.target.value)}
                  className="pl-1"
                />
              </InputGroup>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className={labelClass}>Frais fixes</Label>
              <InputGroup className={fieldClass}>
                <div className="flex h-full items-center px-3 text-brand-grey font-bold text-[13px]">$</div>
                <InputGroupInput
                  type="number"
                  step="0.01"
                  value={fraisFixes}
                  onChange={(e) => setFraisFixes(e.target.value)}
                  className="pl-1"
                />
              </InputGroup>
            </div>
            <div>
              <Label className={labelClass}>Taxes (%)</Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput
                  type="number"
                  step="0.01"
                  value={taxes}
                  onChange={(e) => setTaxes(e.target.value)}
                />
                <div className="flex h-full items-center px-3 text-brand-grey font-bold text-[13px]">%</div>
              </InputGroup>
            </div>
          </div>
          <div>
            <Label className={labelClass}>Date d&apos;effet</Label>
            <InputGroup className={fieldClass}>
              <InputGroupInput
                type="date"
                required
                value={dateEffet}
                onChange={(e) => setDateEffet(e.target.value)}
              />
            </InputGroup>
            <p className="mt-1.5 text-[11px] font-semibold text-brand-grey">
              Si cette date est passée, ce tarif s&apos;appliquera aux futurs colis de cette catégorie. L&apos;ancienne tarification restera pour l&apos;historique.
            </p>
          </div>
          {error && <p className="text-[13px] font-semibold text-red-600">{error}</p>}
          <div className="mt-6 flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-[8px] border-brand-dark/20 text-[13.5px] font-bold"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-[8px] bg-brand-orange px-6 text-[13.5px] font-bold text-white shadow-none hover:bg-brand-orange-dark"
            >
              {isSubmitting ? <Loader2 className="mr-2 animate-spin" size={16} /> : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
