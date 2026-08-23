import { apiFetch } from "./client";
import type { AuditLogEntry, PaginatedResult, RoleInterne, UtilisateurInterne } from "./types";

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// Réservé Super Admin — comptes internes (RF-AUT-004, RF-ADM-001). Pas de
// mot de passe à la création : un lien de configuration est envoyé par
// email (voir UsersService.create() côté backend).
export interface CreateInternalUserPayload {
  email: string;
  telephone?: string;
  nom?: string;
  prenom?: string;
  role: RoleInterne;
  roleCustomId?: string;
}

export const createInternalUser = (payload: CreateInternalUserPayload) => {
  const { role, ...rest } = payload;
  return apiFetch<UtilisateurInterne>("/admin/users", { method: "POST", body: { ...rest, isSuperAdmin: role === "SUPER_ADMIN" } });
};

export const listInternalUsers = () =>
  apiFetch<UtilisateurInterne[]>("/admin/users");

export const getInternalUser = (id: string) =>
  apiFetch<UtilisateurInterne>(`/admin/users/${id}`);

export const updateInternalUser = (
  id: string,
  payload: Partial<Pick<CreateInternalUserPayload, "email" | "telephone" | "role" | "nom" | "prenom" | "roleCustomId">>,
) => {
  const { role, ...rest } = payload;
  return apiFetch<UtilisateurInterne>(`/admin/users/${id}`, { 
    method: "PATCH", 
    body: { ...rest, ...(role !== undefined ? { isSuperAdmin: role === "SUPER_ADMIN" } : {}) } 
  });
};

export const deactivateInternalUser = (id: string) =>
  apiFetch<UtilisateurInterne>(`/admin/users/${id}/deactivate`, { method: "PATCH" });

export const activateInternalUser = (id: string) =>
  apiFetch<UtilisateurInterne>(`/admin/users/${id}/activate`, { method: "PATCH" });

// Renvoie le lien de configuration du mot de passe — pour un compte qui n'a
// jamais reçu/ouvert le premier email d'invitation.
export const resendActivation = (id: string) =>
  apiFetch<{ message: string }>(`/admin/users/${id}/resend-activation`, { method: "POST" });

// Journal d'audit (RF-ADM-006).
export const searchAuditLog = (params: {
  utilisateurId?: string;
  module?: string;
  action?: string;
  dateDebut?: string;
  dateFin?: string;
  page?: number;
  taille?: number;
}) =>
  apiFetch<PaginatedResult<AuditLogEntry> | AuditLogEntry[]>(
    `/admin/audit${toQuery(params)}`,
  );
