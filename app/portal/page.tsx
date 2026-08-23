"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Package, Receipt, Wallet } from "lucide-react";
import { getMeResume } from "@/lib/api/clients";
import type { ClientResume } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { formatDate, formatMoney } from "@/lib/format";
import { ColisStatusBadge, FactureStatusBadge } from "@/components/app-shell/StatusBadge";
import { PageHeader } from "@/components/app-shell/PageHeader";

const cardClass = "rounded-[10px] border border-white/20 bg-white/80 backdrop-blur-xl p-5 shadow-none text-brand-dark transition-all";

export default function PortailResumePage() {
  const [resume, setResume] = useState<ClientResume | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMeResume()
      .then(setResume)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Impossible de charger votre profil."),
      );
  }, []);

  if (error) {
    return <p className="text-[14px] font-semibold text-red-400">{error}</p>;
  }

  if (!resume) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-brand-orange" size={28} />
      </div>
    );
  }

  const { client, colis, factures } = resume;
  const balanceNum = Number(client.balance);

  return (
    <div className="space-y-6">
      <PageHeader>
        <h1 className="text-2xl font-extrabold text-white">
          Bonjour, {client.prenom ?? client.nom}
        </h1>
        <p className="text-[13.5px] text-white/70">Code client {client.codeKse}</p>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={cardClass}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-brand-grey">Balance</span>
            <div className="flex size-9 items-center justify-center rounded-[8px] bg-emerald-500/15 text-emerald-600 font-bold">
              <Wallet size={18} />
            </div>
          </div>
          <p
            className={`text-2xl font-extrabold ${balanceNum < 0 ? "text-red-600" : "text-brand-dark"}`}
          >
            {formatMoney(client.balance)}
          </p>
          {balanceNum < 0 && (
            <p className="mt-1 text-[12px] font-semibold text-red-600">Solde dû à KS Express</p>
          )}
        </div>

        <div className={cardClass}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-brand-grey">Colis récents</span>
            <div className="flex size-9 items-center justify-center rounded-[8px] bg-blue-500/15 text-blue-600 font-bold">
              <Package size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-brand-dark">{colis.length}</p>
        </div>

        <div className={cardClass}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-brand-grey">
              Factures récentes
            </span>
            <div className="flex size-9 items-center justify-center rounded-[8px] bg-amber-500/15 text-amber-600 font-bold">
              <Receipt size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-brand-dark">{factures.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardClass}>
          <div className="mb-3 flex items-center justify-between border-b border-white/40 pb-3">
            <h2 className="text-[15px] font-extrabold text-brand-dark">Derniers colis</h2>
            <Link href="/portal/packages" className="text-[12.5px] font-bold text-brand-orange-text hover:underline">
              Voir tout
            </Link>
          </div>
          {colis.length === 0 ? (
            <p className="text-[13.5px] text-brand-grey py-2">Aucun colis pour l&apos;instant.</p>
          ) : (
            <ul className="divide-y divide-[#f2e6d6]">
              {colis.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-[13.5px] font-semibold text-brand-dark">
                      {c.tracking ?? "Tracking non renseigné"}
                    </p>
                    <p className="text-[12px] text-brand-grey">{formatDate(c.createdAt)}</p>
                  </div>
                  <ColisStatusBadge statut={c.statut} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={cardClass}>
          <div className="mb-3 flex items-center justify-between border-b border-white/40 pb-3">
            <h2 className="text-[15px] font-extrabold text-brand-dark">Dernières factures</h2>
            <Link href="/portal/invoices" className="text-[12.5px] font-bold text-brand-orange-text hover:underline">
              Voir tout
            </Link>
          </div>
          {factures.length === 0 ? (
            <p className="text-[13.5px] text-brand-grey py-2">Aucune facture pour l&apos;instant.</p>
          ) : (
            <ul className="divide-y divide-[#f2e6d6]">
              {factures.slice(0, 5).map((f) => (
                <li key={f.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-[13.5px] font-semibold text-brand-dark">{f.numero}</p>
                    <p className="text-[12px] text-brand-grey">
                      {formatMoney(f.montantPaye)} / {formatMoney(f.total)}
                    </p>
                  </div>
                  <FactureStatusBadge statut={f.statut} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
