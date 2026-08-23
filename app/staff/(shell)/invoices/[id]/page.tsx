"use client";

import { useCallback, useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { Loader2, Printer, CreditCard, ArrowLeft } from "lucide-react";
import { getFacture, ajouterPaiement, getFacturePdfUrl } from "@/lib/api/factures";
import { apiFetch } from "@/lib/api/client";
import type { Facture, ModePaiement } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { formatDate, formatDateTime, formatMoney, formatWeight } from "@/lib/format";
import { FactureStatusBadge, ColisStatusBadge } from "@/components/app-shell/StatusBadge";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const cardClass = "rounded-[10px] border border-white/15 bg-white/5 backdrop-blur-xl p-5 shadow-none text-white";
const fieldClass = "!h-10 w-full rounded-[8px] border-[1.5px] border-white/10 bg-white/5 backdrop-blur-xl px-3 text-[13.5px] text-white shadow-none";
const labelClass = "mb-1 block text-[12.5px] font-bold text-white/90";

export default function FactureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const { user } = useAuth();
  const canEncaisser = user?.isStaff;

  const [facture, setFacture] = useState<Facture | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [montant, setMontant] = useState("");
  const [mode, setMode] = useState<ModePaiement>("ESPECES");
  const [reference, setReference] = useState("");
  const [remise, setRemise] = useState("");
  const [autoriserCredit, setAutoriserCredit] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const load = useCallback(() => {
    getFacture(id)
      .then(setFacture)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de charger cette facture."));
  }, [id]);

  useEffect(load, [load]);

  async function handlePay() {
    setPayError(null);
    if (!montant) return;
    setIsPaying(true);
    try {
      const updated = await ajouterPaiement(id, {
        montant: Number(montant),
        mode,
        reference: reference || undefined,
        autoriserCredit: user?.isSuperAdmin ? autoriserCredit : undefined,
        remise: remise ? Number(remise) : undefined,
      });
      setFacture(updated);
      setMontant("");
      setReference("");
      setRemise("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsPaying(false);
    }
  }

  async function handlePrint(format: "a4" | "pos80") {
    const blob = await apiFetch<Blob>(getFacturePdfUrl(id, format));
    const url = URL.createObjectURL(blob);
    
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 200);
    };
  }

  if (error && !facture) {
    return <p className="text-[14px] font-semibold text-red-400">{error}</p>;
  }

  if (!facture) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-brand-orange" size={28} />
      </div>
    );
  }

  const soldeBrut = Number(facture.total) - Number(facture.montantPaye);
  const solde = Math.max(0, soldeBrut);
  const tropPercu = soldeBrut < 0 ? Math.abs(soldeBrut) : 0;

  return (
    <div className="w-full space-y-6">
      <PageHeader>
        <Link
          href="/staff/invoices"
          className="flex w-fit items-center gap-1.5 text-[12.5px] font-bold text-white/80 hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft size={14} />
          Retour aux factures
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">{facture.numero}</h1>
            <p className="text-[12.5px] text-white/70">
              {facture.client ? (
                <Link
                  href={`/staff/clients/${facture.client.id}`}
                  className="font-bold text-brand-orange hover:underline"
                >
                  {facture.client.prenom
                    ? `${facture.client.prenom} ${facture.client.nom}`
                    : facture.client.nom}
                </Link>
              ) : (
                "—"
              )}{" "}
              · émise le {formatDate(facture.dateEmission)}
            </p>
          </div>
          <FactureStatusBadge statut={facture.statut} />
        </div>
      </PageHeader>

      <section className={`${cardClass} grid gap-4 sm:grid-cols-3`}>
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wide text-white/50">Total</p>
          <p className="text-2xl font-extrabold text-white">{formatMoney(facture.total)}</p>
        </div>
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wide text-white/50">Payé</p>
          <p className="text-2xl font-extrabold text-emerald-400">{formatMoney(facture.montantPaye)}</p>
        </div>
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wide text-white/50">Solde</p>
          <p className={`text-2xl font-extrabold ${solde > 0 ? "text-red-500" : "text-emerald-400"}`}>
            {formatMoney(solde)}
          </p>
          {tropPercu > 0 && (
            <p className="text-[11.5px] font-bold text-emerald-400">
              +{formatMoney(tropPercu)} en avoir client
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Colonne Gauche : Colis facturés */}
        <section className={cardClass}>
          <h2 className="mb-3 text-[15px] font-extrabold text-white border-b border-white/20 pb-2">Colis facturés</h2>
          <ul className="divide-y divide-white/10">
            {(facture.lignes ?? []).map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-3 text-[13.5px]">
                <div className="flex items-center gap-2">
                  {l.colis ? (
                    <Link
                      href={`/staff/packages/${l.colis.id}`}
                      className="font-bold text-brand-orange hover:underline"
                    >
                      {l.colis.tracking ?? "(sans tracking)"}
                    </Link>
                  ) : (
                    <span className="font-semibold text-white/90">(sans tracking)</span>
                  )}
                  {l.colis && <ColisStatusBadge statut={l.colis.statut} />}
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-white">{formatMoney(l.montant)}</span>
                  <p className="text-[11.5px] text-white/60">
                    {formatWeight(l.poidsFacture)} · {formatMoney(l.prixUnitaire)}/lb
                    {Number(l.fraisFixes) > 0 && ` + ${formatMoney(l.fraisFixes)} frais`}
                    {Number(l.taxes) > 0 && ` + ${formatMoney(l.taxes)} taxes`}
                  </p>
                </div>
              </li>
            ))}
            {(!facture.lignes || facture.lignes.length === 0) && (
              <p className="py-4 text-[13.5px] text-white/50 text-center">Aucune ligne.</p>
            )}
          </ul>
          {Number(facture.fraisSupplementaires) > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-3 text-[13.5px]">
              <span className="font-bold text-white">
                {facture.fraisSupplementairesLabel || "Frais supplémentaires"}
              </span>
              <span className="font-extrabold text-white">
                {formatMoney(facture.fraisSupplementaires)}
              </span>
            </div>
          )}
        </section>

        {/* Colonne Droite : Paiements & Reçu */}
        <div className="space-y-6">
          <section className={cardClass}>
            <h2 className="mb-3 text-[15px] font-extrabold text-white border-b border-white/20 pb-2">Paiements</h2>
            <ul className="mb-4 divide-y divide-white/10">
              {(facture.paiements ?? []).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5 text-[13.5px]">
                  <span className="font-semibold text-white">
                    {p.mode} {p.reference ? `— ${p.reference}` : ""}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-[12px] text-white/50">{formatDateTime(p.createdAt)}</span>
                    <span className="font-bold text-emerald-400">{formatMoney(p.montant)}</span>
                  </span>
                </li>
              ))}
              {(!facture.paiements || facture.paiements.length === 0) && (
                <p className="py-3 text-[13.5px] text-white/50">Aucun paiement enregistré.</p>
              )}
            </ul>

            {canEncaisser && facture.statut !== "PAYEE" && facture.statut !== "ANNULEE" && (
              <div className="space-y-4 rounded-[10px] bg-white/5 p-4 border border-white/15">
                <h3 className="text-[13.5px] font-extrabold text-white flex items-center gap-1.5">
                  <CreditCard size={16} className="text-brand-orange" />
                  Enregistrer un paiement
                </h3>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <Label className={labelClass}>Montant ($)</Label>
                    <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                      <InputGroupInput
                        type="number"
                        step="0.01"
                        value={montant}
                        onChange={(e) => setMontant(e.target.value)}
                        className={fieldClass}
                        placeholder="0.00"
                      />
                    </InputGroup>
                  </div>
                  <div>
                    <Label className={labelClass}>Rabais ($)</Label>
                    <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                      <InputGroupInput
                        type="number"
                        step="0.01"
                        value={remise}
                        onChange={(e) => setRemise(e.target.value)}
                        className={fieldClass}
                        placeholder="0.00"
                      />
                    </InputGroup>
                  </div>
                  <div>
                    <Label className={labelClass}>Mode</Label>
                    <Select value={mode} onValueChange={(val) => setMode(val as ModePaiement)}>
                      <SelectTrigger className={fieldClass}>
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent className="bg-brand-dark border-white/15 text-white">
                        <SelectItem value="ESPECES" className="focus:bg-white/10 focus:text-white">Espèces</SelectItem>
                        <SelectItem value="ZELLE" className="focus:bg-white/10 focus:text-white">Zelle</SelectItem>
                        <SelectItem value="AVOIR" className="focus:bg-white/10 focus:text-white">Avoir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={labelClass}>Référence (optionnel)</Label>
                    <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                      <InputGroupInput
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className={fieldClass}
                        placeholder="N° reçu / Zelle"
                      />
                    </InputGroup>
                  </div>
                </div>

                {user?.isSuperAdmin && (
                  <label className="flex items-center gap-2 text-[12.5px] font-bold text-white/90 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={autoriserCredit}
                      onChange={(e) => setAutoriserCredit(e.target.checked)}
                      className="rounded border-white/20 bg-white/10 text-brand-orange focus:ring-brand-orange focus:ring-offset-0"
                    />
                    Autoriser le solde restant à crédit (dette client)
                  </label>
                )}

                {payError && <p className="text-[13px] font-semibold text-red-400 bg-red-500/10 p-2.5 rounded-[8px] border border-red-500/20">{payError}</p>}

                <Button
                  onClick={handlePay}
                  disabled={isPaying || !montant}
                  className="h-10 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-6 text-[13px] font-bold text-white shadow-none disabled:opacity-70"
                >
                  {isPaying ? <Loader2 className="animate-spin" size={16} /> : "Encaisser"}
                </Button>
              </div>
            )}
          </section>

          <section className={cardClass}>
            <h2 className="mb-3 text-[15px] font-extrabold text-white border-b border-white/20 pb-2">Reçu / Imprimer</h2>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => handlePrint("a4")}
                className="h-10 rounded-[8px] border border-white/15 bg-white/5 backdrop-blur-xl px-4 text-[13px] font-bold text-white shadow-none hover:bg-white/10 flex items-center gap-2"
              >
                <Printer size={16} />
                Format A4
              </Button>
              <Button
                type="button"
                onClick={() => handlePrint("pos80")}
                className="h-10 rounded-[8px] border border-white/15 bg-white/5 backdrop-blur-xl px-4 text-[13px] font-bold text-white shadow-none hover:bg-white/10 flex items-center gap-2"
              >
                <Printer size={16} />
                Reçu POS (80mm)
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
