// Les montants Decimal Prisma arrivent en JSON comme des chaînes (ex.
// "125.00") — jamais convertis en `number` JS pour éviter toute perte de
// précision monétaire côté service ; ici, affichage seulement.
export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return `$${n.toLocaleString("fr-HT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatHtg(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return `${n.toLocaleString("fr-HT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HTG`;
}

export function formatWeight(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n) || n === 0) return "—";
  return `${n.toLocaleString("fr-HT", { maximumFractionDigits: 2 })} lb`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Les endpoints paginés du backend renvoient soit `{ items, total, page,
// taille }`, soit — pour certaines listes plus simples — un tableau brut.
// Ce helper normalise les deux formes pour l'affichage.
export function extractItems<T>(result: T[] | { items: T[] }): T[] {
  return Array.isArray(result) ? result : result.items;
}

// Total réel (pour la pagination numérotée) — `null` seulement pour les
// listes qui renvoient un tableau brut sans métadonnée (voir extractItems).
export function extractTotal<T>(result: T[] | { total: number }): number | null {
  return Array.isArray(result) ? null : result.total;
}
