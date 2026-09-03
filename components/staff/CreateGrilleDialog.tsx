"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createGrille } from "@/lib/api/tarification";
import type { GrilleTarifaire, ModeCalculTarif } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fieldClass = "!h-10 w-full rounded-[8px] border-[1.5px] border-[#eadfcf] shadow-none px-3 text-[13.5px]";
const labelClass = "mb-1 block text-[12.5px] font-bold text-brand-dark";

export function CreateGrilleDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (grille: GrilleTarifaire) => void;
}) {
  const [categorie, setCategorie] = useState("");
  const [calculMode, setCalculMode] = useState<ModeCalculTarif>("POIDS");
  const [prixParLb, setPrixParLb] = useState("");
  const [fraisFixes, setFraisFixes] = useState("");
  const [taxes, setTaxes] = useState("");
  const [dateEffet, setDateEffet] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setCategorie("");
      setCalculMode("POIDS");
      setPrixParLb("");
      setFraisFixes("");
      setTaxes("");
      setDateEffet("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const grille = await createGrille({
        categorie,
        calculMode,
        prixParLb: Number(prixParLb),
        fraisFixes: fraisFixes ? Number(fraisFixes) : undefined,
        taxes: taxes ? Number(taxes) : undefined,
        dateEffet,
      });
      onCreated(grille);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-extrabold">
            Nouvelle grille tarifaire
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className={labelClass}>Catégorie *</Label>
              <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                <InputGroupInput required placeholder="Ex: Électronique" value={categorie} onChange={(e) => setCategorie(e.target.value)} className={fieldClass} />
              </InputGroup>
            </div>
            <div>
              <Label className={labelClass}>Mode de calcul *</Label>
              <Select value={calculMode} onValueChange={(val) => setCalculMode(val as ModeCalculTarif)}>
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POIDS">Au poids (colis simple)</SelectItem>
                  <SelectItem value="FIXE">Prix fixe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className={labelClass}>{calculMode === "FIXE" ? "Prix fixe (USD) *" : "Prix par lb (USD) *"}</Label>
              <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                <InputGroupInput type="number" step="0.01" required value={prixParLb} onChange={(e) => setPrixParLb(e.target.value)} className={fieldClass} />
              </InputGroup>
            </div>
            <div>
              <Label className={labelClass}>Frais fixes (USD)</Label>
              <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                <InputGroupInput type="number" step="0.01" value={fraisFixes} onChange={(e) => setFraisFixes(e.target.value)} className={fieldClass} />
              </InputGroup>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className={labelClass}>Taxes (%)</Label>
              <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                <InputGroupInput type="number" step="0.01" value={taxes} onChange={(e) => setTaxes(e.target.value)} className={fieldClass} />
              </InputGroup>
            </div>
            <div>
              <Label className={labelClass}>Date d&apos;effet *</Label>
              <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                <InputGroupInput type="date" required value={dateEffet} onChange={(e) => setDateEffet(e.target.value)} className={fieldClass} />
              </InputGroup>
            </div>
          </div>

          {error && <p className="text-[13px] font-semibold text-red-600 bg-red-50 p-2.5 rounded-[8px]">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 mt-4 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark text-[14px] font-bold text-white shadow-md hover:opacity-90 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Créer la grille"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
