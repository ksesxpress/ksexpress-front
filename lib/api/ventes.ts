import { apiFetch } from "./client";
import type { ModePaiement, PaginatedResult } from "./types";
import type { Produit } from "./produits";

// Ventes en point de vente (POS) — voir VentesService côté backend. `total`
// toujours calculé côté serveur ; le panier n'est qu'une proposition.
export type StatutVente = "EN_ATTENTE" | "PAYEE" | "ANNULEE";

export interface VenteLigneInput {
  produitId: string;
  quantite: number;
}

export interface VenteLigne extends VenteLigneInput {
  id: string;
  venteId: string;
  prixUnitaire: string;
  sousTotal: string;
  produit?: Produit;
}

export interface VentePaiement {
  id: string;
  venteId: string;
  mode: ModePaiement;
  montant: string;
  reference: string | null;
  createdAt: string;
}

export interface Vente {
  id: string;
  numero: string;
  succursaleId: string;
  clientId: string | null;
  caissierId: string;
  statut: StatutVente;
  sousTotal: string;
  taxe: string;
  remise: string;
  total: string;
  lignes: VenteLigne[];
  paiements: VentePaiement[];
  client?: { id: string; codeKse: string; nom: string; prenom: string | null } | null;
  caissier?: { id: string; nom: string | null; prenom: string | null };
  succursale?: { id: string; nom: string; code: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateVentePayload {
  succursaleId: string;
  clientId?: string;
  lignes: VenteLigneInput[];
  remise?: number;
  taxe?: number;
}

export interface AjouterPaiementVentePayload {
  montant: number;
  mode: ModePaiement;
  reference?: string;
}

export async function creerVente(payload: CreateVentePayload): Promise<Vente> {
  return apiFetch<Vente>("/ventes", { method: "POST", body: payload });
}

export async function getVentesEnAttente(query: {
  succursaleId: string;
  statut?: StatutVente;
  page?: number;
  taille?: number;
}): Promise<PaginatedResult<Vente>> {
  const params = new URLSearchParams();
  params.append("succursaleId", query.succursaleId);
  if (query.statut) params.append("statut", query.statut);
  if (query.page) params.append("page", String(query.page));
  if (query.taille) params.append("taille", String(query.taille));
  return apiFetch<PaginatedResult<Vente>>(`/ventes?${params.toString()}`);
}

export async function getVente(id: string): Promise<Vente> {
  return apiFetch<Vente>(`/ventes/${id}`);
}

export async function mettreAJourVente(
  id: string,
  payload: Partial<Omit<CreateVentePayload, "succursaleId">>,
): Promise<Vente> {
  return apiFetch<Vente>(`/ventes/${id}`, { method: "PATCH", body: payload });
}

export async function ajouterPaiement(id: string, payload: AjouterPaiementVentePayload): Promise<Vente> {
  return apiFetch<Vente>(`/ventes/${id}/paiements`, { method: "POST", body: payload });
}

export async function annulerVente(id: string): Promise<Vente> {
  return apiFetch<Vente>(`/ventes/${id}/annuler`, { method: "POST" });
}

// Reçu PDF — même modèle que getFacturePdfUrl (facturation shipping) : la
// route renvoie un blob (pas du JSON), voir apiFetch qui détecte le
// content-type et retourne res.blob() dans ce cas.
export const getVentePdfUrl = (id: string, format: "a4" | "pos80" = "a4") =>
  `/ventes/${id}/pdf?format=${format}`;

export async function rechercheVentesRapports(query: {
  succursaleId?: string | null;
  statut?: StatutVente;
  dateDebut?: string;
  dateFin?: string;
  allStatuses?: boolean;
  page?: number;
  taille?: number;
}): Promise<PaginatedResult<Vente>> {
  const params = new URLSearchParams();
  if (query.succursaleId) params.append("succursaleId", query.succursaleId);
  if (query.statut) params.append("statut", query.statut);
  if (query.dateDebut) params.append("dateDebut", query.dateDebut);
  if (query.dateFin) params.append("dateFin", query.dateFin);
  if (query.allStatuses) params.append("allStatuses", "true");
  if (query.page) params.append("page", String(query.page));
  if (query.taille) params.append("taille", String(query.taille));
  return apiFetch<PaginatedResult<Vente>>(`/ventes/rapports?${params.toString()}`);
}
