import { apiFetch, apiFetchMultipart } from "./client";
import type { PaginatedResult } from "./types";
import { getAccessToken } from "../auth/tokens";

// Catalogue POS — scopé par succursale (chaque boutique a ses propres
// produits/stock, voir ProduitsService côté backend).
export interface CategorieProduit {
  id: string;
  nom: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Produit {
  id: string;
  succursaleId: string;
  categorieId: string | null;
  sku: string;
  nom: string;
  description: string | null;
  prix: string;
  quantiteStock: number;
  seuilAlerte?: number;
  photoUrl: string | null;
  actif: boolean;
  categorie?: CategorieProduit | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProduitPayload {
  succursaleId: string;
  categorieId?: string;
  sku: string;
  nom: string;
  description?: string;
  prix: number;
  quantiteStock?: number;
  seuilAlerte?: number;
  photoUrl?: string;
}

export interface SearchProduitsQuery {
  succursaleId?: string;
  categorieId?: string;
  recherche?: string;
  page?: number;
  taille?: number;
}

export async function getProduits(query: SearchProduitsQuery): Promise<PaginatedResult<Produit>> {
  const params = new URLSearchParams();
  if (query.succursaleId) params.append("succursaleId", query.succursaleId);
  if (query.categorieId) params.append("categorieId", query.categorieId);
  if (query.recherche) params.append("recherche", query.recherche);
  if (query.page) params.append("page", String(query.page));
  if (query.taille) params.append("taille", String(query.taille));
  return apiFetch<PaginatedResult<Produit>>(`/produits?${params.toString()}`);
}

export async function getProduit(id: string): Promise<Produit> {
  return apiFetch<Produit>(`/produits/${id}`);
}

export async function createProduit(payload: CreateProduitPayload): Promise<Produit> {
  return apiFetch<Produit>("/produits", { method: "POST", body: payload });
}

export async function uploadProduitPhoto(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetchMultipart<{ url: string }>("/produits/upload", formData);
}

export async function updateProduit(id: string, payload: Partial<CreateProduitPayload>): Promise<Produit> {
  return apiFetch<Produit>(`/produits/${id}`, { method: "PATCH", body: payload });
}

export async function toggleProduitActif(id: string): Promise<Produit> {
  return apiFetch<Produit>(`/produits/${id}/toggle-actif`, { method: "PATCH" });
}

export async function getCategories(): Promise<CategorieProduit[]> {
  return apiFetch<CategorieProduit[]>(`/produits/categories`);
}

export async function createCategorie(payload: { nom: string; description?: string }): Promise<CategorieProduit> {
  return apiFetch<CategorieProduit>("/produits/categories", {
    method: "POST",
    body: payload,
  });
}

export async function updateCategorie(id: string, payload: { nom?: string; description?: string }): Promise<CategorieProduit> {
  return apiFetch<CategorieProduit>(`/produits/categories/${id}`, {
    method: "PATCH",
    body: payload,
  });
}
