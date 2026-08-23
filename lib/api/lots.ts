import { apiFetch } from "./client";
import type { Colis, Lot, PaginatedResult, StatutColis, TypeLotExpedition } from "./types";

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// Réservé Super Admin / Employé Shipping (RF-SHP-008).
export interface CreateLotPayload {
  reference: string;
  type: TypeLotExpedition;
  dateDepart?: string;
  dateArrivee?: string;
}

export const createLot = (payload: CreateLotPayload) =>
  apiFetch<Lot>("/lots", { method: "POST", body: payload });

export const searchLots = (params: {
  statut?: StatutColis;
  type?: TypeLotExpedition;
  page?: number;
  taille?: number;
}) => apiFetch<PaginatedResult<Lot> | Lot[]>(`/lots${toQuery(params)}`);

export const getLot = (id: string) => apiFetch<Lot>(`/lots/${id}`);

export const updateLot = (id: string, payload: Partial<CreateLotPayload>) =>
  apiFetch<Lot>(`/lots/${id}`, { method: "PATCH", body: payload });

// Renvoie les colis affectés (pas le lot) — le composant doit recharger le
// lot via getLot() après un appel réussi pour voir l'état à jour.
export const attachColisToLot = (id: string, colisIds: string[]) =>
  apiFetch<Colis[]>(`/lots/${id}/packages`, { method: "POST", body: { colisIds } });

export const detachColisFromLot = (id: string, colisId: string) =>
  apiFetch<Colis>(`/lots/${id}/packages/${colisId}`, { method: "DELETE" });

export const changerStatutLot = (id: string, statut: StatutColis, motif?: string) =>
  apiFetch<Lot>(`/lots/${id}/status`, { method: "PATCH", body: { statut, motif } });
