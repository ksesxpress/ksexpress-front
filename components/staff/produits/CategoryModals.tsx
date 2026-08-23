import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCategorie, updateCategorie, CategorieProduit } from "@/lib/api/produits";

export function AddCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  categorieToEdit = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cat: CategorieProduit) => void;
  categorieToEdit?: CategorieProduit | null;
}) {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categorieToEdit) {
      setNom(categorieToEdit.nom);
      setDescription(categorieToEdit.description || "");
    } else {
      setNom("");
      setDescription("");
    }
    setError(null);
  }, [categorieToEdit, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nom.trim()) {
      setError("Le nom de la catégorie est requis.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nom: nom.trim(),
        description: description.trim() || undefined,
      };

      let cat: CategorieProduit;
      if (categorieToEdit) {
        cat = await updateCategorie(categorieToEdit.id, payload);
      } else {
        cat = await createCategorie(payload);
      }

      onSuccess(cat);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-brand-dark/95 border-brand-grey/20 text-white shadow-2xl backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            {categorieToEdit ? "Modifier la Catégorie" : "Nouvelle Catégorie"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nom" className="text-sm font-semibold text-white">Nom de la catégorie <span className="text-brand-orange">*</span></Label>
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              disabled={loading}
              className="bg-black/20 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-brand-orange rounded-md h-10"
              placeholder="Ex: Soins capillaires"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-white">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="bg-black/20 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-brand-orange rounded-md"
              placeholder="Courte description de la catégorie..."
            />
          </div>
          {error && <div className="text-red-400 text-sm font-medium">{error}</div>}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="border-white/10 text-white hover:bg-white/5 rounded-md">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-brand-orange text-white hover:bg-brand-orange/90 font-bold rounded-md">
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
