"use client";

import { useEffect, useState } from "react";
import { listInternalUsers, deactivateInternalUser, activateInternalUser } from "@/lib/api/admin";
import type { RoleInterne, UtilisateurInterne } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { useAuth } from "@/lib/auth/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Plus, Search, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NewUserModal, UpdateUserModal, ViewUserModal, ConfirmDialog } from "@/components/staff/admin/users/UserModals";

const ROLE_LABELS: Record<RoleInterne, string> = {
  SUPER_ADMIN: "SUPER ADMIN",
  CAISSIER: "CAISSIER",
  GESTIONNAIRE_STOCK: "GESTIONNAIRE STOCK",
};

export default function UtilisateursPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UtilisateurInterne[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<UtilisateurInterne | null>(null);
  const [editingUser, setEditingUser] = useState<UtilisateurInterne | null>(null);
  const [togglingUser, setTogglingUser] = useState<UtilisateurInterne | null>(null);

  const loadUsers = () => {
    listInternalUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de charger les comptes."));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  function updateUserInList(updated: UtilisateurInterne) {
    setUsers((prev) => prev?.map((u) => (u.id === updated.id ? updated : u)) ?? null);
  }

  async function performToggleStatus() {
    if (!togglingUser) return;
    try {
      if (togglingUser.actif) {
        const updated = await deactivateInternalUser(togglingUser.id);
        updateUserInList(updated);
      } else {
        const updated = await activateInternalUser(togglingUser.id);
        updateUserInList(updated);
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erreur.");
    } finally {
      setTogglingUser(null);
    }
  }

  const filteredUsers = users?.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.nom?.toLowerCase().includes(search.toLowerCase()) ||
    u.prenom?.toLowerCase().includes(search.toLowerCase()) ||
    u.telephone?.includes(search)
  ) || [];

  return (
    <div className="flex min-h-screen flex-col min-w-0">
      {/* HEADER SECTION */}
      <PageHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Users className="h-7 w-7 text-brand-orange" />
              Users
              <Badge className="bg-brand-orange/20 text-brand-orange border-brand-orange/30 font-bold px-2 py-0.5 text-xs rounded-md ml-2">
                {users?.length || 0} Total
              </Badge>
            </h1>
            <p className="text-sm text-brand-grey mt-0.5">Manage system administrators and employees</p>
          </div>

          <Button
            onClick={() => setIsNewModalOpen(true)}
            className="bg-brand-orange text-white hover:bg-brand-orange/90 font-bold shadow-md rounded-[8px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            NEW USER
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-6 max-w-7xl w-full mx-auto">
        <div className="rounded-[10px] bg-white/5 border border-white/15 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher des utilisateurs..."
                className="pl-10 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-brand-orange focus:ring-brand-orange rounded-[8px]"
              />
            </div>
          </div>
        </div>

        {error && <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 font-semibold rounded-[10px]">{error}</div>}

        {/* TABLE SECTION */}
        <div className="bg-white/5 border border-white/15 backdrop-blur-xl rounded-[10px] overflow-hidden">
          {!users ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-brand-orange" size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white">
                <thead className="border-b border-white/10 text-[11px] font-bold text-brand-grey uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Utilisateur</th>
                    <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rôle</th>
                    <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                    <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vérifié</th>
                    <th className="px-6 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-brand-grey">
                        Aucun utilisateur trouvé.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const initials = `${u.prenom?.[0] || ""}${u.nom?.[0] || ""}`.toUpperCase() || "U";
                      const fullName = [u.prenom, u.nom].filter(Boolean).join(" ") || "Sans nom";
                      const isSelf = u.id === currentUser?.sub;

                      return (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10 border border-white/20 bg-white/10">
                                <AvatarFallback className="text-sm font-bold text-white bg-transparent">{initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-bold text-white">{fullName}</p>
                                <p className="text-xs font-medium text-brand-grey mt-0.5">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top pt-5">
                            <div className="flex flex-col items-start gap-1.5">
                              <Badge className="bg-white/10 text-white border-white/20 font-bold px-2 py-0.5 text-[10px] rounded">
                                {(u as any).roleCustom?.nom || ROLE_LABELS[u.role as RoleInterne] || u.role}
                              </Badge>
                              {u.succursales && u.succursales.length > 0 && (
                                <div className="flex flex-col gap-1 mt-1">
                                  {u.succursales.map(s => (
                                    <span key={s.id} className="text-[11px] font-semibold text-brand-grey flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-brand-grey/50"></span>
                                      {s.nom} {s.roleCustom && <span className="text-white/50 bg-white/5 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">{s.roleCustom}</span>}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top pt-5">
                            <Badge className={`font-semibold bg-transparent border px-2 py-0.5 text-[10px] rounded ${u.actif ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30'}`}>
                              {u.actif ? "ACTIF" : "SUSPENDU"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 align-top pt-5">
                            <Badge className={`font-semibold bg-transparent border px-2 py-0.5 text-[10px] rounded ${u.verifie ? 'text-emerald-400 border-emerald-500/30' : 'text-orange-400 border-orange-500/30'}`}>
                              {u.verifie ? "VÉRIFIÉ" : "NON VÉRIFIÉ"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 align-top pt-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-grey hover:text-white hover:bg-white/10 rounded-lg">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 border-slate-700 bg-slate-800 text-white shadow-xl rounded-xl">
                                <DropdownMenuItem className="cursor-pointer text-white hover:bg-slate-800" onClick={() => setViewingUser(u)}>
                                  Voir les détails
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer text-white hover:bg-slate-800" onClick={() => setEditingUser(u)}>
                                  Modifier
                                </DropdownMenuItem>
                                {!isSelf && (
                                  <DropdownMenuItem onClick={() => setTogglingUser(u)} className={`text-sm font-semibold cursor-pointer hover:bg-slate-700 focus:bg-slate-700 ${u.actif ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {u.actif ? "Suspendre le compte" : "Activer le compte"}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      <NewUserModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={(newUser) => setUsers(prev => prev ? [newUser, ...prev] : [newUser])}
      />

      <ViewUserModal
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        user={viewingUser}
        onEdit={(user) => {
          setViewingUser(null);
          setEditingUser(user);
        }}
      />

      <UpdateUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSuccess={updateUserInList}
      />

      <ConfirmDialog
        isOpen={!!togglingUser}
        onClose={() => setTogglingUser(null)}
        onConfirm={performToggleStatus}
        title={togglingUser?.actif ? "Suspendre le compte" : "Activer le compte"}
        description={`Voulez-vous vraiment ${togglingUser?.actif ? "suspendre" : "activer"} le compte de ${togglingUser?.email} ?`}
        confirmText={togglingUser?.actif ? "Suspendre" : "Activer"}
        isDestructive={togglingUser?.actif ?? false}
      />
    </div>
  );
}
