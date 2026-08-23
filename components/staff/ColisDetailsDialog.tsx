"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Colis } from "@/lib/api/types";
import { formatDate, formatMoney, formatWeight } from "@/lib/format";
import { ColisStatusBadge, FactureStatusBadge } from "@/components/app-shell/StatusBadge";
import { Package, Calendar, Tag, Weight, Store, Box, DollarSign, FileText, Image as ImageIcon, CreditCard } from "lucide-react";

interface ColisDetailsDialogProps {
  colis: Colis | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ColisDetailsDialog({ colis, open, onOpenChange }: ColisDetailsDialogProps) {
  if (!colis) return null;

  const facture = colis.factureLigne?.facture;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="border-b border-gray-200/60 pb-3">
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Package className="text-brand-orange" size={20} />
              {colis.tracking ?? "Colis sans tracking"}
            </DialogTitle>
            <ColisStatusBadge statut={colis.statut} />
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-[13.5px]">
          {/* Section Statut de paiement */}
          <div className="rounded-[8px] bg-slate-50 p-3.5 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-brand-grey text-[11.5px] font-bold uppercase">
                <CreditCard size={15} className="text-brand-orange" />
                Statut de paiement
              </div>
              {facture ? (
                <FactureStatusBadge statut={facture.statut} />
              ) : (
                <span className="rounded-[6px] bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-bold">
                  En attente de facturation
                </span>
              )}
            </div>
            {facture ? (
              <div className="flex items-center justify-between text-[13px] pt-1.5 border-t border-slate-200">
                <span className="font-semibold">Facture {facture.numero}</span>
                <span className="font-bold">
                  {formatMoney(facture.montantPaye)} / {formatMoney(facture.total)}
                </span>
              </div>
            ) : (
              <p className="text-[12.5px] text-brand-grey">Aucune facture associée à ce colis pour le moment.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[8px] bg-slate-50 p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 text-brand-grey text-[11.5px] font-bold uppercase mb-1">
                <Tag size={14} className="text-brand-orange" />
                Catégorie
              </div>
              <p className="font-semibold">{colis.categorie ?? "Non spécifiée"}</p>
            </div>

            <div className="rounded-[8px] bg-slate-50 p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 text-brand-grey text-[11.5px] font-bold uppercase mb-1">
                <Weight size={14} className="text-brand-orange" />
                Poids
              </div>
              <p className="font-semibold">{colis.poidsLb ? formatWeight(colis.poidsLb) : "—"}</p>
            </div>

            <div className="rounded-[8px] bg-slate-50 p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 text-brand-grey text-[11.5px] font-bold uppercase mb-1">
                <Store size={14} className="text-brand-orange" />
                Marchand
              </div>
              <p className="font-semibold">{colis.marchand ?? "—"}</p>
            </div>

            <div className="rounded-[8px] bg-slate-50 p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 text-brand-grey text-[11.5px] font-bold uppercase mb-1">
                <Box size={14} className="text-brand-orange" />
                Lot / Expédition
              </div>
              <p className="font-semibold">{colis.lot?.reference ?? "Non assigné"}</p>
            </div>

            {colis.dimensions && (
              <div className="rounded-[8px] bg-slate-50 p-3 border border-slate-100">
                <div className="flex items-center gap-1.5 text-brand-grey text-[11.5px] font-bold uppercase mb-1">
                  <Box size={14} className="text-brand-orange" />
                  Dimensions
                </div>
                <p className="font-semibold">{colis.dimensions}</p>
              </div>
            )}

            {colis.valeurDeclaree && (
              <div className="rounded-[8px] bg-slate-50 p-3 border border-slate-100">
                <div className="flex items-center gap-1.5 text-brand-grey text-[11.5px] font-bold uppercase mb-1">
                  <DollarSign size={14} className="text-brand-orange" />
                  Valeur déclarée
                </div>
                <p className="font-semibold">{formatMoney(colis.valeurDeclaree)}</p>
              </div>
            )}

            <div className="rounded-[8px] bg-slate-50 p-3 border border-slate-100 col-span-2">
              <div className="flex items-center gap-1.5 text-brand-grey text-[11.5px] font-bold uppercase mb-1">
                <Calendar size={14} className="text-brand-orange" />
                Reçu en entrepôt le
              </div>
              <p className="font-semibold">{formatDate(colis.createdAt)}</p>
            </div>
          </div>

          {colis.description && (
            <div className="rounded-[8px] bg-slate-50 p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 text-brand-grey text-[11.5px] font-bold uppercase mb-1">
                <FileText size={14} className="text-brand-orange" />
                Description
              </div>
              <p className="whitespace-pre-line">{colis.description}</p>
            </div>
          )}

          {colis.photos && colis.photos.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-brand-grey text-[11.5px] font-bold uppercase">
                <ImageIcon size={14} className="text-brand-orange" />
                Photos du colis ({colis.photos.length})
              </div>
              <div className="flex gap-2 overflow-x-auto py-1">
                {colis.photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="h-20 w-20 rounded-[8px] object-cover border border-gray-200 hover:opacity-90 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
