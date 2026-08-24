"use client";

import {
  LayoutDashboard,
  Package,
  HelpCircle,
  ScanLine,
  Boxes,
  Users,
  Receipt,
  ShieldCheck,
  Tags,
  Settings,
  History,
  Building,
  PieChart,
  Megaphone,
  Sparkles,
  Key,
  FileText,
} from "lucide-react";
import { RequireRole } from "@/components/auth/RequireRole";
import { AppShell, type NavEntry } from "@/components/app-shell/AppShell";

const STAFF_ROLES = ["SUPER_ADMIN", "MANAGER", "CAISSIER", "CASHIER", "STAFF"] as const;

function getNavItems(activite?: string): NavEntry[] {
  // Navigation for SHIPPING branch ONLY
  if (activite === "SHIPPING") {
    return [
      {
        label: "Colis & Lots",
        icon: Package,
        items: [
          { href: "/staff/packages", label: "Tous les colis", icon: Package, roles: [...STAFF_ROLES] },
          {
            href: "/staff/packages/unmatched",
            label: "Non identifiés",
            icon: HelpCircle,
            roles: ["SUPER_ADMIN", "MANAGER"],
          },
          { href: "/staff/scan", label: "Scanner", icon: ScanLine, roles: ["SUPER_ADMIN", "MANAGER", "CAISSIER", "CASHIER"] },
          { href: "/staff/lots", label: "Lots d'expédition", icon: Boxes, roles: ["SUPER_ADMIN", "MANAGER"] },
        ],
      },
      {
        label: "Facturation",
        icon: Receipt,
        items: [
          { href: "/staff/invoices", label: "Toutes les factures", icon: Receipt, roles: [...STAFF_ROLES] },
        ],
      },
      {
        label: "Clients",
        icon: Users,
        items: [
          { href: "/staff/clients", label: "Tous les clients", icon: Users, roles: [...STAFF_ROLES] },
        ],
      },
    ];
  }

  // Default / Global Navigation
  return [
    { href: "/staff", label: "Tableau de bord", icon: LayoutDashboard, roles: [...STAFF_ROLES] },
    {
      label: "Colis & Lots",
      icon: Package,
      items: [
        { href: "/staff/packages", label: "Tous les colis", icon: Package, roles: [...STAFF_ROLES] },
        {
          href: "/staff/packages/unmatched",
          label: "Non identifiés",
          icon: HelpCircle,
          roles: ["SUPER_ADMIN", "MANAGER"],
        },
        { href: "/staff/scan", label: "Scanner", icon: ScanLine, roles: ["SUPER_ADMIN", "MANAGER", "CAISSIER", "CASHIER"] },
        { href: "/staff/lots", label: "Lots d'expédition", icon: Boxes, roles: ["SUPER_ADMIN", "MANAGER"] },
      ],
    },
    {
      label: "Facturation",
      icon: Receipt,
      items: [
        { href: "/staff/invoices", label: "Toutes les factures", icon: Receipt, roles: [...STAFF_ROLES] },
      ],
    },
    {
      label: "KS Steel Glow",
      icon: Sparkles,
      items: [
        { href: "/staff/products", label: "Produits", icon: Package, roles: ["SUPER_ADMIN"] },
        { href: "/staff/categories", label: "Catégories", icon: Tags, roles: ["SUPER_ADMIN"] },
        { href: "/staff/sales", label: "Toutes les Ventes", icon: FileText, roles: ["SUPER_ADMIN"] },
      ],
    },
    {
      label: "Succursale",
      icon: Building,
      items: [
        { href: "/staff/succursales", label: "Toutes les succursales", icon: Building, roles: [...STAFF_ROLES] },
      ],
    },
    {
      label: "Marketing & Clients",
      icon: Megaphone,
      items: [
        { href: "/staff/clients", label: "Tous les clients", icon: Users, roles: [...STAFF_ROLES] },
        { href: "/staff/marketing", label: "Campagnes", icon: Megaphone, roles: ["SUPER_ADMIN"] },
      ],
    },
    {
      label: "Rapport Global",
      icon: PieChart,
      items: [
        { href: "/staff/reports", label: "Vue d'ensemble", icon: PieChart, roles: ["SUPER_ADMIN"] },
      ],
    },
    {
      label: "Administration",
      icon: ShieldCheck,
      items: [
        { href: "/staff/admin/users", label: "Utilisateurs", icon: ShieldCheck, roles: ["SUPER_ADMIN"] },
        { href: "/staff/admin/roles", label: "Rôles", icon: Key, roles: ["SUPER_ADMIN"] },
        { href: "/staff/admin/pricing-grids", label: "Tarification", icon: Tags, roles: ["SUPER_ADMIN"] },
        { href: "/staff/admin/settings", label: "Paramètres", icon: Settings, roles: ["SUPER_ADMIN"] },
        { href: "/staff/admin/audit", label: "Journal d'audit", icon: History, roles: ["SUPER_ADMIN"] },
      ],
    },
  ];
}

import { useState, useEffect } from "react";

export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  const [navItems, setNavItems] = useState<NavEntry[]>([]);

  useEffect(() => {
    import("@/lib/auth/tokens").then(m => {
      const activeId = m.getActiveSuccursale();
      const available = m.getAvailableSuccursales();
      const current = available.find(s => s.id === activeId);
      setNavItems(getNavItems(current?.activite));
    });
  }, []);

  return (
    <RequireRole allow={[...STAFF_ROLES]}>
      <div className="dark bg-[#0a0f44] text-white min-h-screen">
        <AppShell navItems={navItems}>{children}</AppShell>
      </div>
    </RequireRole>
  );
}
