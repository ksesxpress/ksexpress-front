import { apiFetch } from "./client";

export type TypeSuccursale = "DEPOT_USA" | "AGENCE_HAITI" | "POINT_RELAIS";
export type ActiviteSuccursale = "SHIPPING" | "BOUTIQUE" | "MIXTE";

export interface Succursale {
  id: string;
  nom: string;
  code: string;
  type: TypeSuccursale;
  activite: ActiviteSuccursale;
  adresse: string;
  ville: string;
  pays: string;
  telephone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  responsable?: string | null;
  horaires?: string | null;
  actif: boolean;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSuccursalePayload {
  nom: string;
  code: string;
  type?: TypeSuccursale;
  activite?: ActiviteSuccursale;
  adresse: string;
  ville: string;
  pays?: string;
  telephone?: string;
  whatsapp?: string;
  email?: string;
  responsable?: string;
  horaires?: string;
  actif?: boolean;
  note?: string;
}

export async function getSuccursales(
  type?: TypeSuccursale,
  activite?: ActiviteSuccursale
): Promise<Succursale[]> {
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (activite) params.append("activite", activite);
  const path = `/succursales${params.toString() ? `?${params.toString()}` : ""}`;
  return apiFetch<Succursale[]>(path, { auth: false });
}

export async function createSuccursale(payload: CreateSuccursalePayload): Promise<Succursale> {
  return apiFetch<Succursale>("/succursales", {
    method: "POST",
    body: payload,
  });
}

export async function updateSuccursale(
  id: string,
  payload: Partial<CreateSuccursalePayload>
): Promise<Succursale> {
  return apiFetch<Succursale>(`/succursales/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function toggleSuccursaleActif(id: string): Promise<Succursale> {
  return apiFetch<Succursale>(`/succursales/${id}/toggle-actif`, {
    method: "PATCH",
  });
}

export async function getSuccursale(id: string): Promise<Succursale & { membersCount?: number; utilisateurs?: any[] }> {
  return apiFetch<Succursale & { membersCount?: number; utilisateurs?: any[] }>(`/succursales/${id}`, { auth: false });
}

export async function addSuccursaleMember(id: string, utilisateurId: string, roleCustomId?: string): Promise<any> {
  return apiFetch(`/succursales/${id}/membres`, {
    method: "POST",
    body: { utilisateurId, roleCustomId },
  });
}

export async function removeSuccursaleMember(id: string, utilisateurId: string): Promise<any> {
  return apiFetch(`/succursales/${id}/membres/${utilisateurId}`, {
    method: "DELETE",
  });
}
