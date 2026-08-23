"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/api/clients";
import type { Client } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

const fieldClass = "!h-10 w-full rounded-[8px] border-[1.5px] border-[#eadfcf] shadow-none px-3 text-[13.5px]";
const labelClass = "mb-1 block text-[12.5px] font-bold ";

export function CreateClientDialog({
  open,
  onOpenChange,
  onCreated,
  showEmail = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (client: Client) => void;
  // Faux pour la création rapide côté boutique (POS) : ces clients n'ont
  // jamais d'email, seulement un téléphone — voir PosClientCombobox, qui
  // n'affiche que les clients sans email (les clients avec email sont
  // considérés côté shipping).
  showEmail?: boolean;
}) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [adresse, setAdresse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setNom("");
      setPrenom("");
      setTelephone("");
      setEmail("");
      setAdresse("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const client = await createClient({
        nom,
        prenom: prenom || undefined,
        telephone: telephone || undefined,
        email: email || undefined,
        adresse: adresse || undefined,
      });
      onCreated(client);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-extrabold">
            Nouveau client
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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

          <div className={showEmail ? "grid gap-4 sm:grid-cols-2" : ""}>
            <div>
              <Label className={labelClass}>Téléphone</Label>
              <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                <InputGroupInput value={telephone} onChange={(e) => setTelephone(e.target.value)} className={fieldClass} />
              </InputGroup>
            </div>
            {showEmail && (
              <div>
                <Label className={labelClass}>Email</Label>
                <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                  <InputGroupInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
                </InputGroup>
              </div>
            )}
          </div>

          <div>
            <Label className={labelClass}>Adresse</Label>
            <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
              <InputGroupInput value={adresse} onChange={(e) => setAdresse(e.target.value)} className={fieldClass} />
            </InputGroup>
          </div>

          {error && <p className="text-[13px] font-semibold text-red-600 bg-red-50 p-2.5 rounded-[8px]">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 mt-4 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark text-[14px] font-bold text-white shadow-md hover:opacity-90 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Créer le client"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
