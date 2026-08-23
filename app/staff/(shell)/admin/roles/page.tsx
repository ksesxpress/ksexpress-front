"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Loader2, Trash } from "lucide-react";
import { getRoles, createRole, updateRole, deleteRole, RoleCustom, CreateRoleData, UpdateRoleData, Succursale } from "@/lib/api/roles";
import { getSuccursales } from "@/lib/api/succursales";
import { CreateRoleDialog, EditRoleDialog, ViewRoleDialog } from "@/components/staff/admin/RoleDialogs";
import { formatDate } from "@/lib/format";

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleCustom[]>([]);
  const [succursales, setSuccursales] = useState<Succursale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<RoleCustom | null>(null);
  const [viewRole, setViewRole] = useState<RoleCustom | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [rolesData, succursalesData] = await Promise.all([
        getRoles(),
        getSuccursales()
      ]);
      setRoles(rolesData);
      setSuccursales(succursalesData);
    } catch (err: any) {
      setError(err.message || "Failed to load roles.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: CreateRoleData) {
    await createRole(data);
    await loadData();
  }

  async function handleUpdate(id: string, data: UpdateRoleData) {
    await updateRole(id, data);
    await loadData();
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Rôles et Permissions</h1>
            <p className="text-[13px] text-white/60">Gérez les rôles personnalisés et les niveaux d'accès.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="rounded-[8px] bg-brand-orange hover:bg-brand-orange-dark font-bold text-white shadow-none h-10 px-5 flex items-center gap-2">
            <Plus size={16} /> Ajouter un Rôle
          </Button>
        </div>
      </PageHeader>

      {error && <p className="text-red-500 font-semibold">{error}</p>}

      <div className="bg-white/5 border border-white/15 backdrop-blur-xl rounded-[10px] overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-brand-orange" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white">
              <thead className="border-b border-white/10 text-[11px] font-bold text-brand-grey uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">NOM DU RÔLE</th>
                  <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">NIVEAU</th>
                  <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">SUCCURSALE</th>
                  <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">AJOUTÉ LE</th>
                  <th className="px-6 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{role.nom}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-[4px] text-[10px] font-bold bg-[#00d084]/10 text-[#00d084] border border-[#00d084]/20 uppercase tracking-wide">
                        {role.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {role.isGlobal ? (
                        <span className="inline-flex px-3 py-1 rounded-[4px] text-[10px] font-bold bg-white/10 text-white/90 border border-white/10 uppercase tracking-wide">
                          GLOBAL
                        </span>
                      ) : (
                        <span className="text-white/80 font-semibold">{role.succursale?.nom || "N/A"}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-white/60">{formatDate(role.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setViewRole(role)}
                        className="p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {roles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-white/50">
                      Aucun rôle trouvé. Créez votre premier rôle personnalisé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateRoleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleCreate}
        succursales={succursales as any}
      />

      <EditRoleDialog
        role={editRole}
        open={!!editRole}
        onOpenChange={(open) => !open && setEditRole(null)}
        onSave={handleUpdate}
        succursales={succursales as any}
      />

      <ViewRoleDialog
        role={viewRole}
        open={!!viewRole}
        onOpenChange={(open) => !open && setViewRole(null)}
        onEditClick={() => {
          setEditRole(viewRole);
          setViewRole(null);
        }}
      />
    </div>
  );
}
