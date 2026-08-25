"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateInternalUser } from "@/lib/api/admin";
import type { RoleInterne, UtilisateurInterne } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fieldClass = "!h-10 w-full rounded-[8px] border-[1.5px] border-[#eadfcf] shadow-none px-3 text-[13.5px]";
const labelClass = "mb-1 block text-[12.5px] font-bold ";

const ROLE_LABELS: Record<RoleInterne, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  DEV: "Développeur",
  CASHIER: "Caissier",
};

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onUpdated,
}: {
  user: UtilisateurInterne | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (user: UtilisateurInterne) => void;
}) {
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [role, setRole] = useState<RoleInterne>("CASHIER");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email ?? "");
      setTelephone(user.telephone ?? "");
      setRole((user.role as RoleInterne) ?? "CASHIER");
      setError(null);
    }
  }, [user]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const updated = await updateInternalUser(user.id, {
        email,
        telephone: telephone || undefined,
        role,
      });
      onUpdated(updated);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-extrabold">
            Modifier le compte {user?.email}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label className={labelClass}>Email *</Label>
            <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
              <InputGroupInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
            </InputGroup>
          </div>

          <div>
            <Label className={labelClass}>Téléphone</Label>
            <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
              <InputGroupInput value={telephone} onChange={(e) => setTelephone(e.target.value)} className={fieldClass} />
            </InputGroup>
          </div>

          <div>
            <Label className={labelClass}>Rôle *</Label>
            <Select value={role} onValueChange={(val) => setRole(val as RoleInterne)}>
              <SelectTrigger className={fieldClass}>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-[13px] font-semibold text-red-600 bg-red-50 p-2.5 rounded-[8px]">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 mt-4 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark text-[14px] font-bold text-white shadow-md hover:opacity-90 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Enregistrer les modifications"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
