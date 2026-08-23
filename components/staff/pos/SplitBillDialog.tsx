"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, Smartphone, Wallet, Loader2 } from "lucide-react";
import type { ModePaiement } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";

const MODES: { value: ModePaiement; label: string; icon: typeof Banknote }[] = [
  { value: "ESPECES", label: "Espèces", icon: Banknote },
  { value: "ZELLE", label: "Zelle", icon: Smartphone },
  { value: "AVOIR", label: "Avoir client", icon: Wallet },
];

interface SplitBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  montantDu: number;
  avoirActif: boolean;
  // Modes réellement disponibles (dérivés des moyens de paiement actifs
  // configurés dans Paramètres — voir app/staff/pos/page.tsx) : n'affiche que
  // ceux-là plutôt qu'une liste fixe en dur.
  modesConfigures: ModePaiement[];
  isSubmitting: boolean;
  onConfirm: (lignes: { mode: ModePaiement; montant: number }[]) => void;
}

// Répartition d'une même vente sur plusieurs modes (Espèces + Zelle, etc.) —
// un montant par mode, doit exactement couvrir `montantDu` avant de pouvoir
// confirmer. "Avoir" désactivé sans client réel (pas de Walk-in), même règle
// que côté facturation shipping.
export function SplitBillDialog({
  open,
  onOpenChange,
  montantDu,
  avoirActif,
  modesConfigures,
  isSubmitting,
  onConfirm,
}: SplitBillDialogProps) {
  const [montants, setMontants] = useState<Record<ModePaiement, string>>({
    ESPECES: "",
    ZELLE: "",
    AVOIR: "",
  });

  const modesDisponibles = MODES.filter(({ value }) => modesConfigures.includes(value));
  const totalSaisi = modesDisponibles.reduce((somme, m) => somme + (Number(montants[m.value]) || 0), 0);
  const restant = Math.round((montantDu - totalSaisi) * 100) / 100;

  function handleChange(mode: ModePaiement, value: string) {
    setMontants((m) => ({ ...m, [mode]: value }));
  }

  function handleConfirm() {
    const lignes = modesDisponibles.filter((m) => Number(montants[m.value]) > 0).map((m) => ({
      mode: m.value,
      montant: Number(montants[m.value]),
    }));
    if (lignes.length === 0 || restant !== 0) return;
    onConfirm(lignes);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/15 bg-white/10 backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle>Diviser le paiement</DialogTitle>
          <DialogDescription>
            Répartissez le montant dû ({formatMoney(montantDu)}) entre plusieurs modes de paiement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {modesDisponibles.length === 0 && (
            <p className="rounded-[8px] border border-dashed border-white/15 bg-white/5 p-2 text-[12px] text-white/50">
              Aucun moyen de paiement configuré — voir Paramètres.
            </p>
          )}
          {modesDisponibles.map(({ value, label, icon: Icon }) => {
            const disabled = value === "AVOIR" && !avoirActif;
            return (
              <div key={value} className={disabled ? "opacity-40" : ""}>
                <Label className="mb-1 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-white/70">
                  <Icon size={14} className="text-brand-orange" />
                  {label}
                  {disabled && <span className="font-normal normal-case text-white/40">(client requis)</span>}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={disabled || isSubmitting}
                  value={montants[value]}
                  onChange={(e) => handleChange(value, e.target.value)}
                  placeholder="0.00"
                  className="bg-white/5 border-white/15 text-white"
                />
              </div>
            );
          })}

          <div className="flex items-center justify-between rounded-[8px] border border-white/10 bg-white/5 px-3 py-2 text-[13.5px]">
            <span className="text-white/60">Restant à couvrir</span>
            <span
              className={`font-bold ${
                restant === 0 ? "text-emerald-400" : restant < 0 ? "text-red-400" : "text-white"
              }`}
            >
              {formatMoney(restant)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || totalSaisi <= 0 || restant !== 0}
            className="bg-brand-orange text-white hover:bg-brand-orange/90 font-bold"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Confirmer le paiement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
