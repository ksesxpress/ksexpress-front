"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxEmpty, ComboboxList, ComboboxItem } from "@/components/ui/combobox";
import { searchClients } from "@/lib/api/clients";
import type { Client } from "@/lib/api/types";
import { extractItems } from "@/lib/format";

const WALKIN = "__walkin__";

function label(client: Client): string {
  const nom = client.prenom ? `${client.prenom} ${client.nom}` : client.nom;
  return `${nom} · ${client.codeKse}${client.telephone ? ` · ${client.telephone}` : ""}`;
}

// Combo avec la liste complète des clients (chargée une fois) — plus rapide
// qu'une recherche serveur à chaque caractère pour un volume de clientèle
// boutique raisonnable. Base UI ne filtre pas lui-même sur `itemToStringLabel`
// (voir SuccursaleDetailsModal, même pattern) : le filtrage à la frappe est
// calculé ici. Walk-in Customer est une entrée du même combo, pas un état
// séparé, pour rester au même endroit que le reste de la liste.
export function PosClientCombobox({
  value,
  onChange,
}: {
  value: Client | null;
  onChange: (client: Client | null) => void;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    // Les clients avec un email sont des clients shipping (KYC/notifications
    // par email) — les clients boutique n'ont qu'un téléphone. On ne montre
    // ici que ces derniers, pour ne pas mélanger les deux clientèles au
    // comptoir (voir aussi CreateClientDialog showEmail={false} côté POS).
    searchClients({ taille: 300 })
      .then((res) => setClients(extractItems(res).filter((c) => !c.email)))
      .catch(() => setClients([]));
  }, []);

  // Resynchronise le texte affiché quand `value` change depuis l'extérieur
  // (reset du panier après encaissement, sélection via scan/création) — sans
  // ça, le libellé tapé/sélectionné précédent reste affiché après un reset.
  // Un client tout juste créé (bouton "+") ou trouvé par scan n'est pas dans
  // `clients` (chargé une seule fois au montage) : sans l'ajouter ici, il
  // reste sélectionné mais disparaît de la liste dès qu'on rouvre le combo —
  // et vu que le formulaire de création est le seul endroit qui capture un
  // email, ça se manifeste comme "seuls les clients sans email s'affichent".
  // Ajustement pendant le rendu plutôt qu'un effet (voir doc React "Adjusting
  // state when a prop changes").
  const [syncedId, setSyncedId] = useState<string | null>(value?.id ?? null);
  if ((value?.id ?? null) !== syncedId) {
    setSyncedId(value?.id ?? null);
    setInputValue("");
    if (value && !clients.some((c) => c.id === value.id)) {
      setClients((prev) => [value, ...prev]);
    }
  }

  const query = inputValue.trim().toLowerCase();
  const filteredClients = query
    ? clients.filter((c) => label(c).toLowerCase().includes(query))
    : clients;
  const showWalkin = !query || "walk-in customer".includes(query);
  const items = [...(showWalkin ? [WALKIN] : []), ...filteredClients.map((c) => c.id)];
  const selected = value ? value.id : WALKIN;

  function handleValueChange(id: string | null) {
    if (!id || id === WALKIN) {
      onChange(null);
      setInputValue("");
      return;
    }
    const client = clients.find((c) => c.id === id);
    if (client) {
      onChange(client);
      setInputValue(label(client));
    }
  }

  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={handleValueChange}
      inputValue={value ? inputValue || label(value) : inputValue}
      onInputValueChange={setInputValue}
      itemToStringLabel={(id: string) => {
        if (id === WALKIN) return "Walk-in Customer";
        const c = clients.find((client) => client.id === id);
        return c ? label(c) : "";
      }}
    >
      <ComboboxInput
        placeholder="Rechercher un client (nom, téléphone, code KSE)..."
        className="h-11 rounded-[10px] border-white/15 bg-white/5 text-white [&_input]:text-white [&_svg]:text-brand-grey focus-within:border-brand-orange focus-within:ring-brand-orange"
      />
      <ComboboxContent className="border-white/15 bg-[#141b6e]/70 text-white backdrop-blur-2xl">
        <ComboboxEmpty className="text-white/50">Aucun client trouvé.</ComboboxEmpty>
        <ComboboxList>
          {(id: string) => {
            if (id === WALKIN) {
              return (
                <ComboboxItem key={id} value={id} className="cursor-pointer data-highlighted:bg-white/10">
                  <User className="h-3.5 w-3.5 text-white/50" />
                  <span className="text-white">Walk-in Customer</span>
                </ComboboxItem>
              );
            }
            const c = clients.find((client) => client.id === id);
            if (!c) return null;
            return (
              <ComboboxItem key={id} value={id} className="cursor-pointer data-highlighted:bg-white/10">
                <User className="h-3.5 w-3.5 text-white/30" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-white">{c.prenom ? `${c.prenom} ${c.nom}` : c.nom}</span>
                  <span className="truncate text-[11px] text-white/50">
                    {c.codeKse}
                    {c.telephone ? ` · ${c.telephone}` : ""}
                  </span>
                </div>
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
