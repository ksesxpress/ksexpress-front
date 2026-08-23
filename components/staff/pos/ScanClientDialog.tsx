"use client";

import { useState, type FormEvent } from "react";
import { ScanLine, AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchClients } from "@/lib/api/clients";
import { ApiError, type Client } from "@/lib/api/types";
import { extractItems } from "@/lib/format";

interface ScanClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFound: (client: Client) => void;
}

// Carte client (code KSE en code-barres) — un scanner USB agit comme un
// clavier : il tape le code puis Entrée dans le champ actif, pas besoin
// d'API caméra/matériel spécifique. Un simple champ auto-focus suffit.
// Remonté à chaque ouverture par le parent (`key={open ? "o" : "c"}`) pour
// repartir d'un champ vide sans passer par un effet de reset.
export function ScanClientDialog({ open, onOpenChange, onFound }: ScanClientDialogProps) {
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const valeur = code.trim();
    if (!valeur || searching) return;
    setSearching(true);
    setError("");
    try {
      const resultats = extractItems(await searchClients({ recherche: valeur, taille: 5 }));
      const exact = resultats.find((c) => c.codeKse.toLowerCase() === valeur.toLowerCase());
      const trouve = exact ?? (resultats.length === 1 ? resultats[0] : null);
      if (!trouve) {
        setError(
          resultats.length > 1
            ? "Plusieurs clients correspondent — utilisez la recherche par nom."
            : "Aucun client trouvé pour ce code — utilisez « + » pour créer sa fiche.",
        );
        return;
      }
      // Un client avec un email est un client shipping, pas un client boutique
      // (voir PosClientCombobox) — pas d'encaissement boutique sur sa fiche.
      if (trouve.email) {
        setError("Ce client est un client shipping (fiche avec email) — non utilisable en boutique.");
        return;
      }
      onFound(trouve);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la recherche.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-white/15 bg-white/10 backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-brand-orange" />
            Scanner la carte client
          </DialogTitle>
          <DialogDescription>Scannez le code-barres de la carte, ou saisissez le code KSE manuellement.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="KSE-000123"
            className="h-12 rounded-[8px] border-white/15 bg-white/5 text-center text-[15px] font-mono tracking-wider text-white"
            autoComplete="off"
            autoFocus
          />
          {error && (
            <div className="flex items-center gap-2 rounded-[8px] border border-red-500/30 bg-red-500/10 p-2.5 text-[12.5px] text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={!code.trim() || searching}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-brand-orange font-bold text-white hover:bg-brand-orange/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            Rechercher
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
