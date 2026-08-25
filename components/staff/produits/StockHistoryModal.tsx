import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Produit } from "@/lib/api/produits";
import { API_URL } from "@/lib/api/config";
import { getAccessToken } from "@/lib/auth/tokens";


interface MouvementStock {
  id: string;
  type: string;
  quantite: number;
  quantiteAvant: number;
  quantiteApres: number;
  motif?: string;
  reference?: string;
  createdAt: string;
  utilisateur: {
    prenom: string | null;
    nom: string;
    email: string | null;
  };
}

export function StockHistoryModal({
  isOpen,
  onClose,
  produit,
}: {
  isOpen: boolean;
  onClose: () => void;
  produit: Produit | null;
}) {
  const [loading, setLoading] = useState(false);
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && produit) {
      loadHistory();
    }
  }, [isOpen, produit]);

  async function loadHistory() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/produits/${produit!.id}/mouvements`, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      });
      if (!res.ok) throw new Error("Erreur lors du chargement de l'historique.");
      const data = await res.json();
      setMouvements(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case "ENTREE":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">Entrée</span>;
      case "RETOUR":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">Retour</span>;
      case "VENTE":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-orange/20 text-brand-orange">Vente</span>;
      case "SORTIE":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">Sortie</span>;
      case "INVENTAIRE":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">Inventaire</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-white/80">{type}</span>;
    }
  }

  if (!produit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] bg-[#0c124e] border-white/10 text-white max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Historique du stock - {produit.nom}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : mouvements.length === 0 ? (
            <div className="text-center text-white/60 py-8">Aucun mouvement de stock enregistré.</div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-white/10">
              <table className="w-full text-sm text-left text-white/80">
                <thead className="text-xs text-white uppercase bg-white/5">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Qte</th>
                    <th className="px-4 py-3 text-right">Avant → Après</th>
                    <th className="px-4 py-3">Utilisateur</th>
                    <th className="px-4 py-3">Motif / Réf</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {mouvements.map((m) => (
                    <tr key={m.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Intl.DateTimeFormat("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(m.createdAt))}
                      </td>
                      <td className="px-4 py-3">
                        {getTypeBadge(m.type)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {(m.type === "SORTIE" || m.type === "VENTE") ? "-" : "+"}{m.quantite}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-white/60">
                        {m.quantiteAvant} &rarr; <span className="text-white font-medium">{m.quantiteApres}</span>
                      </td>
                      <td className="px-4 py-3">
                        {m.utilisateur.prenom} {m.utilisateur.nom}
                      </td>
                      <td className="px-4 py-3 text-xs max-w-[150px] truncate" title={m.motif || m.reference || "-"}>
                        {m.motif || m.reference || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-white/10 text-white hover:bg-white/10 hover:text-white"
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
