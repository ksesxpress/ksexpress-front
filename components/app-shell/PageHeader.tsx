"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// En-tête de page qui reste visible en haut de l'écran pendant qu'on fait
// défiler le contenu — utilisé par toutes les pages de l'espace Staff
// (titre + description + onglets/filtres éventuels, voir app/staff/page.tsx
// pour le cas le plus riche avec les onglets Overview/Analytics/Reports).
//
// `<main>` dans AppShell.tsx n'a pas de hauteur/scroll dédié : c'est le
// document entier qui défile, donc un simple `sticky top-0` suffit (pas
// besoin d'un conteneur de scroll spécial). Les marges négatives font
// remonter le fond jusqu'aux bords du padding de `<main>` pour que le
// contenu qui défile en dessous ne soit jamais visible à travers.
export function PageHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "sticky top-0 sm:top-14 z-20 -mx-4 -mt-5 mb-5 space-y-1 bg-sidebar/80 backdrop-blur-md border-b border-sidebar-border px-4 pt-5 pb-4 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
