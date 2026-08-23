import { apiFetch } from "./client";
import type { Facture, ModePaiement, PaginatedResult, StatutFacture } from "./types";

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export interface CreateFacturePayload {
  clientId: string;
  colisIds?: string[];
  lotId?: string;
  fraisSupplementaires?: number;
  fraisSupplementairesLabel?: string;
}

export interface AjouterPaiementPayload {
  montant: number;
  mode: ModePaiement;
  reference?: string;
  autoriserCredit?: boolean;
  remise?: number;
}

export interface FacturePreview {
  total: number;
  totalColis: number;
  fraisSupplementaires: number;
  poidsTotal: number;
  lignes: {
    colisId: string;
    tracking: string | null;
    poidsFacture: number;
    prixUnitaire: number;
    fraisFixes: number;
    taxes: number;
    montant: number;
  }[];
}

// --- Équipe (Caissier encaisse, Super Admin, lecture élargie à Employé Shipping) ---
export const createFacture = (payload: CreateFacturePayload) =>
  apiFetch<Facture>("/invoices", { method: "POST", body: payload });

export const previewFacture = (payload: CreateFacturePayload) =>
  apiFetch<FacturePreview>("/invoices/preview", { method: "POST", body: payload });

export const searchFactures = (params: {
  clientId?: string;
  statut?: StatutFacture;
  recherche?: string;
  page?: number;
  taille?: number;
}) => apiFetch<PaginatedResult<Facture> | Facture[]>(`/invoices${toQuery(params)}`);

export const getFacture = (id: string) => apiFetch<Facture>(`/invoices/${id}`);

export const getPublicFacture = (id: string) => apiFetch<Facture>(`/invoices/public/${id}`);

export const ajouterPaiement = (id: string, payload: AjouterPaiementPayload) =>
  apiFetch<Facture>(`/invoices/${id}/payments`, {
    method: "POST",
    body: payload,
  });

export const getFacturePdfUrl = (id: string, format: "a4" | "pos80" = "a4") =>
  `/invoices/${id}/pdf?format=${format}`;

// --- Portail client (rôle CLIENT) ---
export const getMesFactures = (params: { statut?: StatutFacture; page?: number; taille?: number }) =>
  apiFetch<PaginatedResult<Facture> | Facture[]>(
    `/invoices/my-invoices${toQuery(params)}`,
  );
