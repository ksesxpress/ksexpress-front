"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { getNonIdentifies, attachColis } from "@/lib/api/colis";
import type { Colis, Client } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { extractItems, extractTotal, formatWeight } from "@/lib/format";
import { ColisStatusBadge } from "@/components/app-shell/StatusBadge";
import { ClientPicker } from "@/components/app-shell/ClientPicker";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { NumberedPagination } from "@/components/ui/pagination";
import { CreatePackageDialog } from "@/components/staff/CreatePackageDialog";

function AttachRow({ colis, onAttached }: { colis: Colis; onAttached: (id: string) => void }) {
  const [client, setClient] = useState<Client | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAttach() {
    if (!client) return;
    setIsSaving(true);
    setError(null);
    try {
      await attachColis(colis.id, client.id);
      onAttached(colis.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de rattacher ce colis.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <TableRow className="border-b border-white/10 hover:bg-white/5">
      <TableCell className="px-4 py-3">
        <Link
          href={`/staff/packages/${colis.id}`}
          className="font-bold text-brand-orange hover:underline"
        >
          {colis.tracking ?? "(sans tracking)"}
        </Link>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-bold text-white">{colis.nomDestinataireBrut || "Non précisé"}</span>
          {colis.codeKseSource && (
            <span className="text-[11.5px] font-semibold text-white/50">KSE: {colis.codeKseSource}</span>
          )}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <ColisStatusBadge statut={colis.statut} />
      </TableCell>
      <TableCell className="px-4 py-3 font-medium">{colis.categorie ?? "—"}</TableCell>
      <TableCell className="px-4 py-3 font-medium">{formatWeight(colis.poidsLb)}</TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex flex-col gap-1 min-w-[220px]">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ClientPicker value={client} onChange={setClient} />
            </div>
            <Button
              onClick={handleAttach}
              disabled={!client || isSaving}
              className="h-10 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-4 text-[12px] font-bold text-white shadow-none disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Rattacher"}
            </Button>
          </div>
          {error && <p className="text-[11px] font-semibold text-red-600">{error}</p>}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function ColisNonIdentifiesPage() {
  const [colis, setColis] = useState<Colis[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [page, setPage] = useState(1);
  const TAILLE = 20;

  function load() {
    getNonIdentifies({ page, taille: TAILLE })
      .then((res) => {
        setColis(extractItems(res));
        setTotal(extractTotal(res));
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Impossible de charger la file."),
      );
  }

  useEffect(load, [page]);

  return (
    <div className="space-y-5">
      <PageHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Colis non identifiés</h1>
            <p className="text-[13.5px] text-white/70">
              Colis sans propriétaire connu — à rattacher manuellement au bon client.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-4 py-2 text-[13px] font-bold text-white hover:opacity-90 shadow-none"
          >
            <Plus size={16} />
            Ajouter un colis
          </button>
        </div>
      </PageHeader>

      {error && <p className="text-[14px] font-semibold text-red-400">{error}</p>}

      {!colis ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-orange" size={28} />
        </div>
      ) : (
        <div className="flex flex-col">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/10 text-[12px] uppercase tracking-wide text-white/50 hover:bg-transparent">
                <TableHead className="sticky top-0 z-10 bg-transparent px-4 py-3 text-white/50">Tracking</TableHead>
                <TableHead className="sticky top-0 z-10 bg-transparent px-4 py-3 text-white/50">Destinataire indiqué</TableHead>
                <TableHead className="sticky top-0 z-10 bg-transparent px-4 py-3 text-white/50">Statut</TableHead>
                <TableHead className="sticky top-0 z-10 bg-transparent px-4 py-3 text-white/50">Catégorie</TableHead>
                <TableHead className="sticky top-0 z-10 bg-transparent px-4 py-3 text-white/50">Poids</TableHead>
                <TableHead className="sticky top-0 z-10 bg-transparent px-4 py-3 text-white/50 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colis.length === 0 ? (
                <TableRow className="hover:bg-transparent border-none">
                  <TableCell colSpan={6} className="py-10 text-center text-[13.5px] text-white/50 font-medium">
                    Aucun colis en attente de rattachement.
                  </TableCell>
                </TableRow>
              ) : (
                colis.map((c) => (
                  <AttachRow
                    key={c.id}
                    colis={c}
                    onAttached={(id) => {
                      setColis((prev) => prev?.filter((p) => p.id !== id) ?? null);
                      if (total !== null) setTotal(total - 1);
                    }}
                  />
                ))
              )}
            </TableBody>
          </Table>

          <div className="shrink-0 pt-4">
            <NumberedPagination
              page={page}
              totalPages={total !== null ? Math.max(1, Math.ceil(total / TAILLE)) : page}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      <CreatePackageDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        allowUnmatched={true}
        onSuccess={() => load()}
      />
    </div>
  );
}
