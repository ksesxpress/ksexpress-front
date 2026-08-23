"use client";

import { LayoutDashboard, Package, Receipt, Settings } from "lucide-react";
import { RequireRole } from "@/components/auth/RequireRole";
import { AppShell, type NavEntry } from "@/components/app-shell/AppShell";

const navItems: NavEntry[] = [
  { href: "/portal", label: "Résumé", icon: LayoutDashboard, roles: ["CLIENT"] },
  { href: "/portal/packages", label: "Mes colis", icon: Package, roles: ["CLIENT"] },
  { href: "/portal/invoices", label: "Mes factures", icon: Receipt, roles: ["CLIENT"] },
  { href: "/portal/settings", label: "Préférences", icon: Settings, roles: ["CLIENT"] },
];

export default function PortailLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole allow={["CLIENT"]}>
      <AppShell navItems={navItems} mobileNav="tabs">
        {children}
      </AppShell>
    </RequireRole>
  );
}
