"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { updateFraisFacture } from "@/lib/api/factures";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api/types";

interface EditFraisFactureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factureId: string;
  initialFrais: number;
  initialLabel?: string | null;
  onSuccess: () => void;
}

export function EditFraisFactureDialog({
  open,
  onOpenChange,
  factureId,
  initialFrais,
  initialLabel,
  onSuccess,
}: EditFraisFactureDialogProps) {
  const [frais, setFrais] = useState(initialFrais.toString());
  const [label, setLabel] = useState(initialLabel || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedFrais = parseFloat(frais);
    if (isNaN(parsedFrais) || parsedFrais < 0) {
      setError("Veuillez entrer un montant valide");
      return;
    }

    try {
      setLoading(true);
      await updateFraisFacture(factureId, {
        fraisSupplementaires: parsedFrais,
        fraisSupplementairesLabel: label || undefined,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la modification des frais");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier les frais de la facture</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="frais">Montant des frais ($)</Label>
            <Input
              id="frais"
              type="number"
              step="0.01"
              min="0"
              value={frais}
              onChange={(e) => setFrais(e.target.value)}
              placeholder="Ex: 50.00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="label">Libellé (optionnel)</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Frais de livraison additionnels"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-brand-orange hover:bg-brand-orange-hover text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
