import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxEmpty, ComboboxList, ComboboxItem } from "@/components/ui/combobox";
import { createProduit, updateProduit, uploadProduitPhoto, getCategories, Produit, CategorieProduit } from "@/lib/api/produits";
import { getAvailableSuccursales } from "@/lib/auth/tokens";
import { Loader2, Upload, X } from "lucide-react";

export function ProductModal({
  isOpen,
  onClose,
  onSuccess,
  productToEdit = null,
  succursaleId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: Produit | null;
  succursaleId: string | null;
}) {
  const [nom, setNom] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [quantiteStock, setQuantiteStock] = useState("");
  const [categorieId, setCategorieId] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState("");
  
  const [categories, setCategories] = useState<CategorieProduit[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [boutiqueQuery, setBoutiqueQuery] = useState("");
  const [catQuery, setCatQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableBoutiques = (getAvailableSuccursales() || []).filter(
    (b: any) => b.activite === "BOUTIQUE"
  );

  useEffect(() => {
    if (isOpen) {
      getCategories().then(setCategories).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (productToEdit) {
      setNom(productToEdit.nom);
      setSku(productToEdit.sku);
      setDescription(productToEdit.description || "");
      setPrix(productToEdit.prix.toString());
      setQuantiteStock(productToEdit.quantiteStock.toString());
      setCategorieId(productToEdit.categorieId || "");
      setPhotoUrl(productToEdit.photoUrl || "");
      setSelectedBoutiqueId(productToEdit.succursaleId);
      
      const b = availableBoutiques.find((x: any) => x.id === productToEdit.succursaleId);
      setBoutiqueQuery(b ? b.nom : "Succursale inconnue");

      if (productToEdit.categorieId) {
        const cat = categories.find(c => c.id === productToEdit.categorieId);
        setCatQuery(cat ? cat.nom : "");
      } else {
        setCatQuery("");
      }
    } else {
      setNom("");
      setSku("");
      setDescription("");
      setPrix("");
      setQuantiteStock("");
      setCategorieId("");
      setPhotoUrl("");
      setCatQuery("");
      
      const defaultBoutique = succursaleId || (availableBoutiques.length > 0 ? availableBoutiques[0].id : "");
      setSelectedBoutiqueId(defaultBoutique);
      const b = availableBoutiques.find((x: any) => x.id === defaultBoutique);
      setBoutiqueQuery(b ? b.nom : "");
    }
    setError(null);
  }, [productToEdit, isOpen, succursaleId, availableBoutiques.length, categories.length]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const res = await uploadProduitPhoto(file);
      setPhotoUrl(res.url);
    } catch (err: any) {
      setError(err.message || "Erreur d'upload de la photo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (!selectedBoutiqueId) {
      setError("Veuillez sélectionner une boutique.");
      return;
    }
    if (!nom.trim() || !sku.trim() || !prix) {
      setError("Nom, SKU et Prix sont requis.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        succursaleId: selectedBoutiqueId,
        nom: nom.trim(),
        sku: sku.trim(),
        description: description.trim() || undefined,
        prix: Number(prix),
        quantiteStock: quantiteStock ? Number(quantiteStock) : undefined,
        categorieId: categorieId || undefined,
        photoUrl: photoUrl || undefined,
      };

      if (productToEdit) {
        const updatePayload = { ...payload } as any;
        delete updatePayload.succursaleId;
        await updateProduit(productToEdit.id, updatePayload);
      } else {
        await createProduit(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  }

  const filteredBoutiques = boutiqueQuery 
    ? availableBoutiques.filter((b: any) => b.nom.toLowerCase().includes(boutiqueQuery.toLowerCase()))
    : availableBoutiques;

  const filteredCategories = catQuery
    ? categories.filter(c => c.nom.toLowerCase().includes(catQuery.toLowerCase()))
    : categories;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-brand-dark/95 border-brand-grey/20 text-white shadow-2xl backdrop-blur-xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            {productToEdit ? "Modifier le Produit" : "Nouveau Produit"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-sm font-semibold text-white">Boutique <span className="text-brand-orange">*</span></Label>
              <Combobox
                items={filteredBoutiques.map((b: any) => b.id)}
                value={selectedBoutiqueId || null}
                onValueChange={(val) => {
                  setSelectedBoutiqueId(val || "");
                  if (val) {
                    const b = availableBoutiques.find((x: any) => x.id === val);
                    if (b) setBoutiqueQuery(b.nom);
                  } else {
                    setBoutiqueQuery("");
                  }
                }}
                inputValue={boutiqueQuery}
                onInputValueChange={setBoutiqueQuery}
                itemToStringLabel={(id) => availableBoutiques.find((b: any) => b.id === id)?.nom || ""}
              >
                <ComboboxInput
                  placeholder="Rechercher une boutique..."
                  className="w-full h-10 rounded-md border-white/10 bg-black/20 text-white [&_input]:text-white focus-within:border-brand-orange focus-within:ring-brand-orange"
                  disabled={!!productToEdit}
                />
                <ComboboxContent className="border-white/15 bg-[#141b6e]/95 text-white backdrop-blur-2xl">
                  <ComboboxEmpty className="py-6 text-center text-sm text-brand-grey">
                    Aucune boutique trouvée.
                  </ComboboxEmpty>
                  <ComboboxList>
                    {filteredBoutiques.map((b: any) => (
                      <ComboboxItem key={b.id} value={b.id} className="text-white data-highlighted:bg-white/10 cursor-pointer">
                        {b.nom}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom" className="text-sm font-semibold text-white">Nom du produit <span className="text-brand-orange">*</span></Label>
              <Input
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                disabled={loading}
                className="bg-black/20 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-brand-orange rounded-md h-10"
                placeholder="Ex: Savon éclaircissant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku" className="text-sm font-semibold text-white">SKU / Code-barres <span className="text-brand-orange">*</span></Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                disabled={loading}
                className="bg-black/20 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-brand-orange rounded-md h-10"
                placeholder="PROD-12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prix" className="text-sm font-semibold text-white">Prix (HTG/USD) <span className="text-brand-orange">*</span></Label>
              <Input
                id="prix"
                type="number"
                min="0"
                step="0.01"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                disabled={loading}
                className="bg-black/20 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-brand-orange rounded-md h-10"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantiteStock" className="text-sm font-semibold text-white">Stock Initial</Label>
              <Input
                id="quantiteStock"
                type="number"
                min="0"
                value={quantiteStock}
                onChange={(e) => setQuantiteStock(e.target.value)}
                disabled={loading}
                className="bg-black/20 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-brand-orange rounded-md h-10"
                placeholder="0"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-sm font-semibold text-white">Catégorie</Label>
              <Combobox
                items={["none", ...filteredCategories.map(c => c.id)]}
                value={categorieId || "none"}
                onValueChange={(val) => {
                  if (!val || val === "none") {
                    setCategorieId("");
                    setCatQuery("");
                  } else {
                    setCategorieId(val);
                    const cat = categories.find(c => c.id === val);
                    if (cat) setCatQuery(cat.nom);
                  }
                }}
                inputValue={catQuery}
                onInputValueChange={setCatQuery}
                itemToStringLabel={(id) => {
                  if (id === "none") return "-- Sans catégorie --";
                  return categories.find(c => c.id === id)?.nom || "";
                }}
              >
                <ComboboxInput
                  placeholder="Rechercher une catégorie..."
                  className="w-full h-10 rounded-md border-white/10 bg-black/20 text-white [&_input]:text-white focus-within:border-brand-orange focus-within:ring-brand-orange"
                  showClear={true}
                />
                <ComboboxContent className="border-white/15 bg-[#141b6e]/95 text-white backdrop-blur-2xl">
                  <ComboboxEmpty className="py-6 text-center text-sm text-brand-grey">
                    Aucune catégorie trouvée.
                  </ComboboxEmpty>
                  <ComboboxList>
                    <ComboboxItem value="none" className="text-white/60 data-highlighted:bg-white/10 cursor-pointer italic">
                      -- Sans catégorie --
                    </ComboboxItem>
                    {filteredCategories.map(c => (
                      <ComboboxItem key={c.id} value={c.id} className="text-white data-highlighted:bg-white/10 cursor-pointer">
                        {c.nom}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description" className="text-sm font-semibold text-white">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                className="bg-black/20 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-brand-orange rounded-md"
                placeholder="Description du produit..."
              />
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-sm font-semibold text-white">Photo du Produit</Label>
              <div className="flex items-center gap-4">
                {photoUrl && (
                  <div className="relative w-16 h-16 rounded-md overflow-hidden bg-white/5 border border-white/10">
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl("")}
                      className="absolute top-0 right-0 bg-black/50 p-1 text-white hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || loading}
                    className="border-white/10 text-white hover:bg-white/5 rounded-md"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {uploading ? "Upload en cours..." : "Choisir une image"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {error && <div className="text-red-400 text-sm font-medium mt-2">{error}</div>}
          
          <DialogFooter className="pt-4 border-t border-white/10 mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="border-white/10 text-white hover:bg-white/5 rounded-md">
              Annuler
            </Button>
            <Button type="submit" disabled={loading || uploading} className="bg-brand-orange text-white hover:bg-brand-orange/90 font-bold rounded-md">
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
