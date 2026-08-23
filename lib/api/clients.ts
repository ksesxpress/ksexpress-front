import { apiFetch } from "./client";
import type { Client, ClientResume, PaginatedResult, CanalNotification } from "./types";

export interface UpdateClientPayload {
  nom?: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  canalNotificationPrefere?: CanalNotification;
}

// --- Portail client (rôle CLIENT) ---
export const getMe = () => apiFetch<Client>("/clients/me");
export const getMeResume = () => apiFetch<ClientResume>("/clients/me/resume");
export const updateMe = (payload: UpdateClientPayload) =>
  apiFetch<Client>("/clients/me", { method: "PATCH", body: payload });

// --- Équipe (Super Admin / Employé Shipping / Caissier lecture) ---
export interface CreateClientPayload {
  nom: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
}

export const createClient = (payload: CreateClientPayload) =>
  apiFetch<Client>("/clients", { method: "POST", body: payload });

export const searchClients = (params: {
  recherche?: string;
  // Omis : actifs et désactivés confondus (voir SearchClientsDto backend).
  actif?: boolean;
  page?: number;
  taille?: number;
}) => {
  const search = new URLSearchParams();
  if (params.recherche) search.set("recherche", params.recherche);
  if (params.actif !== undefined) search.set("actif", String(params.actif));
  if (params.page) search.set("page", String(params.page));
  if (params.taille) search.set("taille", String(params.taille));
  const qs = search.toString();
  return apiFetch<PaginatedResult<Client> | Client[]>(
    `/clients${qs ? `?${qs}` : ""}`,
  );
};

export const getClient = (id: string) => apiFetch<Client>(`/clients/${id}`);
export const getClientResume = (id: string) =>
  apiFetch<ClientResume>(`/clients/${id}/resume`);
export const updateClient = (id: string, payload: UpdateClientPayload) =>
  apiFetch<Client>(`/clients/${id}`, { method: "PATCH", body: payload });
export const deactivateClient = (id: string) =>
  apiFetch<Client>(`/clients/${id}/deactivate`, { method: "PATCH" });
export const activateClient = (id: string) =>
  apiFetch<Client>(`/clients/${id}/activate`, { method: "PATCH" });
