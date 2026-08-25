"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Calculator, ChevronsUpDown, LogOut, Maximize, Minimize, Store } from "lucide-react";
import { RequireRole } from "@/components/auth/RequireRole";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import { getActiveSuccursale, getAvailableSuccursales, setActiveSuccursale } from "@/lib/auth/tokens";
import { getSuccursale } from "@/lib/api/succursales";
import type { JwtPayload } from "@/lib/api/types";

interface SuccursaleOption {
  id: string;
  nom: string;
  activite?: string;
}

// Même logique que AppShell.switchSuccursale (sidebar back-office) : navigue
// vers le bon landing (POS si BOUTIQUE, dashboard sinon) plutôt qu'un simple
// reload, pour rester cohérent si l'activité de la succursale cible diffère.
function switchSuccursale(id: string, options: SuccursaleOption[]) {
  setActiveSuccursale(id);
  const cible = options.find((s) => s.id === id);
  const wantedPath = cible?.activite === "BOUTIQUE" ? "/staff/pos" : "/staff";
  if (window.location.pathname === wantedPath) {
    window.location.reload();
  } else {
    window.location.href = wantedPath;
  }
}

function formatUserName(user: JwtPayload | null): { name: string; initials: string } {
  if (!user) return { name: "Utilisateur KS", initials: "KS" };
  const prenomStr = user.prenom || "";
  const nomStr = user.nom || "";
  const name = `${prenomStr} ${nomStr}`.trim();
  let initials = "";
  if (prenomStr) initials += prenomStr.charAt(0).toUpperCase();
  if (nomStr) initials += nomStr.charAt(0).toUpperCase();
  const fallbackIdentifier = user.email || user.telephone || "Utilisateur KS";
  if (!initials) {
    initials = fallbackIdentifier.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "KS";
  }
  return { name: name || fallbackIdentifier, initials };
}

function CalculatorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [display, setDisplay] = useState("0");
  const [previous, setPrevious] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);

  function handleNumber(n: string) {
    setDisplay((d) => (d === "0" ? n : d + n));
  }

  function handleOperation(op: string) {
    setPrevious(display);
    setOperation(op);
    setDisplay("0");
  }

  function handleEquals() {
    if (!previous || !operation) return;
    const a = parseFloat(previous);
    const b = parseFloat(display);
    const result = operation === "+" ? a + b : operation === "-" ? a - b : operation === "×" ? a * b : b !== 0 ? a / b : 0;
    setDisplay(String(result));
    setPrevious(null);
    setOperation(null);
  }

  function handleClear() {
    setDisplay("0");
    setPrevious(null);
    setOperation(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs border-white/15 bg-white/10 backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle>Calculatrice</DialogTitle>
        </DialogHeader>
        <div className="rounded-[10px] border border-white/10 bg-white/5 p-4 text-right">
          <div className="h-5 text-[13px] text-white/40">{previous && operation ? `${previous} ${operation}` : ""}</div>
          <div className="truncate text-3xl font-bold text-white">{display}</div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {["C", "÷", "×", "-", "7", "8", "9", "+", "4", "5", "6", "1", "2", "3", "0", "."].map((key, i) => (
            <button
              key={`${key}-${i}`}
              onClick={() => {
                if (key === "C") handleClear();
                else if (["+", "-", "×", "÷"].includes(key)) handleOperation(key);
                else handleNumber(key);
              }}
              className={`h-12 rounded-[8px] text-lg font-bold ${
                key === "C"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : ["+", "-", "×", "÷"].includes(key)
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {key}
            </button>
          ))}
          <button
            onClick={handleEquals}
            className="col-span-4 h-12 rounded-[8px] bg-brand-orange text-lg font-bold text-white hover:bg-brand-orange/90"
          >
            =
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const STAFF_ROLES = ["SUPER_ADMIN", "MANAGER", "DEV", "CASHIER"] as const;

function formatTime(date: Date) {
  return date.toLocaleTimeString("fr-HT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("fr-HT", { year: "numeric", month: "short", day: "2-digit" });
}

// Layout dédié à la caisse : plein écran, sans la sidebar du back-office
// (voir route group `(shell)` — le reste de /staff garde sa sidebar, ici on
// veut un poste de vente immersif, à l'image d'une vraie caisse physique).
export default function PosLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [now, setNow] = useState(new Date());
  const [succursaleNom, setSuccursaleNom] = useState<string | null>(null);
  const [availableSuccursales, setAvailableSuccursales] = useState<SuccursaleOption[]>([]);
  const [activeSuccursaleId, setActiveSuccursaleId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const id = getActiveSuccursale();
    setActiveSuccursaleId(id);
    setAvailableSuccursales(getAvailableSuccursales());
    if (!id) return;
    getSuccursale(id)
      .then((s) => setSuccursaleNom(s.nom))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }

  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  const { name: displayName, initials } = formatUserName(user);
  const roleLabel = user?.roleCustomNom || (user?.isSuperAdmin ? "SUPER_ADMIN" : user?.isStaff ? "STAFF" : "CLIENT");

  return (
    <RequireRole allow={[...STAFF_ROLES]}>
      <div className="dark relative flex h-screen flex-col overflow-hidden bg-linear-to-br from-[#0b0f5e] via-[#141b6e] to-[#1c1450] text-white">
        {/* Halos de couleur en fond — donnent de la profondeur aux panneaux
            translucides (glassmorphism) plutôt qu'un simple aplat sombre. */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-orange/20 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]" />

        <div className="relative z-10 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-white/5 px-3 backdrop-blur-2xl sm:px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2" title="KS Express">
              <img src="/logo.png" alt="KS Logo" className="h-7 w-7 object-contain" />
              <span className="hidden text-[15px] font-extrabold sm:inline">
                KS <span className="text-brand-orange-text">Express</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden items-center gap-2 rounded-[8px] border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 font-mono text-[12.5px] font-semibold text-emerald-300 sm:flex">
              {formatTime(now)}
              <span className="text-emerald-500/50">·</span>
              {formatDate(now)}
            </div>

            {/* Sélecteur de succursale — remplace un lien statique "Tableau
                de bord" : seul contrôle vraiment utile ici pour un caissier
                rattaché à plusieurs succursales (change et navigue vers le
                bon landing, voir switchSuccursale ci-dessus). */}
            {availableSuccursales.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-8 items-center gap-1.5 rounded-[8px] border border-white/15 bg-white/5 px-2.5 text-[12.5px] font-semibold text-white/80 hover:bg-white/10 hover:text-white">
                    <Store className="h-3.5 w-3.5 shrink-0 text-brand-orange" />
                    <span className="max-w-24 truncate sm:max-w-40">{succursaleNom}</span>
                    <ChevronsUpDown className="h-3 w-3 shrink-0 text-white/40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="dark w-64 border-white/15 bg-white/10 text-white backdrop-blur-2xl">
                  <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                    Changer de succursale
                  </DropdownMenuLabel>
                  {availableSuccursales.map((s) => (
                    <DropdownMenuItem
                      key={s.id}
                      onClick={() => switchSuccursale(s.id, availableSuccursales)}
                      className={`cursor-pointer gap-2 ${
                        activeSuccursaleId === s.id ? "bg-brand-orange/10 font-semibold text-brand-orange" : ""
                      }`}
                    >
                      <Store className="h-3.5 w-3.5" />
                      <span className="truncate">{s.nom}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              succursaleNom && (
                <div className="flex items-center gap-1.5 rounded-[8px] border border-white/10 bg-white/5 px-2.5 py-1 text-[12.5px] text-white/70">
                  <Store className="h-3.5 w-3.5 shrink-0 text-brand-orange" />
                  <span className="max-w-24 truncate sm:max-w-40">{succursaleNom}</span>
                </div>
              )
            )}

            <button
              onClick={() => setCalculatorOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
              title="Calculatrice"
            >
              <Calculator className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
              title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            >
              {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
            </button>

            {/* Bouton de compte — même composition que le pied de la sidebar
                back-office (Avatar + menu déroulant), pour rester cohérent
                visuellement plutôt qu'une simple icône de sortie isolée. */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-8 items-center gap-2 rounded-[8px] border border-white/15 bg-white/5 pr-2 pl-1.5 hover:bg-white/10">
                  <Avatar className="h-6 w-6 rounded-md border border-brand-orange/20 bg-brand-orange/10 text-brand-orange">
                    <AvatarImage src="" alt={initials} />
                    <AvatarFallback className="rounded-md bg-transparent text-[10px] font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-[12px] font-semibold text-white/80 sm:inline">{displayName}</span>
                  <ChevronsUpDown className="h-3 w-3 text-white/40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark w-56 border-white/15 bg-white/10 text-white backdrop-blur-2xl">
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <Avatar className="h-8 w-8 rounded-lg border border-brand-orange/20 bg-brand-orange/10 text-brand-orange">
                      <AvatarImage src="" alt={initials} />
                      <AvatarFallback className="rounded-lg bg-transparent font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 gap-0.5 text-left leading-tight">
                      <span className="truncate font-semibold">{displayName}</span>
                      <span className="truncate text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-brand-orange focus:text-brand-orange">
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <main className="relative z-10 min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
      <CalculatorDialog open={calculatorOpen} onOpenChange={setCalculatorOpen} />
    </RequireRole>
  );
}
