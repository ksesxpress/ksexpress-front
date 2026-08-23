"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { getMe, updateMe } from "@/lib/api/clients";
import type { CanalNotification, Client } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { PageHeader } from "@/components/app-shell/PageHeader";

const fieldClass = "!h-10 w-full rounded-[8px] border-[1.5px] border-white/20 bg-white/80 backdrop-blur-xl px-3 text-[13.5px] text-brand-dark shadow-none";
const labelClass = "mb-1 block text-[12.5px] font-bold text-brand-dark";

const CANAUX: { value: CanalNotification; label: string }[] = [
  { value: "EMAIL", label: "Email" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "LES_DEUX", label: "Les deux" },
];

export default function PortailParametresPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [adresse, setAdresse] = useState("");
  const [canal, setCanal] = useState<CanalNotification>("EMAIL");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getMe().then((c) => {
      setClient(c);
      setNom(c.nom);
      setPrenom(c.prenom ?? "");
      setTelephone(c.telephone ?? "");
      setEmail(c.email ?? "");
      setAdresse(c.adresse ?? "");
      setCanal(c.canalNotificationPrefere);
    });
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);
    try {
      const updated = await updateMe({
        nom,
        prenom: prenom || undefined,
        telephone: telephone || undefined,
        email: email || undefined,
        adresse: adresse || undefined,
        canalNotificationPrefere: canal,
      });
      setClient(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!client) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-brand-orange" size={28} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader>
        <h1 className="text-2xl font-extrabold text-white">Mes préférences</h1>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[10px] border border-white/20 bg-white/80 backdrop-blur-xl p-5 shadow-none text-brand-dark">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className={labelClass}>Prénom</Label>
            <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
              <InputGroupInput value={prenom} onChange={(e) => setPrenom(e.target.value)} className={fieldClass} />
            </InputGroup>
          </div>
          <div>
            <Label className={labelClass}>Nom *</Label>
            <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
              <InputGroupInput required value={nom} onChange={(e) => setNom(e.target.value)} className={fieldClass} />
            </InputGroup>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className={labelClass}>Email</Label>
            <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
              <InputGroupInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
              />
            </InputGroup>
          </div>
          <div>
            <Label className={labelClass}>Téléphone</Label>
            <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
              <InputGroupInput value={telephone} onChange={(e) => setTelephone(e.target.value)} className={fieldClass} />
            </InputGroup>
          </div>
        </div>

        <div>
          <Label className={labelClass}>Adresse</Label>
          <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
            <InputGroupInput value={adresse} onChange={(e) => setAdresse(e.target.value)} className={fieldClass} />
          </InputGroup>
        </div>

        <div>
          <Label className={labelClass}>Canal de notification préféré</Label>
          <div className="flex gap-2">
            {CANAUX.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCanal(c.value)}
                className={`rounded-[8px] border px-4 py-2 text-[13px] font-bold transition-colors ${
                  canal === c.value
                    ? "border-brand-orange bg-brand-orange/20 text-brand-orange-text"
                    : "border-white/40 bg-white/60 text-brand-dark hover:bg-white"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-[13px] font-semibold text-red-600 bg-red-50 p-2.5 rounded-[8px]">{error}</p>}
        {success && (
          <p className="text-[13px] font-semibold text-green-700 bg-green-50 p-2.5 rounded-[8px]">
            Vos informations ont été mises à jour.
          </p>
        )}

        <Button
          type="submit"
          disabled={isSaving}
          className="h-10 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-6 text-[13px] font-bold text-white shadow-none disabled:opacity-70 mt-2"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Enregistrer"}
        </Button>
      </form>
    </div>
  );
}
