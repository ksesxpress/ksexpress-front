import type { AuthTokens } from "@/lib/api/types";

// Type extracted directly from AuthTokens.succursales
export type AvailableSuccursale = NonNullable<AuthTokens["succursales"]>[number];

// localStorage — app réelle connectée à une vraie API (pas un artifact
// Claude), le stockage en mémoire seul déconnecterait l'utilisateur à chaque
// rechargement de page. Accès toujours gardé par `typeof window` (SSR/App
// Router : ce code peut s'exécuter côté serveur au premier rendu).
const ACCESS_KEY = "kse_access_token";
const REFRESH_KEY = "kse_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem("kse_active_succursale");
  window.localStorage.removeItem("kse_available_succursales");
}

export function setActiveSuccursale(succursaleId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("kse_active_succursale", succursaleId);
}

export function getActiveSuccursale(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("kse_active_succursale");
}

export function setAvailableSuccursales(succursales: AvailableSuccursale[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("kse_available_succursales", JSON.stringify(succursales));
}

export function getAvailableSuccursales(): AvailableSuccursale[] {
  if (typeof window === "undefined") return [];
  const stored = window.localStorage.getItem("kse_available_succursales");
  return stored ? JSON.parse(stored) : [];
}

export function getCurrentBranchRole(): string | null {
  if (typeof window === "undefined") return null;
  const activeId = getActiveSuccursale();
  const stored = getAvailableSuccursales();
  if (stored && activeId) {
    const currentBranch = stored.find((s) => s.id === activeId);
    return currentBranch?.roleCustom?.nom || null;
  }
  return null;
}
