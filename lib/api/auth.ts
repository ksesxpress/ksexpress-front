import { apiFetch } from "./client";
import type { AuthTokens } from "./types";

export interface RegisterPayload {
  email?: string;
  telephone?: string;
  motDePasse: string;
  nom: string;
  prenom?: string;
  adresse?: string;
}

export interface RegisterResponse {
  message: string;
  utilisateurId: string;
  codeClient: string;
  codeVerificationDebug?: string;
}

export function apiRegister(payload: RegisterPayload) {
  return apiFetch<RegisterResponse>("/auth/register", {
    method: "POST",
    body: payload,
    auth: false,
  });
}

export function apiVerify(utilisateurId: string, code: string) {
  return apiFetch<{ message: string }>("/auth/verify", {
    method: "POST",
    body: { utilisateurId, code },
    auth: false,
  });
}

export function apiLogin(identifiant: string, motDePasse: string) {
  return apiFetch<AuthTokens>("/auth/login", {
    method: "POST",
    body: { identifiant, motDePasse },
    auth: false,
  });
}

export function apiRefresh(refreshToken: string) {
  return apiFetch<AuthTokens>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
    auth: false,
  });
}

export function apiRequestPasswordReset(identifiant: string) {
  return apiFetch<{ message: string }>("/auth/password-reset/request", {
    method: "POST",
    body: { identifiant },
    auth: false,
  });
}

export function apiConfirmPasswordReset(
  utilisateurId: string,
  token: string,
  nouveauMotDePasse: string,
) {
  return apiFetch<{ message: string }>("/auth/password-reset/confirm", {
    method: "POST",
    body: { utilisateurId, token, nouveauMotDePasse },
    auth: false,
  });
}

export function apiLogout(refreshToken: string) {
  return apiFetch<{ message: string }>("/auth/logout", {
    method: "POST",
    body: { refreshToken },
  });
}

export function apiLogoutAll() {
  return apiFetch<{ message: string }>("/auth/logout-all", { method: "POST" });
}
