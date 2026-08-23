import type { ActiviteSuccursale } from "./succursales";

// Rôles — doit rester synchronisé avec `Role` (prisma/schema.prisma) côté
// ksexpress-back. Un seul login pour tout le monde (voir AGENTS.md) : le
// rôle décidé côté backend, embarqué dans le JWT, pilote la redirection et
// l'affichage côté frontend (RBAC réel reste appliqué côté API — jamais fait
// confiance côté client pour la sécurité, seulement pour l'UX).
export type Role =
  | "SUPER_ADMIN"
  | "CAISSIER"
  | "GESTIONNAIRE_STOCK"
  | "CLIENT";

export interface JwtPayload {
  sub: string;
  email: string | null;
  telephone?: string | null;
  nom: string | null;
  prenom: string | null;
  isStaff: boolean;
  isSuperAdmin: boolean;
  clientId: string | null;
  roleCustomNom?: string | null;
  jti: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  succursales?: Array<{
    id: string;
    nom: string;
    code: string;
    // Pilote la redirection post-connexion (BOUTIQUE → /staff/pos) — voir
    // landingPathForRole dans lib/auth/auth-context.tsx.
    activite: ActiviteSuccursale;
    roleCustom: any;
  }>;
}

// Forme normalisée des erreurs API — voir AllExceptionsFilter côté backend :
// { code, message, détails }.
export interface ApiErrorBody {
  code?: string;
  message?: string | string[];
  détails?: unknown;
  statusCode?: number;
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null, fallbackMessage: string) {
    const message = Array.isArray(body?.message)
      ? body!.message.join(" ")
      : (body?.message ?? fallbackMessage);
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type CanalNotification = "EMAIL" | "WHATSAPP" | "LES_DEUX";

// Renvoyé en `détails` sur une 409 de /packages/scan* quand le code scanné
// (tracking) correspond à plusieurs colis — voir ColisService.lookupByCode
// côté backend. Permet à l'UI de proposer un choix plutôt que de deviner.
export interface ScanCandidat {
  id: string;
  codeKse: string | null;
  client: string | null;
  statut: StatutColis;
}

export type StatutColis =
  | "CREATED"
  | "RECEIVED_USA"
  | "WAITING_SHIPMENT"
  | "IN_TRANSIT"
  | "CUSTOM_CLEARANCE"
  | "ARRIVED_HAITI"
  | "READY_PICKUP"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "LOST";

export type StatutFacture = "OUVERTE" | "PARTIELLE" | "PAYEE" | "ANNULEE";

export type ModePaiement = "ESPECES" | "ZELLE" | "AVOIR";

export interface Client {
  id: string;
  codeKse: string;
  nom: string;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  balance: string;
  canalNotificationPrefere: CanalNotification;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ColisClientLabel {
  id: string;
  codeKse: string;
  nom: string;
  prenom: string | null;
  telephone?: string | null;
}

export interface Colis {
  id: string;
  tracking: string | null;
  clientId: string | null;
  lotId: string | null;
  statut: StatutColis;
  poidsLb: string | null;
  dimensions: string | null;
  categorie: string | null;
  rayon: string | null;
  marchand: string | null;
  valeurDeclaree: string | null;
  description: string | null;
  photos: string[];
  nonIdentifie: boolean;
  codeKseSource: string | null;
  nomDestinataireBrut: string | null;
  adresseBrute: string | null;
  extraitEmail: string | null;
  createdAt: string;
  updatedAt: string;
  // Présents seulement quand l'endpoint les inclut (voir colis.service.ts
  // côté backend — findAll/findOne renvoient client + lot, pas les autres
  // méthodes) — toujours optionnels côté frontend.
  client?: ColisClientLabel | null;
  lot?: { id?: string; reference: string } | null;
  factureLigne?: {
    facture?: {
      id: string;
      numero: string;
      statut: StatutFacture;
      total: string;
      montantPaye: string;
    } | null;
  } | null;
}

export interface Paiement {
  id: string;
  factureId: string;
  montant: string;
  mode: ModePaiement;
  reference: string | null;
  createdAt: string;
}

export interface FactureLigne {
  id: string;
  factureId: string;
  colisId: string;
  poidsFacture: string;
  prixUnitaire: string;
  fraisFixes: string;
  taxes: string;
  montant: string;
  colis?: Colis;
}

export interface Facture {
  id: string;
  numero: string;
  clientId: string;
  total: string;
  montantPaye: string;
  statut: StatutFacture;
  fraisSupplementaires: string;
  fraisSupplementairesLabel: string | null;
  signatureUrl?: string | null;
  dateEmission: string;
  client?: Client;
  lignes?: FactureLigne[];
  paiements?: Paiement[];
}

export interface ClientResume {
  client: Client;
  colis: Colis[];
  factures: Facture[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  taille: number;
}

export type TypeLotExpedition = "AVION" | "BATEAU";

export interface Lot {
  id: string;
  reference: string;
  type: TypeLotExpedition;
  statut: StatutColis;
  dateDepart: string | null;
  dateArrivee: string | null;
  // findAll : colis allégé (poids + catégorie seulement, pour le total
  // agrégé + les badges de catégorie) ; findOne : colis complet + client.
  colis?: Colis[];
  _count?: { colis: number };
  createdAt: string;
  updatedAt: string;
}

export type RoleInterne = Exclude<Role, "CLIENT">;

export interface UtilisateurInterne {
  id: string;
  email: string | null;
  telephone: string | null;
  nom: string | null;
  prenom: string | null;
  role: Role;
  verifie: boolean;
  actif: boolean;
  dernierAcces: string | null;
  createdAt: string;
  succursales?: Array<{ id: string; nom: string; code: string; roleCustom?: string }>;
}

export interface AuditLogEntry {
  id: string;
  utilisateurId: string | null;
  action: string;
  module: string;
  cibleType: string | null;
  cibleId: string | null;
  details: unknown;
  createdAt: string;
}

// Règle interne KS Express : POIDS = facturé au poids (colis simple
// uniquement), FIXE = prix fixe, poids ignoré (voir GrilleTarifaire.calculMode
// côté backend — nécessite la migration Prisma correspondante).
export type ModeCalculTarif = "POIDS" | "FIXE";

export interface GrilleTarifaire {
  id: string;
  categorie: string;
  calculMode: ModeCalculTarif;
  prixParLb: string;
  fraisFixes: string;
  taxes: string;
  dateEffet: string;
  actif: boolean;
}

export interface MoyenPaiement {
  id: string;
  label: string;
  numero: string;
  titulaire: string | null;
  ordre: number;
  actif: boolean;
  // Mode de règlement réel associé (pilote les boutons de paiement en caisse
  // POS/facturation) — absent = purement informatif (facture/email).
  mode: ModePaiement | null;
}

// Identité affichée sur factures/labels/emails et sur le site public
// (voir ParametresService.getEntrepriseInfo côté backend).
export interface EntrepriseInfo {
  nom: string;
  adresse: string;
  telephone: string;
  whatsapp: string;
  emailSupport: string;
  delaiLivraisonJours?: number;
}

// Seuils système auparavant en dur (photos max/colis, verrouillage login,
// validité codes) — voir ParametresService.getLimites côté backend.
export interface LimitesSysteme {
  maxPhotosParColis: number;
  maxTentativesLogin: number;
  verrouillageMinutes: number;
  codeValiditeMinutes: number;
  resetValiditeMinutes: number;
}

// GET /settings/public (sans authentification) — site vitrine, voir
// components/Contact.tsx et PublicSettingsController côté backend. Aussi
// utilisé côté espace staff (non-admin) pour lire maxPhotosParColis, car
// GET /admin/settings/limits est réservé au Super Admin.
export interface PublicSettings extends EntrepriseInfo {
  logoUrl: string | null;
  maxPhotosParColis: number;
}
