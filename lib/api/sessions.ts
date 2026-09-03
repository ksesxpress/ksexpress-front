import { apiFetch } from "./client";

export interface SessionCaisse {
  id: string;
  succursaleId: string;
  caissierId: string;
  fondInitial: number | string;
  fondFinal: number | string | null;
  totalVentes: number | string;
  statut: "OUVERTE" | "FERMEE";
  ouverteLe: string;
  fermeeLe: string | null;
  notes: string | null;
}

export async function getActiveSession(succursaleId: string): Promise<SessionCaisse | null> {
  try {
    const session = await apiFetch<SessionCaisse>("/sessions-caisse/active", {
      headers: {
        "x-succursale-id": succursaleId,
      },
    });
    // Si l'API retourne null, vide, ou un blob (ex: NestJS qui retourne rien), ce n'est pas un objet session
    if (!session || typeof session !== "object" || !("id" in session)) {
      return null;
    }
    return session;
  } catch (err: any) {
    if (err.status === 404 || err.message?.includes("introuvable")) {
      return null;
    }
    throw err;
  }
}

export async function openSession(succursaleId: string, fondInitial: number): Promise<SessionCaisse> {
  return apiFetch<SessionCaisse>("/sessions-caisse/open", {
    method: "POST",
    headers: {
      "x-succursale-id": succursaleId,
    },
    body: { fondInitial },
  });
}

export async function closeSession(
  succursaleId: string,
  sessionId: string,
  fondFinal?: number,
  notes?: string
): Promise<SessionCaisse> {
  return apiFetch<SessionCaisse>(`/sessions-caisse/${sessionId}/close`, {
    method: "POST",
    headers: {
      "x-succursale-id": succursaleId,
    },
    body: { fondFinal, notes },
  });
}
