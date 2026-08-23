"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { getCategories, CategorieProduit } from "@/lib/api/produits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tags, Plus, Search, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddCategoryModal } from "@/components/staff/produits/CategoryModals";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategorieProduit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categorieToEdit, setCategorieToEdit] = useState<CategorieProduit | null>(null);

  const loadCategories = () => {
    getCategories()
      .then(setCategories)
      .catch((err) => setError(err.message || "Erreur de chargement."));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = categories?.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) || 
    c.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleOpenNew = () => {
    setCategorieToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CategorieProduit) => {
    setCategorieToEdit(cat);
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col min-w-0">
      <PageHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Tags className="h-7 w-7 text-brand-orange" />
              Catégories Globales
              <Badge className="bg-brand-orange/20 text-brand-orange border-brand-orange/30 font-bold px-2 py-0.5 text-xs rounded-md ml-2">
                {categories?.length || 0} Total
              </Badge>
            </h1>
            <p className="text-sm text-brand-grey mt-0.5">Gérez les catégories applicables à tous vos produits</p>
          </div>

          <Button
            onClick={handleOpenNew}
            className="bg-brand-orange text-white hover:bg-brand-orange/90 font-bold shadow-md rounded-[8px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            NOUVELLE CATÉGORIE
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-6 max-w-5xl w-full mx-auto">
        <div className="rounded-[10px] bg-white/5 border border-white/15 p-4 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-grey" />
              <Input
                placeholder="Rechercher une catégorie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-brand-orange rounded-md h-9"
              />
            </div>
          </div>

          {error ? (
            <div className="text-center p-8 text-red-400 bg-red-400/10 rounded-[10px] border border-red-400/20">
              {error}
            </div>
          ) : categories === null ? (
            <div className="text-center p-8 text-brand-grey">Chargement...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center p-8 text-brand-grey bg-black/10 rounded-[10px] border border-white/5">
              Aucune catégorie trouvée.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[8px] border border-white/10 bg-black/20">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 border-b border-white/10 font-semibold text-brand-grey uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3 w-1/3">Nom</th>
                    <th className="px-4 py-3 w-1/3">Description</th>
                    <th className="px-4 py-3">Créée le</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white">
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-semibold">{cat.nom}</td>
                      <td className="px-4 py-3 text-white/70">
                        {cat.description ? (
                          <span className="line-clamp-1" title={cat.description}>{cat.description}</span>
                        ) : (
                          <span className="italic text-white/30">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(cat.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleOpenEdit(cat)}
                          className="text-brand-grey hover:text-white"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categorieToEdit={categorieToEdit}
        onSuccess={(cat) => {
          if (categorieToEdit) {
            setCategories(prev => prev ? prev.map(c => c.id === cat.id ? cat : c) : [cat]);
          } else {
            setCategories(prev => prev ? [...prev, cat] : [cat]);
          }
        }}
      />
    </div>
  );
}
