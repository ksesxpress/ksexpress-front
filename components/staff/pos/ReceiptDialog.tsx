"use client";

import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { formatMoney, formatDateTime } from "@/lib/format";
import { getVentePdfUrl, type Vente } from "@/lib/api/ventes";

// Reçu PDF généré côté serveur — même modèle que la facturation shipping
// (voir VentePdfService, qui reprend le design de FacturePdfService : même
// en-tête/logo, mêmes deux formats). Le résumé affiché ici n'est qu'un
// aperçu rapide ; le document réellement imprimé est le PDF téléchargé.
export function ReceiptDialog({
  vente,
  open,
  onOpenChange,
  succursaleNom,
}: {
  vente: Vente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  succursaleNom?: string | null;
}) {
  async function handlePrint(format: "a4" | "pos80") {
    if (!vente) return;
    const blob = await apiFetch<Blob>(getVentePdfUrl(vente.id, format));
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-white/15 bg-white/10 backdrop-blur-2xl">
        {vente && (
          <>
            <DialogHeader>
              <DialogTitle>Reçu {vente.numero}</DialogTitle>
              <DialogDescription>Vente encaissée — {formatDateTime(vente.createdAt)}</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="text-center">
                <p className="text-[15px] font-extrabold text-white">{succursaleNom ?? "KS Express"}</p>
                <p className="mt-0.5 text-[11px] text-white/60">{formatDateTime(vente.createdAt)}</p>
                <p className="font-mono text-[11px] text-white/60">{vente.numero}</p>
              </div>

              <div className="text-[12.5px] text-white/70">
                Client :{" "}
                {vente.client ? `${vente.client.prenom ?? ""} ${vente.client.nom}`.trim() : "Walk-in Customer"}
              </div>

              <div className="divide-y divide-white/10 border-y border-white/10 py-1">
                {vente.lignes.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-2 py-1 text-[12.5px] text-white">
                    <span className="min-w-0 flex-1 truncate">
                      {l.quantite} × {l.produit?.nom ?? "Produit"}
                    </span>
                    <span className="shrink-0 font-semibold">{formatMoney(l.sousTotal)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[12.5px] text-white/80">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{formatMoney(vente.sousTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rabais</span>
                  <span>-{formatMoney(vente.remise)}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-1 text-[14px] font-extrabold text-white">
                  <span>Total</span>
                  <span>{formatMoney(vente.total)}</span>
                </div>
              </div>

              <div className="space-y-1 text-[12px] text-white/60">
                {vente.paiements.map((p) => (
                  <div key={p.id} className="flex justify-between">
                    <span>{p.mode}</span>
                    <span>{formatMoney(p.montant)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-1 grid grid-cols-2 gap-2">
              <Button
                onClick={() => handlePrint("a4")}
                variant="outline"
                className="gap-2 font-bold"
              >
                <Printer className="h-4 w-4" />
                Format A4
              </Button>
              <Button
                onClick={() => handlePrint("pos80")}
                className="gap-2 bg-brand-orange font-bold text-white hover:bg-brand-orange/90"
              >
                <Printer className="h-4 w-4" />
                Reçu POS (80mm)
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
