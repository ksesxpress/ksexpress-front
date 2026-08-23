import { apiFetch } from "./client";

export interface Succursale {
  id: string;
  nom: string;
  actif: boolean;
}

export interface RoleCustom {
  id: string;
  nom: string;
  level: string;
  description?: string;
  isGlobal: boolean;
  succursaleId?: string;
  succursale?: Succursale;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleData {
  nom: string;
  level: string;
  description?: string;
  isGlobal?: boolean;
  succursaleId?: string;
}

export interface UpdateRoleData extends Partial<CreateRoleData> {}

export async function getRoles(): Promise<RoleCustom[]> {
  return apiFetch<RoleCustom[]>("/admin/roles");
}

export async function getRole(id: string): Promise<RoleCustom> {
  return apiFetch<RoleCustom>(`/admin/roles/${id}`);
}

export async function createRole(data: CreateRoleData): Promise<RoleCustom> {
  return apiFetch<RoleCustom>("/admin/roles", {
    method: "POST",
    body: data as any,
  });
}

export async function updateRole(
  id: string,
  data: UpdateRoleData,
): Promise<RoleCustom> {
  return apiFetch<RoleCustom>(`/admin/roles/${id}`, {
    method: "PATCH",
    body: data as any,
  });
}

export async function deleteRole(id: string): Promise<void> {
  return apiFetch<void>(`/admin/roles/${id}`, {
    method: "DELETE",
  });
}
