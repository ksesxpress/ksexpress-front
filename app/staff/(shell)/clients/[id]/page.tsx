"use client";

import { useCallback, useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { getClientResume, updateClient, deactivateClient } from "@/lib/api/clients";
import type { ClientResume, CanalNotification } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { formatDate, formatMoney, formatWeight } from "@/lib/format";
import { ColisStatusBadge, FactureStatusBadge } from "@/components/app-shell/StatusBadge";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { mergeFactures } from "@/lib/api/factures";

const fieldClass = "h-11 rounded-[10px] border border-white/10 bg-white/5 text-white";
const labelClass = "mb-1.5 block text-[12.5px] font-bold text-white/90";

const CANAL_LABELS: Record<CanalNotification, string> = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  LES_DEUX: "Email + WhatsApp",
};

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-bold uppercase text-white/50">{label}</p>
      <p className="text-[14.5px] font-semibold text-white/90">{value}</p>
    </div>
  );
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const { user } = useAuth();
  const canEdit = user?.isStaff;

  const [resume, setResume] = useState<ClientResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [adresse, setAdresse] = useState("");
  const [canal, setCanal] = useState<CanalNotification>("EMAIL");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [selectedFactures, setSelectedFactures] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  const load = useCallback(() => {
    getClientResume(id)
      .then((r) => {
        setResume(r);
        setNom(r.client.nom);
        setPrenom(r.client.prenom ?? "");
        setTelephone(r.client.telephone ?? "");
        setEmail(r.client.email ?? "");
        setAdresse(r.client.adresse ?? "");
        setCanal(r.client.canalNotificationPrefere);
        setSelectedFactures([]);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de charger ce client."));
  }, [id]);

  useEffect(load, [load]);

  async function handleMergeFactures() {
    if (selectedFactures.length < 2) return;
    setIsMerging(true);
    try {
      await mergeFactures(selectedFactures);
      load();
    } catch (err) {
      setAlertMessage(err instanceof ApiError ? err.message : "Erreur lors de la fusion.");
    } finally {
      setIsMerging(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    try {
      const updated = await updateClient(id, {
        nom,
        prenom: prenom || undefined,
        telephone: telephone || undefined,
        email: email || undefined,
        adresse: adresse || undefined,
        canalNotificationPrefere: canal,
      });
      setResume((prev) => (prev ? { ...prev, client: updated } : prev));
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!confirm("Désactiver ce client ?")) return;
    try {
      const updated = await deactivateClient(id);
      setResume((prev) => (prev ? { ...prev, client: updated } : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de désactiver ce client.");
    }
  }

  if (!resume) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-brand-orange" size={28} />
      </div>
    );
  }

  const { client, colis, factures } = resume;
  const totalFacture = factures.reduce((sum, f) => sum + Number(f.total), 0);
  const soldeFactures = factures.reduce(
    (sum, f) => sum + (Number(f.total) - Number(f.montantPaye)),
    0,
  );

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/staff/clients" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/50 hover:text-white transition-colors">
        <ArrowLeft size={16} />
        Retour aux clients
      </Link>

      <PageHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              {client.prenom ? `${client.prenom} ${client.nom}` : client.nom}
            </h1>
            <p className="text-[12.5px] text-white/70">
              {client.codeKse} · {client.actif ? "Actif" : "Désactivé"} · client depuis{" "}
              {formatDate(client.createdAt)}
            </p>
          </div>
          <span
            className={`text-lg font-extrabold ${Number(client.balance) < 0 ? "text-red-500" : "text-white"}`}
          >
            {formatMoney(client.balance)}
          </span>
        </div>
      </PageHeader>

      <section className="grid gap-4 rounded-[10px] border border-white/15 bg-white/5 backdrop-blur-xl p-5 sm:grid-cols-3">
        <div>
          <p className="text-[12px] font-bold uppercase text-white/50">Colis</p>
          <p className="text-xl font-extrabold text-white">{colis.length}</p>
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase text-white/50">Total facturé</p>
          <p className="text-xl font-extrabold text-white">{formatMoney(totalFacture)}</p>
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase text-white/50">Solde impayé</p>
          <p className={`text-xl font-extrabold ${soldeFactures > 0 ? "text-red-500" : "text-emerald-400"}`}>
            {formatMoney(soldeFactures)}
          </p>
        </div>
      </section>

      {!canEdit && (
        <section className="rounded-[10px] border border-white/15 bg-white/5 backdrop-blur-xl p-5">
          <h2 className="mb-3 text-[15px] font-bold text-white">Fiche client</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoField label="Téléphone" value={client.telephone ?? "—"} />
            <InfoField label="Email" value={client.email ?? "—"} />
            <InfoField label="Adresse" value={client.adresse ?? "—"} />
            <InfoField
              label="Notifications préférées"
              value={CANAL_LABELS[client.canalNotificationPrefere]}
            />
          </div>
        </section>
      )}

      {canEdit && (
        <section className="rounded-[10px] border border-white/15 bg-white/5 backdrop-blur-xl p-5">
          <h2 className="mb-3 text-[15px] font-bold text-white">Fiche client</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className={labelClass}>Prénom</Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput value={prenom} onChange={(e) => setPrenom(e.target.value)} />
              </InputGroup>
            </div>
            <div>
              <Label className={labelClass}>Nom</Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput required value={nom} onChange={(e) => setNom(e.target.value)} />
              </InputGroup>
            </div>
            <div>
              <Label className={labelClass}>Téléphone</Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput value={telephone} onChange={(e) => setTelephone(e.target.value)} />
              </InputGroup>
            </div>
            <div>
              <Label className={labelClass}>Email</Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </InputGroup>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label className={labelClass}>Adresse</Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput value={adresse} onChange={(e) => setAdresse(e.target.value)} />
              </InputGroup>
            </div>
            <div>
              <Label className={labelClass}>Notifications préférées</Label>
              <select
                value={canal}
                onChange={(e) => setCanal(e.target.value as CanalNotification)}
                className="h-11 w-full rounded-[10px] border border-white/10 bg-white/5 text-white px-3 text-[13.5px] [&>option]:bg-brand-dark"
              >
                {(Object.keys(CANAL_LABELS) as CanalNotification[]).map((c) => (
                  <option key={c} value={c}>
                    {CANAL_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="mt-3 text-[13px] font-semibold text-red-600">{error}</p>}
          {saved && <p className="mt-3 text-[13px] font-semibold text-green-700">Enregistré.</p>}

          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-10 rounded-[8px] bg-brand-orange hover:bg-brand-orange-dark px-6 text-[13.5px] font-bold text-white shadow-none disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Enregistrer"}
            </Button>
            {client.actif && (
              <button
                onClick={handleDeactivate}
                className="h-10 rounded-[8px] border border-red-500/50 bg-red-500/10 px-6 text-[13.5px] font-semibold text-red-500 hover:bg-red-500/20 transition-colors"
              >
                Désactiver
              </button>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[10px] border border-white/15 bg-white/5 backdrop-blur-xl p-5">
          <h2 className="mb-3 text-[15px] font-bold text-white">Colis ({colis.length})</h2>
          <ul className="divide-y divide-white/10">
            {colis.slice(0, 20).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <Link href={`/staff/packages/${c.id}`} className="text-[13.5px] font-semibold text-brand-orange hover:underline">
                    {c.tracking ?? "(sans tracking)"}
                  </Link>
                  <p className="text-[11.5px] text-white/60">
                    {c.categorie ?? "—"} · {c.poidsLb ? formatWeight(c.poidsLb) : "poids —"} ·{" "}
                    {formatDate(c.createdAt)}
                  </p>
                </div>
                <ColisStatusBadge statut={c.statut} />
              </li>
            ))}
            {colis.length === 0 && <p className="py-2 text-[13.5px] text-white/50">Aucun colis.</p>}
          </ul>
        </section>

        <section className="rounded-[10px] border border-white/15 bg-white/5 backdrop-blur-xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-white">Factures ({factures.length})</h2>
            {selectedFactures.length > 1 && (
              <Button
                onClick={handleMergeFactures}
                disabled={isMerging}
                className="h-8 rounded-[6px] bg-brand-orange hover:bg-brand-orange-dark px-3 text-[12px] font-bold text-white shadow-none"
              >
                {isMerging ? <Loader2 className="mr-2 animate-spin" size={14} /> : null}
                Fusionner ({selectedFactures.length})
              </Button>
            )}
          </div>
          <ul className="divide-y divide-white/10">
            {factures.slice(0, 20).map((f) => {
              const isOuverte = f.statut === "OUVERTE";
              return (
                <li key={f.id} className="flex items-center gap-3 py-2.5">
                  {isOuverte ? (
                    <input
                      type="checkbox"
                      checked={selectedFactures.includes(f.id)}
                      onChange={() => {
                        setSelectedFactures((prev) =>
                          prev.includes(f.id) ? prev.filter((id) => id !== f.id) : [...prev, f.id]
                        );
                      }}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 accent-brand-orange"
                    />
                  ) : (
                    <div className="w-4" /> // placeholder pour aligner
                  )}
                  <div className="flex-1">
                    <Link href={`/staff/invoices/${f.id}`} className="text-[13.5px] font-semibold text-brand-orange hover:underline">
                      {f.numero}
                    </Link>
                    <p className="text-[11.5px] text-white/60">
                      {formatMoney(f.total)} · payé {formatMoney(f.montantPaye)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-white/50">{formatDate(f.dateEmission)}</span>
                    <FactureStatusBadge statut={f.statut} />
                  </div>
                </li>
              );
            })}
            {factures.length === 0 && <p className="py-2 text-[13.5px] text-white/50">Aucune facture.</p>}
          </ul>
        </section>
      </div>

      <Dialog open={!!alertMessage} onOpenChange={(open) => !open && setAlertMessage(null)}>
        <DialogContent className="max-w-md bg-[#13111C] border border-white/10 p-6 text-white sm:rounded-[12px]">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-bold text-white">Attention</DialogTitle>
            <DialogDescription className="text-[14px] text-white/70 mt-2">
              {alertMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button
              onClick={() => setAlertMessage(null)}
              className="bg-brand-orange hover:bg-brand-orange-dark text-white font-bold h-10 px-6 rounded-[8px]"
            >
              Compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
