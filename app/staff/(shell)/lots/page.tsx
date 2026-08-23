"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import { createLot, searchLots } from "@/lib/api/lots";
import type { Lot, TypeLotExpedition } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { extractItems, extractTotal, formatDate, formatWeight } from "@/lib/format";
import { ColisStatusBadge } from "@/components/app-shell/StatusBadge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { NumberedPagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";

const fieldClass = "!h-10 w-full rounded-[8px] border-[1.5px] border-white/20 bg-white/80 backdrop-blur-xl px-3 text-[13.5px] shadow-none";
const labelClass = "mb-1 block text-[12px] font-bold text-white";
const TAILLE = 50;

function poidsTotalLot(l: Lot): number {
  return (l.colis ?? []).reduce((sum, c) => sum + (c.poidsLb ? Number(c.poidsLb) : 0), 0);
}

function categoriesLot(l: Lot): string[] {
  return Array.from(new Set((l.colis ?? []).map((c) => c.categorie).filter(Boolean))) as string[];
}

function CreateLotForm({ onCreated }: { onCreated: (lot: Lot) => void }) {
  const [reference, setReference] = useState("");
  const [type, setType] = useState<TypeLotExpedition>("AVION");
  const [dateDepart, setDateDepart] = useState("");
  const [dateArrivee, setDateArrivee] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const lot = await createLot({
        reference,
        type,
        dateDepart: dateDepart || undefined,
        dateArrivee: dateArrivee || undefined,
      });
      onCreated(lot);
      setReference("");
      setDateDepart("");
      setDateArrivee("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-[10px] border border-white/20 bg-white/10 backdrop-blur-xl p-5 sm:grid-cols-4"
    >
      <div>
        <Label className={labelClass}>Référence</Label>
        <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
          <InputGroupInput
            required
            placeholder="LOT-2026-08-001"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className={fieldClass}
          />
        </InputGroup>
      </div>
      <div>
        <Label className={labelClass}>Type</Label>
        <Select
          value={type}
          onValueChange={(val) => setType(val as TypeLotExpedition)}
        >
          <SelectTrigger className={fieldClass + " w-full"}>
            <SelectValue placeholder="Sélectionner" />
          </SelectTrigger>
          <SelectContent className="bg-white/80 backdrop-blur-xl border-white/40">
            <SelectItem value="AVION">Avion</SelectItem>
            <SelectItem value="BATEAU">Bateau</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className={labelClass}>Date de départ</Label>
        <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
          <InputGroupInput type="date" value={dateDepart} onChange={(e) => setDateDepart(e.target.value)} className={fieldClass} />
        </InputGroup>
      </div>
      <div>
        <Label className={labelClass}>Date d&apos;arrivée</Label>
        <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
          <InputGroupInput type="date" value={dateArrivee} onChange={(e) => setDateArrivee(e.target.value)} className={fieldClass} />
        </InputGroup>
      </div>
      {error && <p className="sm:col-span-4 text-[12.5px] font-semibold text-red-400">{error}</p>}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-10 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-5 text-[13px] font-bold text-white sm:col-span-4 sm:w-fit disabled:opacity-70 mt-1"
      >
        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (
          <span className="flex items-center gap-1.5"><Plus size={14} /> Créer le lot</span>
        )}
      </Button>
    </form>
  );
}

export default function LotsPage() {
  const [lots, setLots] = useState<Lot[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    searchLots({ page, taille: TAILLE })
      .then((res) => {
        setLots(extractItems(res));
        setTotal(extractTotal(res));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de charger les lots."));
  }, [page]);

  return (
    <div className="space-y-5">
      <PageHeader>
        <h1 className="text-2xl font-extrabold text-white">Lots d&apos;expédition</h1>
      </PageHeader>

      <CreateLotForm onCreated={(lot) => setLots((prev) => (prev ? [lot, ...prev] : [lot]))} />

      {error && <p className="text-[14px] font-semibold text-red-400">{error}</p>}

      {!lots ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-orange" size={28} />
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-center">Colis</TableHead>
                  <TableHead>Poids total</TableHead>
                  <TableHead>Catégories</TableHead>
                  <TableHead>Départ</TableHead>
                  <TableHead>Arrivée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-brand-grey py-10">
                      Aucun lot pour l'instant.
                    </TableCell>
                  </TableRow>
                ) : (
                  lots.map((lot) => {
                    const categories = categoriesLot(lot);
                    return (
                      <TableRow key={lot.id} className="cursor-pointer hover:bg-white/5 transition-colors" onClick={() => router.push(`/staff/lots/${lot.id}`)}>
                        <TableCell>
                          <span className="font-semibold text-brand-orange">
                            {lot.reference}
                          </span>
                        </TableCell>
                        <TableCell>{lot.type === "AVION" ? "Avion" : "Bateau"}</TableCell>
                        <TableCell>
                          <ColisStatusBadge statut={lot.statut} />
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {lot._count?.colis ?? (lot.colis ?? []).length}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatWeight(poidsTotalLot(lot))}
                        </TableCell>
                        <TableCell>
                          {categories.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {categories.map((cat) => (
                                <span
                                  key={cat}
                                  className="inline-block rounded-[6px] bg-white/10 px-2 py-0.5 text-[11px] font-semibold border border-white/20"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{formatDate(lot.dateDepart) || "—"}</TableCell>
                        <TableCell>{formatDate(lot.dateArrivee) || "—"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="shrink-0 pt-4">
            <NumberedPagination
              page={page}
              totalPages={total !== null ? Math.max(1, Math.ceil(total / TAILLE)) : page}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
