"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Banknote,
  Smartphone,
  Wallet,
  Split,
  PauseCircle,
  Percent,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  X,
  Clock,
  History,
  LayoutGrid,
  UserPlus,
  ScanLine,
  Eye,
} from "lucide-react";
import { PosClientCombobox } from "@/components/staff/pos/PosClientCombobox";
import { CreateClientDialog } from "@/components/staff/CreateClientDialog";
import { ScanClientDialog } from "@/components/staff/pos/ScanClientDialog";
import { SplitBillDialog } from "@/components/staff/pos/SplitBillDialog";
import { ReceiptDialog } from "@/components/staff/pos/ReceiptDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getActiveSuccursale } from "@/lib/auth/tokens";
import { getSuccursale } from "@/lib/api/succursales";
import { listerMoyensPaiementActifs } from "@/lib/api/parametres";
import { ApiError, type Client, type ModePaiement } from "@/lib/api/types";
import { formatHtg, formatDateTime } from "@/lib/format";
import { getActiveSession, openSession, type SessionCaisse } from "@/lib/api/sessions";
import { cn } from "@/lib/utils";
import {
  getCategories,
  getProduits,
  type CategorieProduit,
  type Produit,
} from "@/lib/api/produits";
import {
  creerVente,
  mettreAJourVente,
  ajouterPaiement,
  getVente,
  getVentesEnAttente,
  annulerVente,
  type Vente,
  type CreateVentePayload,
} from "@/lib/api/ventes";

import { useAuth } from "@/lib/auth/auth-context";

interface LignePanier {
  produit: Produit;
  quantite: number;
}

const MODES_PAIEMENT: { value: ModePaiement; label: string; icon: typeof Banknote }[] = [
  { value: "ESPECES", label: "Espèces", icon: Banknote },
  { value: "ZELLE", label: "Zelle", icon: Smartphone },
  { value: "AVOIR", label: "Avoir client", icon: Wallet },
];

function initiales(nom: string): string {
  return nom.trim().slice(0, 2).toUpperCase();
}

// Client walk-in : `undefined` côté API (pas de clientId), pas un vrai
// enregistrement Client — voir CreateVenteDto.clientId côté backend.
function venteClientToPickerValue(client: Vente["client"]): Client | null {
  if (!client) return null;
  return {
    id: client.id,
    codeKse: client.codeKse,
    nom: client.nom,
    prenom: client.prenom,
    telephone: null,
    email: null,
    adresse: null,
    balance: "0",
    canalNotificationPrefere: "EMAIL",
    actif: true,
    createdAt: "",
    updatedAt: "",
  };
}

export default function PosPage() {
  const { user } = useAuth();
  const succursaleId = useMemo(() => getActiveSuccursale(), []);
  const [succursaleNom, setSuccursaleNom] = useState<string | null>(null);

  const isCashier = useMemo(() => {
    if (user?.isSuperAdmin) return false;
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("kse_available_succursales");
      if (stored && succursaleId) {
        try {
          const available = JSON.parse(stored);
          const currentBranch = available.find((s: any) => s.id === succursaleId);
          return currentBranch?.roleCustom?.nom === "CASHIER";
        } catch (e) { }
      }
    }
    return false;
  }, [user, succursaleId]);

  const [categories, setCategories] = useState<CategorieProduit[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categorieId, setCategorieId] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);

  const [cart, setCart] = useState<LignePanier[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [scanClientOpen, setScanClientOpen] = useState(false);
  const [remise, setRemise] = useState(0);
  const [remiseDialogOpen, setRemiseDialogOpen] = useState(false);
  const [remiseSaisie, setRemiseSaisie] = useState("0");
  const [modeSelectionne, setModeSelectionne] = useState<ModePaiement | null>(null);
  const [venteEnCours, setVenteEnCours] = useState<Vente | null>(null);
  const [cartLoaded, setCartLoaded] = useState(false);

  const [ventesEnAttente, setVentesEnAttente] = useState<Vente[]>([]);
  const [ventesEnAttenteOpen, setVentesEnAttenteOpen] = useState(false);
  const [ventesPayeesOpen, setVentesPayeesOpen] = useState(false);
  const [ventesPayees, setVentesPayees] = useState<Vente[]>([]);
  const [loadingVentesPayees, setLoadingVentesPayees] = useState(false);

  const [splitBillOpen, setSplitBillOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [receiptVente, setReceiptVente] = useState<Vente | null>(null);

  // === SESSION CAISSE (Cash Start) ===
  const [activeSession, setActiveSession] = useState<SessionCaisse | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [fondInitial, setFondInitial] = useState("");
  const [openingSession, setOpeningSession] = useState(false);

  useEffect(() => {
    if (!succursaleId) {
      setCheckingSession(false);
      return;
    }
    getActiveSession(succursaleId)
      .then((sess) => setActiveSession(sess))
      .catch((err) => console.error("Session fetch error:", err))
      .finally(() => setCheckingSession(false));
  }, [succursaleId]);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Modes de paiement réellement disponibles à la caisse — dérivés des
  // moyens de paiement actifs configurés dans Paramètres (un mode n'apparaît
  // que s'il a au moins un moyen actif qui le désigne), pas une liste fixe.
  const [modesConfigures, setModesConfigures] = useState<ModePaiement[]>([]);

  useEffect(() => {
    listerMoyensPaiementActifs()
      .then((moyens) => {
        const modes = moyens
          .map((m) => m.mode)
          .filter((m): m is ModePaiement => m !== null);
        setModesConfigures(Array.from(new Set(modes)));
      })
      .catch(() => setModesConfigures([]));
  }, []);

  const loadCatalogue = useCallback(async () => {
    if (!succursaleId) return;
    try {
      setLoadingCatalogue(true);
      const [cats, page] = await Promise.all([
        getCategories(),
        getProduits({ succursaleId, categorieId: categorieId ?? undefined, recherche: recherche || undefined, taille: 60 }),
      ]);
      setCategories(cats);
      setProduits(page.items);
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Erreur lors du chargement du catalogue.");
    } finally {
      setLoadingCatalogue(false);
    }
  }, [succursaleId, categorieId, recherche]);

  const loadVentesEnAttente = useCallback(async () => {
    if (!succursaleId) return;
    try {
      const page = await getVentesEnAttente({ succursaleId, statut: "EN_ATTENTE" });
      setVentesEnAttente(page.items);
    } catch {
      // Liste secondaire — une erreur ici ne doit pas bloquer la caisse.
    }
  }, [succursaleId]);

  const loadVentesPayees = useCallback(async () => {
    if (!succursaleId) return;
    try {
      setLoadingVentesPayees(true);
      const page = await getVentesEnAttente({ succursaleId, statut: "PAYEE" });
      setVentesPayees(page.items);
    } catch {
      // Panneau secondaire — une erreur ici ne doit pas bloquer la caisse.
    } finally {
      setLoadingVentesPayees(false);
    }
  }, [succursaleId]);

  useEffect(() => {
    if (!succursaleId) return;
    getSuccursale(succursaleId)
      .then((s) => setSuccursaleNom(s.nom))
      .catch(() => { });
  }, [succursaleId]);

  useEffect(() => {
    loadCatalogue();
  }, [loadCatalogue]);

  useEffect(() => {
    loadVentesEnAttente();
  }, [loadVentesEnAttente]);

  useEffect(() => {
    if (ventesPayeesOpen) loadVentesPayees();
  }, [ventesPayeesOpen, loadVentesPayees]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("ksexpress_pos_cart");
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedClient = localStorage.getItem("ksexpress_pos_client");
      if (savedClient) setClient(JSON.parse(savedClient));

      const savedRemise = localStorage.getItem("ksexpress_pos_remise");
      if (savedRemise) setRemise(JSON.parse(savedRemise));

      const savedVente = localStorage.getItem("ksexpress_pos_venteEnCours");
      if (savedVente) setVenteEnCours(JSON.parse(savedVente));
    } catch (err) { }
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    localStorage.setItem("ksexpress_pos_cart", JSON.stringify(cart));
    localStorage.setItem("ksexpress_pos_client", JSON.stringify(client));
    localStorage.setItem("ksexpress_pos_remise", JSON.stringify(remise));
    localStorage.setItem("ksexpress_pos_venteEnCours", JSON.stringify(venteEnCours));
  }, [cart, client, remise, venteEnCours, cartLoaded]);

  function resetCart() {
    setCart([]);
    setClient(null);
    setRemise(0);
    setModeSelectionne(null);
    setVenteEnCours(null);
  }

  function addToCart(produit: Produit) {
    setCart((lignes) => {
      const existante = lignes.find((l) => l.produit.id === produit.id);
      if (existante) {
        return lignes.map((l) =>
          l.produit.id === produit.id ? { ...l, quantite: l.quantite + 1 } : l,
        );
      }
      return [...lignes, { produit, quantite: 1 }];
    });
  }

  function updateQuantite(produitId: string, delta: number) {
    setCart((lignes) =>
      lignes
        .map((l) => (l.produit.id === produitId ? { ...l, quantite: l.quantite + delta } : l))
        .filter((l) => l.quantite > 0),
    );
  }

  function removeFromCart(produitId: string) {
    setCart((lignes) => lignes.filter((l) => l.produit.id !== produitId));
  }

  const sousTotal = cart.reduce((somme, l) => somme + Number(l.produit.prix) * l.quantite, 0);
  const total = Math.max(0, Math.round((sousTotal - remise) * 100) / 100);

  // Crée la vente si le panier n'est pas encore persisté (nouvelle vente),
  // ou synchronise la vente reprise si elle a été modifiée depuis — jamais de
  // confiance sur le total calculé côté client, le serveur recalcule tout.
  async function ensureVente(): Promise<Vente> {
    if (!succursaleId) throw new Error("Aucune succursale active.");
    const lignes = cart.map((l) => ({ produitId: l.produit.id, quantite: l.quantite }));
    if (venteEnCours) {
      return mettreAJourVente(venteEnCours.id, { clientId: client?.id, lignes, remise });
    }
    const payload: CreateVentePayload = { succursaleId, clientId: client?.id, lignes, remise };
    return creerVente(payload);
  }

  async function handleFinaliser() {
    if (cart.length === 0 || !modeSelectionne || submitting) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const vente = await ensureVente();
      const payee = await ajouterPaiement(vente.id, { montant: Number(vente.total), mode: modeSelectionne });
      setSuccessMsg(`Vente ${payee.numero} encaissée avec succès (${formatHtg(payee.total)}).`);
      setReceiptVente(payee);
      setReceiptOpen(true);
      resetCart();
      loadVentesEnAttente();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Erreur lors de l'encaissement.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMettreEnPause() {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      await ensureVente();
      setSuccessMsg("Vente mise en pause.");
      resetCart();
      loadVentesEnAttente();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Erreur lors de la mise en pause.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOuvrirSplitBill() {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const vente = await ensureVente();
      setVenteEnCours(vente);
      setSplitBillOpen(true);
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Erreur lors de la préparation du paiement divisé.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmSplitBill(lignes: { mode: ModePaiement; montant: number }[]) {
    if (!venteEnCours || submitting) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      let derniere = venteEnCours;
      for (const ligne of lignes) {
        derniere = await ajouterPaiement(derniere.id, { montant: ligne.montant, mode: ligne.mode });
      }
      setSuccessMsg(`Vente ${derniere.numero} encaissée avec succès (paiement divisé).`);
      setReceiptVente(derniere);
      setReceiptOpen(true);
      setSplitBillOpen(false);
      resetCart();
      loadVentesEnAttente();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Erreur lors du paiement divisé.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReprendreVente(id: string) {
    setErrorMsg("");
    try {
      const vente = await getVente(id);
      setVenteEnCours(vente);
      setCart(
        vente.lignes
          .filter((l) => l.produit)
          .map((l) => ({ produit: l.produit as Produit, quantite: l.quantite })),
      );
      setClient(venteClientToPickerValue(vente.client));
      setRemise(Number(vente.remise));
      setVentesEnAttenteOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Erreur lors de la reprise de la vente.");
    }
  }

  async function handleAnnulerVenteEnAttente(id: string, event: React.MouseEvent) {
    event.stopPropagation();
    try {
      await annulerVente(id);
      if (venteEnCours?.id === id) resetCart();
      loadVentesEnAttente();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Erreur lors de l'annulation.");
    }
  }

  function handleOuvrirRabais() {
    setRemiseSaisie(String(remise));
    setRemiseDialogOpen(true);
  }

  function handleConfirmerRabais() {
    setRemise(Math.max(0, Number(remiseSaisie) || 0));
    setRemiseDialogOpen(false);
  }

  const avoirActif = client !== null;

  if (checkingSession) {
    return <div className="flex h-full items-center justify-center p-6 text-white/50">Vérification de la caisse...</div>;
  }

  if (!succursaleId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex items-center gap-2 rounded-[10px] border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>Aucune succursale active — sélectionnez une succursale pour ouvrir la caisse.</span>
        </div>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[10px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <h2 className="mb-4 text-lg font-bold text-white">Ouvrir la caisse (Cash Start)</h2>
          <p className="mb-6 text-sm text-white/70">
            Veuillez entrer le montant de départ (fonds de caisse) pour commencer votre session.
          </p>
          <div className="flex flex-col gap-4">
            <Input
              type="number"
              placeholder="Montant (ex: 5000)"
              value={fondInitial}
              onChange={(e) => setFondInitial(e.target.value)}
              disabled={openingSession}
              className="border-white/10 bg-black/20 text-white"
            />
            {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}
            <Button
              className="w-full bg-brand-orange text-white hover:bg-brand-orange/90"
              disabled={openingSession || !fondInitial}
              onClick={async () => {
                setOpeningSession(true);
                setErrorMsg("");
                try {
                  const sess = await openSession(succursaleId, Number(fondInitial));
                  setActiveSession(sess);
                } catch (err: any) {
                  setErrorMsg(err.message || "Erreur lors de l'ouverture de la caisse.");
                } finally {
                  setOpeningSession(false);
                }
              }}
            >
              {openingSession ? "Ouverture..." : "Ouvrir la caisse"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
        {/* Colonne gauche : catégories, verticale (une par ligne, icône +
            libellé), à l'image d'une vraie caisse — pas des filtres en pilule
            horizontale au-dessus de la grille. */}
        <div className="flex w-26 shrink-0 flex-col gap-2 overflow-y-auto border-r border-white/10 bg-white/4 p-2 backdrop-blur-2xl sm:w-32 sm:p-3">
          <button
            onClick={() => setCategorieId(null)}
            className={cn(
              "flex h-16 shrink-0 flex-col items-center justify-center gap-1 rounded-[10px] text-[11.5px] font-bold transition-all",
              categorieId === null
                ? "bg-brand-orange text-white shadow-md"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            <LayoutGrid className="h-5 w-5" />
            Toutes
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategorieId(cat.id)}
              className="flex shrink-0 flex-col items-center gap-1.5 rounded-[10px] p-2 transition-all hover:bg-white/5"
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border text-[13px] font-extrabold transition-all",
                  categorieId === cat.id
                    ? "border-brand-orange bg-brand-orange text-white"
                    : "border-white/15 bg-white/5 text-white/70",
                )}
              >
                {initiales(cat.nom)}
              </span>
              <span
                className={cn(
                  "line-clamp-2 text-center text-[10.5px] font-semibold leading-tight",
                  categorieId === cat.id ? "text-brand-orange" : "text-white/60",
                )}
              >
                {cat.nom}
              </span>
            </button>
          ))}
        </div>

        {/* Colonne centrale : recherche + grille produits */}
        <div className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-4">
          {(errorMsg || successMsg) && (
            <div
              className={`mb-3 flex items-center gap-2 rounded-[10px] border p-3 text-sm ${errorMsg
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                }`}
            >
              {errorMsg ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
              <span>{errorMsg || successMsg}</span>
            </div>
          )}

          <div className="relative mb-3">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-brand-grey" />
            <Input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!recherche) return;
                  const searchStr = recherche.trim().toLowerCase();

                  // 1. Chercher dans les produits actuellement affichés
                  let match = produits?.find(p => p.sku.toLowerCase() === searchStr);

                  // 2. S'il n'est pas encore affiché (API pas encore revenue), on cherche directement
                  if (!match && succursaleId) {
                    try {
                      const res = await getProduits({ succursaleId, recherche: searchStr, taille: 5 });
                      match = res.items.find(p => p.sku.toLowerCase() === searchStr);
                    } catch (error) {
                      console.error("Erreur scan barcode:", error);
                    }
                  }

                  if (match) {
                    addToCart(match);
                    setRecherche("");
                    setErrorMsg(""); // Effacer les éventuelles erreurs précédentes
                  } else {
                    setErrorMsg(`Le produit (SKU: ${searchStr.toUpperCase()}) n'est pas disponible dans cette succursale.`);
                    setRecherche(""); // Optionnel : vider l'entrée pour le prochain scan
                  }
                }
              }}
              placeholder="Rechercher un produit (nom, SKU) ou Scanner un Code-barres..."
              className="h-11 rounded-[8px] border-white/15 bg-white/5 pl-10 text-white placeholder:text-white/30 focus:border-brand-orange focus:ring-brand-orange"
            />
          </div>

          {loadingCatalogue ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-[10px] border border-white/10 bg-white/5" />
              ))}
            </div>
          ) : produits.length === 0 ? (
            <div className="rounded-[10px] border border-white/15 bg-white/5 p-12 text-center backdrop-blur-xl">
              <Package className="mx-auto mb-3 h-12 w-12 text-brand-grey opacity-50" />
              <h3 className="mb-1 text-lg font-bold text-white">Aucun produit trouvé</h3>
              <p className="text-sm text-brand-grey">
                {recherche ? `Aucun résultat pour "${recherche}"` : "Aucun produit dans cette catégorie."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {produits.map((produit) => {
                const enRupture = produit.quantiteStock <= 0;
                return (
                  <button
                    key={produit.id}
                    onClick={() => !enRupture && addToCart(produit)}
                    disabled={enRupture}
                    className="group flex flex-col overflow-hidden rounded-[10px] border border-white/15 bg-white/5 text-left backdrop-blur-xl transition-all hover:border-brand-orange/40 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex aspect-square items-center justify-center bg-white/5">
                      {produit.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={produit.photoUrl} alt={produit.nom} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-10 w-10 text-white/20" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <p className="text-[10.5px] font-semibold text-white/50">
                        {produit.categorie?.nom ?? "—"} · Sku: {produit.sku}
                      </p>
                      <p className="line-clamp-2 text-[13px] font-semibold text-white group-hover:text-brand-orange transition-colors">
                        {produit.nom}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-1">
                        <span className="text-[13.5px] font-bold text-white">{formatHtg(produit.prix)}</span>
                        {enRupture ? (
                          <span className="text-[10px] font-semibold text-red-400">Rupture</span>
                        ) : (
                          <span className="rounded-[6px] bg-brand-orange/15 p-1 text-brand-orange">
                            <Plus className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne droite : client, panier, paiement */}
        <div className="flex w-85 shrink-0 flex-col border-l border-white/10 bg-white/4 backdrop-blur-2xl sm:w-95">
          <div className="border-b border-white/10 p-3">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <PosClientCombobox value={client} onChange={setClient} />
              </div>
              <button
                onClick={() => setCreateClientOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-brand-orange text-white hover:bg-brand-orange/90"
                title="Nouveau client"
              >
                <UserPlus className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={() => setScanClientOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-brand-orange text-white hover:bg-brand-orange/90"
                title="Scanner la carte client"
              >
                <ScanLine className="h-4.5 w-4.5" />
              </button>
            </div>
            {client && (
              <div className="mt-2 flex items-center justify-between rounded-[8px] border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11.5px]">
                <span className="text-amber-200/80">Code : {client.codeKse}</span>
                <span className="font-semibold text-amber-300">Avoir : {formatHtg(client.balance)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-brand-orange" />
              <span className="text-[12.5px] font-bold text-white">Panier</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] font-bold text-white/70">
                {cart.length} article{cart.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {venteEnCours && <span className="font-mono text-[10.5px] text-white/40">{venteEnCours.numero}</span>}
              {cart.length > 0 && (
                <button onClick={resetCart} className="text-white/40 hover:text-red-400" title="Vider le panier">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="p-8 text-center text-[13px] italic text-brand-grey">Panier vide — sélectionnez des produits.</div>
            ) : (
              <>
                <div className="grid grid-cols-[1fr_58px_70px] gap-1 px-3 pt-2 text-[10.5px] font-bold uppercase tracking-wider text-white/40">
                  <span>Article</span>
                  <span className="text-center">Qté</span>
                  <span className="text-right">Coût</span>
                </div>
                <div className="space-y-1 p-3 pt-1.5">
                  {cart.map((ligne) => (
                    <div
                      key={ligne.produit.id}
                      className="grid grid-cols-[1fr_58px_70px] items-center gap-1 rounded-[8px] bg-white/5 px-2 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-semibold text-white">{ligne.produit.nom}</p>
                        <p className="text-[10.5px] text-brand-grey">{formatHtg(ligne.produit.prix)}</p>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => updateQuantite(ligne.produit.id, -1)}
                          className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-white/10 text-white hover:bg-white/20"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="w-4 text-center text-[12px] font-bold text-white">{ligne.quantite}</span>
                        <button
                          onClick={() => updateQuantite(ligne.produit.id, 1)}
                          className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-white/10 text-white hover:bg-white/20"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[12px] font-bold text-white">
                          {formatHtg(Number(ligne.produit.prix) * ligne.quantite)}
                        </span>
                        <button onClick={() => removeFromCart(ligne.produit.id)} className="text-white/30 hover:text-red-400">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="shrink-0 space-y-1.5 border-t border-white/10 p-3">
            <div className="flex items-center justify-between text-[12.5px] text-white/70">
              <span>Sous-total</span>
              <span>{formatHtg(sousTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[12.5px] text-white/70">
              <span>Rabais</span>
              <span className={remise > 0 ? "text-brand-orange" : ""}>-{formatHtg(remise)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-[15px] font-extrabold text-white">
              <span>Total à payer</span>
              <span className="text-brand-orange">{formatHtg(total)}</span>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-white/10 p-3">
            <div className="space-y-1.5">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/40">Mode de paiement</p>
              {modesConfigures.length === 0 ? (
                <p className="rounded-[8px] border border-dashed border-white/15 bg-white/5 p-2 text-[11px] text-white/50">
                  Aucun moyen de paiement configuré — voir Paramètres.
                </p>
              ) : (
                MODES_PAIEMENT.filter(({ value }) => modesConfigures.includes(value)).map(({ value, label, icon: Icon }) => {
                  const disabled = value === "AVOIR" && !avoirActif;
                  const selected = modeSelectionne === value;
                  return (
                    <button
                      key={value}
                      onClick={() => !disabled && setModeSelectionne(selected ? null : value)}
                      disabled={disabled || cart.length === 0}
                      title={disabled ? "Sélectionnez un client pour utiliser l'avoir" : undefined}
                      className={cn(
                        "flex h-9 w-full items-center gap-1.5 rounded-[8px] border px-2.5 text-[11.5px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40",
                        selected
                          ? "border-brand-orange bg-brand-orange/15 text-brand-orange"
                          : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/40">Actions</p>
              <button
                onClick={handleMettreEnPause}
                disabled={cart.length === 0 || submitting}
                className="flex h-9 w-full items-center gap-1.5 rounded-[8px] border border-white/15 bg-white/5 px-2.5 text-[11.5px] font-semibold text-white/80 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PauseCircle className="h-3.5 w-3.5 shrink-0" />
                En Pause
              </button>
              <button
                onClick={handleOuvrirRabais}
                disabled={cart.length === 0}
                className="flex h-9 w-full items-center gap-1.5 rounded-[8px] border border-white/15 bg-white/5 px-2.5 text-[11.5px] font-semibold text-white/80 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Percent className="h-3.5 w-3.5 shrink-0" />
                Rabais
              </button>
              <button
                onClick={handleOuvrirSplitBill}
                disabled={cart.length === 0 || submitting}
                className="flex h-9 w-full items-center gap-1.5 rounded-[8px] border border-white/15 bg-white/5 px-2.5 text-[11.5px] font-semibold text-white/80 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Split className="h-3.5 w-3.5 shrink-0" />
                Split Bill
              </button>
              <button
                onClick={handleFinaliser}
                disabled={cart.length === 0 || !modeSelectionne || submitting}
                className="flex h-9 w-full items-center gap-1.5 rounded-[8px] bg-brand-orange px-2.5 text-[11.5px] font-bold text-white transition-all hover:bg-brand-orange/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                Finaliser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'actions flottante en bas — accès aux ventes en attente et à
          l'historique du jour, sans quitter la caisse (voir aussi "En Pause"
          dans le panier, qui crée l'entrée consultée ici). */}
      <div className="flex shrink-0 items-center justify-center gap-2 border-t border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-2xl sm:gap-3 sm:px-4">
        <Button
          onClick={() => setVentesEnAttenteOpen(true)}
          variant="outline"
          className="h-9 gap-2 rounded-[8px] border-white/15 bg-white/5 px-4 font-semibold text-white hover:bg-white/10 sm:h-10"
        >
          <Clock className="h-4 w-4 text-brand-orange" />
          Vente en Attente
          {ventesEnAttente.length > 0 && (
            <span className="rounded-full bg-brand-orange px-1.5 text-[11px] font-bold text-white">
              {ventesEnAttente.length}
            </span>
          )}
        </Button>
        <Button
          onClick={() => setVentesPayeesOpen(true)}
          variant="outline"
          className="h-9 gap-2 rounded-[8px] border-white/15 bg-white/5 px-4 font-semibold text-white hover:bg-white/10 sm:h-10"
        >
          <History className="h-4 w-4 text-emerald-400" />
          Mes Ventes
        </Button>
      </div>

      {/* Sheet — Ventes en attente (reprise) */}
      <Sheet open={ventesEnAttenteOpen} onOpenChange={setVentesEnAttenteOpen}>
        <SheetContent side="right" className="w-100 border-l border-white/15 bg-[#141b6e]/60 text-white backdrop-blur-2xl sm:w-110">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5 text-brand-orange" />
              Ventes en attente
            </SheetTitle>
            <SheetDescription>Reprenez une vente mise en pause pour cette succursale.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
            {ventesEnAttente.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-brand-grey">
                Aucune vente en attente.
              </div>
            ) : (
              ventesEnAttente.map((v) => (
                <div
                  key={v.id}
                  onClick={() => handleReprendreVente(v.id)}
                  className="group flex cursor-pointer items-center justify-between gap-2 rounded-[10px] border border-white/10 bg-white/5 p-3 transition-all hover:border-brand-orange/40 hover:bg-white/10"
                >
                  <div>
                    <p className="font-mono text-[12.5px] font-semibold text-brand-orange">{v.numero}</p>
                    <p className="text-[12px] text-white/60">
                      {v.client ? `${v.client.prenom ?? ""} ${v.client.nom}`.trim() : "Walk-in Customer"} ·{" "}
                      {formatDateTime(v.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{formatHtg(v.total)}</span>
                    <button
                      onClick={(e) => handleAnnulerVenteEnAttente(v.id, e)}
                      className="text-white/40 hover:text-red-400"
                      title="Annuler cette vente"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet — Mes ventes du jour (consultation) */}
      <Sheet open={ventesPayeesOpen} onOpenChange={setVentesPayeesOpen}>
        <SheetContent side="right" className="w-100 border-l border-white/15 bg-[#141b6e]/60 text-white backdrop-blur-2xl sm:w-110">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-white">
              <History className="h-5 w-5 text-emerald-400" />
              Mes ventes du jour
            </SheetTitle>
            <SheetDescription>Ventes encaissées à cette succursale.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
            {loadingVentesPayees ? (
              <div className="py-8 text-center text-sm text-brand-grey">Chargement...</div>
            ) : ventesPayees.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-brand-grey">
                Aucune vente encaissée pour le moment.
              </div>
            ) : (
              ventesPayees.map((v) => (
                <div key={v.id} className="rounded-[10px] border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-[12.5px] font-semibold text-emerald-400">{v.numero}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{formatHtg(v.total)}</span>
                      <button
                        onClick={() => {
                          setReceiptVente(v);
                          setReceiptOpen(true);
                        }}
                        className="text-white/50 hover:text-white"
                        title="Voir le détail / réimprimer le reçu"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-0.5 text-[12px] text-white/60">
                    {v.client ? `${v.client.prenom ?? ""} ${v.client.nom}`.trim() : "Walk-in Customer"} ·{" "}
                    {formatDateTime(v.createdAt)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {v.paiements.map((p) => (
                      <span key={p.id} className="rounded-[6px] bg-white/10 px-2 py-0.5 text-[10.5px] font-semibold text-white/70">
                        {p.mode} · {formatHtg(p.montant)}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog — Nouveau client (walk-in de la boutique, pas un client shipping —
          pas de champ email, voir PosClientCombobox) */}
      <CreateClientDialog
        open={createClientOpen}
        onOpenChange={setCreateClientOpen}
        onCreated={setClient}
        showEmail={false}
      />

      {/* Dialog — Scanner la carte client (code KSE en code-barres) */}
      <ScanClientDialog
        key={scanClientOpen ? "open" : "closed"}
        open={scanClientOpen}
        onOpenChange={setScanClientOpen}
        onFound={setClient}
      />

      {/* Dialog — Rabais */}
      <Dialog open={remiseDialogOpen} onOpenChange={setRemiseDialogOpen}>
        <DialogContent className="max-w-xs border-white/15 bg-white/10 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle>Rabais</DialogTitle>
          </DialogHeader>
          <div>
            <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-white/70">Montant du rabais</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={remiseSaisie}
              onChange={(e) => setRemiseSaisie(e.target.value)}
              className="h-11 rounded-[8px] border-white/15 bg-white/5 text-white"
              autoFocus
            />
            <p className="mt-1.5 text-[12px] text-white/50">Sous-total : {formatHtg(sousTotal)}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemiseDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleConfirmerRabais} className="bg-brand-orange text-white hover:bg-brand-orange/90 font-bold">
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SplitBillDialog
        key={venteEnCours?.id ?? "none"}
        open={splitBillOpen}
        onOpenChange={setSplitBillOpen}
        montantDu={venteEnCours ? Number(venteEnCours.total) : total}
        avoirActif={avoirActif}
        modesConfigures={modesConfigures}
        isSubmitting={submitting}
        onConfirm={handleConfirmSplitBill}
      />

      {/* Dialog — Reçu (après encaissement, ou réimpression depuis "Mes ventes") */}
      <ReceiptDialog vente={receiptVente} open={receiptOpen} onOpenChange={setReceiptOpen} succursaleNom={succursaleNom} />
    </div>
  );
}
