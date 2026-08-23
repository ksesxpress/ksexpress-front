import type { StatutColis, StatutFacture } from "@/lib/api/types";

// Libellés simples et normalisés (décision utilisateur) — pas de formulation
// administrative française à rallonge, des mots courts et directs.
const COLIS_LABELS: Record<StatutColis, string> = {
  CREATED: "Created",
  RECEIVED_USA: "Received",
  WAITING_SHIPMENT: "Waiting",
  IN_TRANSIT: "In Transit",
  CUSTOM_CLEARANCE: "Customs",
  ARRIVED_HAITI: "Arrived",
  READY_PICKUP: "Available",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  LOST: "Lost",
};

const COLIS_COLORS: Record<StatutColis, string> = {
  CREATED: "bg-slate-100 text-slate-700",
  RECEIVED_USA: "bg-blue-100 text-blue-700",
  WAITING_SHIPMENT: "bg-amber-100 text-amber-700",
  IN_TRANSIT: "bg-indigo-100 text-indigo-700",
  CUSTOM_CLEARANCE: "bg-purple-100 text-purple-700",
  ARRIVED_HAITI: "bg-cyan-100 text-cyan-700",
  READY_PICKUP: "bg-brand-orange/20 text-brand-orange-text",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  RETURNED: "bg-red-100 text-red-700",
  LOST: "bg-red-100 text-red-700",
};

// Liste réutilisée par tous les filtres de statut (colis, portail, lots) —
// une seule source de vérité pour les libellés normalisés.
export const COLIS_STATUT_OPTIONS: { value: StatutColis; label: string }[] = (
  Object.keys(COLIS_LABELS) as StatutColis[]
).map((value) => ({ value, label: COLIS_LABELS[value] }));

export function colisStatutLabel(statut: StatutColis): string {
  return COLIS_LABELS[statut];
}

export function ColisStatusBadge({ statut }: { statut: StatutColis }) {
  return (
    <span
      className={`inline-block rounded-[6px] px-2.5 py-1 text-[11.5px] font-bold ${COLIS_COLORS[statut]}`}
    >
      {COLIS_LABELS[statut]}
    </span>
  );
}

const FACTURE_LABELS: Record<StatutFacture, string> = {
  OUVERTE: "Non payée",
  PARTIELLE: "Partiellement payée",
  PAYEE: "Payée",
  ANNULEE: "Annulée",
};

const FACTURE_COLORS: Record<StatutFacture, string> = {
  OUVERTE: "bg-amber-100 text-amber-800",
  PARTIELLE: "bg-amber-100 text-amber-700",
  PAYEE: "bg-green-100 text-green-700",
  ANNULEE: "bg-red-100 text-red-700",
};

export function FactureStatusBadge({ statut }: { statut: StatutFacture }) {
  return (
    <span
      className={`inline-block rounded-[6px] px-2.5 py-1 text-[11.5px] font-bold ${FACTURE_COLORS[statut]}`}
    >
      {FACTURE_LABELS[statut]}
    </span>
  );
}
