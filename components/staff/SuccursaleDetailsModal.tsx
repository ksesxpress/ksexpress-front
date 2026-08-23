"use client";

import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxEmpty, ComboboxList, ComboboxItem } from "@/components/ui/combobox";
import { Loader2, Plus, Trash2, User as UserIcon } from "lucide-react";
import { getSuccursale, addSuccursaleMember, removeSuccursaleMember, type Succursale } from "@/lib/api/succursales";
import { listInternalUsers } from "@/lib/api/admin";
import type { UtilisateurInterne } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

interface SuccursaleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  succursaleId: string | null;
}

export function SuccursaleDetailsModal({ isOpen, onClose, succursaleId }: SuccursaleDetailsModalProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin;
  
  const [succursale, setSuccursale] = useState<Succursale & { utilisateurs?: any[], rolesCustom?: any[] } | null>(null);
  const [allUsers, setAllUsers] = useState<UtilisateurInterne[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [comboboxSearch, setComboboxSearch] = useState("");
  const [comboboxRoleSearch, setComboboxRoleSearch] = useState("");
  const [userToRemove, setUserToRemove] = useState<string | null>(null);

  const loadData = async () => {
    if (!succursaleId) return;
    try {
      setLoading(true);
      setErrorMsg("");
      const [succData, usersData] = await Promise.all([
        getSuccursale(succursaleId),
        isSuperAdmin ? listInternalUsers() : Promise.resolve([])
      ]);
      setSuccursale(succData);
      setAllUsers(usersData);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && succursaleId) {
      loadData();
      setShowAddMember(false);
      setSelectedUserId("");
      setSelectedRoleId("");
      setComboboxSearch("");
      setComboboxRoleSearch("");
      setUserToRemove(null);
    }
  }, [isOpen, succursaleId]);

  const handleAddMember = async () => {
    if (!selectedUserId || !succursaleId || !selectedRoleId) return;
    try {
      setActionLoading(true);
      setErrorMsg("");
      await addSuccursaleMember(succursaleId, selectedUserId, selectedRoleId);
      await loadData();
      setSelectedUserId("");
      setSelectedRoleId("");
      setComboboxSearch("");
      setComboboxRoleSearch("");
      setShowAddMember(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'ajout du membre");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!succursaleId || !userToRemove) return;
    try {
      setActionLoading(true);
      setErrorMsg("");
      await removeSuccursaleMember(succursaleId, userToRemove);
      await loadData();
      setUserToRemove(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors du retrait du membre");
    } finally {
      setActionLoading(false);
    }
  };

  const currentMemberIds = new Set(succursale?.utilisateurs?.map(u => u.id) || []);
  const availableUsersToAdd = allUsers.filter(u => {
    if (currentMemberIds.has(u.id)) return false;
    const customRole = (u as any).roleCustom;
    return customRole?.level?.toUpperCase() === "USER" || customRole?.nom?.toUpperCase() === "USER";
  });
  const filteredAvailableUsers = availableUsersToAdd.filter(u => {
    const roleName = (u as any).roleCustom?.nom || u.role;
    const displayName = u.prenom || u.nom ? `${u.prenom || ''} ${u.nom || ''}`.trim() : u.email;
    const searchStr = `${displayName} ${roleName}`.toLowerCase();
    return searchStr.includes(comboboxSearch.toLowerCase());
  });

  const filteredRoles = (succursale?.rolesCustom || []).filter((r: any) => {
    return r.nom.toLowerCase().includes(comboboxRoleSearch.toLowerCase());
  });

  const userItemsIds = useMemo(() => filteredAvailableUsers.map(u => u.id), [filteredAvailableUsers]);
  const roleItemsIds = useMemo(() => filteredRoles.map((r: any) => r.id), [filteredRoles]);
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl bg-brand-dark/95 backdrop-blur-xl border border-white/10 p-0 overflow-hidden text-white rounded-[16px] shadow-2xl">
        {loading && !succursale ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : succursale ? (
          <div className="flex flex-col max-h-[85vh]">
            <DialogHeader className="p-6 bg-white/5 border-b border-white/10 flex-none">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center bg-brand-orange/20 border border-brand-orange/50 text-brand-orange rounded-full">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    {succursale.nom}
                  </DialogTitle>
                  <p className="text-sm font-medium text-white/60 mt-0.5">
                    Service ID: <span className="text-brand-orange font-mono">{succursale.id}</span>
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="overflow-y-auto p-6">
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20 font-medium">
                  {errorMsg}
                </div>
              )}

              {/* ABOUT THIS SERVICE */}
              <div className="mb-6">
                <h4 className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">
                  About this service
                </h4>
                <div className="bg-white/5 p-4 border border-white/10 rounded-[10px] text-sm text-white/80">
                  {succursale.note || "No description provided."}
                </div>
              </div>

              {/* METADATA GRID */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div>
                  <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                    Business Category Status
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-semibold rounded-md">
                      {succursale.activite}
                    </Badge>
                    {succursale.actif && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold rounded-md">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                    Service Manager
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-6 w-6 border border-white/10 bg-white/10">
                      <AvatarFallback className="text-[10px] font-bold text-white bg-transparent">
                        {succursale.responsable ? succursale.responsable.charAt(0).toUpperCase() : "N"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold leading-tight text-white/90">
                      {succursale.responsable || "N/A"}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                    Onboarded Since
                  </h4>
                  <p className="text-sm font-bold mt-2 text-white/90">
                    {new Date(succursale.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                    Code
                  </h4>
                  <p className="text-sm font-bold text-brand-orange font-mono mt-2">
                    {succursale.code.toLowerCase()}
                  </p>
                </div>
              </div>

              {/* TEAM MEMBERS */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                    Team Members ({succursale.utilisateurs?.length || 0})
                  </h4>
                  {isSuperAdmin && !showAddMember && (
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-brand-orange/80 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  )}
                </div>

                {showAddMember && (
                  <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-[10px] flex items-end gap-3 text-white">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        Sélectionner un employé
                      </label>
                      {succursale.rolesCustom && succursale.rolesCustom.length === 0 ? (
                        <div className="text-xs text-red-400 p-2 border border-red-500/20 bg-red-500/10 rounded">
                          Aucun rôle créé pour cette succursale. Impossible d'ajouter un membre sans rôle.
                        </div>
                      ) : (
                        <Combobox
                          items={userItemsIds}
                          value={selectedUserId}
                          onValueChange={(val) => {
                            const id = val as string;
                            setSelectedUserId(id);
                            const user = allUsers.find(u => u.id === id);
                            if (user) {
                              const roleName = (user as any).roleCustom?.nom || user.role;
                              const displayName = user.prenom || user.nom ? `${user.prenom || ''} ${user.nom || ''}`.trim() : user.email;
                              setComboboxSearch(`${displayName} (${roleName})`);
                            }
                          }}
                          inputValue={comboboxSearch}
                          onInputValueChange={setComboboxSearch}
                          // Sans ceci, Base UI affiche l'id brut (nos `items` sont des
                          // strings) dans le champ dès qu'une sélection est confirmée,
                          // écrasant le texte lisible posé juste au-dessus.
                          itemToStringLabel={(id: string) => {
                            const u = allUsers.find(user => user.id === id);
                            if (!u) return "";
                            const roleName = (u as any).roleCustom?.nom || u.role;
                            const displayName = u.prenom || u.nom ? `${u.prenom || ''} ${u.nom || ''}`.trim() : u.email;
                            return `${displayName} (${roleName})`;
                          }}
                        >
                          <ComboboxInput 
                            placeholder="Choisir / Rechercher..." 
                            className="border-white/10 bg-transparent text-white focus-within:ring-brand-orange focus-within:border-brand-orange [&_input]:text-white h-[38px]" 
                          />
                          <ComboboxContent className="bg-[#0a0a0f] border-white/10 text-white z-[100]">
                            {filteredAvailableUsers.length === 0 ? (
                              <div className="p-2 text-sm text-white/50 text-center">Aucun employé trouvé</div>
                            ) : (
                              <ComboboxList className="text-white">
                                {(id: string) => {
                                  const u = filteredAvailableUsers.find(user => user.id === id);
                                  if (!u) return null;
                                  const roleName = (u as any).roleCustom?.nom || u.role;
                                  const displayName = u.prenom || u.nom ? `${u.prenom || ''} ${u.nom || ''}`.trim() : u.email;
                                  return (
                                    <ComboboxItem key={id} value={id} className="focus:bg-white/10 cursor-pointer data-[highlighted]:bg-white/10 data-[highlighted]:!text-white">
                                      <span className="!text-white block w-full">{displayName} ({roleName})</span>
                                    </ComboboxItem>
                                  );
                                }}
                              </ComboboxList>
                            )}
                          </ComboboxContent>
                        </Combobox>
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        Rôle dans la succursale
                      </label>
                      <Combobox
                        items={roleItemsIds}
                        value={selectedRoleId}
                        onValueChange={(val) => {
                          const id = val as string;
                          setSelectedRoleId(id);
                          const role = succursale?.rolesCustom?.find((r: any) => r.id === id);
                          if (role) {
                            setComboboxRoleSearch(role.nom);
                          }
                        }}
                        inputValue={comboboxRoleSearch}
                        onInputValueChange={setComboboxRoleSearch}
                        itemToStringLabel={(id: string) => {
                          const role = succursale?.rolesCustom?.find((r: any) => r.id === id);
                          return role ? role.nom : "";
                        }}
                      >
                        <ComboboxInput 
                          placeholder="Choisir / Rechercher..." 
                          className="border-white/10 bg-transparent text-white focus-within:ring-brand-orange focus-within:border-brand-orange [&_input]:text-white h-[38px] disabled:opacity-50" 
                          disabled={!succursale?.rolesCustom || succursale.rolesCustom.length === 0}
                        />
                        <ComboboxContent className="bg-[#0a0a0f] border-white/10 text-white z-[100]">
                          {filteredRoles.length === 0 ? (
                            <div className="p-2 text-sm text-white/50 text-center">Aucun rôle trouvé</div>
                          ) : (
                            <ComboboxList className="text-white">
                              {(id: string) => {
                                const role = filteredRoles.find((r: any) => r.id === id);
                                if (!role) return null;
                                return (
                                  <ComboboxItem key={id} value={id} className="focus:bg-white/10 cursor-pointer data-[highlighted]:bg-white/10 data-[highlighted]:!text-white">
                                    <span className="!text-white block w-full">{role.nom}</span>
                                  </ComboboxItem>
                                );
                              }}
                            </ComboboxList>
                          )}
                        </ComboboxContent>
                      </Combobox>
                    </div>
                    <Button 
                      onClick={handleAddMember} 
                      disabled={!selectedUserId || !selectedRoleId || actionLoading || succursale.rolesCustom?.length === 0}
                      className="bg-brand-orange hover:bg-brand-orange/90 text-white h-[38px] font-semibold"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowAddMember(false)}
                      className="text-white/60 hover:text-white hover:bg-white/10 rounded-[8px]"
                    >
                      Annuler
                    </Button>
                  </div>
                )}

                <div className="border border-white/10 rounded-[10px] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-white/80">
                      <thead className="bg-white/5 border-b border-white/10 text-[11px] font-bold text-white/50 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">USER</th>
                          <th className="px-4 py-3">ROLE</th>
                          <th className="px-4 py-3">STATUS</th>
                          {isSuperAdmin && <th className="px-4 py-3 text-right">ACTIONS</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {!succursale.utilisateurs || succursale.utilisateurs.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-white/50">
                              Aucun employé dans cette succursale.
                            </td>
                          </tr>
                        ) : (
                          succursale.utilisateurs.map((u: any) => {
                            const initials = `${u.prenom?.[0] || ""}${u.nom?.[0] || ""}`.toUpperCase() || "U";
                            return (
                              <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 border border-white/10 bg-white/10">
                                      <AvatarFallback className="text-xs font-bold text-white bg-transparent">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-bold leading-none mb-1 text-white">
                                        {u.prenom} {u.nom}
                                      </p>
                                      <p className="text-[11px] font-medium text-white/60">{u.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="outline" className="bg-white/10 text-white/80 border-white/20 font-bold px-2 py-0.5 text-[10px] rounded">
                                    {u.roleCustom?.nom || u.role}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="outline" className={`font-bold px-2 py-0.5 text-[10px] rounded ${u.actif ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                    {u.actif ? "ACTIVE" : "SUSPENDED"}
                                  </Badge>
                                </td>
                                {isSuperAdmin && (
                                  <td className="px-4 py-3 text-right">
                                    {userToRemove === u.id ? (
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={handleRemoveMember}
                                          disabled={actionLoading}
                                          className="text-xs text-red-400 hover:text-red-300 font-bold"
                                        >
                                          Confirmer
                                        </button>
                                        <button
                                          onClick={() => setUserToRemove(null)}
                                          disabled={actionLoading}
                                          className="text-xs text-white/50 hover:text-white"
                                        >
                                          Annuler
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setUserToRemove(u.id)}
                                        disabled={actionLoading}
                                        className="text-red-400/50 hover:text-red-400 transition-colors p-1"
                                        title="Retirer de la succursale"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

              <div className="bg-white/5 border-t border-white/10 p-4 flex items-center justify-end gap-3 flex-none">
                <Button variant="outline" onClick={onClose} className="bg-transparent border-white/10 text-white hover:bg-white/10 rounded-lg">
                  Close
                </Button>
                {isSuperAdmin && (
                  <Button onClick={onClose} className="bg-brand-orange text-white hover:bg-brand-orange/90 font-bold rounded-lg px-6">
                    Edit Service
                  </Button>
                )}
              </div>
          </div>
        ) : (
          <div className="text-center text-red-500">
            Erreur de chargement.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
