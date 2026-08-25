import { apiFetch } from "./client";

export interface ShippingReportData {
  colis: {
    total: number;
    livres: number;
    enTransit: number;
    poidsTotal: number;
  };
  finance: {
    chiffreAffaires: number;
    encaisse: number;
    creances: number;
  };
  clients: number;
  succursales: number;
  items?: unknown[]; // For the table
}

export async function getShippingReports(filters?: {
  dateDebut?: string;
  dateFin?: string;
  succursaleId?: string;
  statut?: string;
}): Promise<ShippingReportData> {
  let url = '/reports/shipping';
  
  if (filters) {
    const params = new URLSearchParams();
    if (filters.dateDebut) params.append('dateDebut', filters.dateDebut);
    if (filters.dateFin) params.append('dateFin', filters.dateFin);
    if (filters.succursaleId && filters.succursaleId !== 'Toutes') params.append('succursaleId', filters.succursaleId);
    if (filters.statut && filters.statut !== 'TOUT') params.append('statut', filters.statut);
    
    const queryStr = params.toString();
    if (queryStr) {
      url += `?${queryStr}`;
    }
  }

  return apiFetch<ShippingReportData>(url);
}
