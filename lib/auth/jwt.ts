import type { JwtPayload } from "@/lib/api/types";

// Décodage local du JWT (base64url du payload) — jamais une vérification de
// signature côté client (impossible et inutile sans le secret) : sert
// uniquement à lire rôle/sub/exp pour piloter l'UI. La sécurité réelle est
// toujours appliquée côté API (RolesGuard/JwtAuthGuard), jamais côté client.
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return null;
    const normalized = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isExpired(payload: Pick<JwtPayload, "exp">, skewSeconds = 10): boolean {
  return Date.now() >= (payload.exp - skewSeconds) * 1000;
}
