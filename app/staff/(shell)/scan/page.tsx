"use client";

import { useRef, useState, type FormEvent } from "react";
import { ScanLine, Loader2, ArrowRight, UserPlus, PackagePlus } from "lucide-react";
import { lookupColisByCode, scannerColis, changerStatutColis } from "@/lib/api/colis";
import type { Colis, ScanCandidat, StatutColis } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { ColisStatusBadge, COLIS_STATUT_OPTIONS } from "@/components/app-shell/StatusBadge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreatePackageDialog } from "@/components/staff/CreatePackageDialog";
import { PackageProgress } from "@/components/staff/PackageProgress";
import { formatWeight } from "@/lib/format";

export default function ScanPage() {
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<Colis | null>(null);
  const [candidats, setCandidats] = useState<ScanCandidat[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentScans, setRecentScans] = useState<Colis[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Modal states for creating packages
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createAsUnmatched, setCreateAsUnmatched] = useState(false);

  // Status manual change state
  const [newStatus, setNewStatus] = useState<StatutColis | "">("");

  async function handleLookup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!code) return;
    setError(null);
    setCandidats(null);
    setPreview(null);
    setIsLoading(true);
    setNewStatus("");

    try {
      const c = await lookupColisByCode(code);
      setPreview(c);
    } catch (err) {
      setPreview(null);
      const candidatsFromDetails =
        err instanceof ApiError &&
        err.status === 409 &&
        err.body?.détails &&
        typeof err.body.détails === "object" &&
        Array.isArray((err.body.détails as { candidats?: unknown }).candidats)
          ? ((err.body.détails as { candidats: ScanCandidat[] }).candidats)
          : null;
      
      if (err instanceof ApiError && candidatsFromDetails) {
        setCandidats(candidatsFromDetails);
        setError(err.message);
      } else {
        setError(err instanceof ApiError ? err.message : "Code introuvable.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePickCandidat(candidat: ScanCandidat) {
    setError(null);
    setIsLoading(true);
    try {
      const c = await lookupColisByCode(code, candidat.id);
      setPreview(c);
      setCandidats(null);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de charger ce colis.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAdvance() {
    if (!preview) return;
    setError(null);
    setIsLoading(true);
    try {
      const c = await scannerColis(code, undefined, preview.id);
      addRecentScan(c);
      resetScanState();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de faire avancer ce colis.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleManualStatusChange() {
    if (!preview || !newStatus) return;
    setError(null);
    setIsLoading(true);
    try {
      const c = await changerStatutColis(preview.id, newStatus as StatutColis);
      addRecentScan(c);
      resetScanState();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de changer le statut.");
    } finally {
      setIsLoading(false);
    }
  }

  function addRecentScan(colis: Colis) {
    setRecentScans((prev) => {
      const filtered = prev.filter((p) => p.id !== colis.id);
      return [colis, ...filtered].slice(0, 5); // Keep last 5
    });
  }

  function resetScanState() {
    setPreview(null);
    setCandidats(null);
    setCode("");
    setNewStatus("");
    inputRef.current?.focus();
  }

  function openCreate(unmatched: boolean) {
    setCreateAsUnmatched(unmatched);
    setIsCreateOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader>
        <h1 className="text-2xl font-extrabold text-white">Poste de Scan</h1>
        <p className="text-[13.5px] text-white/70">
          Scannez le QR (id interne) ou le code-barres (tracking) d&apos;un colis pour l&apos;afficher.
        </p>
      </PageHeader>

      <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
        {/* LEFT COLUMN: Scan Input & History */}
        <div className="space-y-6">
          <form onSubmit={handleLookup} className="rounded-[10px] border border-white/15 bg-white/5 backdrop-blur-xl shadow-none p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-[8px] border border-white/10 bg-white/5 px-4 py-1 focus-within:border-brand-orange focus-within:ring-1 focus-within:ring-brand-orange transition-all">
              <ScanLine size={24} className="text-brand-orange" />
              <input
                ref={inputRef}
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Scanner ou saisir un code..."
                className="h-14 w-full bg-transparent text-[16px] font-medium text-white outline-none placeholder:font-normal placeholder:text-white/40"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !code}
              className="h-12 w-full rounded-[10px] bg-brand-orange text-[14px] font-bold text-white shadow-none disabled:opacity-70 hover:bg-brand-orange/90"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Rechercher (Entrée)"}
            </Button>
          </div>
        </form>

        <PackageProgress statut={preview?.statut} />

        {candidats && candidats.length > 0 && (
          <div className="rounded-[10px] border border-amber-500/20 bg-amber-500/10 backdrop-blur-xl p-5 shadow-none">
            <p className="mb-3 text-[13.5px] font-bold text-amber-500">
              Conflit : Plusieurs colis partagent ce tracking. Choisissez le bon :
            </p>
            <ul className="divide-y divide-amber-500/20">
              {candidats.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[14px] font-bold text-white">
                      {c.client ?? "Client inconnu"}
                    </p>
                    <p className="text-[12.5px] text-amber-500/80 font-medium">{c.codeKse ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ColisStatusBadge statut={c.statut} />
                    <button
                      onClick={() => handlePickCandidat(c)}
                      disabled={isLoading}
                      className="rounded-[8px] bg-amber-600 px-4 py-2 text-[12px] font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-70 transition-colors"
                    >
                      Choisir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Historique des Scans Récents */}
        {recentScans.length > 0 && (
          <div className="rounded-[10px] border border-white/15 bg-white/5 backdrop-blur-xl p-5">
            <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-white/50">
              Scans récents (Session)
            </h3>
            <div className="space-y-2">
              {recentScans.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-[10px] bg-white/5 p-3 shadow-none border border-white/10">
                  <div>
                    <p className="text-[13.5px] font-bold text-white">{c.tracking ?? "Sans tracking"}</p>
                    <p className="text-[12px] text-white/50">
                      {c.client?.nom ? `${c.client.nom} ${c.client.prenom}` : "Non identifié"}
                    </p>
                  </div>
                  <ColisStatusBadge statut={c.statut} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Actions Panel */}
      <div className="sticky top-20 rounded-[10px] border border-white/15 bg-white/5 backdrop-blur-xl shadow-none overflow-hidden flex flex-col min-h-[400px]">
        {/* En-tête du panneau */}
        <div className="bg-white/5 border-b border-white/10 px-5 py-4 text-white">
          <h2 className="text-[16px] font-extrabold flex items-center gap-2">
            Panneau d&apos;actions
          </h2>
          <p className="text-[13px] text-white/50 mt-0.5">
            {preview ? "Colis trouvé" : error ? "Colis introuvable" : "En attente de scan..."}
          </p>
        </div>

        <div className="p-6 flex-1 flex flex-col justify-center">
          {isLoading && !preview && !error ? (
             <div className="flex justify-center items-center py-10">
               <Loader2 className="animate-spin text-brand-orange" size={32} />
             </div>
          ) : preview ? (
            <div className="space-y-6">
              {/* Infos colis */}
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1">Tracking</p>
                  <p className="text-[18px] font-extrabold text-white break-all leading-tight">
                    {preview.tracking ?? "(sans tracking)"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-[8px] border border-white/10">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-white/50">Statut</p>
                    <div className="mt-1"><ColisStatusBadge statut={preview.statut} /></div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-white/50">Client</p>
                    <p className="text-[13.5px] font-bold text-white mt-1">
                       {preview.client ? `${preview.client.nom} ${preview.client.prenom}` : "Non identifié"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-white/50">Catégorie</p>
                    <p className="text-[13.5px] font-medium text-white mt-1">{preview.categorie ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-white/50">Poids</p>
                    <p className="text-[13.5px] font-medium text-white mt-1">{formatWeight(preview.poidsLb)}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <Button
                  onClick={handleAdvance}
                  disabled={isLoading}
                  className="w-full h-14 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark shadow-none text-[15px] font-bold text-white hover:opacity-90 transition-all flex items-center justify-between px-6"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <span>Faire avancer (Auto)</span>}
                  <ArrowRight size={20} />
                </Button>

                <div className="rounded-[8px] border border-white/10 bg-white/5 p-4 space-y-3">
                  <p className="text-[12px] font-bold text-white text-center">Ou forcer un statut manuel</p>
                  <div className="flex gap-2">
                    <Select value={newStatus} onValueChange={(val) => setNewStatus(val as StatutColis)}>
                      <SelectTrigger className="flex-1 h-10 bg-brand-dark text-[13px] border-white/10 text-white">
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent className="bg-brand-dark border-white/15 text-white">
                        {COLIS_STATUT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-[13px] focus:bg-white/10 focus:text-white">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleManualStatusChange}
                      disabled={!newStatus || isLoading}
                      variant="secondary"
                      className="h-10 px-4 text-[12.5px] font-bold bg-white/10 text-white hover:bg-white/20 border border-white/10"
                    >
                      Valider
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : error && code ? (
             <div className="space-y-6">
               <div className="text-center space-y-2">
                 <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                   <ScanLine size={32} />
                 </div>
                 <p className="text-[15px] font-bold text-red-400">{error}</p>
                 <p className="text-[13.5px] text-white/50 font-medium break-all">
                   Le code <span className="text-white">{code}</span> n&apos;est rattaché à aucun colis existant.
                 </p>
               </div>

               <div className="space-y-3 pt-6 border-t border-white/10">
                 <p className="text-[12px] font-bold uppercase tracking-wider text-white/50 text-center mb-4">
                   Actions possibles
                 </p>
                 <Button
                    onClick={() => openCreate(false)}
                    className="w-full h-12 bg-white/5 border border-white/10 text-white hover:bg-white/10 flex items-center justify-start gap-3 px-4 shadow-none"
                 >
                   <UserPlus size={18} className="text-brand-orange" />
                   <span className="font-bold text-[13.5px]">Ajouter un colis (Client connu)</span>
                 </Button>

                 <Button
                    onClick={() => openCreate(true)}
                    className="w-full h-12 bg-white/5 border border-white/10 text-white hover:bg-white/10 flex items-center justify-start gap-3 px-4 shadow-none"
                 >
                   <PackagePlus size={18} className="text-white/50" />
                   <span className="font-bold text-[13.5px]">Envoyer en &quot;Non identifié&quot;</span>
                 </Button>
               </div>
            </div>
          ) : (
             <div className="text-center opacity-40">
               <ScanLine size={64} className="mx-auto mb-4 text-white" />
               <p className="text-[14px] font-bold text-white">En attente de scan...</p>
             </div>
          )}
        </div>
      </div>

      <CreatePackageDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        allowUnmatched={createAsUnmatched}
        defaultTracking={code}
        onSuccess={(colis) => {
           addRecentScan(colis);
           resetScanState();
        }}
      />
    </div>
    </div>
  );
}
