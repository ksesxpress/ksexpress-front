"use client";

// `npx shadcn@latest add pagination` bloqué par le réseau du sandbox (même
// blocage que Round 3/10/11 — voir data-table.tsx). Porté à la main depuis
// le JSON du registry (workaround web_fetch), puis adapté : primitives à
// base de <button> (pas <a href>) puisque la pagination ici pilote un état
// React local (page) plutôt qu'une navigation par URL, et style aligné sur
// la convention "pilule" déjà utilisée partout ailleurs dans l'app (voir
// les boutons Précédent/Suivant d'origine dans invoices/page.tsx et
// admin/audit/page.tsx, remplacés par ce composant) plutôt que les tokens
// bruts shadcn (bg-primary etc.).

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full items-center justify-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = { isActive?: boolean } & React.ComponentProps<"button">;

function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
  return (
    <button
      type="button"
      data-slot="pagination-link"
      data-active={isActive || undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-8 min-w-8 items-center justify-center rounded-[8px] text-[13.5px] font-medium text-white transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40",
        isActive ? "border border-white/20 bg-white/10" : "border border-transparent",
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink aria-label="Page précédente" className={cn("gap-1.5 px-3 hover:bg-transparent", className)} {...props}>
      <ChevronLeft size={16} />
      <span className="hidden sm:inline">Previous</span>
    </PaginationLink>
  );
}

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink aria-label="Page suivante" className={cn("gap-1.5 px-3 hover:bg-transparent", className)} {...props}>
      <span className="hidden sm:inline">Next</span>
      <ChevronRight size={16} />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex h-8 w-8 items-center justify-center text-white/50", className)}
      {...props}
    >
      <MoreHorizontal size={16} />
    </span>
  );
}

// Calcule la liste des numéros de page à afficher, avec des "..." pour les
// grands nombres de pages — même algorithme que le hook usePagination de MUI
// / les démos shadcn (1 page de chaque côté de la page active, toujours les
// bornes 1 et dernière page visibles). Ex. page=5, total=20 →
// [1, "ellipsis", 4, 5, 6, "ellipsis", 20].
function getPaginationRange(current: number, total: number, siblingCount = 1): (number | "ellipsis")[] {
  const totalVisible = siblingCount * 2 + 5;
  if (totalVisible >= total) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftCount = 3 + siblingCount * 2;
    return [...Array.from({ length: leftCount }, (_, i) => i + 1), "ellipsis", total];
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = 3 + siblingCount * 2;
    return [1, "ellipsis", ...Array.from({ length: rightCount }, (_, i) => total - rightCount + i + 1)];
  }
  return [
    1,
    "ellipsis",
    ...Array.from({ length: rightSibling - leftSibling + 1 }, (_, i) => leftSibling + i),
    "ellipsis",
    total,
  ];
}

// Composant prêt-à-l'emploi pour toutes les pages de liste (Colis, Factures,
// Clients, Lots, Journal d'audit) — vrais numéros de page cliquables (avec
// "...") + Précédent/Suivant, calculés depuis `total` (le backend renvoie
// bien un total réel sur ces 5 endpoints, voir extractTotal).
function NumberedPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  const range = getPaginationRange(page, totalPages);

  return (
    <Pagination className={cn("justify-start", className)}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))} />
        </PaginationItem>
        {range.map((item, i) =>
          item === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink isActive={item === page} onClick={() => onPageChange(item)}>
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  NumberedPagination,
};
