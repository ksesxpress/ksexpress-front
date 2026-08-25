"use client";

import { useCallback, useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2, Upload, Printer } from "lucide-react";
import {
  getColis,
  updateColis,
  changerStatutColis,
  removeColisPhoto,
  getColisLabelUrl,
} from "@/lib/api/colis";
import { apiFetch } from "@/lib/api/client";
import { API_TUNNEL_HEADERS, API_URL } from "@/lib/api/config";
import { getAccessToken } from "@/lib/auth/tokens";
import { getPricingCategories } from "@/lib/api/tarification";
import { getPublicSettings } from "@/lib/api/parametres";
import type { Colis, StatutColis, ApiErrorBody } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { ColisStatusBadge, COLIS_STATUT_OPTIONS } from "@/components/app-shell/StatusBadge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { useAuth } from "@/lib/auth/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const cardClass = "rounded-[10px] border border-white/15 bg-white/5 backdrop-blur-xl p-5 shadow-none text-white";
const fieldClass = "!h-10 w-full rounded-[8px] border border-white/10 bg-white/5 backdrop-blur-xl px-3 text-[13.5px] text-white shadow-none";
const labelClass = "mb-1 block text-[12.5px] font-bold text-white/90";

const MAX_PHOTOS_DEFAUT = 5;

export default function ColisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);

  const [colis, setColis] = useState<Colis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [poidsLb, setPoidsLb] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [categorie, setCategorie] = useState("");
  const [valeurDeclaree, setValeurDeclaree] = useState("");
  const [description, setDescription] = useState("");
  const [rayon, setRayon] = useState("");
  const [marchand, setMarchand] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [nextStatut, setNextStatut] = useState<StatutColis>("RECEIVED_USA");
  const [motif, setMotif] = useState("");
  const [isChangingStatut, setIsChangingStatut] = useState(false);
  const [statutError, setStatutError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [maxPhotos, setMaxPhotos] = useState(MAX_PHOTOS_DEFAUT);
  
  const { user } = useAuth();
  const [isCashier, setIsCashier] = useState(false);

  useEffect(() => {
    import("@/lib/auth/tokens").then(m => {
      const activeId = m.getActiveSuccursale();
      const available = m.getAvailableSuccursales();
      const current = available.find(s => s.id === activeId);
      const role = current?.roleCustom?.level?.toUpperCase() || (user?.isStaff && !user.isSuperAdmin ? "CASHIER" : "");
      if (role === "CASHIER") {
        setIsCashier(true);
      }
    });
  }, [user]);

  useEffect(() => {
    getPricingCategories()
      .then((noms) => setCategories(noms))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    getPublicSettings()
      .then((s) => setMaxPhotos(s.maxPhotosParColis))
      .catch(() => setMaxPhotos(MAX_PHOTOS_DEFAUT));
  }, []);

  const load = useCallback(() => {
    getColis(id)
      .then((c) => {
        setColis(c);
        setPoidsLb(c.poidsLb ?? "");
        setDimensions(c.dimensions ?? "");
        setCategorie(c.categorie ?? "");
        setValeurDeclaree(c.valeurDeclaree ?? "");
        setDescription(c.description ?? "");
        setRayon(c.rayon ?? "");
        setMarchand(c.marchand ?? "");
        setNextStatut(c.statut);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Impossible de charger ce colis."),
      );
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    try {
      const updated = await updateColis(id, {
        poidsLb: poidsLb ? Number(poidsLb) : undefined,
        dimensions: dimensions || undefined,
        categorie: categorie || undefined,
        valeurDeclaree: valeurDeclaree ? Number(valeurDeclaree) : undefined,
        description: description || undefined,
        rayon: rayon || undefined,
        marchand: marchand || undefined,
      });
      setColis(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangeStatut() {
    setStatutError(null);
    setIsChangingStatut(true);
    try {
      const updated = await changerStatutColis(id, nextStatut, motif || undefined);
      setColis(updated);
      setMotif("");
    } catch (err) {
      setStatutError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsChangingStatut(false);
    }
  }

  async function handleUploadPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("photos", f));
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/packages/${id}/photos`, {
        method: "POST",
        headers: {
          ...API_TUNNEL_HEADERS,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });
      if (!res.ok) {
        let body: ApiErrorBody | null = null;
        try {
          body = (await res.json()) as ApiErrorBody;
        } catch {
          // non-JSON fallback
        }
        throw new ApiError(res.status, body, "Échec de l'envoi des photos.");
      }
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Échec de l'envoi des photos.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemovePhoto(url: string) {
    try {
      await removeColisPhoto(id, url);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de retirer cette photo.");
    }
  }

  async function handlePrintLabel(format: "thermal" | "a4") {
    const blob = await apiFetch<Blob>(getColisLabelUrl(id, format));
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

  if (error && !colis) {
    return <p className="text-[14px] font-semibold text-red-400">{error}</p>;
  }

  if (!colis) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-brand-orange" size={28} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader>
        <Link
          href="/staff/packages"
          className="flex w-fit items-center gap-1.5 text-[12.5px] font-bold text-white/80 hover:text-white mb-1"
        >
          <ArrowLeft size={14} />
          Retour à la liste des colis
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              {colis.tracking ?? "Colis sans tracking"}
            </h1>
            <p className="text-[12.5px] text-white/70">Créé le {formatDateTime(colis.createdAt)}</p>
          </div>
          <ColisStatusBadge statut={colis.statut} />
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Colonne Gauche : Client & Détails du colis */}
        <div className="space-y-6">
          <section className={cardClass}>
            <h2 className="mb-3 text-[15px] font-extrabold text-white border-b border-white/15 pb-2">Client</h2>
            {colis.client ? (
              <Link
                href={`/staff/clients/${colis.client.id}`}
                className="flex items-center justify-between rounded-[8px] border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10 transition-colors"
              >
                <div>
                  <p className="text-[13.5px] font-bold text-white">
                    {colis.client.prenom ? `${colis.client.prenom} ${colis.client.nom}` : colis.client.nom}
                  </p>
                  <p className="text-[12px] text-white/50">
                    {colis.client.codeKse}
                    {colis.client.telephone ? ` · ${colis.client.telephone}` : ""}
                  </p>
                </div>
                <span className="text-[12.5px] font-bold text-brand-orange hover:underline">Voir la fiche</span>
              </Link>
            ) : (
              <p className="text-[13.5px] text-white/50">
                {colis.nomDestinataireBrut
                  ? `Non rattaché — destinataire indiqué : ${colis.nomDestinataireBrut}`
                  : "Aucun client rattaché à ce colis."}
              </p>
            )}
          </section>

          <section className={cardClass}>
            <h2 className="mb-3 text-[15px] font-extrabold text-white border-b border-white/15 pb-2">Détails du colis</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className={labelClass}>Poids (lb)</Label>
                <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                  <InputGroupInput
                    type="number"
                    step="0.01"
                    value={poidsLb}
                    onChange={(e) => setPoidsLb(e.target.value)}
                    className={fieldClass}
                  />
                </InputGroup>
              </div>
              <div>
                <Label className={labelClass}>Dimensions</Label>
                <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                  <InputGroupInput value={dimensions} onChange={(e) => setDimensions(e.target.value)} className={fieldClass} />
                </InputGroup>
              </div>
              <div>
                <Label className={labelClass}>Catégorie</Label>
                <Select value={categorie} onValueChange={setCategorie}>
                  <SelectTrigger className={fieldClass}>
                    <SelectValue placeholder="— Choisir —" />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-dark border-white/15 text-white">
                    {categorie && !categories.includes(categorie) && (
                      <SelectItem value={categorie} className="focus:bg-white/10 focus:text-white">{categorie}</SelectItem>
                    )}
                    {categories.map((c) => (
                      <SelectItem key={c} value={c} className="focus:bg-white/10 focus:text-white">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelClass}>Valeur déclarée (USD)</Label>
                <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                  <InputGroupInput
                    type="number"
                    step="0.01"
                    value={valeurDeclaree}
                    onChange={(e) => setValeurDeclaree(e.target.value)}
                    className={fieldClass}
                  />
                </InputGroup>
              </div>
              <div>
                <Label className={labelClass}>Marchand</Label>
                <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                  <InputGroupInput value={marchand} onChange={(e) => setMarchand(e.target.value)} className={fieldClass} />
                </InputGroup>
              </div>
              <div>
                <Label className={labelClass}>Emplacement</Label>
                <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                  <InputGroupInput value={rayon} onChange={(e) => setRayon(e.target.value)} className={fieldClass} />
                </InputGroup>
              </div>
            </div>
            <div className="mt-4">
              <Label className={labelClass}>Description</Label>
              <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                <InputGroupInput value={description} onChange={(e) => setDescription(e.target.value)} className={fieldClass} />
              </InputGroup>
            </div>

            {error && <p className="mt-3 text-[13px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-[8px]">{error}</p>}
            {saved && (
              <p className="mt-3 text-[13px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-[8px]">Modifications enregistrées.</p>
            )}

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="mt-4 h-10 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-6 text-[13px] font-bold text-white shadow-none disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Enregistrer les modifications"}
            </Button>
          </section>
        </div>

        {/* Colonne Droite : Statut, Photos, Label */}
        <div className="space-y-6">
          <section className={cardClass}>
            <h2 className="mb-3 text-[15px] font-extrabold text-white border-b border-white/15 pb-2">Changer le Statut</h2>
            <div className="space-y-4">
              <div>
                <Label className={labelClass}>Nouveau statut</Label>
                <Select value={nextStatut} onValueChange={(val) => setNextStatut(val as StatutColis)}>
                  <SelectTrigger className={fieldClass}>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-dark border-white/15 text-white">
                    {COLIS_STATUT_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="focus:bg-white/10 focus:text-white">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelClass}>Motif (requis pour un retour/exception)</Label>
                <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                  <InputGroupInput value={motif} onChange={(e) => setMotif(e.target.value)} className={fieldClass} placeholder="Raison de la modification..." />
                </InputGroup>
              </div>
              <Button
                onClick={handleChangeStatut}
                disabled={isChangingStatut}
                className="h-10 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-6 text-[13px] font-bold text-white shadow-none disabled:opacity-70"
              >
                {isChangingStatut ? <Loader2 className="animate-spin" size={16} /> : "Mettre à jour le statut"}
              </Button>
            </div>
            {statutError && (
              <p className="mt-3 text-[13px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-[8px]">{statutError}</p>
            )}
          </section>

          <section className={cardClass}>
            <h2 className="mb-3 text-[15px] font-extrabold text-white border-b border-white/15 pb-2">
              Photos ({colis.photos.length}/{maxPhotos})
            </h2>
            <div className="mb-3 grid grid-cols-3 gap-3">
              {colis.photos.map((url) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-[8px] border border-white/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Photo du colis" className="h-full w-full object-cover" />
                  <button
                    onClick={() => handleRemovePhoto(url)}
                    className="absolute right-1 top-1 rounded-[6px] bg-white/90 p-1 text-red-600 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Retirer cette photo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            {colis.photos.length < maxPhotos && (
              <label className="flex w-fit cursor-pointer items-center gap-2 rounded-[8px] border border-white/15 bg-white/5 px-4 py-2 text-[12.5px] font-bold text-white hover:bg-white/10 transition-colors">
                <Upload size={14} />
                {isUploading ? "Envoi..." : "Ajouter des photos"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => handleUploadPhotos(e.target.files)}
                />
              </label>
            )}
          </section>

          <div className="rounded-[10px] border border-white/15 bg-white/5 p-4 backdrop-blur-xl mb-6">
            <h2 className="mb-3 text-[15px] font-extrabold text-white border-b border-white/15 pb-2">Label / Étiquette</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-white/5 border-white/15 text-white hover:bg-white/10 hover:text-white"
                onClick={() => handlePrintLabel("thermal")}
                disabled={isCashier}
                title={isCashier ? "Les caissiers ne peuvent pas imprimer de labels" : undefined}
              >
                <Printer size={16} className="mr-2 opacity-70" />
                Imprimer (Thermique)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-white/5 border-white/15 text-white hover:bg-white/10 hover:text-white"
                onClick={() => handlePrintLabel("a4")}
                disabled={isCashier}
                title={isCashier ? "Les caissiers ne peuvent pas imprimer de labels" : undefined}
              >
                <Printer size={16} className="mr-2 opacity-70" />
                Imprimer (A4)
              </Button>
            </div>
            {isCashier && <p className="mt-2 text-[11.5px] text-brand-orange/80">Option d'impression désactivée pour le rôle Caissier.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
