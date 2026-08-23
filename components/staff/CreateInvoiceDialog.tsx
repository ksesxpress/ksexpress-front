import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calculator } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createFacture, previewFacture, type FacturePreview } from "@/lib/api/factures";
import { getClientResume } from "@/lib/api/clients";
import type { Client, Colis } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { ClientPicker } from "@/components/app-shell/ClientPicker";
import { ColisStatusBadge } from "@/components/app-shell/StatusBadge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { formatMoney, formatWeight } from "@/lib/format";

const fieldClass = "h-11 w-full rounded-[8px] border-[1.5px] border-white/10 bg-white/5 shadow-none px-3 text-[13.5px]";
const labelClass = "mb-1.5 block text-[12.5px] font-bold text-white/90";

export function CreateInvoiceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [readyColis, setReadyColis] = useState<Colis[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fraisSupplementaires, setFraisSupplementaires] = useState("");
  const [fraisSupplementairesLabel, setFraisSupplementairesLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [preview, setPreview] = useState<FacturePreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setClient(null);
      setReadyColis(null);
      setSelected(new Set());
      setFraisSupplementaires("");
      setFraisSupplementairesLabel("");
      setPreview(null);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!client) return;
    getClientResume(client.id)
      .then((r) =>
        setReadyColis(
          r.colis.filter((c) => c.statut === "READY_PICKUP" && !c.factureLigne),
        ),
      )
      .catch(() => setReadyColis([]));
  }, [client]);

  useEffect(() => {
    if (!client || selected.size === 0) {
      setPreview(null);
      return;
    }
    setIsPreviewLoading(true);
    previewFacture({
      clientId: client.id,
      colisIds: Array.from(selected),
      fraisSupplementaires: fraisSupplementaires ? Number(fraisSupplementaires) : undefined,
    })
      .then(setPreview)
      .catch(() => setPreview(null))
      .finally(() => setIsPreviewLoading(false));
  }, [client, selected, fraisSupplementaires]);

  function handleClientChange(next: Client | null) {
    setClient(next);
    setReadyColis(null);
    setSelected(new Set());
    setPreview(null);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Direct calculation preview fallback
  const selectedColisObjects = (readyColis ?? []).filter((c) => selected.has(c.id));
  const totalPoidsFacture = selectedColisObjects.reduce(
    (acc, c) => acc + (c.poidsLb ? Math.ceil(Number(c.poidsLb)) : 0),
    0,
  );
  const extraFee = fraisSupplementaires ? Number(fraisSupplementaires) : 0;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!client) {
      setError("Sélectionnez un client.");
      return;
    }
    if (selected.size === 0) {
      setError("Sélectionnez au moins un colis Prêt pour retrait non facturé.");
      return;
    }
    setIsSubmitting(true);
    try {
      const facture = await createFacture({
        clientId: client.id,
        colisIds: Array.from(selected),
        fraisSupplementaires: extraFee || undefined,
        fraisSupplementairesLabel: fraisSupplementairesLabel || undefined,
      });
      onOpenChange(false);
      router.push(`/staff/invoices/${facture.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-extrabold flex items-center gap-2">
            <Calculator className="text-brand-orange" size={22} />
            Nouvelle facture
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label className={labelClass}>Client</Label>
            <ClientPicker value={client} onChange={handleClientChange} />
          </div>

          {client && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className={labelClass.replace("mb-1.5", "")}>
                  Colis non facturés prêts pour retrait ({selected.size} sélectionné{selected.size > 1 ? "s" : ""})
                </Label>
                {readyColis && readyColis.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selected.size === readyColis.length) {
                        setSelected(new Set());
                      } else {
                        setSelected(new Set(readyColis.map((c) => c.id)));
                      }
                    }}
                    className="text-[12px] font-bold text-brand-orange-text hover:underline"
                  >
                    {selected.size === readyColis.length ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                )}
              </div>

              {!readyColis ? (
                <div className="flex justify-center p-4 border border-white/10 rounded-[10px] bg-white/5">
                  <Loader2 className="animate-spin text-brand-orange" size={20} />
                </div>
              ) : readyColis.length === 0 ? (
                <div className="p-4 border border-white/10 rounded-[10px] bg-white/5">
                  <p className="text-[13px] text-brand-grey text-center font-medium">
                    Ce client n&apos;a aucun colis « Prêt pour retrait » disponible à facturer.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-white/10 rounded-[10px] border border-white/10 max-h-52 overflow-y-auto">
                  {readyColis.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggle(c.id)}
                        className="h-4 w-4 rounded-[4px] border-white/10 text-brand-orange focus:ring-brand-orange cursor-pointer"
                      />
                      <div
                        className="flex-1 flex items-center justify-between gap-2 cursor-pointer select-none"
                        onClick={() => toggle(c.id)}
                      >
                        <div>
                          <p className="text-[13.5px] font-bold">
                            {c.tracking ?? "(sans tracking)"}
                          </p>
                          <p className="text-[12px] text-brand-grey">
                            {c.categorie ?? "Colis"} · {formatWeight(c.poidsLb)}
                          </p>
                        </div>
                        <ColisStatusBadge statut={c.statut} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className={labelClass}>Frais supplémentaires (USD)</Label>
              <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                <InputGroupInput
                  type="number"
                  step="0.01"
                  value={fraisSupplementaires}
                  onChange={(e) => setFraisSupplementaires(e.target.value)}
                  className={fieldClass}
                  placeholder="0.00"
                />
              </InputGroup>
            </div>
            <div>
              <Label className={labelClass}>Libellé du frais</Label>
              <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
                <InputGroupInput
                  placeholder="Assurance, douane..."
                  value={fraisSupplementairesLabel}
                  onChange={(e) => setFraisSupplementairesLabel(e.target.value)}
                  className={fieldClass}
                />
              </InputGroup>
            </div>
          </div>

          {/* Direct live calculation & total summary box inside the dialog */}
          {client && selected.size > 0 && (
            <div className="rounded-[10px] border border-brand-orange/50 bg-gradient-to-br from-brand-orange/10 to-brand-orange/5 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-extrabold uppercase tracking-wide text-brand-orange-text">
                  Aperçu du calcul en direct
                </p>
                {isPreviewLoading && <Loader2 className="animate-spin text-brand-orange" size={14} />}
              </div>
              <div className="flex justify-between items-center text-[13.5px]">
                <span>Colis sélectionnés :</span>
                <span className="font-bold">{selected.size} colis</span>
              </div>
              <div className="flex justify-between items-center text-[13.5px]">
                <span>Poids total facturé :</span>
                <span className="font-bold">{preview ? `${preview.poidsTotal} lb` : `${totalPoidsFacture} lb`}</span>
              </div>
              {preview && (
                <div className="flex justify-between items-center text-[13.5px]">
                  <span>Frais d&apos;expédition (colis) :</span>
                  <span className="font-bold">{formatMoney(preview.totalColis)}</span>
                </div>
              )}
              {extraFee > 0 && (
                <div className="flex justify-between items-center text-[13.5px]">
                  <span>{fraisSupplementairesLabel || "Frais supplémentaires"} :</span>
                  <span className="font-bold text-amber-700">+{formatMoney(extraFee)}</span>
                </div>
              )}

              <div className="border-t border-brand-orange/20 pt-2 flex justify-between items-center text-[15px] font-extrabold">
                <span>TOTAL ESTIMÉ :</span>
                <span className="text-[18px] text-green-700">
                  {preview ? formatMoney(preview.total) : "Calcul en cours..."}
                </span>
              </div>
            </div>
          )}

          {error && <p className="text-[13px] font-semibold text-red-600 bg-red-50 p-2.5 rounded-[8px]">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting || selected.size === 0}
            className="w-full h-11 mt-4 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark text-[14px] font-bold text-white shadow-md hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              `Générer la facture (${selected.size} colis · ${preview ? formatMoney(preview.total) : `${totalPoidsFacture} lb`})`
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
