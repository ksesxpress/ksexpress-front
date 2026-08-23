import { API_TUNNEL_HEADERS, API_URL } from "./config";
import { ApiError, type ApiErrorBody, type AuthTokens } from "./types";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/lib/auth/tokens";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  // Certaines routes publiques (login, register...) ne doivent jamais
  // tenter d'attacher un jeton ni de rafraîchir sur 401.
  auth?: boolean;
}

let refreshInFlight: Promise<AuthTokens | null> | null = null;

// Un seul rafraîchissement en vol à la fois, même si plusieurs requêtes
// échouent en 401 en même temps (ex. plusieurs appels lancés au montage
// d'une page) — évite une course qui invaliderait un refresh token encore
// valide (rotation côté backend, voir AuthService.refresh).
async function refreshTokens(): Promise<AuthTokens | null> {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...API_TUNNEL_HEADERS,
        },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        clearTokens();
        return null;
      }
      const tokens = (await res.json()) as AuthTokens;
      setTokens(tokens);
      return tokens;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;

  async function doFetch(accessToken: string | null): Promise<Response> {
    const finalHeaders: HeadersInit = {
      ...API_TUNNEL_HEADERS,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    };
    return fetch(`${API_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  let res = await doFetch(auth ? getAccessToken() : null);

  // 401 sur une route protégée : une seule tentative de rafraîchissement,
  // puis on rejoue la requête d'origine avec le nouveau jeton.
  if (res.status === 401 && auth) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      res = await doFetch(refreshed.accessToken);
    }
  }

  if (!res.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // corps non-JSON (ex. PDF/erreur bas niveau) — on garde body à null
    }
    if (res.status === 401) clearTokens();
    throw new ApiError(res.status, body, `Erreur ${res.status}`);
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.blob()) as T;
}

export async function apiFetchMultipart<T>(path: string, formData: FormData, auth = true): Promise<T> {
  async function doFetch(accessToken: string | null): Promise<Response> {
    const finalHeaders: HeadersInit = {
      ...API_TUNNEL_HEADERS,
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };
    return fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: finalHeaders,
      body: formData,
    });
  }

  let res = await doFetch(auth ? getAccessToken() : null);

  if (res.status === 401 && auth) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      res = await doFetch(refreshed.accessToken);
    }
  }

  if (!res.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {}
    if (res.status === 401) clearTokens();
    throw new ApiError(res.status, body, `Erreur ${res.status}`);
  }

  return (await res.json()) as T;
}
