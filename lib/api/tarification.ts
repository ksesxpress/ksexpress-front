import { apiFetch } from "./client";
import type { GrilleTarifaire, ModeCalculTarif, PaginatedResult } from "./types";

function toQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// Réservé Super Admin (RF-SHP-009).
export interface CreateGrillePayload {
  categorie: string;
  // POIDS (défaut) = facturé au poids (colis simple uniquement) ; FIXE =
  // prix fixe, poids ignoré (règle interne KS Express).
  calculMode?: ModeCalculTarif;
  prixParLb: number;
  fraisFixes?: number;
  taxes?: number;
  dateEffet: string;
}

export const createGrille = (payload: CreateGrillePayload) =>
  apiFetch<GrilleTarifaire>("/admin/pricing-grids", { method: "POST", body: payload });

export const searchGrilles = (params: {
  categorie?: string;
  actif?: boolean;
  page?: number;
  taille?: number;
}) =>
  apiFetch<PaginatedResult<GrilleTarifaire> | GrilleTarifaire[]>(
    `/admin/pricing-grids${toQuery(params)}`,
  );

export const getGrille = (id: string) =>
  apiFetch<GrilleTarifaire>(`/admin/pricing-grids/${id}`);

export const updateGrille = (
  id: string,
  payload: Partial<CreateGrillePayload> & { actif?: boolean },
) =>
  apiFetch<GrilleTarifaire>(`/admin/pricing-grids/${id}`, {
    method: "PATCH",
    body: payload,
  });

// Route dédiée pour tout le personnel (pas seulement Super Admin) — noms
// de catégories actives uniquement, sans détails de prix. Contrairement à
// /admin/pricing-grids (réservé Super Admin), utilisable pour peupler un
// menu déroulant « Catégorie » (voir app/staff/packages/[id]/page.tsx).
export const getPricingCategories = () => apiFetch<string[]>("/pricing-categories");

// Route publique pour le calculateur (vitrine)
export const getPublicPricingGrids = () =>
  apiFetch<GrilleTarifaire[]>("/public-tarification/grids");
