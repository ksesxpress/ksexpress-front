"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Edit, UserX, UserCheck } from "lucide-react";
import { searchClients, deactivateClient, activateClient } from "@/lib/api/clients";
import type { Client } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { extractItems, extractTotal, formatMoney } from "@/lib/format";
import { useAuth } from "@/lib/auth/auth-context";
import { getCurrentBranchRole } from "@/lib/auth/tokens";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { NumberedPagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateClientDialog } from "@/components/staff/CreateClientDialog";
import { EditClientDialog } from "@/components/staff/EditClientDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const TAILLE = 30;

const STATUTS: { value: "all" | "true" | "false"; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "true", label: "Actif" },
  { value: "false", label: "Désactivé" },
];

function ClientDeactivateButton({ client, onChanged }: { client: Client; onChanged: (c: Client) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleDeactivate() {
    setError(null);
    setIsSaving(true);
    try {
      const updated = await deactivateClient(client.id);
      onChanged(updated);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!client.actif) return null;
  return (
    <>
      <span className="inline-flex flex-col">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          disabled={isSaving}
          className="text-red-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
          title="Désactiver"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />}
        </Button>
      </span>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0f] border-white/10 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Désactiver le client</DialogTitle>
            <DialogDescription className="text-white/60">
              Voulez-vous vraiment désactiver le client <strong className="text-white">{client.prenom} {client.nom} ({client.codeKse})</strong> ? Il ne pourra plus se connecter ni créer de nouveaux colis.
            </DialogDescription>
          </DialogHeader>

          {error && <p className="text-[13px] font-semibold text-red-500 bg-red-500/10 p-3 rounded-lg">{error}</p>}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isSaving}
              className="h-10 rounded-[8px] px-6 hover:bg-white/5 hover:text-white"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleDeactivate}
              disabled={isSaving}
              className="h-10 rounded-[8px] bg-red-600 hover:bg-red-500 px-6 font-bold text-white shadow-none"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Désactiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ClientActivateButton({ client, onChanged }: { client: Client; onChanged: (c: Client) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleActivate() {
    setError(null);
    setIsSaving(true);
    try {
      const updated = await activateClient(client.id);
      onChanged(updated);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSaving(false);
    }
  }

  if (client.actif) return null;
  return (
    <>
      <span className="inline-flex flex-col">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          disabled={isSaving}
          className="text-green-500 hover:text-green-400 hover:bg-green-500/10 disabled:opacity-50"
          title="Réactiver"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
        </Button>
      </span>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0f] border-white/10 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Réactiver le client</DialogTitle>
            <DialogDescription className="text-white/60">
              Voulez-vous réactiver le compte du client <strong className="text-white">{client.prenom} {client.nom} ({client.codeKse})</strong> ? Il pourra à nouveau se connecter.
            </DialogDescription>
          </DialogHeader>

          {error && <p className="text-[13px] font-semibold text-red-500 bg-red-500/10 p-3 rounded-lg">{error}</p>}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isSaving}
              className="h-10 rounded-[8px] px-6 hover:bg-white/5 hover:text-white"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleActivate}
              disabled={isSaving}
              className="h-10 rounded-[8px] bg-green-600 hover:bg-green-500 px-6 font-bold text-white shadow-none"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Réactiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ClientsPage() {
  const { user } = useAuth();
  
  const branchRole = getCurrentBranchRole();
  const legacyRole = user?.isSuperAdmin ? "SUPER_ADMIN" : (branchRole || user?.roleCustomNom || (!user?.isStaff ? "CLIENT" : "MANAGER"))?.toUpperCase();
  const canManage = Boolean(user?.isSuperAdmin || user?.isStaff);
  const canCreate = Boolean(user?.isSuperAdmin || (user?.isStaff && branchRole !== "CASHIER"));

  const [clients, setClients] = useState<Client[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState<"all" | "true" | "false">("all");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const router = useRouter();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  function updateClientInList(updated: Client) {
    setClients((prev) => prev?.map((c) => (c.id === updated.id ? updated : c)) ?? null);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchClients({
        recherche: q || undefined,
        actif: statut === "all" ? undefined : statut === "true",
        page,
        taille: TAILLE,
      })
        .then((res) => {
          setClients(extractItems(res));
          setTotal(extractTotal(res));
        })
        .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de charger les clients."));
    }, 300);
    return () => clearTimeout(timeout);
  }, [q, statut, page]);

  return (
    <div className="space-y-5">
      <PageHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-white">Clients</h1>
          {canCreate && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-4 py-2 text-[13px] font-bold text-white hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Nouveau client
            </button>
          )}
        </div>
      </PageHeader>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-md">
          <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
            <InputGroupInput
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher par nom, téléphone, code KSE..."
              className="!h-10 w-full rounded-[8px] border-[1.5px] border-white/20 bg-white/80 backdrop-blur-xl px-3 text-[13.5px] text-brand-dark shadow-none"
            />
          </InputGroup>
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={statut}
            onValueChange={(val) => {
              setStatut(val as "all" | "true" | "false");
              setPage(1);
            }}
          >
            <SelectTrigger className="!h-10 w-full rounded-[8px] border-[1.5px] border-white/20 bg-white/80 backdrop-blur-xl px-3 text-[13.5px] shadow-none">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent className="bg-white/80 backdrop-blur-xl border-white/40">
              {STATUTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-[14px] font-semibold text-red-400">{error}</p>}

      {!clients ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-orange" size={28} />
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Code KSE</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Balance</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManage ? 6 : 5} className="text-center text-brand-grey py-10">
                      Aucun client trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((c) => {
                    return (
                      <TableRow
                        key={c.id}
                        onClick={() => router.push(`/staff/clients/${c.id}`)}
                        className="cursor-pointer"
                      >
                        <TableCell className="font-semibold text-brand-orange">
                          {c.prenom} {c.nom}
                        </TableCell>
                        <TableCell className="font-mono text-brand-grey">{c.codeKse}</TableCell>
                        <TableCell>{c.email || "—"}</TableCell>
                        <TableCell>{c.telephone || "—"}</TableCell>
                        <TableCell>
                          <span className={Number(c.balance) < 0 ? "text-red-600 font-bold" : ""}>
                            {formatMoney(c.balance)}
                          </span>
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingClient(c);
                                }}
                                className="text-brand-orange hover:text-brand-orange-text hover:bg-brand-orange/10"
                                title="Modifier"
                              >
                                <Edit size={16} />
                              </Button>
                              <ClientDeactivateButton client={c} onChanged={updateClientInList} />
                              <ClientActivateButton client={c} onChanged={updateClientInList} />
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="shrink-0 border-t border-white/40 p-4">
            <NumberedPagination
              page={page}
              totalPages={total !== null ? Math.max(1, Math.ceil(total / TAILLE)) : page}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {canCreate && (
        <>
          <CreateClientDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onCreated={(newClient) => setClients((prev) => (prev ? [newClient, ...prev] : [newClient]))}
          />
          <EditClientDialog
            client={editingClient}
            open={Boolean(editingClient)}
            onOpenChange={(open) => {
              if (!open) setEditingClient(null);
            }}
            onUpdated={updateClientInList}
          />
        </>
      )}
    </div>
  );
}
