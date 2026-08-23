import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { RoleCustom, CreateRoleData, UpdateRoleData, Succursale } from "@/lib/api/roles";

const fieldClass = "h-11 rounded-[10px] border border-white/10 bg-white/5 text-white";
const labelClass = "mb-1.5 block text-[12.5px] font-bold text-white/90";

export function CreateRoleDialog({
  open,
  onOpenChange,
  onSave,
  succursales,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateRoleData) => Promise<void>;
  succursales: Succursale[];
}) {
  const [nom, setNom] = useState("");
  const [level, setLevel] = useState("");
  const [description, setDescription] = useState("");
  const [isGlobal, setIsGlobal] = useState(true);
  const [succursaleId, setSuccursaleId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNom("");
      setLevel("");
      setDescription("");
      setIsGlobal(true);
      setSuccursaleId("");
    }
  }, [open]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ nom, level, description, isGlobal, succursaleId: isGlobal ? undefined : succursaleId });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-brand-dark/95 backdrop-blur-xl border border-white/10 text-white rounded-[16px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-brand-orange">Ajouter un Rôle</DialogTitle>
          <p className="text-[13px] text-white/60">Créez un nouveau rôle avec des permissions personnalisées.</p>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 mt-4">
          <div>
            <Label className={labelClass}>NOM DU RÔLE <span className="text-red-500">*</span></Label>
            <InputGroup className={fieldClass}>
              <InputGroupInput required placeholder="ex: Manager" value={nom} onChange={(e) => setNom(e.target.value)} />
            </InputGroup>
          </div>
          <div>
            <Label className={labelClass}>NIVEAU (CODE) <span className="text-red-500">*</span></Label>
            <InputGroup className={fieldClass}>
              <InputGroupInput required placeholder="ex: MANAGER" value={level} onChange={(e) => setLevel(e.target.value)} />
            </InputGroup>
          </div>
          <div>
            <Label className={labelClass}>DESCRIPTION</Label>
            <InputGroup className={fieldClass}>
              <InputGroupInput placeholder="Brève description du rôle" value={description} onChange={(e) => setDescription(e.target.value)} />
            </InputGroup>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isGlobal" checked={isGlobal} onChange={(e) => setIsGlobal(e.target.checked)} className="rounded border-white/20 bg-white/5 accent-brand-orange" />
            <label htmlFor="isGlobal" className="text-[13px] font-semibold text-white/90">Rôle Global (s'applique à toutes les succursales)</label>
          </div>
          {!isGlobal && (
            <div>
              <Label className={labelClass}>SÉLECTIONNER LA SUCCURSALE <span className="text-red-500">*</span></Label>
              <select
                required
                className="h-11 w-full rounded-[10px] border border-white/10 bg-white/5 text-white px-3 text-[13.5px] [&>option]:bg-brand-dark"
                value={succursaleId}
                onChange={(e) => setSuccursaleId(e.target.value)}
              >
                <option value="">Sélectionner...</option>
                {succursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button type="button" onClick={() => onOpenChange(false)} variant="ghost" className="rounded-[8px] text-white hover:bg-white/10">Annuler</Button>
            <Button type="submit" disabled={loading} className="rounded-[8px] bg-brand-orange hover:bg-brand-orange-dark text-white font-bold">
              {loading ? "Création..." : "Créer le Rôle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditRoleDialog({
  role,
  open,
  onOpenChange,
  onSave,
  succursales,
}: {
  role: RoleCustom | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: UpdateRoleData) => Promise<void>;
  succursales: Succursale[];
}) {
  const [nom, setNom] = useState("");
  const [level, setLevel] = useState("");
  const [description, setDescription] = useState("");
  const [isGlobal, setIsGlobal] = useState(true);
  const [succursaleId, setSuccursaleId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && role) {
      setNom(role.nom);
      setLevel(role.level);
      setDescription(role.description || "");
      setIsGlobal(role.isGlobal);
      setSuccursaleId(role.succursaleId || "");
    }
  }, [open, role]);

  if (!role) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(role!.id, { nom, level, description, isGlobal, succursaleId: isGlobal ? undefined : succursaleId });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-brand-dark/95 backdrop-blur-xl border border-white/10 text-white rounded-[16px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-brand-orange">MODIFIER LE RÔLE</DialogTitle>
          <p className="text-[13px] text-white/60">Mettez à jour les informations du rôle.</p>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <input type="checkbox" id="editIsGlobal" checked={isGlobal} onChange={(e) => setIsGlobal(e.target.checked)} className="rounded border-white/20 bg-white/5 accent-brand-orange" />
            <label htmlFor="editIsGlobal" className="text-[13px] font-semibold text-white/90">Rôle Global (s'applique à toutes les succursales)</label>
          </div>
          {!isGlobal && (
            <div>
              <Label className={labelClass}>SÉLECTIONNER LA SUCCURSALE <span className="text-red-500">*</span></Label>
              <select
                required
                className="h-11 w-full rounded-[10px] border border-white/10 bg-white/5 text-white px-3 text-[13.5px] [&>option]:bg-brand-dark"
                value={succursaleId}
                onChange={(e) => setSuccursaleId(e.target.value)}
              >
                <option value="">Sélectionner...</option>
                {succursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label className={labelClass}>NOM DU RÔLE <span className="text-red-500">*</span></Label>
            <InputGroup className={fieldClass}>
              <InputGroupInput required value={nom} onChange={(e) => setNom(e.target.value)} />
            </InputGroup>
          </div>
          <div>
            <Label className={labelClass}>NIVEAU (CODE) <span className="text-red-500">*</span></Label>
            <InputGroup className={fieldClass}>
              <InputGroupInput required value={level} onChange={(e) => setLevel(e.target.value)} />
            </InputGroup>
          </div>
          <div>
            <Label className={labelClass}>DESCRIPTION</Label>
            <InputGroup className={fieldClass}>
              <InputGroupInput value={description} onChange={(e) => setDescription(e.target.value)} />
            </InputGroup>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" onClick={() => onOpenChange(false)} variant="ghost" className="rounded-[8px] text-white hover:bg-white/10">Annuler</Button>
            <Button type="submit" disabled={loading} className="rounded-[8px] bg-brand-orange hover:bg-brand-orange-dark text-white font-bold">
              {loading ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ViewRoleDialog({
  role,
  open,
  onOpenChange,
  onEditClick,
}: {
  role: RoleCustom | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClick: () => void;
}) {
  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-brand-dark/95 backdrop-blur-xl border border-white/10 text-white rounded-[16px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-orange/20 flex items-center justify-center border border-brand-orange/50">
               <span className="text-brand-orange text-xs">R</span>
            </div>
            {role.nom}
          </DialogTitle>
          <p className="text-[13px] text-white/60">Détails et configuration du rôle</p>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1">NIVEAU</p>
              <p className="text-[13px] font-bold">{role.level}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1">PORTÉE</p>
              <p className="text-[13px] font-bold">{role.isGlobal ? "Global" : role.succursale?.nom || "N/A"}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1">TYPE</p>
              <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Personnalisé
              </span>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">DESCRIPTION</p>
            <div className="bg-white/5 border border-white/10 rounded-[10px] p-3 text-[13px] text-white/80 min-h-[60px]">
              {role.description || <span className="italic text-white/30">Aucune description</span>}
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button onClick={() => onOpenChange(false)} variant="ghost" className="rounded-[8px] text-white hover:bg-white/10 border border-white/10">Fermer</Button>
            <Button onClick={onEditClick} className="rounded-[8px] bg-brand-orange hover:bg-brand-orange-dark text-white font-bold flex items-center gap-2">
              <span>Modifier</span>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
