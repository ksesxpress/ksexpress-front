import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Produit } from "@/lib/api/produits";
import { API_URL, getToken } from "@/lib/api/config";

export function StockAdjustmentModal({
  isOpen,
  onClose,
  onSuccess,
  produit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  produit: Produit | null;
}) {
  const [type, setType] = useState<"ENTREE" | "SORTIE" | "INVENTAIRE">("ENTREE");
  const [quantite, setQuantite] = useState("");
  const [motif, setMotif] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!produit) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const qte = Number(quantite);
    if (!qte || isNaN(qte) || qte <= 0) {
      setError("Veuillez entrer une quantité valide supérieure à 0.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/produits/${produit!.id}/stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          type,
          quantite: qte,
          motif: motif.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur lors de l'ajustement du stock.");
      }

      onSuccess();
      onClose();
      setQuantite("");
      setMotif("");
      setType("ENTREE");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-[#0c124e] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Ajuster le stock</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-white">Produit</Label>
            <div className="text-sm text-white/70">{produit.nom} (SKU: {produit.sku})</div>
            <div className="text-sm text-brand-orange">Stock actuel : {produit.quantiteStock}</div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-white">Type d'ajustement</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              disabled={loading}
              className="w-full bg-black/20 border border-white/10 text-white rounded-md h-10 px-3 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              <option value="ENTREE">Ajout (Entrée de stock)</option>
              <option value="SORTIE">Retrait (Perte, Casse, Sortie)</option>
              <option value="INVENTAIRE">Inventaire (Nouvelle quantité)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantite" className="text-sm font-semibold text-white">
              {type === "INVENTAIRE" ? "Nouvelle quantité absolue" : "Quantité à ajuster"} <span className="text-brand-orange">*</span>
            </Label>
            <Input
              id="quantite"
              type="number"
              min="1"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              disabled={loading}
              className="bg-black/20 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-brand-orange rounded-md h-10"
              placeholder={type === "INVENTAIRE" ? "Ex: 45" : "Ex: 10"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif" className="text-sm font-semibold text-white">Motif (Optionnel)</Label>
            <Input
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              disabled={loading}
              className="bg-black/20 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-brand-orange rounded-md h-10"
              placeholder="Ex: Réception de marchandise"
            />
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-white/10 text-white hover:bg-white/10 hover:text-white"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
