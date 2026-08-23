// URL de base de l'API backend (ksexpress-back). Jamais en dur — voir
// AGENTS.md : NEXT_PUBLIC_API_URL dans .env.local, jamais commit.
// Défaut cohérent avec le CORS backend (localhost:3000 front / port backend
// configurable via PORT, 3001 par défaut en local).
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

// Les tunnels ngrok gratuits affichent une page d'avertissement sur certaines
// requêtes GET. Ce header indique que le client est notre application.
export const API_TUNNEL_HEADERS: HeadersInit = API_URL.includes(".ngrok-free.app")
  ? { "ngrok-skip-browser-warning": "true" }
  : {};
