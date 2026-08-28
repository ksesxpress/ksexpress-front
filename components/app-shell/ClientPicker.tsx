"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { searchClients } from "@/lib/api/clients";
import type { Client } from "@/lib/api/types";
import { extractItems } from "@/lib/format";

// Recherche client par nom/téléphone/code KSE — utilisé partout où un
// clientId doit être saisi (création de colis, de facture...).
export function ClientPicker({
  value,
  onChange,
  placeholder = "Rechercher un client (nom, téléphone, code KSE)...",
  requireEmail = true,
}: {
  value: Client | null;
  onChange: (client: Client | null) => void;
  placeholder?: string;
  requireEmail?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) return;
    const timeout = setTimeout(() => {
      searchClients({ recherche: query, taille: 8 })
        .then((res) => {
          let items = extractItems(res);
          if (requireEmail) {
            items = items.filter((c) => !!c.email);
          }
          setResults(items);
        })
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-[10px] border border-white/10 bg-white/5 px-3 py-2.5 text-white">
        <div>
          <p className="text-[13.5px] font-semibold">
            {value.prenom ? `${value.prenom} ${value.nom}` : value.nom}
          </p>
          <p className="text-[12px] text-white/50">{value.codeKse}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-[12.5px] font-semibold text-brand-orange hover:text-brand-orange/80"
        >
          Changer
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex h-11 items-center gap-2 rounded-[10px] border border-white/10 bg-white/5 px-3 focus-within:border-brand-orange focus-within:ring-1 focus-within:ring-brand-orange transition-all">
        <Search size={16} className="text-white/50" />
        <input
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setOpen(true);
            if (next.length < 2) setResults([]);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="h-full w-full bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/40"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-[10px] border border-white/10 bg-[#0a0a0f] shadow-xl max-h-60 overflow-y-auto">
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                  setQuery("");
                }}
                className="block w-full px-3 py-2 text-left text-[13.5px] hover:bg-white/10"
              >
                <span className="font-semibold text-white">
                  {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                </span>{" "}
                <span className="text-white/50">— {c.codeKse}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
