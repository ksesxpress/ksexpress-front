"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  MessageSquare,
  Mail,
  User,
  Clock,
  Globe,
  CheckCircle2,
  XCircle,
  Edit2,
  Power,
  PlaneTakeoff,
  PackageCheck,
  AlertCircle,
  ShoppingBag,
  Store,
  LayoutGrid,
  List,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getSuccursales,
  toggleSuccursaleActif,
  Succursale,
  TypeSuccursale,
  ActiviteSuccursale,
} from "@/lib/api/succursales";
import { SuccursaleFormDialog } from "@/components/staff/SuccursaleFormDialog";
import { SuccursaleDetailsModal } from "@/components/staff/SuccursaleDetailsModal";
import { Eye } from "lucide-react";

export default function SuccursalesPage() {
  const { user } = useAuth();
  const [succursales, setSuccursales] = useState<Succursale[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("TOUT");
  const [selectedActivite, setSelectedActivite] = useState<string>("TOUT");
  const [onlyActive, setOnlyActive] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSuccursale, setEditingSuccursale] = useState<Succursale | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [viewingSuccursaleId, setViewingSuccursaleId] = useState<string | null>(null);

  const isSuperAdmin = user?.isSuperAdmin;

  const loadSuccursales = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await getSuccursales();
      setSuccursales(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors du chargement des succursales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuccursales();
  }, []);

  const handleToggleActif = async (id: string) => {
    try {
      await toggleSuccursaleActif(id);
      loadSuccursales();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors du changement de statut");
    }
  };

  const filteredSuccursales = succursales.filter((item) => {
    const matchesSearch =
      item.nom.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.ville.toLowerCase().includes(search.toLowerCase()) ||
      item.adresse.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      selectedType === "TOUT" || item.type === selectedType;

    const matchesActivite =
      selectedActivite === "TOUT" || item.activite === selectedActivite;

    const matchesActive = !onlyActive || item.actif;

    return matchesSearch && matchesType && matchesActivite && matchesActive;
  });

  const totalCount = succursales.length;
  const shippingCount = succursales.filter((s) => s.activite === "SHIPPING" || s.activite === "MIXTE").length;
  const boutiqueCount = succursales.filter((s) => s.activite === "BOUTIQUE" || s.activite === "MIXTE").length;

  const getTypeBadge = (t: TypeSuccursale) => {
    switch (t) {
      case "DEPOT_USA":
        return (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 rounded-[6px]">
            <Globe className="h-3 w-3 mr-1" />
            Dépôt USA
          </Badge>
        );
      case "POINT_RELAIS":
        return (
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 rounded-[6px]">
            <MapPin className="h-3 w-3 mr-1" />
            Point Relais
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 rounded-[6px]">
            <Building2 className="h-3 w-3 mr-1" />
            Agence Haïti
          </Badge>
        );
    }
  };

  const getActiviteBadge = (a: ActiviteSuccursale) => {
    switch (a) {
      case "BOUTIQUE":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 rounded-[6px]">
            <ShoppingBag className="h-3 w-3 mr-1" />
            Boutique
          </Badge>
        );
      case "MIXTE":
        return (
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 rounded-[6px]">
            <Store className="h-3 w-3 mr-1" />
            Shipping & Boutique
          </Badge>
        );
      default:
        return (
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 rounded-[6px]">
            <PackageCheck className="h-3 w-3 mr-1" />
            Shipping
          </Badge>
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Building2 className="h-7 w-7 text-brand-orange" />
              Succursales & Points de Service
            </h1>
            <p className="text-sm text-brand-grey mt-0.5">
              Gestion des agences Shipping, Boutiques physiques et Dépôts logistiques
            </p>
          </div>

          {isSuperAdmin && (
            <Button
              onClick={() => {
                setEditingSuccursale(null);
                setDialogOpen(true);
              }}
              className="bg-brand-orange text-white hover:bg-brand-orange/90 font-bold shadow-md rounded-[8px]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une succursale
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl w-full mx-auto">
        {errorMsg && (
          <div className="flex items-center gap-2 p-4 rounded-[10px] bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Stat Cards Header */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-[10px] bg-white/5 border border-white/15 p-4 backdrop-blur-xl flex items-center gap-4">
            <div className="rounded-[8px] bg-brand-orange/15 p-3 text-brand-orange">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-brand-grey font-medium">Total Succursales</p>
              <h3 className="text-2xl font-black text-white mt-0.5">{totalCount}</h3>
            </div>
          </div>

          <div className="rounded-[10px] bg-white/5 border border-white/15 p-4 backdrop-blur-xl flex items-center gap-4">
            <div className="rounded-[8px] bg-blue-500/15 p-3 text-blue-400">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-brand-grey font-medium">Points Shipping & Fret</p>
              <h3 className="text-2xl font-black text-white mt-0.5">{shippingCount}</h3>
            </div>
          </div>

          <div className="rounded-[10px] bg-white/5 border border-white/15 p-4 backdrop-blur-xl flex items-center gap-4">
            <div className="rounded-[8px] bg-emerald-500/15 p-3 text-emerald-400">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-brand-grey font-medium">Boutiques & Showrooms</p>
              <h3 className="text-2xl font-black text-white mt-0.5">{boutiqueCount}</h3>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="rounded-[10px] bg-white/5 border border-white/15 p-4 backdrop-blur-xl space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-grey" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, code, ville, adresse..."
                className="pl-10 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-brand-orange focus:ring-brand-orange rounded-[8px]"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Switcher (Grid vs List) */}
              <div className="flex items-center p-1 rounded-[8px] bg-white/5 border border-white/15">
                <button
                  onClick={() => setViewMode("GRID")}
                  title="Affichage en Grille"
                  className={`p-1.5 rounded-[6px] text-xs font-medium transition-all ${
                    viewMode === "GRID"
                      ? "bg-brand-orange text-white shadow-md"
                      : "text-brand-grey hover:text-white"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("LIST")}
                  title="Affichage en Liste"
                  className={`p-1.5 rounded-[6px] text-xs font-medium transition-all ${
                    viewMode === "LIST"
                      ? "bg-brand-orange text-white shadow-md"
                      : "text-brand-grey hover:text-white"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Status Filter toggle */}
              <Button
                variant={onlyActive ? "default" : "outline"}
                onClick={() => setOnlyActive(!onlyActive)}
                className={`rounded-[8px] ${
                  onlyActive
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30"
                    : "bg-white/5 border-white/15 text-brand-grey hover:text-white"
                }`}
              >
                {onlyActive ? <CheckCircle2 className="h-4 w-4 mr-2" /> : null}
                Seulement les actives
              </Button>
            </div>
          </div>

          {/* Activity & Type Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            <span className="text-xs text-brand-grey font-medium mr-2">Activité :</span>
            {[
              { id: "TOUT", label: "Toutes les activités" },
              { id: "SHIPPING", label: "📦 Shipping & Fret" },
              { id: "BOUTIQUE", label: "🛍️ Boutiques" },
              { id: "MIXTE", label: "🏪 Mixtes (Shipping + Boutique)" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedActivite(tab.id)}
                className={`px-3 py-1 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedActivite === tab.id
                    ? "bg-brand-orange text-white shadow-sm"
                    : "bg-white/5 text-brand-grey hover:bg-white/10 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            <span className="text-xs text-brand-grey font-medium mr-2">Localisation :</span>
            {[
              { id: "TOUT", label: "Tous les pays" },
              { id: "AGENCE_HAITI", label: "Agences Haïti" },
              { id: "DEPOT_USA", label: "Entrepôts USA" },
              { id: "POINT_RELAIS", label: "Points Relais" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedType === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white/5 text-brand-grey hover:bg-white/10 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 rounded-[10px] bg-white/5 border border-white/10 animate-pulse"
              />
            ))}
          </div>
        ) : filteredSuccursales.length === 0 ? (
          /* Empty State */
          <div className="rounded-[10px] bg-white/5 border border-white/15 p-12 text-center backdrop-blur-xl">
            <Building2 className="h-12 w-12 text-brand-grey mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-bold text-white mb-1">Aucune succursale trouvée</h3>
            <p className="text-sm text-brand-grey max-w-md mx-auto mb-6">
              {search
                ? `Aucun résultat pour "${search}"`
                : "Aucune succursale enregistrée dans cette catégorie."}
            </p>
            {isSuperAdmin && (
              <Button
                onClick={() => {
                  setEditingSuccursale(null);
                  setDialogOpen(true);
                }}
                className="bg-brand-orange text-white hover:bg-brand-orange/90 font-bold rounded-[8px]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une succursale
              </Button>
            )}
          </div>
        ) : viewMode === "GRID" ? (
          /* Grid View Mode */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSuccursales.map((succursale) => (
              <div
                key={succursale.id}
                className={`rounded-[10px] bg-white/5 border ${
                  succursale.actif
                    ? "border-white/15 hover:border-brand-orange/40"
                    : "border-red-500/30 opacity-70"
                } p-5 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between group hover:shadow-lg`}
              >
                <div className="space-y-4">
                  {/* Header: Code & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-[4px] bg-white/10 text-white font-mono text-xs font-bold border border-white/20">
                          {succursale.code}
                        </span>
                        {getTypeBadge(succursale.type)}
                        {getActiviteBadge(succursale.activite)}
                      </div>
                      <h2 className="text-lg font-bold text-white group-hover:text-brand-orange transition-colors">
                        {succursale.nom}
                      </h2>
                    </div>

                    <Badge
                      className={`rounded-[6px] shrink-0 ${
                        succursale.actif
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}
                    >
                      {succursale.actif ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ouvert
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactif
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Address & City */}
                  <div className="rounded-[8px] bg-white/5 p-3 border border-white/10 space-y-1">
                    <div className="flex items-start gap-2 text-sm text-white/90">
                      <MapPin className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
                      <span>
                        {succursale.adresse},{" "}
                        <strong className="text-white">{succursale.ville}</strong> ({succursale.pays})
                      </span>
                    </div>
                    {succursale.horaires && (
                      <div className="flex items-center gap-2 text-xs text-brand-grey pt-1 border-t border-white/10">
                        <span>{succursale.horaires}</span>
                      </div>
                    )}
                  </div>

                  {/* Contacts & Responsable Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {succursale.telephone && (
                      <a
                        href={`tel:${succursale.telephone}`}
                        className="flex items-center gap-2 p-2 rounded-[6px] bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5 text-brand-orange" />
                        <span className="truncate">{succursale.telephone}</span>
                      </a>
                    )}

                    {succursale.whatsapp && (
                      <a
                        href={`https://wa.me/${succursale.whatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-[6px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>WhatsApp Direct</span>
                      </a>
                    )}

                    {succursale.email && (
                      <a
                        href={`mailto:${succursale.email}`}
                        className="flex items-center gap-2 p-2 rounded-[6px] bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5 text-blue-400" />
                        <span className="truncate">{succursale.email}</span>
                      </a>
                    )}

                    {succursale.responsable && (
                      <div className="flex items-center gap-2 p-2 rounded-[6px] bg-white/5 border border-white/10 text-white/80">
                        <User className="h-3.5 w-3.5 text-purple-400" />
                        <span className="truncate">{succursale.responsable}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-4 mt-4 border-t border-white/10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setViewingSuccursaleId(succursale.id);
                      setDetailsModalOpen(true);
                    }}
                    className="flex-1 min-w-[110px] bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-blue-400/50 text-xs rounded-[6px]"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5 text-blue-400 shrink-0" />
                    <span className="truncate">Détails</span>
                  </Button>

                  {isSuperAdmin && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingSuccursale(succursale);
                          setDialogOpen(true);
                        }}
                        className="flex-1 min-w-[100px] bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-brand-orange/50 text-xs rounded-[6px]"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1.5 text-brand-orange shrink-0" />
                        <span className="truncate">Modifier</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActif(succursale.id)}
                        className={`flex-1 min-w-[105px] text-xs rounded-[6px] ${
                          succursale.actif
                            ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                        }`}
                      >
                        <Power className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                        <span className="truncate">{succursale.actif ? "Désactiver" : "Activer"}</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List / Table View Mode */
          <div className="bg-white/5 border border-white/15 backdrop-blur-xl rounded-[10px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white">
                <thead className="border-b border-white/10 text-[11px] font-bold text-brand-grey uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Code & Succursale</th>
                    <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type & Activité</th>
                    <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Localisation</th>
                    <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contacts</th>
                    <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Horaires</th>
                    <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                    {isSuperAdmin && <th className="py-4 px-6 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSuccursales.map((succursale) => (
                    <tr key={succursale.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-bold text-white hover:text-brand-orange transition-colors text-sm leading-snug">
                            {succursale.nom}
                          </div>
                          <div className="flex items-center">
                            <span className="px-2 py-0.5 rounded-[4px] bg-brand-orange/15 text-brand-orange font-mono font-extrabold text-[10.5px] border border-brand-orange/30 tracking-wider">
                              {succursale.code}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getTypeBadge(succursale.type)}
                          {getActiviteBadge(succursale.activite)}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-white/80">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-brand-orange shrink-0" />
                          <span>{succursale.ville}, {succursale.pays}</span>
                        </div>
                        <span className="text-[11px] text-brand-grey block">{succursale.adresse}</span>
                      </td>

                      <td className="px-6 py-4 text-white/80">
                        <div className="space-y-0.5">
                          {succursale.telephone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-brand-orange" />
                              <span>{succursale.telephone}</span>
                            </div>
                          )}
                          {succursale.whatsapp && (
                            <div className="flex items-center gap-1 text-emerald-400">
                              <MessageSquare className="h-3 w-3" />
                              <span>WA: {succursale.whatsapp}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {succursale.horaires ? (
                          succursale.horaires.includes(":") ? (
                            <div className="space-y-0.5">
                              <div className="font-bold text-white text-xs">
                                {succursale.horaires.split(":")[0].trim()}
                              </div>
                              <div className="text-[11.5px] text-amber-400 font-medium">
                                {succursale.horaires.split(":").slice(1).join(":").trim()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-white text-xs">{succursale.horaires}</span>
                          )
                        ) : (
                          <span className="text-brand-grey text-xs italic">Non spécifié</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge
                          className={`rounded-[6px] ${
                            succursale.actif
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }`}
                        >
                          {succursale.actif ? "Ouvert" : "Inactif"}
                        </Badge>
                      </td>

                      {isSuperAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setViewingSuccursaleId(succursale.id);
                                setDetailsModalOpen(true);
                              }}
                              className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-[6px]"
                              title="Voir les détails"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingSuccursale(succursale);
                                setDialogOpen(true);
                              }}
                              className="h-8 w-8 text-white/70 hover:text-brand-orange hover:bg-white/10 rounded-[6px]"
                              title="Modifier"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleToggleActif(succursale.id)}
                              className={`h-8 w-8 rounded-[6px] ${
                                succursale.actif
                                  ? "text-red-400 hover:bg-red-500/20"
                                  : "text-emerald-400 hover:bg-emerald-500/20"
                              }`}
                              title={succursale.actif ? "Désactiver" : "Activer"}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <SuccursaleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        succursale={editingSuccursale}
        onSuccess={loadSuccursales}
      />

      {/* Details & Members Modal */}
      <SuccursaleDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setViewingSuccursaleId(null);
        }}
        succursaleId={viewingSuccursaleId}
      />
    </div>
  );
}
