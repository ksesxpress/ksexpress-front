"use client";

import { useEffect, useState, use as usePromise } from "react";
import { Loader2, CheckCircle2, ShieldCheck, MapPin, Phone, Mail, Package, ExternalLink } from "lucide-react";
import { getPublicFacture } from "@/lib/api/factures";
import type { Facture } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { formatDate, formatDateTime, formatMoney, formatWeight } from "@/lib/format";
import { FactureStatusBadge, ColisStatusBadge } from "@/components/app-shell/StatusBadge";

export default function PublicInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [facture, setFacture] = useState<Facture | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPublicFacture(id)
      .then(setFacture)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Facture introuvable ou indisponible."),
      );
  }, [id]);

  if (error && !facture) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="rounded-[16px] border border-white/20 bg-white/10 backdrop-blur-xl p-8 max-w-md w-full space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-xl font-bold text-white">Vérification impossible</h1>
          <p className="text-[14px] text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  if (!facture) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-orange" size={32} />
      </div>
    );
  }

  const soldeBrut = Number(facture.total) - Number(facture.montantPaye);
  const solde = Math.max(0, soldeBrut);
  const tropPercu = soldeBrut < 0 ? Math.abs(soldeBrut) : 0;
  const clientName = facture.client
    ? (facture.client.prenom ? `${facture.client.prenom} ${facture.client.nom}` : facture.client.nom)
    : "Client KS Express";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* En-tête de vérification officielle */}
        <div className="rounded-[16px] border border-emerald-500/30 bg-emerald-950/40 backdrop-blur-xl p-4 flex items-center justify-between text-emerald-300 shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-400 shrink-0" size={24} />
            <div>
              <p className="text-[13.5px] font-extrabold uppercase tracking-wide">
                Reçu Officiel Vérifié
              </p>
              <p className="text-[12px] text-emerald-300/80">
                Document authentique certifié par KS Express Service
              </p>
            </div>
          </div>
          <span className="text-[12px] font-mono font-bold bg-emerald-500/20 px-2.5 py-1 rounded-[6px] text-emerald-200">
            OK
          </span>
        </div>

        {/* Carte principale Reçu / Facture */}
        <div className="rounded-[20px] border border-white/20 bg-white/90 backdrop-blur-2xl shadow-2xl overflow-hidden text-brand-dark p-6 sm:p-8 space-y-6">
          {/* Logo & Info Entreprise */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-2xl font-black text-brand-dark tracking-tight">KS EXPRESS</h1>
              <p className="text-[12.5px] font-semibold text-brand-orange-text">
                Service de Livraison & Transit Haïti - USA
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block mb-1">
                <FactureStatusBadge statut={facture.statut} />
              </span>
              <p className="text-[16px] font-extrabold text-brand-dark">{facture.numero}</p>
              <p className="text-[12px] text-brand-grey">Émise le {formatDate(facture.dateEmission)}</p>
            </div>
          </div>

          {/* Info Client */}
          <div className="rounded-[12px] bg-slate-50 border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-brand-grey">Destinataire / Client</p>
              <p className="text-[16px] font-extrabold text-brand-dark">{clientName}</p>
            </div>
            {facture.client?.codeKse && (
              <div className="text-right sm:text-left">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-brand-grey">KSE Code</p>
                <p className="text-[14px] font-mono font-extrabold text-brand-orange-text">
                  {facture.client.codeKse}
                </p>
              </div>
            )}
          </div>

          {/* Synthèse financière */}
          <div className="grid grid-cols-3 gap-3 rounded-[12px] bg-gradient-to-br from-slate-900 to-brand-dark p-4 text-white">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Total</p>
              <p className="text-[18px] sm:text-2xl font-black">{formatMoney(facture.total)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Payé</p>
              <p className="text-[18px] sm:text-2xl font-black text-emerald-400">{formatMoney(facture.montantPaye)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Solde</p>
              <p className={`text-[18px] sm:text-2xl font-black ${solde > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {formatMoney(solde)}
              </p>
              {tropPercu > 0 && (
                <p className="text-[10.5px] font-bold text-emerald-300">
                  +{formatMoney(tropPercu)} en avoir
                </p>
              )}
            </div>
          </div>

          {/* Colis inclus */}
          <div className="space-y-3">
            <h2 className="text-[14px] font-extrabold text-brand-dark uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Package size={16} className="text-brand-orange" />
              Colis inclus dans cette facture
            </h2>
            <ul className="divide-y divide-slate-150 border border-slate-200 rounded-[12px] bg-white overflow-hidden">
              {(facture.lignes ?? []).map((l) => (
                <li key={l.id} className="p-3.5 flex items-center justify-between text-[13.5px] hover:bg-slate-50">
                  <div>
                    <p className="font-extrabold text-brand-dark">
                      {l.colis?.tracking ?? "(sans tracking)"}
                    </p>
                    <p className="text-[12px] text-brand-grey font-medium">
                      {formatWeight(l.poidsFacture)} · {formatMoney(l.prixUnitaire)}/lb
                    </p>
                  </div>
                  <span className="font-black text-brand-dark">{formatMoney(l.montant)}</span>
                </li>
              ))}
            </ul>
            {Number(facture.fraisSupplementaires) > 0 && (
              <div className="flex justify-between items-center text-[13.5px] px-2 font-bold text-slate-700">
                <span>{facture.fraisSupplementairesLabel || "Frais supplémentaires"} :</span>
                <span>{formatMoney(facture.fraisSupplementaires)}</span>
              </div>
            )}
          </div>

          {/* Historique des paiements */}
          <div className="space-y-3">
            <h2 className="text-[14px] font-extrabold text-brand-dark uppercase tracking-wider border-b border-slate-200 pb-2">
              Règlements & Paiements
            </h2>
            <ul className="divide-y divide-slate-150 border border-slate-200 rounded-[12px] bg-white overflow-hidden">
              {(facture.paiements ?? []).map((p) => (
                <li key={p.id} className="p-3.5 flex items-center justify-between text-[13.5px]">
                  <div>
                    <span className="font-bold text-brand-dark">{p.mode}</span>
                    {p.reference && <span className="text-brand-grey text-[12px]"> ({p.reference})</span>}
                    <p className="text-[11.5px] text-brand-grey">{formatDateTime(p.createdAt)}</p>
                  </div>
                  <span className="font-bold text-emerald-700">{formatMoney(p.montant)}</span>
                </li>
              ))}
              {(!facture.paiements || facture.paiements.length === 0) && (
                <li className="p-4 text-center text-[13px] text-brand-grey">Aucun paiement enregistré.</li>
              )}
            </ul>
          </div>

          {/* Contact Support KS Express */}
          <div className="rounded-[12px] bg-amber-50/80 border border-amber-200 p-4 space-y-2 text-[12.5px] text-amber-900">
            <p className="font-extrabold text-[13px] text-amber-950 flex items-center gap-1.5">
              <MapPin size={15} /> KS Express Service — Cap-Haïtien
            </p>
            <p># 35, Angle des rues 20 I-J, Cap-Haïtien, Haïti</p>
            <div className="flex flex-wrap gap-4 pt-1 text-[12px] font-semibold text-amber-800">
              <span className="flex items-center gap-1"><Phone size={13} /> +509 34 04 3288</span>
              <span className="flex items-center gap-1"><Mail size={13} /> ksexpressservice2025@gmail.com</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[12px] text-white/50">
          © {new Date().getFullYear()} KS Express Service. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
