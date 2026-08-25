"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Package,
  HelpCircle,
  ScanLine,
  Boxes,
  Users,
  Receipt,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useAuth } from "@/lib/auth/auth-context";
import { getCurrentBranchRole, getActiveSuccursale, getAvailableSuccursales } from "@/lib/auth/tokens";
import type { Role, Colis, Lot, Facture, Client, ApiErrorBody } from "@/lib/api/types";
import { searchColis } from "@/lib/api/colis";
import { searchLots } from "@/lib/api/lots";
import { searchFactures } from "@/lib/api/factures";
import { searchClients } from "@/lib/api/clients";
import { extractItems, formatMoney, formatDate } from "@/lib/format";
import { colisStatutLabel } from "@/components/app-shell/StatusBadge";
import { Tabs, TabsList, TabsTab, TabsIndicator, TabsPanel } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/app-shell/PageHeader";

interface ShortcutCard {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  roles: string[];
}

const shortcuts: ShortcutCard[] = [
  {
    href: "/staff/packages",
    label: "Colis",
    description: "Rechercher, créer et suivre les colis.",
    icon: Package,
    roles: ["SUPER_ADMIN", "MANAGER", "CAISSIER", "CASHIER"],
  },
  {
    href: "/staff/packages/unmatched",
    label: "Colis non identifiés",
    description: "File d'attente à rattacher à un client.",
    icon: HelpCircle,
    roles: ["SUPER_ADMIN", "MANAGER"],
  },
  {
    href: "/staff/scan",
    label: "Scanner",
    description: "Faire avancer un colis d'un scan.",
    icon: ScanLine,
    roles: ["SUPER_ADMIN", "MANAGER", "CAISSIER", "CASHIER"],
  },
  {
    href: "/staff/lots",
    label: "Lots d'expédition",
    description: "Regrouper des colis pour un même envoi.",
    icon: Boxes,
    roles: ["SUPER_ADMIN", "MANAGER"],
  },
  {
    href: "/staff/clients",
    label: "Clients",
    description: "Fiches clients et vue 360°.",
    icon: Users,
    roles: ["SUPER_ADMIN", "MANAGER", "CAISSIER", "CASHIER"],
  },
  {
    href: "/staff/invoices",
    label: "Factures",
    description: "Encaissement et reçus.",
    icon: Receipt,
    roles: ["SUPER_ADMIN", "MANAGER", "CAISSIER", "CASHIER"],
  },
  {
    href: "/staff/pos",
    label: "Point de Vente (POS)",
    description: "Caisse, encaissements et reçus.",
    icon: Wallet,
    roles: ["SUPER_ADMIN", "MANAGER", "CAISSIER", "CASHIER"],
  },
  {
    href: "/staff/admin/users",
    label: "Administration",
    description: "Comptes internes, tarification, paramètres, audit.",
    icon: ShieldCheck,
    roles: ["SUPER_ADMIN"],
  },
];

// Palette réutilisée pour les graphiques — dérivée des couleurs de marque
// déjà utilisées ailleurs dans l'app (voir StatusBadge.tsx, brand-orange).
const CHART_COLORS = [
  "#f2994a",
  "#2d9cdb",
  "#27ae60",
  "#9b51e0",
  "#eb5757",
  "#f2c94c",
  "#56ccf2",
  "#bb6bd9",
  "#219653",
  "#828282",
];

// Rôles pouvant lire chaque ressource — reflète exactement les décorateurs
// @Roles(...) côté backend (voir colis/lots/factures/clients.controller.ts)
// pour éviter des appels 403 inutiles au montage du dashboard.
const CAN_READ_COLIS: string[] = ["SUPER_ADMIN", "MANAGER", "CAISSIER", "CASHIER"];
const CAN_READ_LOTS: string[] = ["SUPER_ADMIN", "MANAGER"];
const CAN_READ_FACTURES: string[] = ["SUPER_ADMIN", "MANAGER", "CAISSIER", "CASHIER"];
const CAN_READ_CLIENTS: string[] = ["SUPER_ADMIN", "MANAGER", "CAISSIER", "CASHIER"];

// Style « dashboard-01 » (bloc shadcn) : carte avec libellé/valeur/badge de
// tendance + pied de page contextuel — porté à la main (CLI shadcn bloquée
// par le réseau du sandbox, voir components/ui/sidebar.tsx et tabs.tsx pour
// le même précédent). La tendance n'est affichée que quand elle est
// réellement calculable à partir de données historiques déjà chargées (pas
// de pourcentage inventé) — voir encaisseTrend / colisSemaineTrend plus bas.
function SectionCard({
  icon: Icon,
  label,
  value,
  trend,
  footerNote,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: { pct: number; direction: "up" | "down"; label: string };
  footerNote?: string;
}) {
  const TrendIcon = trend?.direction === "down" ? TrendingDown : TrendingUp;
  return (
    <Card className="bg-card text-card-foreground border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-sm font-medium text-muted-foreground">
          {label}
        </CardDescription>
        {trend && (
          <Badge variant="outline" className="border-border text-foreground font-normal bg-background/50">
            <TrendIcon className="mr-1 size-3" />
            {trend.direction === "up" ? "+" : "-"}
            {Math.abs(trend.pct).toFixed(1)}%
          </Badge>
        )}
      </CardHeader>
      <div className="px-6 pb-2">
        <CardTitle className="text-2xl font-bold">{value}</CardTitle>
      </div>
      {(trend || footerNote) && (
        <CardFooter className="flex flex-col items-start gap-1 p-0 px-6 pb-6 text-xs">
          {trend && (
            <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
              {trend.label}
              <TrendIcon size={12} />
            </div>
          )}
          {footerNote && <div className="text-muted-foreground">{footerNote}</div>}
        </CardFooter>
      )}
    </Card>
  );
}

type Periode = "7j" | "30j" | "3m";

const PERIODE_OPTIONS: { value: Periode; label: string; jours: number }[] = [
  { value: "7j", label: "7 jours", jours: 7 },
  { value: "30j", label: "30 jours", jours: 30 },
  { value: "3m", label: "3 mois", jours: 90 },
];

function PeriodToggle({ value, onChange }: { value: Periode; onChange: (p: Periode) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background p-1">
      {PERIODE_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
            value === o.value
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 text-sm font-medium text-foreground">{title}</h3>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export default function EspaceDashboardPage() {
  const { user } = useAuth();

  const [colis, setColis] = useState<Colis[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periode, setPeriode] = useState<Periode>("30j");

  const branchRole = getCurrentBranchRole();
  let branchActivite = null;
  if (typeof window !== "undefined") {
    const activeId = getActiveSuccursale();
    const stored = getAvailableSuccursales();
    if (stored && activeId) {
      const currentBranch = stored.find((s) => s.id === activeId);
      branchActivite = currentBranch?.activite || null;
    }
  }

  const legacyRole = user?.isSuperAdmin ? "SUPER_ADMIN" : (branchRole || user?.roleCustomNom || (!user?.isStaff ? "CLIENT" : "MANAGER"))?.toUpperCase();
  const isShippingManager = legacyRole === "MANAGER" && branchActivite === "SHIPPING";
  const showFinancials = legacyRole ? (CAN_READ_FACTURES.includes(legacyRole as any) && !isShippingManager) : false;

  const visibleShortcuts = shortcuts.filter((s) => {
    if (!legacyRole || !s.roles.includes(legacyRole as any)) return false;
    if (s.href === "/staff/pos" && branchActivite === "SHIPPING") return false;
    return true;
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const [colisRes, lotsRes, facturesRes, clientsRes] = await Promise.allSettled([
        legacyRole && CAN_READ_COLIS.includes(legacyRole as any)
          ? searchColis({ taille: 500 })
          : Promise.resolve(null),
        legacyRole && CAN_READ_LOTS.includes(legacyRole as any)
          ? searchLots({ taille: 500 })
          : Promise.resolve(null),
        showFinancials
          ? searchFactures({ taille: 500 })
          : Promise.resolve(null),
        legacyRole && CAN_READ_CLIENTS.includes(legacyRole as any)
          ? searchClients({ taille: 500 })
          : Promise.resolve(null),
      ]);
      if (cancelled) return;

      if (colisRes.status === "fulfilled" && colisRes.value) {
        setColis(extractItems(colisRes.value));
      }
      if (lotsRes.status === "fulfilled" && lotsRes.value) {
        setLots(extractItems(lotsRes.value));
      }
      if (facturesRes.status === "fulfilled" && facturesRes.value) {
        setFactures(extractItems(facturesRes.value));
      }
      if (clientsRes.status === "fulfilled" && clientsRes.value) {
        setClients(extractItems(clientsRes.value));
      }
      setIsLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // --- Agrégations calculées côté client (pas d'endpoint stats dédié côté
  // backend) — tout est dérivé des listes déjà chargées ci-dessus. ---

  const kpis = useMemo(() => {
    const enTransit = colis.filter((c) => c.statut === "IN_TRANSIT").length;
    const disponibles = colis.filter((c) => c.statut === "READY_PICKUP").length;
    const lotsActifs = lots.filter((l) => l.statut !== "DELIVERED" && l.statut !== "CANCELLED").length;
    const clientsActifs = clients.filter((c) => c.actif).length;
    const facturesOuvertes = factures.filter(
      (f) => f.statut === "OUVERTE" || f.statut === "PARTIELLE",
    ).length;
    const encaisse = factures.reduce((sum, f) => sum + Number(f.montantPaye || 0), 0);
    return { enTransit, disponibles, lotsActifs, clientsActifs, facturesOuvertes, encaisse };
  }, [colis, lots, clients, factures]);

  const colisParStatut = useMemo(() => {
    const counts = new Map<string, number>();
    colis.forEach((c) => {
      const label = colisStatutLabel(c.statut);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([statut, total]) => ({ statut, total }));
  }, [colis]);

  const colisParCategorie = useMemo(() => {
    const counts = new Map<string, number>();
    colis.forEach((c) => {
      const label = c.categorie?.trim() || "Autre";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([categorie, total]) => ({ categorie, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [colis]);

  // Volume de colis reçus sur les 14 derniers jours (par date de création).
  const volumeParJour = useMemo(() => {
    const days: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ key, label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) });
    }
    const counts = new Map<string, number>();
    colis.forEach((c) => {
      const key = c.createdAt.slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return days.map((d) => ({ jour: d.label, colis: counts.get(d.key) ?? 0 }));
  }, [colis]);

  // Chiffre facturé vs encaissé par mois (6 derniers mois).
  const revenuParMois = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key, label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }) });
    }
    const facture = new Map<string, number>();
    const encaisse = new Map<string, number>();
    factures.forEach((f) => {
      const d = new Date(f.dateEmission);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      facture.set(key, (facture.get(key) ?? 0) + Number(f.total || 0));
      encaisse.set(key, (encaisse.get(key) ?? 0) + Number(f.montantPaye || 0));
    });
    return months.map((m) => ({
      mois: m.label,
      Facturé: Math.round((facture.get(m.key) ?? 0) * 100) / 100,
      Encaissé: Math.round((encaisse.get(m.key) ?? 0) * 100) / 100,
    }));
  }, [factures]);

  // Volume de colis reçus sur la période choisie (7j / 30j / 3 mois) — pour
  // le graphique interactif de l'Overview (style « dashboard-01 »). Basé
  // sur les mêmes 500 derniers colis déjà chargés (voir note Reports).
  const volumeParPeriode = useMemo(() => {
    const jours = PERIODE_OPTIONS.find((o) => o.value === periode)?.jours ?? 30;
    const days: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = jours - 1; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        key,
        label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      });
    }
    const counts = new Map<string, number>();
    colis.forEach((c) => {
      const key = c.createdAt.slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return days.map((d) => ({ jour: d.label, colis: counts.get(d.key) ?? 0 }));
  }, [colis, periode]);

  // Tendances réelles (pas de pourcentage inventé) — dérivées des séries
  // déjà calculées ci-dessus, pour les badges des cartes KPI.
  const colisSemaineTrend = useMemo(() => {
    const semaineActuelle = volumeParJour.slice(7, 14).reduce((s, d) => s + d.colis, 0);
    const semainePrecedente = volumeParJour.slice(0, 7).reduce((s, d) => s + d.colis, 0);
    if (semainePrecedente === 0) return null;
    const pct = ((semaineActuelle - semainePrecedente) / semainePrecedente) * 100;
    return { pct, direction: pct >= 0 ? ("up" as const) : ("down" as const), valeur: semaineActuelle };
  }, [volumeParJour]);

  const encaisseTrend = useMemo(() => {
    if (revenuParMois.length < 2) return null;
    const moisActuel = revenuParMois[revenuParMois.length - 1].Encaissé;
    const moisPrecedent = revenuParMois[revenuParMois.length - 2].Encaissé;
    if (moisPrecedent === 0) return null;
    const pct = ((moisActuel - moisPrecedent) / moisPrecedent) * 100;
    return { pct, direction: pct >= 0 ? ("up" as const) : ("down" as const) };
  }, [revenuParMois]);

  // Top 5 clients par nombre de colis — pour le rapport.
  const topClients = useMemo(() => {
    const counts = new Map<string, { nom: string; codeKse: string; total: number }>();
    colis.forEach((c) => {
      if (!c.client) return;
      const key = c.client.id;
      const existing = counts.get(key);
      if (existing) {
        existing.total += 1;
      } else {
        counts.set(key, {
          nom: `${c.client.nom} ${c.client.prenom ?? ""}`.trim(),
          codeKse: c.client.codeKse,
          total: 1,
        });
      }
    });
    return Array.from(counts.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [colis]);

  const facturesRecentes = useMemo(
    () =>
      [...factures]
        .sort((a, b) => new Date(b.dateEmission).getTime() - new Date(a.dateEmission).getTime())
        .slice(0, 8),
    [factures],
  );

  const lotsActifsRecents = useMemo(
    () =>
      lots
        .filter((l) => l.statut !== "DELIVERED" && l.statut !== "CANCELLED")
        .slice(0, 8),
    [lots],
  );

  const isCashier = legacyRole === "CAISSIER" || legacyRole === "CASHIER";

  if (isCashier) {
    return (
      <div className="space-y-6">
        <PageHeader>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold text-white">Espace Caisse</h1>
            <p className="text-sm text-brand-grey">Bienvenue dans l'espace Caisse KS Express.</p>
          </div>
        </PageHeader>
        
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleShortcuts.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.href} href={s.href} className="group relative block rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:-translate-y-1 hover:border-brand-orange/30 hover:bg-white/10 hover:shadow-[0_8px_24px_-12px_rgba(242,153,74,0.3)]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-orange/15 text-brand-orange transition-colors group-hover:bg-brand-orange group-hover:text-white">
                  <Icon size={20} />
                </div>
                <h3 className="mb-1 text-sm font-bold text-white transition-colors group-hover:text-brand-orange">{s.label}</h3>
                <p className="text-xs text-white/50">{s.description}</p>
              </Link>
            );
          })}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 mt-6">
          <SectionCard
            icon={Wallet}
            label="Total encaissé"
            value={isLoading ? "…" : formatMoney(kpis.encaisse)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <PageHeader className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Tableau de bord</h1>
            <p className="text-sm text-muted-foreground">
              Bienvenue dans l&apos;espace KS Express Service.
            </p>
          </div>

          <TabsList variant="line">
            <TabsIndicator />
            <TabsTab value="overview">Overview</TabsTab>
            <div className="h-4 w-px bg-sidebar-border" />
            <TabsTab value="analytics">Analytics</TabsTab>
            <div className="h-4 w-px bg-sidebar-border" />
            <TabsTab value="reports">Reports</TabsTab>
          </TabsList>
        </PageHeader>

        {/* --- Overview --- */}
        <TabsPanel value="overview" className="space-y-6">
          {(CAN_READ_COLIS.includes(legacyRole as Role) ||
            CAN_READ_LOTS.includes(legacyRole as Role) ||
            showFinancials ||
            CAN_READ_CLIENTS.includes(legacyRole as Role)) && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CAN_READ_COLIS.includes(legacyRole as Role) && (
                <SectionCard
                  icon={Package}
                  label="Colis en transit"
                  value={isLoading ? "…" : String(kpis.enTransit)}
                  footerNote={`${colis.length} colis au total`}
                />
              )}
              {CAN_READ_COLIS.includes(legacyRole as Role) && (
                <SectionCard
                  icon={CheckCircle2}
                  label="Disponibles au dépôt"
                  value={isLoading ? "…" : String(kpis.disponibles)}
                />
              )}
              {CAN_READ_LOTS.includes(legacyRole as Role) && (
                <SectionCard
                  icon={Boxes}
                  label="Lots actifs"
                  value={isLoading ? "…" : String(kpis.lotsActifs)}
                  footerNote={`${lots.length} lots au total`}
                />
              )}
              {CAN_READ_CLIENTS.includes(legacyRole as Role) && (
                <SectionCard
                  icon={Users}
                  label="Clients actifs"
                  value={isLoading ? "…" : String(kpis.clientsActifs)}
                  footerNote={`${clients.length} clients au total`}
                />
              )}
              {showFinancials && (
                <SectionCard
                  icon={Clock}
                  label="Factures ouvertes"
                  value={isLoading ? "…" : String(kpis.facturesOuvertes)}
                />
              )}
              {showFinancials && (
                <SectionCard
                  icon={Wallet}
                  label="Total encaissé"
                  value={isLoading ? "…" : formatMoney(kpis.encaisse)}
                  trend={
                    encaisseTrend
                      ? {
                          pct: encaisseTrend.pct,
                          direction: encaisseTrend.direction,
                          label:
                            encaisseTrend.direction === "up"
                              ? "En hausse ce mois-ci"
                              : "En baisse ce mois-ci",
                        }
                      : undefined
                  }
                  footerNote="Vs mois précédent"
                />
              )}
            </div>
          )}

          {CAN_READ_COLIS.includes(legacyRole as Role) && (
            <div className="rounded-xl border border-border bg-card p-5 mt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium text-foreground">Colis reçus</h2>
                  {colisSemaineTrend && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      {colisSemaineTrend.direction === "up" ? (
                        <TrendingUp size={12} className="text-brand-orange" />
                      ) : (
                        <TrendingDown size={12} className="text-destructive" />
                      )}
                      {colisSemaineTrend.valeur} colis cette semaine (
                      {colisSemaineTrend.direction === "up" ? "+" : "-"}
                      {Math.abs(colisSemaineTrend.pct).toFixed(0)}% vs semaine dernière)
                    </p>
                  )}
                </div>
                <PeriodToggle value={periode} onChange={setPeriode} />
              </div>
              <div className="h-64 w-full">
                {isLoading ? (
                  <EmptyChart message="Chargement…" />
                ) : colis.length === 0 ? (
                  <EmptyChart message="Aucune donnée." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumeParPeriode} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colisAreaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff590d" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#ff590d" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="jour"
                        fontSize={11}
                        tickLine={false}
                        interval={periode === "3m" ? 13 : periode === "30j" ? 4 : 0}
                      />
                      <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="colis"
                        name="Colis"
                        stroke="#ff590d"
                        strokeWidth={2}
                        fill="url(#colisAreaFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-sm font-medium text-foreground">Accès rapide</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleShortcuts.map((s) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
                  >
                    <div className="mb-3 inline-flex rounded-full bg-brand-orange/15 p-2.5 text-brand-orange">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-sm font-medium text-foreground">{s.label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </TabsPanel>

        {/* --- Analytics --- */}
        <TabsPanel value="analytics" className="space-y-6">
          {CAN_READ_COLIS.includes(legacyRole as Role) && (
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Volume de colis reçus (14 derniers jours)">
                {isLoading ? (
                  <EmptyChart message="Chargement…" />
                ) : colis.length === 0 ? (
                  <EmptyChart message="Aucune donnée." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={volumeParJour} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="jour" fontSize={11} tickLine={false} />
                      <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="colis"
                        name="Colis"
                        stroke="#f2994a"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title="Colis par statut">
                {isLoading ? (
                  <EmptyChart message="Chargement…" />
                ) : colisParStatut.length === 0 ? (
                  <EmptyChart message="Aucune donnée." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={colisParStatut} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="statut" fontSize={10} tickLine={false} interval={0} angle={-25} textAnchor="end" height={50} />
                      <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="total" name="Colis" fill="#2d9cdb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title="Répartition par catégorie">
                {isLoading ? (
                  <EmptyChart message="Chargement…" />
                ) : colisParCategorie.length === 0 ? (
                  <EmptyChart message="Aucune donnée." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={colisParCategorie}
                        dataKey="total"
                        nameKey="categorie"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry: unknown) => {
                          const e = entry as { categorie?: string; total?: number };
                          return `${e.categorie ?? ""} (${e.total ?? 0})`;
                        }}
                      >
                        {colisParCategorie.map((entry, index) => (
                          <Cell key={entry.categorie} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              {showFinancials && (
                <ChartCard title="Facturé vs encaissé (6 derniers mois)">
                  {isLoading ? (
                    <EmptyChart message="Chargement…" />
                  ) : factures.length === 0 ? (
                    <EmptyChart message="Aucune donnée." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenuParMois} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="mois" fontSize={11} tickLine={false} />
                        <YAxis fontSize={11} tickLine={false} />
                        <Tooltip formatter={(value: unknown) => formatMoney(value as number)} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Facturé" fill="#9b51e0" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="Encaissé" fill="#27ae60" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              )}
            </div>
          )}
          {!CAN_READ_COLIS.includes(legacyRole as Role) && (
            <p className="text-[13px] text-brand-grey">Aucune donnée disponible pour ce rôle.</p>
          )}
        </TabsPanel>

        {/* --- Reports --- */}
        <TabsPanel value="reports" className="space-y-6">
          {CAN_READ_COLIS.includes(legacyRole as Role) && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-medium text-foreground">Top clients (par nombre de colis)</h3>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Chargement…</p>
              ) : topClients.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée.</p>
              ) : (
              <div className="rounded-[10px] bg-white/5 border border-white/15 overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-white">
                    <thead className="border-b border-white/10 text-[11px] font-bold text-brand-grey uppercase tracking-wider">
                      <tr>
                        <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Client</th>
                        <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Code</th>
                        <th className="py-4 px-6 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Colis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {topClients.map((c) => (
                        <tr key={c.codeKse} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">{c.nom}</td>
                          <td className="px-6 py-4 text-brand-grey font-mono text-xs">{c.codeKse}</td>
                          <td className="px-6 py-4 text-right font-bold text-white">{c.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {showFinancials && (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Factures récentes</h3>
                  <Link href="/staff/invoices" className="text-xs font-medium text-brand-orange hover:underline">
                    Voir tout
                  </Link>
                </div>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement…</p>
                ) : facturesRecentes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune facture.</p>
                ) : (
                  <ul className="divide-y divide-border/50">
                    {facturesRecentes.map((f) => (
                      <li key={f.id} className="flex items-center justify-between py-3 text-sm">
                        <div>
                          <p className="font-medium text-foreground">{f.numero}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(f.dateEmission)}</p>
                        </div>
                        <span className="font-medium text-foreground">{formatMoney(f.total)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {CAN_READ_LOTS.includes(legacyRole as Role) && (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Lots actifs</h3>
                  <Link href="/staff/lots" className="text-xs font-medium text-brand-orange hover:underline">
                    Voir tout
                  </Link>
                </div>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement…</p>
                ) : lotsActifsRecents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun lot actif.</p>
                ) : (
                  <ul className="divide-y divide-border/50">
                    {lotsActifsRecents.map((l) => (
                      <li key={l.id} className="flex items-center justify-between py-3 text-sm">
                        <div>
                          <p className="font-medium text-foreground">{l.reference}</p>
                          <p className="text-xs text-muted-foreground">{colisStatutLabel(l.statut)}</p>
                        </div>
                        <span className="font-medium text-foreground">
                          {l._count?.colis ?? l.colis?.length ?? 0} colis
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp size={13} />
            Chiffres calculés côté client à partir des 500 derniers enregistrements de chaque liste.
          </div>
        </TabsPanel>
      </Tabs>
    </div>
  );
}
