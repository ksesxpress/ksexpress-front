"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import {
  getLogoUrl,
  uploadLogoFile,
  getEntrepriseInfo,
  setEntrepriseInfo,
  getTauxChangeGdes,
  setTauxChangeGdes,
  getFacturePrefixe,
  setFacturePrefixe,
  getLimites,
  setLimites,
  creerMoyenPaiement,
  listerMoyensPaiement,
  modifierMoyenPaiement,
  supprimerMoyenPaiement,
} from "@/lib/api/parametres";
import type { EntrepriseInfo, LimitesSysteme, ModePaiement, MoyenPaiement } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/app-shell/PageHeader";

const fieldClass = "!h-11 w-full rounded-[10px] border border-white/10 bg-white/5 text-white px-3 text-[13.5px] shadow-none";
const labelClass = "mb-1.5 block text-[12.5px] font-bold text-white/90";
const containerClass = "rounded-[10px] border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-none text-white flex flex-col justify-between";

function LogoSection() {
  const [valeur, setValeur] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLogoUrl().then((r) => setValeur(r.valeur ?? ""));
  }, []);

  async function handleFileChange(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setSaved(false);
    setIsUploading(true);
    try {
      const resultat = await uploadLogoFile(file);
      setValeur(resultat.valeur ?? "");
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Échec de l'envoi du logo.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className={containerClass}>
      <div>
        <h2 className="mb-3 text-[16px] font-extrabold text-white">Logo (emails)</h2>
        {valeur && (
          <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-[8px] border border-white/10 bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={valeur} alt="Logo actuel" className="h-full w-full object-contain" />
          </div>
        )}
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-[8px] border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-[12.5px] font-bold text-white transition-colors">
          <Upload size={14} />
          {isUploading ? "Envoi..." : "Choisir un fichier"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => handleFileChange(e.target.files)}
          />
        </label>
        {saved && <p className="mt-2 text-[12.5px] font-semibold text-green-700">Enregistré.</p>}
        {error && <p className="mt-2 text-[12.5px] font-semibold text-red-600">{error}</p>}
      </div>
    </div>
  );
}

const ENTREPRISE_VIDE: EntrepriseInfo = {
  nom: "",
  adresse: "",
  telephone: "",
  whatsapp: "",
  emailSupport: "",
};

function EntrepriseSection() {
  const [valeurs, setValeurs] = useState<EntrepriseInfo>(ENTREPRISE_VIDE);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getEntrepriseInfo().then(setValeurs);
  }, []);

  function champ(cle: keyof EntrepriseInfo) {
    return {
      value: valeurs[cle] ?? "",
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        setValeurs((v) => ({ ...v, [cle]: e.target.value })),
    };
  }

  function champNumber(cle: keyof EntrepriseInfo) {
    return {
      value: valeurs[cle] ?? "",
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        setValeurs((v) => ({ ...v, [cle]: e.target.value ? Number(e.target.value) : undefined })),
    };
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    try {
      const resultat = await setEntrepriseInfo(valeurs);
      setValeurs(resultat);
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className={containerClass}>
      <div>
        <h2 className="mb-1 text-[16px] font-extrabold text-white">Informations de l&apos;entreprise</h2>
        <p className="mb-3 text-[12.5px] text-white/60">
          Affichées sur les factures, les labels de colis, les emails et le site public.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className={labelClass}>Nom</Label>
            <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
              <InputGroupInput required {...champ("nom")} className={fieldClass} />
            </InputGroup>
          </div>
          <div>
            <Label className={labelClass}>Email support</Label>
            <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
              <InputGroupInput type="email" {...champ("emailSupport")} className={fieldClass} />
            </InputGroup>
          </div>
          <div className="sm:col-span-2">
            <Label className={labelClass}>Adresse</Label>
            <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
              <InputGroupInput required {...champ("adresse")} className={fieldClass} />
            </InputGroup>
          </div>
          <div>
            <Label className={labelClass}>Téléphone</Label>
            <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
              <InputGroupInput required {...champ("telephone")} className={fieldClass} />
            </InputGroup>
          </div>
          <div>
            <Label className={labelClass}>WhatsApp (chiffres seulement)</Label>
            <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
              <InputGroupInput required placeholder="50934043288" {...champ("whatsapp")} className={fieldClass} />
            </InputGroup>
          </div>
          <div className="sm:col-span-2">
            <Label className={labelClass}>Estimation delivery (jours)</Label>
            <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
              <InputGroupInput type="number" min={0} required {...champNumber("delaiLivraisonJours")} className={fieldClass} />
            </InputGroup>
          </div>
        </div>
      </div>
      <div>
        {saved && <p className="mt-2 text-[12.5px] font-semibold text-green-700">Enregistré.</p>}
        <Button
          type="submit"
          disabled={isSaving}
          className="mt-4 h-10 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-5 text-[13px] font-bold text-white shadow-none disabled:opacity-70"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

function TauxChangeSection() {
  const [valeur, setValeur] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getTauxChangeGdes().then((r) => setValeur(r.valeur ?? ""));
  }, []);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    try {
      await setTauxChangeGdes(Number(valeur));
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className={containerClass}>
      <div>
        <h2 className="mb-2 text-[16px] font-extrabold text-white">Taux de change USD → HTG</h2>
        <Label className={labelClass}>1 USD =</Label>
        <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
          <InputGroupInput type="number" step="0.01" value={valeur} onChange={(e) => setValeur(e.target.value)} className={fieldClass} />
        </InputGroup>
      </div>
      <div>
        {saved && <p className="mt-2 text-[12.5px] font-semibold text-green-700">Enregistré.</p>}
        <Button
          type="submit"
          disabled={isSaving}
          className="mt-4 h-10 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-5 text-[13px] font-bold text-white shadow-none disabled:opacity-70"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

function FacturePrefixeSection() {
  const [valeur, setValeur] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getFacturePrefixe().then((r) => setValeur(r.valeur ?? ""));
  }, []);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    try {
      await setFacturePrefixe(valeur);
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className={containerClass}>
      <div>
        <h2 className="mb-2 text-[16px] font-extrabold text-white">Préfixe des numéros de facture</h2>
        <Label className={labelClass}>Préfixe</Label>
        <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
          <InputGroupInput
            required
            placeholder="FAC"
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            className={fieldClass}
          />
        </InputGroup>
        <p className="mt-1.5 text-[12px] text-white/60">
          Exemple : {valeur || "FAC"}-2026-000123
        </p>
      </div>
      <div>
        {saved && <p className="mt-2 text-[12.5px] font-semibold text-green-700">Enregistré.</p>}
        <Button
          type="submit"
          disabled={isSaving}
          className="mt-4 h-10 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-5 text-[13px] font-bold text-white shadow-none disabled:opacity-70"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

const LIMITES_CHAMPS: { cle: keyof LimitesSysteme; label: string; hint: string }[] = [
  { cle: "maxPhotosParColis", label: "Photos maximum par colis", hint: "RG-SHP-10 — défaut : 5" },
  { cle: "maxTentativesLogin", label: "Tentatives de connexion avant verrouillage", hint: "défaut : 5" },
  { cle: "verrouillageMinutes", label: "Durée du verrouillage (minutes)", hint: "défaut : 15" },
  { cle: "codeValiditeMinutes", label: "Validité du code de vérification (minutes)", hint: "défaut : 10" },
  { cle: "resetValiditeMinutes", label: "Validité du lien de réinitialisation (minutes)", hint: "défaut : 30" },
];

function LimitesSection() {
  const [valeurs, setValeurs] = useState<LimitesSysteme | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getLimites().then(setValeurs);
  }, []);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valeurs) return;
    setIsSaving(true);
    setSaved(false);
    try {
      const resultat = await setLimites(valeurs);
      setValeurs(resultat);
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className={containerClass}>
      <div>
        <h2 className="mb-3 text-[16px] font-extrabold text-white">Seuils système</h2>
        {!valeurs ? (
          <Loader2 className="animate-spin text-brand-orange" size={20} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {LIMITES_CHAMPS.map(({ cle, label, hint }) => (
              <div key={cle}>
                <Label className={labelClass}>{label}</Label>
                <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                  <InputGroupInput
                    type="number"
                    min={1}
                    required
                    value={valeurs[cle]}
                    onChange={(e) =>
                      setValeurs((v) => (v ? { ...v, [cle]: Number(e.target.value) } : v))
                    }
                    className={fieldClass}
                  />
                </InputGroup>
                <p className="mt-1 text-[11.5px] text-white/60">{hint}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        {saved && <p className="mt-2 text-[12.5px] font-semibold text-green-700">Enregistré.</p>}
        <Button
          type="submit"
          disabled={isSaving || !valeurs}
          className="mt-4 h-10 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-5 text-[13px] font-bold text-white shadow-none disabled:opacity-70"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

const MODE_LABELS: Record<ModePaiement, string> = {
  ESPECES: "Espèces",
  ZELLE: "Zelle",
  AVOIR: "Avoir",
};

function MoyensPaiementSection() {
  const [moyens, setMoyens] = useState<MoyenPaiement[] | null>(null);
  const [label, setLabel] = useState("");
  const [numero, setNumero] = useState("");
  const [titulaire, setTitulaire] = useState("");
  const [mode, setMode] = useState<ModePaiement | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moyenToDelete, setMoyenToDelete] = useState<string | null>(null);

  useEffect(() => {
    listerMoyensPaiement().then(setMoyens);
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const moyen = await creerMoyenPaiement({
        label,
        numero,
        titulaire: titulaire || undefined,
        mode: mode || undefined,
      });
      setMoyens((prev) => (prev ? [...prev, moyen] : [moyen]));
      setLabel("");
      setNumero("");
      setTitulaire("");
      setMode("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActif(m: MoyenPaiement) {
    const updated = await modifierMoyenPaiement(m.id, { actif: !m.actif });
    setMoyens((prev) => prev?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
  }

  async function changeMode(m: MoyenPaiement, nouveauMode: ModePaiement | "") {
    const updated = await modifierMoyenPaiement(m.id, { mode: nouveauMode || null });
    setMoyens((prev) => prev?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
  }

  async function handleDeleteConfirm() {
    if (!moyenToDelete) return;
    await supprimerMoyenPaiement(moyenToDelete);
    setMoyens((prev) => prev?.filter((x) => x.id !== moyenToDelete) ?? null);
    setMoyenToDelete(null);
  }

  return (
    <div className={containerClass}>
      <div>
        <h2 className="mb-3 text-[16px] font-extrabold text-white">Moyens de paiement</h2>

        {!moyens ? (
          <Loader2 className="animate-spin text-brand-orange" size={20} />
        ) : (
          <ul className="mb-4 divide-y divide-white/10">
            {moyens.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-[13.5px]">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-white">{m.label}</p>
                    {m.mode && (
                      <span className="rounded-[5px] bg-brand-orange/15 px-1.5 py-0.5 text-[10px] font-bold text-brand-orange">
                        {MODE_LABELS[m.mode]}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-white/60">
                    {m.numero} {m.titulaire ? `· ${m.titulaire}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={m.mode ?? ""}
                    onChange={(e) => changeMode(m, e.target.value as ModePaiement | "")}
                    className="h-8 rounded-[6px] border border-white/10 bg-white/5 px-2 text-[11.5px] text-white"
                  >
                    <option value="" className="text-black">
                      Informatif seulement
                    </option>
                    {(Object.keys(MODE_LABELS) as ModePaiement[]).map((mp) => (
                      <option key={mp} value={mp} className="text-black">
                        {MODE_LABELS[mp]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => toggleActif(m)}
                    className={`rounded-[6px] px-2.5 py-1 text-[11.5px] font-bold transition-colors ${
                      m.actif ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                  >
                    {m.actif ? "Actif" : "Inactif"}
                  </button>
                  <button onClick={() => setMoyenToDelete(m.id)} className="text-red-600 hover:text-red-800 p-1" aria-label="Supprimer">
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
            {moyens.length === 0 && <p className="py-2 text-[13.5px] text-white/60">Aucun moyen de paiement.</p>}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-5">
          <div>
            <Label className={labelClass}>Libellé</Label>
            <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
              <InputGroupInput required placeholder="Zelle" value={label} onChange={(e) => setLabel(e.target.value)} className={fieldClass} />
            </InputGroup>
          </div>
          <div>
            <Label className={labelClass}>Numéro</Label>
            <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
              <InputGroupInput required value={numero} onChange={(e) => setNumero(e.target.value)} className={fieldClass} />
            </InputGroup>
          </div>
          <div>
            <Label className={labelClass}>Titulaire</Label>
            <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
              <InputGroupInput value={titulaire} onChange={(e) => setTitulaire(e.target.value)} className={fieldClass} />
            </InputGroup>
          </div>
          <div>
            <Label className={labelClass}>Mode réel</Label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as ModePaiement | "")}
              className={fieldClass}
            >
              <option value="" className="text-black">
                Informatif seulement
              </option>
              {(Object.keys(MODE_LABELS) as ModePaiement[]).map((mp) => (
                <option key={mp} value={mp} className="text-black">
                  {MODE_LABELS[mp]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="!h-10 w-full rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark text-[13px] font-bold text-white shadow-none disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <span className="flex items-center justify-center gap-1.5"><Plus size={14} /> Ajouter</span>}
            </Button>
          </div>
        </form>
        {error && <p className="mt-2 text-[12.5px] font-semibold text-red-600">{error}</p>}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!moyenToDelete} onOpenChange={(open) => !open && setMoyenToDelete(null)}>
        <DialogContent className="bg-[#141b6e] border border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Supprimer ce moyen de paiement ?</DialogTitle>
            <DialogDescription className="text-white/70">
              Cette action est irréversible et retirera ce moyen de paiement des options disponibles.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setMoyenToDelete(null)} className="text-white hover:bg-white/10">
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-none">
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ParametresPage() {
  return (
    <div className="space-y-5">
      <PageHeader>
        <h1 className="text-2xl font-extrabold text-white">Paramètres</h1>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-2 items-start">
        <div className="space-y-5">
          <EntrepriseSection />
          <MoyensPaiementSection />
        </div>
        <div className="space-y-5">
          <LogoSection />
          <div className="grid gap-5 sm:grid-cols-2">
            <TauxChangeSection />
            <FacturePrefixeSection />
          </div>
          <LimitesSection />
        </div>
      </div>
    </div>
  );
}
