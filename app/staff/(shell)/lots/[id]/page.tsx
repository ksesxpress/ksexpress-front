"use client";

import { useCallback, useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, X, PackagePlus } from "lucide-react";
import {
  getLot,
  attachColisToLot,
  detachColisFromLot,
  changerStatutLot,
} from "@/lib/api/lots";
import type { Lot, StatutColis } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { formatDate, formatWeight } from "@/lib/format";
import { ColisStatusBadge, colisStatutLabel } from "@/components/app-shell/StatusBadge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const cardClass = "rounded-[10px] border border-white/15 bg-white/5 backdrop-blur-xl p-5 shadow-none text-white";
const fieldClass = "!h-10 w-full rounded-[8px] border border-white/10 bg-white/5 backdrop-blur-xl px-3 text-[13.5px] text-white shadow-none";
const labelClass = "mb-1 block text-[12.5px] font-bold text-white/90";

const STATUTS: StatutColis[] = [
  "WAITING_SHIPMENT",
  "IN_TRANSIT",
  "CUSTOM_CLEARANCE",
  "ARRIVED_HAITI",
  "READY_PICKUP",
];

export default function LotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [lot, setLot] = useState<Lot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [colisIds, setColisIds] = useState("");
  const [isAttaching, setIsAttaching] = useState(false);
  const [nextStatut, setNextStatut] = useState<StatutColis>("IN_TRANSIT");
  const [motif, setMotif] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  const load = useCallback(() => {
    getLot(id)
      .then((l) => {
        setLot(l);
        const idx = STATUTS.indexOf(l.statut);
        const next = idx !== -1 && idx < STATUTS.length - 1 ? STATUTS[idx + 1] : l.statut;
        setNextStatut(next);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de charger ce lot."));
  }, [id]);

  useEffect(load, [load]);

  async function handleAttach() {
    const ids = colisIds
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return;
    setIsAttaching(true);
    setError(null);
    try {
      await attachColisToLot(id, ids);
      load();
      setColisIds("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de rattacher ces colis.");
    } finally {
      setIsAttaching(false);
    }
  }

  async function handleDetach(colisId: string) {
    try {
      await detachColisFromLot(id, colisId);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de retirer ce colis.");
    }
  }

  async function handleChangeStatut() {
    setIsChanging(true);
    setError(null);
    try {
      await changerStatutLot(id, nextStatut, motif || undefined);
      load();
      setMotif("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de changer le statut.");
    } finally {
      setIsChanging(false);
    }
  }

  if (!lot) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-brand-orange" size={28} />
      </div>
    );
  }

  const poidsTotal = (lot.colis ?? []).reduce((sum, c) => sum + (c.poidsLb ? Number(c.poidsLb) : 0), 0);
  const categories = Array.from(
    new Set((lot.colis ?? []).map((c) => c.categorie).filter(Boolean)),
  ) as string[];
  const client = lot.colis?.find((c) => c.client)?.client ?? null;

  return (
    <div className="w-full space-y-6">
      <PageHeader>
        <Link
          href="/staff/lots"
          className="flex w-fit items-center gap-1.5 text-[12.5px] font-bold text-white/80 hover:text-white mb-1"
        >
          <ArrowLeft size={14} />
          Retour aux lots
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">{lot.reference}</h1>
            <p className="text-[12.5px] text-white/70">
              {lot.type === "AVION" ? "Avion" : "Bateau"} · départ {formatDate(lot.dateDepart)} · arrivée{" "}
              {formatDate(lot.dateArrivee)}
            </p>
          </div>
          <ColisStatusBadge statut={lot.statut} />
        </div>
      </PageHeader>

      {error && <p className="text-[13.5px] font-semibold text-red-400">{error}</p>}

      <section className={`${cardClass} grid gap-4 sm:grid-cols-3`}>
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wide text-white/50">Client</p>
          {client ? (
            <Link
              href={`/staff/clients/${client.id}`}
              className="text-[15px] font-extrabold text-brand-orange hover:underline"
            >
              {client.prenom ? `${client.prenom} ${client.nom}` : client.nom}
            </Link>
          ) : (
            <p className="text-[15px] font-extrabold text-white/90">—</p>
          )}
        </div>
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wide text-white/50">Poids total</p>
          <p className="text-[15px] font-extrabold text-white">{formatWeight(poidsTotal)}</p>
        </div>
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wide text-white/50">Catégories</p>
          {categories.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-block rounded-[6px] bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white border border-white/10"
                >
                  {cat}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[15px] font-extrabold text-white/90">—</p>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Colonne Gauche : Statut du lot */}
        <section className={cardClass}>
          <h2 className="mb-3 text-[15px] font-extrabold text-white border-b border-white/15 pb-2">
            Statut du lot (propagé à tous ses colis)
          </h2>
          {lot.statut === "WAITING_SHIPMENT" && (lot.colis?.length ?? 0) < 2 && (
            <p className="mb-3 text-[12.5px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-[8px]">
              Un lot doit contenir au moins 2 colis avant de partir en transit (
              {lot.colis?.length ?? 0} actuellement).
            </p>
          )}
          <div className="space-y-4">
            <div>
              <Label className={labelClass}>Nouveau statut</Label>
              <Select value={nextStatut} onValueChange={(val) => setNextStatut(val as StatutColis)}>
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent className="bg-brand-dark border-white/15 text-white">
                  {STATUTS.map((s) => (
                    <SelectItem key={s} value={s} className="focus:bg-white/10 focus:text-white">
                      {colisStatutLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={labelClass}>Motif (optionnel)</Label>
              <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                <InputGroupInput value={motif} onChange={(e) => setMotif(e.target.value)} className={fieldClass} placeholder="Ex: Retard vol, etc." />
              </InputGroup>
            </div>
            <Button
              onClick={handleChangeStatut}
              disabled={isChanging}
              className="h-10 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-6 text-[13px] font-bold text-white shadow-none disabled:opacity-70"
            >
              {isChanging ? <Loader2 className="animate-spin" size={16} /> : "Mettre à jour le statut"}
            </Button>
          </div>
        </section>

        {/* Colonne Droite : Colis du lot */}
        <section className={cardClass}>
          <h2 className="mb-3 text-[15px] font-extrabold text-white border-b border-white/15 pb-2">
            Colis du lot ({lot.colis?.length ?? 0})
          </h2>
          <div className="mb-4 space-y-3">
            <div>
              <Label className={labelClass}>Rattacher des colis (IDs / Trackings)</Label>
              <div className="flex gap-2">
                <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none flex-1">
                  <InputGroupInput
                    value={colisIds}
                    onChange={(e) => setColisIds(e.target.value)}
                    className={fieldClass}
                    placeholder="Saisir IDs ou trackings..."
                  />
                </InputGroup>
                <Button
                  onClick={handleAttach}
                  disabled={isAttaching || !colisIds}
                  className="h-10 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-4 text-[13px] font-bold text-white shadow-none disabled:opacity-70 shrink-0"
                >
                  {isAttaching ? <Loader2 className="animate-spin" size={16} /> : "Rattacher"}
                </Button>
              </div>
              <p className="mt-1 text-[11.5px] text-white/50 font-medium">
                Un lot ne regroupe que les colis d&apos;un seul et même client.
              </p>
            </div>
          </div>

          {lot.colis && lot.colis.length > 0 ? (
            <ul className="divide-y divide-white/10">
              {lot.colis.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/staff/packages/${c.id}`}
                      className="text-[13.5px] font-bold text-brand-orange hover:underline"
                    >
                      {c.tracking ?? "(sans tracking)"}
                    </Link>
                    <span className="text-[12.5px] text-white/50 font-medium">
                      {c.client
                        ? c.client.prenom
                          ? `${c.client.prenom} ${c.client.nom}`
                          : c.client.nom
                        : "—"}
                    </span>
                    <ColisStatusBadge statut={c.statut} />
                  </div>
                  <button
                    onClick={() => handleDetach(c.id)}
                    className="rounded-[6px] p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label="Retirer du lot"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13.5px] text-white/50 py-3 text-center">Aucun colis rattaché à ce lot.</p>
          )}
        </section>
      </div>
    </div>
  );
}
