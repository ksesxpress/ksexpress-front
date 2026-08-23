"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createColis } from "@/lib/api/colis";
import { getPricingCategories } from "@/lib/api/tarification";
import type { Client, Colis } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { ClientPicker } from "@/components/app-shell/ClientPicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const fieldClass = "h-11 rounded-[10px] border border-white/10 bg-white/5 text-white placeholder:text-white/40 ";
const labelClass = "mb-1.5 block text-[12.5px] font-bold text-white/80 ";

export function CreatePackageDialog({
  open,
  onOpenChange,
  onSuccess,
  allowUnmatched,
  defaultTracking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (colis: Colis) => void;
  allowUnmatched?: boolean;
  defaultTracking?: string;
}) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [tracking, setTracking] = useState(defaultTracking ?? "");
  const [poidsLb, setPoidsLb] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [categorie, setCategorie] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [valeurDeclaree, setValeurDeclaree] = useState("");
  const [description, setDescription] = useState("");
  const [rayon, setRayon] = useState("");
  const [marchand, setMarchand] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync defaultTracking when it changes
  useEffect(() => {
    if (defaultTracking !== undefined) {
      setTracking(defaultTracking);
    }
  }, [defaultTracking]);

  // Load categories when the dialog opens
  useEffect(() => {
    if (open && categories.length === 0) {
      getPricingCategories()
        .then((noms) => setCategories(noms))
        .catch(() => setCategories([]));
    }
  }, [open, categories.length]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setClient(null);
      setTracking(defaultTracking ?? "");
      setPoidsLb("");
      setDimensions("");
      setCategorie("");
      setValeurDeclaree("");
      setDescription("");
      setRayon("");
      setMarchand("");
      setError(null);
    }
  }, [open, defaultTracking]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!client && !allowUnmatched) {
      setError("Sélectionnez un client propriétaire du colis.");
      return;
    }
    if (!tracking.trim()) {
      setError("Le tracking est obligatoire (plusieurs colis peuvent partager le même).");
      return;
    }
    if (!categorie) {
      setError("La catégorie est obligatoire.");
      return;
    }
    setIsSubmitting(true);
    try {
      const colis = await createColis({
        clientId: client?.id,
        tracking: tracking || undefined,
        poidsLb: poidsLb ? Number(poidsLb) : undefined,
        dimensions: dimensions || undefined,
        categorie: categorie || undefined,
        valeurDeclaree: valeurDeclaree ? Number(valeurDeclaree) : undefined,
        description: description || undefined,
        rayon: rayon || undefined,
        marchand: marchand || undefined,
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess(colis);
      } else {
        router.push(`/staff/packages/${colis.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Nouveau colis</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau colis en remplissant les informations ci-dessous.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {!allowUnmatched && (
            <div>
              <Label className={labelClass}>Client</Label>
              <ClientPicker value={client} onChange={setClient} />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className={labelClass}>Tracking</Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput required value={tracking} onChange={(e) => setTracking(e.target.value)} />
              </InputGroup>
            </div>
            <div>
              <Label className={labelClass}>Poids (lb) — optionnel</Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput
                  type="number"
                  step="0.01"
                  value={poidsLb}
                  onChange={(e) => setPoidsLb(e.target.value)}
                />
              </InputGroup>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className={labelClass}>Dimensions — optionnel</Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput
                  placeholder="30x20x15 cm"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                />
              </InputGroup>
            </div>
            <div>
              <Label className={labelClass}>Catégorie <span className="text-red-500">*</span></Label>
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                className={`w-full px-3 text-[13.5px] outline-none focus-visible:ring-1 focus-visible:ring-brand-orange ${fieldClass}`}
              >
                <option value="" className="bg-brand-dark text-white">— Choisir —</option>
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-brand-dark text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className={labelClass}>Valeur déclarée (USD) — optionnel</Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput
                  type="number"
                  step="0.01"
                  value={valeurDeclaree}
                  onChange={(e) => setValeurDeclaree(e.target.value)}
                />
              </InputGroup>
            </div>
            <div>
              <Label className={labelClass}>Marchand — optionnel</Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput
                  placeholder="Amazon"
                  value={marchand}
                  onChange={(e) => setMarchand(e.target.value)}
                />
              </InputGroup>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className={labelClass}>Emplacement (rayon) — optionnel</Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput value={rayon} onChange={(e) => setRayon(e.target.value)} />
              </InputGroup>
            </div>
            <div>
              <Label className={labelClass}>Description — optionnel</Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput value={description} onChange={(e) => setDescription(e.target.value)} />
              </InputGroup>
            </div>
          </div>

          {error && <p className="text-[13px] font-semibold text-red-600">{error}</p>}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-[8px] px-6 hover:bg-white/5 hover:text-white"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-6 text-[14px] font-bold text-white hover:opacity-90 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Ajouter le colis"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
