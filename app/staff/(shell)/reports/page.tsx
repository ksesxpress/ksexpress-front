"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Package, DollarSign, Users, Store, Loader2, Target, Download, Printer, FilterX } from "lucide-react";
import { getShippingReports, ShippingReportData } from "@/lib/api/reports";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { downloadCSV } from "@/lib/export";
import { getAvailableSuccursales } from "@/lib/auth/tokens";
import { apiFetch } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PrintReportHeader } from "@/components/staff/PrintReportHeader";

export default function ReportsPage() {
  const [data, setData] = useState<ShippingReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");
  const [localSuccursaleId, setLocalSuccursaleId] = useState<string>("Toutes");
  const [statutFilter, setStatutFilter] = useState<string>("TOUT");

  const availableBranches = (getAvailableSuccursales() || []).filter(
    (b: any) => b.activite === "SHIPPING" || b.activite === "BOTH"
  );

  async function loadData() {
    setLoading(true);
    try {
      const filters: any = {};
      if (localSuccursaleId !== "Toutes") filters.succursaleId = localSuccursaleId;
      if (dateDebut) filters.dateDebut = dateDebut;
      if (dateFin) filters.dateFin = dateFin;
      if (statutFilter !== "TOUT") filters.statut = statutFilter;

      const res = await getShippingReports(filters);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [dateDebut, dateFin, localSuccursaleId, statutFilter]);

  function resetFilters() {
    setDateDebut("");
    setDateFin("");
    setLocalSuccursaleId("Toutes");
    setStatutFilter("TOUT");
  }

  async function handlePrint() {
    setLoading(true);
    try {
      let url = "/reports/shipping/pdf?";
      const params = new URLSearchParams();
      if (localSuccursaleId !== "Toutes") params.append('succursaleId', localSuccursaleId);
      if (dateDebut) params.append('dateDebut', dateDebut);
      if (dateFin) params.append('dateFin', dateFin);
      if (statutFilter !== "TOUT") params.append('statut', statutFilter);

      url += params.toString();
      
      const blob: Blob = await apiFetch(url);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setLoading(false);
    }
  }

  function handleExportCSV() {
    if (!data) return;
    const exportData = [
      { categorie: "Finance", metrique: "Chiffre d'Affaires", valeur: formatMoney(data.finance.chiffreAffaires) },
      { categorie: "Finance", metrique: "Encaissé", valeur: formatMoney(data.finance.encaisse) },
      { categorie: "Finance", metrique: "Créances", valeur: formatMoney(data.finance.creances) },
      { categorie: "Colis", metrique: "Total Enregistrés", valeur: data.colis.total },
      { categorie: "Colis", metrique: "En Transit", valeur: data.colis.enTransit },
      { categorie: "Colis", metrique: "Livrés", valeur: data.colis.livres },
      { categorie: "Colis", metrique: "Poids Total (lb)", valeur: data.colis.poidsTotal },
      { categorie: "Réseau", metrique: "Clients Actifs", valeur: data.clients },
      { categorie: "Réseau", metrique: "Succursales Shipping", valeur: data.succursales },
    ];
    downloadCSV(exportData, `Dashboard_Shipping_${new Date().toISOString().split('T')[0]}.csv`, {
      categorie: "Catégorie",
      metrique: "Métrique",
      valeur: "Valeur"
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#040339] print:bg-white print:text-black">
      <div className="print:hidden">
        <PageHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
            <h1 className="text-2xl font-extrabold text-white">Tableau de bord Shipping</h1>
            <div className="flex gap-2">
              <Button
                onClick={handleExportCSV}
                className="bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30 font-bold shadow-md rounded-[8px]"
              >
                <Download className="h-4 w-4 mr-2" />
                EXPORTER CSV
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-brand-orange text-white hover:bg-brand-orange/90 font-bold shadow-md rounded-[8px]"
              >
                <Printer className="h-4 w-4 mr-2" />
                IMPRIMER LE RAPPORT
              </Button>
            </div>
          </div>
        </PageHeader>
      </div>

      <PrintReportHeader 
        title="Dashboard Global Shipping" 
        subtitle={`Date d'extraction : ${new Date().toLocaleDateString('fr-FR')}`} 
      />
      
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full print:p-0 print:m-0">
        
        <div className="rounded-[10px] bg-white/5 border border-white/15 p-4 backdrop-blur-xl mb-6 print:hidden">
          <div className="flex flex-col md:flex-row flex-wrap items-end gap-4">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-brand-grey">Succursale</label>
              <select
                value={localSuccursaleId}
                onChange={(e) => setLocalSuccursaleId(e.target.value)}
                className="bg-black/20 border border-white/10 text-white focus-visible:ring-brand-orange rounded-md h-9 px-3 w-full"
              >
                <option value="Toutes" className="text-black">Toutes les succursales</option>
                {availableBranches.map((s: any) => (
                  <option key={s.id} value={s.id} className="text-black">
                    {s.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 flex-1 min-w-[150px]">
              <label className="text-xs font-semibold text-brand-grey">Statut Colis</label>
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="bg-black/20 border border-white/10 text-white focus-visible:ring-brand-orange rounded-md h-9 px-3 w-full"
              >
                <option value="TOUT" className="text-black">Tous les statuts</option>
                <option value="REGISTERED" className="text-black">Enregistré</option>
                <option value="IN_TRANSIT" className="text-black">En Transit</option>
                <option value="ARRIVED_HAITI" className="text-black">Arrivé Haïti</option>
                <option value="READY_PICKUP" className="text-black">Prêt à livrer</option>
                <option value="DELIVERED" className="text-black">Livré</option>
              </select>
            </div>

            <div className="space-y-1.5 flex-1 min-w-[150px]">
              <label className="text-xs font-semibold text-brand-grey">Date de début</label>
              <Input 
                type="date" 
                value={dateDebut} 
                onChange={(e) => setDateDebut(e.target.value)}
                className="bg-black/20 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-brand-orange rounded-md h-9 [color-scheme:dark]"
              />
            </div>

            <div className="space-y-1.5 flex-1 min-w-[150px]">
              <label className="text-xs font-semibold text-brand-grey">Date de fin</label>
              <Input 
                type="date" 
                value={dateFin} 
                onChange={(e) => setDateFin(e.target.value)}
                className="bg-black/20 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-brand-orange rounded-md h-9 [color-scheme:dark]"
              />
            </div>

            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="h-9 flex-shrink-0 bg-white/5 border-white/10 text-white hover:bg-white/10"
              title="Réinitialiser les filtres"
            >
              <FilterX className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center print:hidden">
            <Loader2 className="animate-spin text-brand-orange" size={48} />
          </div>
        ) : error ? (
          <div className="rounded-[16px] bg-red-500/10 p-6 text-center border border-red-500/20 print:hidden">
            <p className="text-red-400 font-bold">{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-8 print:space-y-6">
            
            {/* KPI Section 1: Finances */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 print:text-black print:mb-2">
                <DollarSign className="text-brand-orange print:text-black" size={20} />
                Finance (Facturation Shipping)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:flex print:gap-4 print:w-full">
                <div className="rounded-[16px] bg-white/5 p-6 backdrop-blur-xl border border-white/10 print:border-black print:bg-transparent print:flex-1">
                  <p className="text-brand-grey text-sm font-semibold mb-1 uppercase tracking-wider print:text-gray-600">Chiffre d'Affaires</p>
                  <p className="text-3xl font-extrabold text-white print:text-black">{formatMoney(data.finance.chiffreAffaires)}</p>
                </div>
                <div className="rounded-[16px] bg-white/5 p-6 backdrop-blur-xl border border-white/10 print:border-black print:bg-transparent print:flex-1">
                  <p className="text-brand-grey text-sm font-semibold mb-1 uppercase tracking-wider print:text-gray-600">Encaissé</p>
                  <p className="text-3xl font-extrabold text-green-400 print:text-black">{formatMoney(data.finance.encaisse)}</p>
                </div>
                <div className="rounded-[16px] bg-white/5 p-6 backdrop-blur-xl border border-white/10 relative overflow-hidden print:border-black print:bg-transparent print:flex-1">
                  <div className="absolute top-0 right-0 p-4 opacity-10 print:hidden">
                    <Target size={64} className="text-red-400" />
                  </div>
                  <p className="text-brand-grey text-sm font-semibold mb-1 uppercase tracking-wider relative z-10 print:text-gray-600">Créances (Impayés)</p>
                  <p className="text-3xl font-extrabold text-red-400 relative z-10 print:text-black">{formatMoney(data.finance.creances)}</p>
                </div>
              </div>
            </div>

            {/* KPI Section 2: Colis */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 print:text-black print:mb-2">
                <Package className="text-brand-orange print:text-black" size={20} />
                Volume de Colis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:flex print:gap-4 print:w-full">
                <div className="rounded-[16px] bg-white/5 p-6 backdrop-blur-xl border border-white/10 print:border-black print:bg-transparent print:flex-1">
                  <p className="text-brand-grey text-sm font-semibold mb-1 uppercase tracking-wider print:text-gray-600">Total Enregistrés</p>
                  <p className="text-3xl font-extrabold text-white print:text-black">{data.colis.total}</p>
                </div>
                <div className="rounded-[16px] bg-white/5 p-6 backdrop-blur-xl border border-white/10 print:border-black print:bg-transparent print:flex-1">
                  <p className="text-brand-grey text-sm font-semibold mb-1 uppercase tracking-wider print:text-gray-600">En Transit</p>
                  <p className="text-3xl font-extrabold text-brand-yellow print:text-black">{data.colis.enTransit}</p>
                </div>
                <div className="rounded-[16px] bg-white/5 p-6 backdrop-blur-xl border border-white/10 print:border-black print:bg-transparent print:flex-1">
                  <p className="text-brand-grey text-sm font-semibold mb-1 uppercase tracking-wider print:text-gray-600">Livrés</p>
                  <p className="text-3xl font-extrabold text-green-400 print:text-black">{data.colis.livres}</p>
                </div>
                <div className="rounded-[16px] bg-white/5 p-6 backdrop-blur-xl border border-white/10 print:border-black print:bg-transparent print:flex-1">
                  <p className="text-brand-grey text-sm font-semibold mb-1 uppercase tracking-wider print:text-gray-600">Poids Total (lb)</p>
                  <p className="text-3xl font-extrabold text-brand-orange print:text-black">{data.colis.poidsTotal} lb</p>
                </div>
              </div>
            </div>

            {/* KPI Section 3: Réseau */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 print:text-black print:mb-2">
                <Store className="text-brand-orange print:text-black" size={20} />
                Réseau & Clients
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:flex print:gap-4 print:w-full">
                <div className="rounded-[16px] bg-white/5 p-6 backdrop-blur-xl border border-white/10 flex items-center gap-4 print:border-black print:bg-transparent print:flex-1">
                  <div className="p-3 bg-brand-orange/20 rounded-full print:bg-transparent print:border print:border-gray-300">
                    <Users className="text-brand-orange print:text-black" size={24} />
                  </div>
                  <div>
                    <p className="text-brand-grey text-sm font-semibold uppercase tracking-wider print:text-gray-600">Clients Actifs</p>
                    <p className="text-2xl font-extrabold text-white print:text-black">{data.clients}</p>
                  </div>
                </div>
                <div className="rounded-[16px] bg-white/5 p-6 backdrop-blur-xl border border-white/10 flex items-center gap-4 print:border-black print:bg-transparent print:flex-1">
                  <div className="p-3 bg-brand-orange/20 rounded-full print:bg-transparent print:border print:border-gray-300">
                    <Store className="text-brand-orange print:text-black" size={24} />
                  </div>
                  <div>
                    <p className="text-brand-grey text-sm font-semibold uppercase tracking-wider print:text-gray-600">Succursales Shipping</p>
                    <p className="text-2xl font-extrabold text-white print:text-black">{data.succursales}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau des colis */}
            {data.items && data.items.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 print:text-black print:mb-2">
                  <Package className="text-brand-orange print:text-black" size={20} />
                  Détail des Colis
                </h2>
                <div className="overflow-x-auto rounded-[8px] border border-white/10 bg-black/20 print:border-none print:bg-transparent print:overflow-visible">
                  <table className="w-full text-sm text-left print:border-collapse print:w-full">
                    <thead className="bg-white/5 border-b border-white/10 font-semibold text-brand-grey uppercase text-xs tracking-wider print:bg-gray-100 print:text-black print:border-black">
                      <tr>
                        <th className="px-4 py-3 print:border print:border-gray-300">Tracking</th>
                        <th className="px-4 py-3 print:border print:border-gray-300">Date</th>
                        <th className="px-4 py-3 print:border print:border-gray-300">Client</th>
                        <th className="px-4 py-3 print:border print:border-gray-300">Destination</th>
                        <th className="px-4 py-3 print:border print:border-gray-300">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-white print:text-black print:divide-gray-300">
                      {data.items.map((colis: any) => (
                        <tr key={colis.id} className="hover:bg-white/5 transition-colors print:hover:bg-transparent">
                          <td className="px-4 py-3 font-medium text-white print:text-black print:border print:border-gray-300">
                            {colis.trackingNumber}
                          </td>
                          <td className="px-4 py-3 text-brand-grey print:text-black print:border print:border-gray-300">
                            {new Date(colis.createdAt).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-4 py-3 text-brand-grey font-medium print:text-black print:border print:border-gray-300">
                            {colis.client ? `${colis.client.prenom || ''} ${colis.client.nom}`.trim() : "—"}
                          </td>
                          <td className="px-4 py-3 text-brand-grey print:text-black print:border print:border-gray-300">
                            Global
                          </td>
                          <td className="px-4 py-3 print:border print:border-gray-300 print:text-black">
                            <Badge className="bg-white/10 text-brand-grey border border-white/20 print:border-none print:text-black print:bg-transparent print:p-0">
                              {colis.statut}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        ) : null}
      </div>
    </div>
  );
}
