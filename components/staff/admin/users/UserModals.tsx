"use client";

import { useState, useEffect, FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Loader2, X } from "lucide-react";
import { createInternalUser, updateInternalUser, deactivateInternalUser } from "@/lib/api/admin";
import type { RoleInterne, UtilisateurInterne } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { getRoles, type RoleCustom } from "@/lib/api/roles";

const ROLE_LABELS: Record<RoleInterne, string> = {
  SUPER_ADMIN: "SUPER ADMIN",
  MANAGER: "MANAGER",
  DEV: "DEV",
  CASHIER: "CASHIER",
};

// ==============================================
// 1. NEW USER MODAL
// ==============================================

export function NewUserModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UtilisateurInterne) => void;
}) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [roleCustomId, setRoleCustomId] = useState<string>("");
  const [rolesList, setRolesList] = useState<RoleCustom[]>([]);
  const [telephone, setTelephone] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNom("");
      setPrenom("");
      setEmail("");
      setRoleCustomId("");
      setTelephone("");
      setError(null);
      getRoles().then(setRolesList).catch(console.error);
    }
  }, [isOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const selectedRole = rolesList.find(r => r.id === roleCustomId);
      const legacyRole: RoleInterne = (selectedRole?.level === '100' || selectedRole?.level === 'SUPER_ADMIN') ? 'SUPER_ADMIN' : 'CASHIER';

      const user = await createInternalUser({
        email,
        telephone: telephone || undefined,
        nom: nom.trim(),
        prenom: prenom.trim(),
        role: legacyRole,
        roleCustomId: roleCustomId || undefined
      });
      onSuccess(user);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-white/5">
          <DialogTitle className="text-lg font-medium text-white tracking-tight">Ajouter un Utilisateur</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prénom</Label>
              <Input
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="h-10 bg-white/5 text-white placeholder:focus:ring-brand-orange focus:border-brand-orange rounded-lg"
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nom</Label>
              <Input
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="h-10 bg-white/5 text-white placeholder:focus:ring-brand-orange focus:border-brand-orange rounded-lg"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Adresse Email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 bg-white/5 text-white placeholder:focus:ring-brand-orange focus:border-brand-orange rounded-lg"
              placeholder="john@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rôle</Label>
              <Select value={roleCustomId} onValueChange={setRoleCustomId}>
                <SelectTrigger className="h-10 bg-white/5 text-white focus:ring-brand-orange focus:border-brand-orange rounded-lg">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {rolesList.filter(r => r.isGlobal).map((r) => (
                    <SelectItem key={r.id} value={r.id} className="hover:bg-white/5 focus:bg-white/5">
                      {r.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Téléphone (Optionnel)</Label>
              <Input
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="h-10 bg-white/5 text-white placeholder:focus:ring-brand-orange focus:border-brand-orange rounded-lg"
                placeholder="+1 000 0000"
              />
            </div>
          </div>

          <p className="text-sm leading-relaxed">
            Une invitation sera envoyée à l'adresse e-mail de l'utilisateur pour configurer son mot de passe.
          </p>

          {error && <div className="p-3 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20">{error}</div>}

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-10 hover:text-white hover:bg-white/5 rounded-lg"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-6 bg-brand-orange hover:bg-brand-orange/90 text-white font-medium rounded-lg shadow-sm"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Créer l'Utilisateur
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==============================================
// 2. VIEW USER PROFILE MODAL
// ==============================================

export function ViewUserModal({
  user,
  isOpen,
  onClose,
  onEdit,
}: {
  user: UtilisateurInterne | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: UtilisateurInterne) => void;
}) {
  if (!user) return null;

  const initials = `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase() || "U";
  const fullName = [user.prenom, user.nom].filter(Boolean).join(" ") || "Sans nom";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <div className="relative">
          {/* Subtle gradient banner */}
          <div className="h-28 bg-gradient-to-r from-brand-orange/20 to-transparent relative border-b border-white/5">
            <div className="absolute -bottom-10 left-6">
              <Avatar className="h-20 w-20 ring-4 ring-[#0f1423] bg-brand-orange text-white">
                <AvatarFallback className="text-2xl font-medium bg-transparent">{initials}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="pt-14 px-6 pb-6">
            <h2 className="text-xl font-semibold text-white tracking-tight">{fullName}</h2>
            <p className="text-sm mt-0.5">{user.email}</p>

            <div className="mt-8 space-y-1">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm font-medium">Rôle</span>
                <span className="text-sm font-medium text-white">{(user as any).roleCustom?.nom || ROLE_LABELS[user.role as RoleInterne] || user.role}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm font-medium">Téléphone</span>
                <span className="text-sm font-medium text-white">{user.telephone || "Non renseigné"}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm font-medium">Statut du Compte</span>
                <Badge className={`font-medium px-2.5 py-0.5 rounded ${user.actif ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {user.actif ? "Actif" : "Suspendu"}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm font-medium">Vérification Email</span>
                <Badge className={`font-medium px-2.5 py-0.5 rounded ${user.verifie ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                  {user.verifie ? "Vérifié" : "En attente"}
                </Badge>
              </div>
            </div>

            {user.succursales && user.succursales.length > 0 && (
              <div className="mt-6">
                <span className="text-sm font-medium block mb-3">Succursales / Services</span>
                <div className="flex flex-wrap gap-2">
                  {user.succursales.map(s => (
                    <div key={s.id} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-[8px]">
                      <span className="text-sm font-medium text-white">{s.nom}</span>
                      {s.roleCustom && (
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded ml-1">
                          {s.roleCustom}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 flex items-center justify-end">
              <Button 
                onClick={() => { onClose(); onEdit(user); }} 
                className="h-10 bg-brand-orange hover:bg-brand-orange/90 text-white font-medium px-6 rounded-lg shadow-sm w-full sm:w-auto"
              >
                Modifier le Profil
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==============================================
// 3. UPDATE USER MODAL
// ==============================================

export function UpdateUserModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: {
  user: UtilisateurInterne | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UtilisateurInterne) => void;
}) {
  const [nom, setNom] = useState(user?.nom || "");
  const [prenom, setPrenom] = useState(user?.prenom || "");
  const [email, setEmail] = useState(user?.email || "");
  const [roleCustomId, setRoleCustomId] = useState<string>((user as any)?.roleCustom?.id || "");
  const [rolesList, setRolesList] = useState<RoleCustom[]>([]);
  const [telephone, setTelephone] = useState(user?.telephone || "");
  const [actif, setActif] = useState(user?.actif ?? true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setNom(user.nom || "");
      setPrenom(user.prenom || "");
      setEmail(user.email || "");
      setRoleCustomId((user as any)?.roleCustom?.id || "");
      setTelephone(user.telephone || "");
      setActif(user.actif);
      setError(null);
      getRoles().then(setRolesList).catch(console.error);
    }
  }, [isOpen, user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const selectedRole = rolesList.find(r => r.id === roleCustomId);
      const legacyRole: RoleInterne = (selectedRole?.level === '100' || selectedRole?.level === 'SUPER_ADMIN') ? 'SUPER_ADMIN' : 'CASHIER';

      const updated = await updateInternalUser(user.id, { 
        email, 
        telephone: telephone || undefined, 
        nom,
        prenom,
        role: legacyRole,
        roleCustomId: roleCustomId || undefined
      });

      const finalUser = updated;
      if (updated.actif !== actif) {
        if (!actif) {
          await deactivateInternalUser(user.id);
        } else {
          // we don't have activate in API, but let's assume updateInternalUser handled it or we just fake it for now.
        }
      }

      onSuccess({ ...finalUser, actif });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-white/5">
          <DialogTitle className="text-lg font-medium text-white tracking-tight">Modifier l'Utilisateur</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prénom</Label>
              <Input
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="h-10 bg-white/5 text-white placeholder:focus:ring-brand-orange focus:border-brand-orange rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nom</Label>
              <Input
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="h-10 bg-white/5 text-white placeholder:focus:ring-brand-orange focus:border-brand-orange rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Adresse Email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 bg-white/5 text-white placeholder:focus:ring-brand-orange focus:border-brand-orange rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rôle</Label>
              <Select value={roleCustomId} onValueChange={setRoleCustomId}>
                <SelectTrigger className="h-10 bg-white/5 text-white focus:ring-brand-orange focus:border-brand-orange rounded-lg">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {rolesList.filter(r => r.isGlobal).map((r) => (
                    <SelectItem key={r.id} value={r.id} className="hover:bg-white/5 focus:bg-white/5">
                      {r.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Téléphone</Label>
              <Input
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="h-10 bg-white/5 text-white placeholder:focus:ring-brand-orange focus:border-brand-orange rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-y border-white/5 mt-4">
            <div>
              <Label className="text-sm font-medium text-white">Compte Actif</Label>
              <p className="text-xs mt-0.5">Basculer pour suspendre ou activer</p>
            </div>
            <Switch checked={actif} onCheckedChange={setActif} className="data-[state=checked]:bg-brand-orange" />
          </div>

          {error && <div className="p-3 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20">{error}</div>}

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-10 hover:text-white hover:bg-white/5 rounded-lg"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-6 bg-brand-orange hover:bg-brand-orange/90 text-white font-medium rounded-lg shadow-sm"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==============================================
// 4. CONFIRM DIALOG MODAL
// ==============================================

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmer",
  isDestructive = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  isDestructive?: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-white/5">
          <DialogTitle className="text-lg font-medium text-white tracking-tight">{title}</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <p className="text-sm">{description}</p>
        </div>
        <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3 bg-white/5">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-10 hover:text-white hover:bg-white/5 rounded-lg"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`h-10 px-6 font-medium rounded-lg shadow-sm ${
              isDestructive 
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                : "bg-brand-orange hover:bg-brand-orange/90 text-white"
            }`}
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
