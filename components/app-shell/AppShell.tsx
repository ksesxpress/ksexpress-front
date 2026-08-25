"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode } from "react";
import { LogOut, User, Settings, ChevronsUpDown, ChevronRight, Store, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemo, useCallback, useState, useEffect, Fragment } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { getCurrentBranchRole } from "@/lib/auth/tokens";
import type { Role, JwtPayload } from "@/lib/api/types";
import { getMe } from "@/lib/api/clients";
import { cn } from "@/lib/utils";
import { TopHeader } from "./TopHeader";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";

export interface NavLeaf {
  href: string;
  label: string;
  icon: LucideIcon;
  // Rôles autorisés à voir ce lien — filtré côté client pour l'UX
  // (l'accès réel reste appliqué par le backend, voir RequireRole).
  roles: string[];
}

// Regroupe plusieurs liens sous un même en-tête de la barre latérale,
// ouvert en accordéon DANS la sidebar (jamais un panneau flottant qui sort
// de la barre — voir correction utilisateur) — jamais une simple liste
// plate de boutons non plus (sections groupées par catégorie).
export interface NavGroup {
  label: string;
  icon: LucideIcon;
  items: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  DEV: "Développeur",
  CASHIER: "Caissier(e)",
  GESTIONNAIRE_STOCK: "Gestionnaire Stock",
  CLIENT: "Client",
};

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;

  // Si c'est le dashboard (racine de section), on ne matche jamais les sous-pages (ex: /staff/packages)
  if (href === "/staff" || href === "/portal") {
    return false;
  }

  // Ne matche les sous-pages que s'il y a un ID après (et non pas une sous-rubrique fixe existante)
  if (pathname.startsWith(`${href}/`) && pathname.split('/').length > href.split('/').length) {
    const nextSegment = pathname.split('/')[href.split('/').length];
    // S'il s'agit d'une page de détail type UUID, ID, ou "new", on la considère active pour le parent
    // mais "unmatched" est une rubrique à part, donc on l'exclut ici.
    if (nextSegment !== 'unmatched') {
      return true;
    }
  }
  return false;
}

function SidebarLeaf({
  item,
  pathname,
  onNavigate,
}: {
  item: NavLeaf;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild className={active ? "bg-brand-orange/15 text-brand-orange hover:bg-brand-orange/15 hover:text-brand-orange" : ""}>
        <Link href={item.href} onClick={onNavigate}>
          <Icon size={16} />
          {item.label}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarGroupNav({
  group,
  pathname,
  onNavigate,
  isOpen,
  onOpenChange,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const Icon = group.icon;
  const groupActive = group.items.some((item) => isActive(pathname, item.href));
  const { state, setOpen } = useSidebar();

  const handleOpenChange = (open: boolean) => {
    if (state === "collapsed" && open) {
      setOpen(true);
    }
    onOpenChange(open);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange} asChild className="group/collapsible">
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={group.label} className={groupActive ? "text-brand-orange hover:text-brand-orange" : ""}>
          <CollapsibleTrigger>
            {Icon && <Icon />}
            <span>{group.label}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarMenuButton>
        <CollapsibleContent>
          <SidebarMenuSub>
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <SidebarMenuSubItem key={item.href}>
                  <SidebarMenuSubButton asChild className={active ? "bg-brand-orange/15 text-brand-orange hover:bg-brand-orange/15 hover:text-brand-orange" : ""}>
                    <Link href={item.href} onClick={onNavigate}>
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

// Barre d'onglets fixée en bas de l'écran, remplaçant le tiroir hamburger
// sur mobile pour un espace dont la navigation reste plate (pas de groupes
// imbriqués — voir portal/layout.tsx) : pattern app mobile classique, plus
// rapide d'accès que devoir ouvrir un tiroir pour 3-4 destinations.
function MobileTabBar({ entries, pathname }: { entries: NavEntry[]; pathname: string }) {
  const leaves = entries.filter((entry): entry is NavLeaf => !isGroup(entry));
  if (leaves.length === 0) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-sidebar pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="flex items-stretch justify-around">
        {leaves.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
                active ? "text-brand-orange" : "text-muted-foreground",
              )}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function formatName(user: JwtPayload | null | undefined): { name: string; initials: string } {
  if (!user) return { name: "Utilisateur KS", initials: "KS" };

  const prenomStr = user.prenom || "";
  const nomStr = user.nom || "";
  const name = `${prenomStr} ${nomStr}`.trim();

  let initials = "";
  if (prenomStr) initials += prenomStr.charAt(0).toUpperCase();
  if (nomStr) initials += nomStr.charAt(0).toUpperCase();

  const fallbackIdentifier = user.email || user.telephone || "Utilisateur KS";

  if (!initials) {
    const cleanId = fallbackIdentifier.replace(/[^a-zA-Z0-9]/g, "");
    initials = cleanId.slice(0, 2).toUpperCase() || "KS";
  }

  return { name: name || fallbackIdentifier, initials };
}

function AppShellInner({
  visibleEntries,
  pathname,
  defaultOpenGroups,
  roleLabel,
  user,
  onLogout,
  mobileNav,
  children,
}: {
  visibleEntries: NavEntry[];
  pathname: string;
  defaultOpenGroups: string[];
  roleLabel: string | null;
  user: any;
  onLogout: () => void;
  mobileNav: "drawer" | "tabs";
  children: ReactNode;
}) {
  const [clientInfo, setClientInfo] = useState<{ nom?: string | null; prenom?: string | null; email?: string | null; telephone?: string | null } | null>(null);
  const [availableSuccursales, setAvailableSuccursalesState] = useState<any[]>([]);
  const [activeSuccursaleId, setActiveSuccursaleId] = useState<string | null>(null);

  useEffect(() => {
    import("@/lib/auth/tokens").then(m => {
      setAvailableSuccursalesState(m.getAvailableSuccursales());
      setActiveSuccursaleId(m.getActiveSuccursale());
    });
  }, []);

  function switchSuccursale(id: string) {
    import("@/lib/auth/tokens").then(m => {
      m.setActiveSuccursale(id);
      // Rechargement complet (pas router.push) : beaucoup de pages chargent
      // des données scopées à la succursale active au montage — plus sûr de
      // tout réinitialiser. Si la nouvelle succursale change de landing
      // (BOUTIQUE -> POS, ou l'inverse), on y navigue plutôt que de recharger
      // la page courante, qui n'aurait pas de sens pour l'autre activité.
      const cible = availableSuccursales.find((s) => s.id === id);
      const wantedPath = cible?.activite === "BOUTIQUE" ? "/staff/pos" : "/staff";
      if (pathname === wantedPath) {
        window.location.reload();
      } else {
        window.location.href = wantedPath;
      }
    });
  }

  useEffect(() => {
    if (!user?.isStaff) {
      getMe()
        .then((c) => setClientInfo({ nom: c.nom, prenom: c.prenom, email: c.email, telephone: c.telephone }))
        .catch(() => { });
    }
  }, [user]);

  const effectiveUser = useMemo(() => {
    if (!user) return null;
    return {
      ...user,
      nom: clientInfo?.nom ?? user.nom,
      prenom: clientInfo?.prenom ?? user.prenom,
      email: clientInfo?.email ?? user.email,
      telephone: clientInfo?.telephone ?? user.telephone,
    };
  }, [user, clientInfo]);

  const { name: displayName, initials } = formatName(effectiveUser);

  const { setOpenMobile, isMobile } = useSidebar();
  const closeMobile = useCallback(() => setOpenMobile(false), [setOpenMobile]);

  const [openGroup, setOpenGroup] = useState<string | null>(defaultOpenGroups[0] || null);

  const logoHref = pathname.startsWith("/staff")
    ? "/staff"
    : pathname.startsWith("/portal")
      ? "/portal"
      : "/";

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="h-14 justify-center border-b border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild tooltip="KS Express">
                <Link href={logoHref}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-transparent">
                    <img src="/logo.png" alt="KS Logo" className="h-8 w-8 object-contain" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                    <span className="font-semibold text-sidebar-foreground text-lg truncate">
                      KS <span className="text-brand-orange-text">Express</span>
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {visibleEntries.map((entry) =>
                isGroup(entry) ? (
                  <Fragment key={entry.label}>
                    <li className="mt-3 mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden">
                      {entry.label}
                    </li>
                    <SidebarGroupNav
                      group={entry}
                      pathname={pathname}
                      onNavigate={closeMobile}
                      isOpen={openGroup === entry.label}
                      onOpenChange={(isOpen) => setOpenGroup(isOpen ? entry.label : null)}
                    />
                  </Fragment>
                ) : (
                  <SidebarLeaf
                    key={entry.href}
                    item={entry}
                    pathname={pathname}
                    onNavigate={closeMobile}
                  />
                ),
              )}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  tooltip="Mon Profil"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <DropdownMenuTrigger>
                    <Avatar className="h-8 w-8 rounded-lg border border-brand-orange/20 bg-brand-orange/10 text-brand-orange">
                      <AvatarImage src="" alt={initials} />
                      <AvatarFallback className="rounded-lg bg-transparent font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight gap-0.5">
                      <span className="truncate font-semibold">{displayName}</span>
                      {roleLabel ? (
                        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-brand-orange">{roleLabel}</span>
                      ) : (
                        <Skeleton className="h-3 w-16" />
                      )}
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </DropdownMenuTrigger>
                </SidebarMenuButton>
                <DropdownMenuContent
                  className="dark w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-sidebar border-sidebar-border p-1 shadow-md text-sidebar-foreground"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-3 px-2 py-2">
                      <Avatar className="h-8 w-8 rounded-lg border border-brand-orange/20 bg-brand-orange/10 text-brand-orange">
                        <AvatarImage src="" alt={initials} />
                        <AvatarFallback className="rounded-lg bg-transparent font-bold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight gap-1">
                        <span className="truncate font-semibold text-foreground">{displayName}</span>
                        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                          {roleLabel}
                        </span>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-border/50 m-0" />
                    <div className="px-2 py-2">
                      <span className="truncate text-xs text-muted-foreground">
                        {effectiveUser?.email || effectiveUser?.telephone || "Compte KS"}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50 mb-1" />
                  {/* <DropdownMenuItem className="cursor-pointer gap-2 py-2 px-2 text-sm text-sidebar-foreground focus:bg-sidebar-accent focus:text-sidebar-accent-foreground rounded-md">
                    <User size={16} className="text-muted-foreground" />
                    Profil
                    <span className="ml-auto text-[10px] tracking-widest text-muted-foreground">⇧⌘P</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 py-2 px-2 text-sm text-sidebar-foreground focus:bg-sidebar-accent focus:text-sidebar-accent-foreground rounded-md">
                    <Settings size={16} className="text-muted-foreground" />
                    Paramètres
                    <span className="ml-auto text-[10px] tracking-widest text-muted-foreground">⌘S</span>
                  </DropdownMenuItem> */}
                  <DropdownMenuSeparator className="bg-border/50 mb-1" />

                  {availableSuccursales.length > 1 && !user?.isSuperAdmin && (
                    <>
                      <DropdownMenuLabel className="p-2 text-xs font-semibold text-muted-foreground uppercase">
                        Changer de succursale
                      </DropdownMenuLabel>
                      {availableSuccursales.map(s => (
                        <DropdownMenuItem
                          key={s.id}
                          onClick={() => switchSuccursale(s.id)}
                          className={cn(
                            "cursor-pointer gap-2 py-2 px-2 text-sm text-sidebar-foreground focus:bg-sidebar-accent focus:text-sidebar-accent-foreground rounded-md flex items-center justify-between",
                            activeSuccursaleId === s.id && "bg-brand-orange/10 text-brand-orange font-semibold"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Store size={14} className={activeSuccursaleId === s.id ? "text-brand-orange" : "text-muted-foreground"} />
                            <div className="flex flex-row items-center gap-1.5">
                              <span className="truncate">{s.nom}</span>
                              <span className="text-[10px] font-medium text-muted-foreground uppercase">[{s.activite}]</span>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator className="bg-border/50 my-1" />
                    </>
                  )}

                  <DropdownMenuItem
                    onClick={onLogout}
                    className="cursor-pointer gap-2 py-2 px-2 text-sm text-brand-orange focus:bg-brand-orange/10 focus:text-brand-orange rounded-md"
                  >
                    <LogOut size={16} />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-[#040339] min-h-screen">
        <TopHeader />

        {/* En-tête mobile seulement, invisible à partir de `sm`. En mode
            "drawer" (staff), le déclencheur ouvre le tiroir de la sidebar
            (voir SidebarTrigger). En mode "tabs" (portail client), pas de
            tiroir à ouvrir — la navigation se fait via MobileTabBar en bas
            de l'écran, donc pas de déclencheur ici. */}
        <header className="flex items-center justify-between border-b border-border bg-background/50 backdrop-blur-md px-4 py-3 sm:hidden">
          {mobileNav === "drawer" ? (
            <SidebarTrigger />
          ) : (
            <span className="w-5" aria-hidden="true" />
          )}
          <span className="text-[15px] font-extrabold text-foreground">
            KS <span className="text-brand-orange-text">Express</span>
          </span>
          <button onClick={onLogout} aria-label="Déconnexion" className="text-foreground">
            <LogOut size={18} />
          </button>
        </header>

        {/* Un seul <main>, jamais dupliqué — la page (children) ne doit
            monter qu'une fois (elle peut faire ses propres appels API, voir
            app/staff/page.tsx). Les paddings s'adaptent en CSS responsive.
            Marge basse supplémentaire sur mobile en mode "tabs" pour ne pas
            passer sous la barre d'onglets fixe (voir MobileTabBar). */}
        <main
          className={cn(
            "flex-1 min-w-0 px-4 py-5 sm:px-6 sm:py-6",
            mobileNav === "tabs" && "pb-20 sm:pb-6",
          )}
        >
          <div className="mx-auto w-full sm:max-w-6xl min-w-0">{children}</div>
        </main>

        {mobileNav === "tabs" && <MobileTabBar entries={visibleEntries} pathname={pathname} />}
      </SidebarInset>
    </>
  );
}

export function AppShell({
  navItems,
  children,
  // "drawer" (défaut, espace staff — navigation groupée) ou "tabs" (portail
  // client — 4 destinations plates, barre d'onglets fixe sur mobile, voir
  // MobileTabBar). Le rendu desktop (sidebar gauche) ne change jamais.
  mobileNav = "drawer",
}: {
  navItems: NavEntry[];
  children: ReactNode;
  mobileNav?: "drawer" | "tabs";
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const branchRole = getCurrentBranchRole();

  const legacyRole = user?.isSuperAdmin ? "SUPER_ADMIN" : (branchRole || user?.roleCustomNom || (!user?.isStaff ? "CLIENT" : "MANAGER"))?.toUpperCase();

  const visibleEntries = user
    ? navItems
      .map((entry) =>
        isGroup(entry)
          ? { ...entry, items: entry.items.filter((item) => item.roles.includes(legacyRole as any)) }
          : entry,
      )
      .filter((entry) => (isGroup(entry) ? entry.items.length > 0 : entry.roles.includes(legacyRole as any)))
    : [];

  // Groupe(s) déjà ouvert(s) au montage — celui qui contient la page
  // active, pour ne pas atterrir sur une section repliée par défaut.
  // Volontairement calculé une seule fois (defaultValue = non contrôlé) :
  // pas besoin de réagir aux changements de pathname/visibleEntries ensuite.
  const defaultOpenGroups = useMemo(
    () =>
      visibleEntries
        .filter((entry) => isGroup(entry) && entry.items.some((item) => isActive(pathname, item.href)))
        .map((entry) => (entry as NavGroup).label),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <SidebarProvider className="bg-sidebar">
      <AppShellInner
        visibleEntries={visibleEntries}
        pathname={pathname}
        defaultOpenGroups={defaultOpenGroups}
        roleLabel={user?.roleCustomNom || (user?.isSuperAdmin ? "SUPER_ADMIN" : user?.isStaff ? "STAFF" : "CLIENT")}
        user={user}
        onLogout={handleLogout}
        mobileNav={mobileNav}
      >
        {children}
      </AppShellInner>
    </SidebarProvider>
  );
}
