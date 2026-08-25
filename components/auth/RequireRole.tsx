"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import type { Role } from "@/lib/api/types";

// Garde de route côté client : redirige vers /login si non authentifié,
// ou vers l'espace approprié si le rôle ne correspond pas à cette section
// (ex. un Client qui tente d'ouvrir /staff, ou un Caissier qui tente
// d'ouvrir une page réservée Super Admin). La sécurité réelle reste
// appliquée côté API (@Roles) — ce garde n'est là que pour l'UX.
export function RequireRole({
  allow,
  children,
}: {
  allow: string[];
  children: ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    
    import("@/lib/auth/tokens").then(m => {
      const activeId = m.getActiveSuccursale();
      const available = m.getAvailableSuccursales();
      const currentBranch = available.find(s => s.id === activeId);
      const branchRole = currentBranch?.roleCustom?.level || currentBranch?.roleCustom?.nom;

      const legacyRole = (user.isSuperAdmin ? "SUPER_ADMIN" : (branchRole || user.roleCustomNom || (!user.isStaff ? "CLIENT" : "MANAGER")))?.toUpperCase();
      const upperAllow = allow.map(r => r.toUpperCase());
      
      const isAllowed = upperAllow.includes("STAFF") 
        ? user.isStaff 
        : (upperAllow.includes(legacyRole as any) || (user.isSuperAdmin && upperAllow.includes("SUPER_ADMIN")));

      if (!isAllowed) {
        const target = user.isStaff ? "/staff/unauthorized" : "/portal";
        if (pathname !== target) {
          router.replace(target);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user, router, pathname]);

  // Pour le premier rendu avant le useEffect, on essaie de lire localStorage de manière synchrone si on est côté client.
  let branchRole = null;
  if (typeof window !== "undefined") {
    const activeId = window.localStorage.getItem("kse_active_succursale");
    const stored = window.localStorage.getItem("kse_available_succursales");
    if (stored && activeId) {
      try {
        const available = JSON.parse(stored);
        const currentBranch = available.find((s: any) => s.id === activeId);
        branchRole = currentBranch?.roleCustom?.level || currentBranch?.roleCustom?.nom;
      } catch (e) {}
    }
  }

  const legacyRole = user ? (user.isSuperAdmin ? "SUPER_ADMIN" : (branchRole || user.roleCustomNom || (!user.isStaff ? "CLIENT" : "MANAGER")))?.toUpperCase() : null;
  const upperAllow = allow.map(r => r.toUpperCase());
  const isAllowed = user && (upperAllow.includes("STAFF") 
    ? user.isStaff 
    : (upperAllow.includes(legacyRole as any) || (user.isSuperAdmin && upperAllow.includes("SUPER_ADMIN"))));

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[60vh] flex-1 items-center justify-center">
        <Loader2 className="animate-spin text-brand-orange" size={28} />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="animate-spin text-brand-orange" size={28} />
        <p className="text-white/60">Vérification des accès en cours...</p>
      </div>
    );
  }

  return <>{children}</>;
}
