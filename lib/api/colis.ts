import { apiFetch } from "./client";
import type { Colis, PaginatedResult, StatutColis } from "./types";

export interface CreateColisPayload {
  clientId?: string;
  tracking?: string;
  poidsLb?: number;
  dimensions?: string;
  categorie?: string;
  valeurDeclaree?: number;
  description?: string;
  rayon?: string;
  marchand?: string;
}

export type UpdateColisPayload = Partial<Omit<CreateColisPayload, "clientId">>;

function toQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// --- Équipe (Super Admin / Employé Shipping, lecture élargie à Caissier) ---
export const createColis = (payload: CreateColisPayload) =>
  apiFetch<Colis>("/packages", { method: "POST", body: payload });

export const searchColis = (params: {
  tracking?: string;
  codeKse?: string;
  nom?: string;
  statut?: StatutColis;
  lotId?: string;
  dateDebut?: string;
  dateFin?: string;
  page?: number;
  taille?: number;
  sansLot?: boolean;
}) => apiFetch<PaginatedResult<Colis> | Colis[]>(`/packages${toQuery(params)}`);

export const getColis = (id: string) => apiFetch<Colis>(`/packages/${id}`);

export const updateColis = (id: string, payload: UpdateColisPayload) =>
  apiFetch<Colis>(`/packages/${id}`, { method: "PATCH", body: payload });

export const changerStatutColis = (
  id: string,
  statut: StatutColis,
  motif?: string,
) =>
  apiFetch<Colis>(`/packages/${id}/status`, {
    method: "PATCH",
    body: { statut, motif },
  });

export const getNonIdentifies = (params: { page?: number; taille?: number }) =>
  apiFetch<PaginatedResult<Colis> | Colis[]>(
    `/packages/unmatched${toQuery(params)}`,
  );

export const suggestClientsForColis = (id: string) =>
  apiFetch<unknown[]>(`/packages/${id}/suggestions`);

export const attachColis = (id: string, clientId: string) =>
  apiFetch<Colis>(`/packages/${id}/attach`, {
    method: "PATCH",
    body: { clientId },
  });

// `colisId` lève l'ambiguïté quand plusieurs colis partagent le même
// tracking (RG-SHP-01 n'exige l'unicité qu'au sein d'un même client) — sans
// lui, l'API renvoie 409 avec la liste `candidats` à choisir.
export const lookupColisByCode = (code: string, colisId?: string) =>
  apiFetch<Colis>(
    `/packages/scan/${encodeURIComponent(code)}${colisId ? `?colisId=${encodeURIComponent(colisId)}` : ""}`,
  );

export const scannerColis = (code: string, statutCible?: StatutColis, colisId?: string) =>
  apiFetch<Colis>("/packages/scan", {
    method: "POST",
    body: { code, statutCible, colisId },
  });

export const removeColisPhoto = (id: string, url: string) =>
  apiFetch<Colis>(`/packages/${id}/photos`, {
    method: "DELETE",
    body: { url },
  });

export const getColisLabelUrl = (id: string, format: "thermal" | "a4" = "thermal") => {
  // Utilisé comme `href`/`src` direct (le PDF part avec le Bearer via un
  // fetch + blob dans le composant, pas un lien brut — voir ColisLabelLink).
  return `/packages/${id}/label?format=${format}`;
};

// --- Portail client (rôle CLIENT) ---
export const getMesColis = (params: { statut?: StatutColis; page?: number; taille?: number }) =>
  apiFetch<PaginatedResult<Colis> | Colis[]>(
    `/packages/my-packages${toQuery(params)}`,
  );

export const trackPublicColis = (code: string) =>
  apiFetch<any>(`/public-tracking/${encodeURIComponent(code)}`);
