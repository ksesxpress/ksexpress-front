import { apiFetch, apiFetchMultipart } from "./client";
import { API_TUNNEL_HEADERS, API_URL } from "./config";
import {
  ApiError,
  type EntrepriseInfo,
  type LimitesSysteme,
  type ModePaiement,
  type MoyenPaiement,
  type PublicSettings,
} from "./types";
import { getAccessToken } from "@/lib/auth/tokens";

// Réservé Super Admin (config sans redéploiement — logo, taux de change,
// moyens de paiement affichés sur factures/emails).
export const getLogoUrl = () => apiFetch<{ valeur: string }>("/admin/settings/logo");
export const setLogoUrl = (valeur: string) =>
  apiFetch<{ valeur: string }>("/admin/settings/logo", {
    method: "PATCH",
    body: { valeur },
  });

// Upload direct du fichier (multipart) — hébergement Cloudinary automatique
// côté backend, voir ParametresController.uploadLogo. Alternative à
// setLogoUrl() pour choisir un fichier plutôt que coller une URL. Appelé via
// `fetch` brut (pas `apiFetch`, qui envoie du JSON) — même pattern que
// l'upload de photos de colis, voir app/staff/packages/[id]/page.tsx.
export const uploadLogoFile = async (file: File): Promise<{ valeur: string }> => {
  const form = new FormData();
  form.append("logo", file);
  return apiFetchMultipart<{ valeur: string }>("/admin/settings/logo/upload", form);
};

export const getTauxChangeGdes = () =>
  apiFetch<{ valeur: string }>("/admin/settings/exchange-rate-htg");
export const setTauxChangeGdes = (valeur: number) =>
  apiFetch<{ valeur: string }>("/admin/settings/exchange-rate-htg", {
    method: "PATCH",
    body: { valeur: String(valeur) },
  });

// Site public (sans authentification) — voir components/Contact.tsx.
export const getPublicSettings = () =>
  apiFetch<PublicSettings>("/settings/public", { auth: false });

// Informations de l'entreprise (nom, adresse, téléphone, WhatsApp, email
// support) — utilisées sur factures/labels/emails et sur le site public.
export const getEntrepriseInfo = () =>
  apiFetch<EntrepriseInfo>("/admin/settings/company");
export const setEntrepriseInfo = (payload: Partial<EntrepriseInfo>) =>
  apiFetch<EntrepriseInfo>("/admin/settings/company", {
    method: "PATCH",
    body: payload,
  });

// Préfixe des numéros de facture (ex. "FAC" → FAC-2026-000123).
export const getFacturePrefixe = () =>
  apiFetch<{ valeur: string }>("/admin/settings/invoice-prefix");
export const setFacturePrefixe = (valeur: string) =>
  apiFetch<{ valeur: string }>("/admin/settings/invoice-prefix", {
    method: "PATCH",
    body: { valeur },
  });

// Seuils système (photos max/colis, verrouillage login, validité codes).
export const getLimites = () => apiFetch<LimitesSysteme>("/admin/settings/limits");
export const setLimites = (payload: Partial<LimitesSysteme>) =>
  apiFetch<LimitesSysteme>("/admin/settings/limits", {
    method: "PATCH",
    body: payload,
  });

export interface CreateMoyenPaiementPayload {
  label: string;
  numero: string;
  titulaire?: string;
  ordre?: number;
  mode?: ModePaiement;
}

export const creerMoyenPaiement = (payload: CreateMoyenPaiementPayload) =>
  apiFetch<MoyenPaiement>("/admin/settings/payment-methods", {
    method: "POST",
    body: payload,
  });

export const listerMoyensPaiement = () =>
  apiFetch<MoyenPaiement[]>("/admin/settings/payment-methods");

// Lecture seule, accessible au personnel (pas seulement Super Admin) — voir
// ParametresController.listerMoyensPaiementActifs côté backend. Utilisé par
// la caisse (POS) pour ne proposer que les modes de paiement réellement
// configurés, plutôt qu'une liste fixe en dur.
export const listerMoyensPaiementActifs = () =>
  apiFetch<MoyenPaiement[]>("/admin/settings/payment-methods/active");

export const modifierMoyenPaiement = (
  id: string,
  payload: Partial<Omit<CreateMoyenPaiementPayload, "mode">> & { actif?: boolean; mode?: ModePaiement | null },
) =>
  apiFetch<MoyenPaiement>(`/admin/settings/payment-methods/${id}`, {
    method: "PATCH",
    body: payload,
  });

export const supprimerMoyenPaiement = (id: string) =>
  apiFetch<void>(`/admin/settings/payment-methods/${id}`, { method: "DELETE" });
