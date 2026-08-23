"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { getProduits, toggleProduitActif, Produit } from "@/lib/api/produits";
import { getActiveSuccursale } from "@/lib/auth/tokens";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Plus, Search, MoreHorizontal, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductModal } from "@/components/staff/produits/ProductModals";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxEmpty, ComboboxList, ComboboxItem } from "@/components/ui/combobox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ProductsPage() {
  const [products, setProducts] = useState<Produit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produit | null>(null);

  const [availableSuccursales, setAvailableSuccursales] = useState<any[]>([]);
  const [localSuccursaleId, setLocalSuccursaleId] = useState<string>("all");
  const [boutiqueQuery, setBoutiqueQuery] = useState("");

  useEffect(() => {
    import("@/lib/auth/tokens").then(({ getAvailableSuccursales, getActiveSuccursale }) => {
      const branches = (getAvailableSuccursales() || []).filter(
        (b: any) => b.activite === "BOUTIQUE"
      );
      setAvailableSuccursales(branches);
      // setLocalSuccursaleId(getActiveSuccursale() || (branches.length > 0 ? branches[0].id : null));
      setLocalSuccursaleId("all");
    });
  }, []);

  const loadProducts = () => {
    getProduits({ succursaleId: localSuccursaleId === "all" ? undefined : localSuccursaleId, taille: 100 }) // using taille 100 for a simple view first
      .then((res) => setProducts(res.items))
      .catch((err) => setError(err.message || "Erreur de chargement."));
  };

  useEffect(() => {
    loadProducts();
  }, [localSuccursaleId]);

  const filteredProducts = products?.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  ) || [];

  async function handleToggle(id: string) {
    try {
      const updated = await toggleProduitActif(id);
      setProducts(prev => prev?.map(p => p.id === id ? updated : p) ?? null);
    } catch (err: any) {
      alert(err.message || "Erreur lors de la modification du statut.");
    }
  }

  function openNewProduct() {
    setEditingProduct(null);
    setIsModalOpen(true);
  }

  function openEditProduct(product: Produit) {
    setEditingProduct(product);
    setIsModalOpen(true);
  }

  return (
    <div className="flex min-h-screen flex-col min-w-0">
      <PageHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Package className="h-7 w-7 text-brand-orange" />
              Catalogue Produits
              <Badge className="bg-brand-orange/20 text-brand-orange border-brand-orange/30 font-bold px-2 py-0.5 text-xs rounded-md ml-2">
                {products?.length || 0} Total
              </Badge>
            </h1>
            <p className="text-sm text-brand-grey mt-0.5">Gérez les produits disponibles pour votre succursale</p>
          </div>

          <Button
            onClick={openNewProduct}
            className="bg-brand-orange text-white hover:bg-brand-orange/90 font-bold shadow-md rounded-[8px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            NOUVEAU PRODUIT
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-6 max-w-7xl w-full mx-auto">
        <div className="rounded-[10px] bg-white/5 border border-white/15 p-4 backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4 flex-1 overflow-hidden">
              <div className="relative w-full sm:w-[320px] shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-grey" />
                <Input
                  placeholder="Rechercher par nom ou SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-brand-orange rounded-md h-9 w-full"
                />
              </div>

              {availableSuccursales.length > 0 && (
                <div className="w-full sm:w-[250px] shrink-0">
                  <Combobox
                    items={["all", ...availableSuccursales.map(s => s.id)]}
                    value={localSuccursaleId}
                    onValueChange={(val) => {
                      setLocalSuccursaleId(val || "all");
                      if (val && val !== "all") {
                        const b = availableSuccursales.find((x: any) => x.id === val);
                        if (b) setBoutiqueQuery(b.nom);
                      } else {
                        setBoutiqueQuery("");
                      }
                    }}
                    inputValue={boutiqueQuery}
                    onInputValueChange={setBoutiqueQuery}
                    itemToStringLabel={(id) => {
                      if (id === "all") return "Toutes les boutiques";
                      return availableSuccursales.find((b: any) => b.id === id)?.nom || "";
                    }}
                  >
                    <ComboboxInput
                      placeholder="Filtrer par boutique..."
                      className="h-9 rounded-md border-white/10 bg-black/20 text-white [&_input]:text-white focus-within:border-brand-orange focus-within:ring-brand-orange w-full"
                      showClear={true}
                    />
                  <ComboboxContent className="border-white/15 bg-[#141b6e]/95 text-white backdrop-blur-2xl">
                    <ComboboxEmpty className="py-6 text-center text-sm text-brand-grey">
                      Aucune boutique trouvée.
                    </ComboboxEmpty>
                    <ComboboxList>
                      <ComboboxItem value="all" className="text-white/60 data-highlighted:bg-white/10 cursor-pointer italic">
                        Toutes les boutiques
                      </ComboboxItem>
                      {availableSuccursales
                        .filter(b => boutiqueQuery ? b.nom.toLowerCase().includes(boutiqueQuery.toLowerCase()) : true)
                        .map(b => (
                        <ComboboxItem key={b.id} value={b.id} className="text-white data-highlighted:bg-white/10 cursor-pointer">
                          {b.nom}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
              )}
            </div>
          </div>

          {error ? (
            <div className="text-center p-8 text-red-400 bg-red-400/10 rounded-[10px] border border-red-400/20">
              {error}
            </div>
          ) : products === null ? (
            <div className="text-center p-8 text-brand-grey">Chargement...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center p-8 text-brand-grey bg-black/10 rounded-[10px] border border-white/5">
              Aucun produit trouvé.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[8px] border border-white/10 bg-black/20">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 border-b border-white/10 font-semibold text-brand-grey uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Image</th>
                    <th className="px-4 py-3">Produit</th>
                    <th className="px-4 py-3">Catégorie</th>
                    <th className="px-4 py-3">Prix</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        {prod.photoUrl ? (
                          <img src={prod.photoUrl} alt={prod.nom} className="w-10 h-10 object-cover rounded-md bg-white/10" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
                            <Package className="w-5 h-5 text-brand-grey" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{prod.nom}</div>
                        <div className="text-xs text-muted-foreground">{prod.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-brand-grey">
                        {prod.categorie?.nom || "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-brand-orange">
                        ${Number(prod.prix).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="bg-white/5 text-white border-white/10">
                          {prod.quantiteStock}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {prod.actif ? (
                          <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 font-medium">Actif</Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 font-medium">Inactif</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/10">
                              <span className="sr-only">Menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-brand-dark border-brand-grey/20 text-white">
                            <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer" onClick={() => openEditProduct(prod)}>
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer" onClick={() => handleToggle(prod.id)}>
                              {prod.actif ? "Désactiver" : "Activer"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={editingProduct}
        succursaleId={localSuccursaleId}
        onSuccess={() => {
          loadProducts(); // refresh the list
        }}
      />
    </div>
  );
}
