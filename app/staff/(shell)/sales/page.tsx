"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Printer, Loader2, FilterX, FileText } from "lucide-react";
import { getAvailableSuccursales } from "@/lib/auth/tokens";
import { rechercheVentesRapports, type Vente } from "@/lib/api/ventes";
import { apiFetch } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatHTG } from "@/lib/utils";
import { downloadCSV } from "@/lib/export";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PrintReportHeader } from "@/components/staff/PrintReportHeader";

export default function SalesReportPage() {
  const [ventes, setVentes] = useState<Vente[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");
  const [localSuccursaleId, setLocalSuccursaleId] = useState<string>("Toutes");
  const [statutFilter, setStatutFilter] = useState<string>("TOUT");

  // On ne garde que les succursales capables de vendre (BOUTIQUE)
  const availableBranches = (getAvailableSuccursales() || []).filter(
    (b: any) => b.activite === "BOUTIQUE"
  );

  async function fetchVentes() {
    setIsLoading(true);
    try {
      const query: any = {
        allStatuses: true,
        taille: 100,
      };

      if (localSuccursaleId !== "Toutes") {
        query.succursaleId = localSuccursaleId;
      }
      
      if (dateDebut) {
        query.dateDebut = new Date(`${dateDebut}T00:00:00`).toISOString();
      }
      if (dateFin) {
        query.dateFin = new Date(`${dateFin}T23:59:59`).toISOString();
      }
      if (statutFilter !== "TOUT") {
        query.statut = statutFilter;
      }

      const res = await rechercheVentesRapports(query);
      setVentes(res.items);
    } catch (error) {
      alert("Erreur lors du chargement des ventes");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchVentes();
  }, [dateDebut, dateFin, localSuccursaleId, statutFilter]);

  function resetFilters() {
    setDateDebut("");
    setDateFin("");
    setLocalSuccursaleId("Toutes");
    setStatutFilter("TOUT");
  }

  async function handlePrint() {
    setIsLoading(true);
    try {
      let url = "/ventes/rapports/pdf?";
      const params = new URLSearchParams();
      if (localSuccursaleId !== "Toutes") params.append('succursaleId', localSuccursaleId);
      if (dateDebut) params.append('dateDebut', new Date(`${dateDebut}T00:00:00`).toISOString());
      if (dateFin) params.append('dateFin', new Date(`${dateFin}T23:59:59`).toISOString());
      if (statutFilter !== "TOUT") params.append('statut', statutFilter);

      url += params.toString();
      
      const blob: Blob = await apiFetch(url);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExportCSV() {
    setIsLoading(true);
    try {
      // Fetch all for export (up to 5000 records)
      const query: any = {
        allStatuses: true,
        taille: 5000,
      };

      if (localSuccursaleId !== "Toutes") {
        query.succursaleId = localSuccursaleId;
      }
      if (dateDebut) {
        query.dateDebut = new Date(`${dateDebut}T00:00:00`).toISOString();
      }
      if (dateFin) {
        query.dateFin = new Date(`${dateFin}T23:59:59`).toISOString();
      }
      if (statutFilter !== "TOUT") {
        query.statut = statutFilter;
      }

      const res = await rechercheVentesRapports(query);
      const allVentes = res.items;

      const exportData = allVentes.map((v: Vente) => ({
        numero: v.numero,
        date: new Intl.DateTimeFormat('fr-FR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }).format(new Date(v.createdAt)),
        boutique: v.succursale?.nom || "—",
        client: v.client ? `${v.client.prenom || ''} ${v.client.nom}`.trim() : "Client Comptoir",
        caissier: v.caissier?.nom ? `${v.caissier?.prenom || ''} ${v.caissier.nom}`.trim() : "—",
        statut: v.statut,
        total_htg: parseFloat(v.total).toFixed(2)
      }));

      downloadCSV(exportData, `Rapport_Ventes_${new Date().toISOString().split('T')[0]}.csv`, {
        numero: "Numéro Vente",
        date: "Date",
        boutique: "Boutique",
        client: "Client",
        caissier: "Caissier",
        statut: "Statut",
        total_htg: "Total (HTG)"
      });
    } catch (e) {
      alert("Erreur lors de l'exportation");
    } finally {
      setIsLoading(false);
    }
  }

  const totalVentes = ventes?.reduce((acc, v) => v.statut !== "ANNULEE" ? acc + parseFloat(v.total) : acc, 0) || 0;

  return (
    <div className="flex min-h-screen flex-col min-w-0 print:bg-white print:text-black">
      <div className="print:hidden">
        <PageHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
            <div>
              <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
                <FileText className="h-7 w-7 text-brand-orange" />
                Toutes les Ventes
                <Badge className="bg-brand-orange/20 text-brand-orange border-brand-orange/30 font-bold px-2 py-0.5 text-xs rounded-md ml-2">
                  {ventes?.length || 0} Total
                </Badge>
              </h1>
              <p className="text-sm text-brand-grey mt-0.5">Rapport global des ventes pour les boutiques KS Steel Glow</p>
            </div>
            
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
        title="Rapport des Ventes" 
        subtitle={`${localSuccursaleId === "Toutes" ? "Toutes les succursales" : availableBranches.find(b => b.id === localSuccursaleId)?.nom} | ${dateDebut ? ` Du ${dateDebut}` : " Depuis toujours"} ${dateFin ? ` Au ${dateFin}` : ""}`} 
      />

      <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-6 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none">
        
        <div className="rounded-[10px] bg-white/5 border border-white/15 p-4 backdrop-blur-xl print:hidden">
          <div className="flex flex-col md:flex-row flex-wrap items-end gap-4">
            
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-brand-grey">Boutique</label>
              <select
                value={localSuccursaleId}
                onChange={(e) => setLocalSuccursaleId(e.target.value)}
                className="bg-black/20 border border-white/10 text-white focus-visible:ring-brand-orange rounded-md h-9 px-3 w-full"
              >
                <option value="Toutes" className="text-black">Toutes les boutiques</option>
                {availableBranches.map((s) => (
                  <option key={s.id} value={s.id} className="text-black">
                    {s.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 flex-1 min-w-[150px]">
              <label className="text-xs font-semibold text-brand-grey">Statut</label>
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="bg-black/20 border border-white/10 text-white focus-visible:ring-brand-orange rounded-md h-9 px-3 w-full"
              >
                <option value="TOUT" className="text-black">Tous les statuts</option>
                <option value="PAYEE" className="text-black">Payées</option>
                <option value="EN_ATTENTE" className="text-black">En attente</option>
                <option value="ANNULEE" className="text-black">Annulées</option>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:flex print:gap-8 print:mb-8">
          <div className="rounded-[10px] bg-white/5 border border-white/15 p-4 backdrop-blur-xl flex flex-col items-center justify-center print:border-black print:border print:bg-transparent print:text-black print:flex-1">
            <h3 className="text-sm font-medium text-brand-grey mb-1 print:text-black">Nombre de Ventes</h3>
            <p className="text-3xl font-bold text-white print:text-black">{ventes?.length || 0}</p>
          </div>
          <div className="rounded-[10px] bg-white/5 border border-white/15 p-4 backdrop-blur-xl flex flex-col items-center justify-center print:border-black print:border print:bg-transparent print:text-black print:flex-1">
            <h3 className="text-sm font-medium text-brand-grey mb-1 print:text-black">Montant Total</h3>
            <p className="text-3xl font-bold text-green-400 print:text-black">{formatHTG(totalVentes)}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center p-8 text-brand-grey print:hidden">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Chargement...
          </div>
        ) : ventes === null || ventes.length === 0 ? (
          <div className="text-center p-8 text-brand-grey bg-black/10 rounded-[10px] border border-white/5 print:text-black print:border-none print:bg-transparent">
            Aucune vente trouvée pour ces critères.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[8px] border border-white/10 bg-black/20 print:border-none print:bg-transparent print:overflow-visible">
            <table className="w-full text-sm text-left print:border-collapse print:w-full">
              <thead className="bg-white/5 border-b border-white/10 font-semibold text-brand-grey uppercase text-xs tracking-wider print:bg-gray-100 print:text-black print:border-black">
                <tr>
                  <th className="px-4 py-3 print:border print:border-gray-300">N° Vente</th>
                  <th className="px-4 py-3 print:border print:border-gray-300">Date</th>
                  <th className="px-4 py-3 print:border print:border-gray-300">Boutique</th>
                  <th className="px-4 py-3 print:border print:border-gray-300">Client</th>
                  <th className="px-4 py-3 print:border print:border-gray-300">Caissier</th>
                  <th className="px-4 py-3 print:border print:border-gray-300">Statut</th>
                  <th className="px-4 py-3 text-right print:border print:border-gray-300">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white print:text-black print:divide-gray-300">
                {ventes.map((vente) => (
                  <tr key={vente.id} className="hover:bg-white/5 transition-colors print:hover:bg-transparent">
                    <td className="px-4 py-3 font-medium text-white print:text-black print:border print:border-gray-300">
                      {vente.numero}
                    </td>
                    <td className="px-4 py-3 text-brand-grey print:text-black print:border print:border-gray-300">
                      {new Intl.DateTimeFormat('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      }).format(new Date(vente.createdAt))}
                    </td>
                    <td className="px-4 py-3 text-brand-grey print:text-black print:border print:border-gray-300">
                      {vente.succursale?.nom || "—"}
                    </td>
                    <td className="px-4 py-3 text-brand-grey print:text-black print:border print:border-gray-300">
                      {vente.client ? `${vente.client.prenom || ''} ${vente.client.nom}`.trim() : "Client Comptoir"}
                    </td>
                    <td className="px-4 py-3 text-brand-grey print:text-black print:border print:border-gray-300">
                      {vente.caissier?.nom ? `${vente.caissier?.prenom || ''} ${vente.caissier.nom}`.trim() : "—"}
                    </td>
                    <td className="px-4 py-3 print:border print:border-gray-300 print:text-black">
                      {vente.statut === "PAYEE" ? (
                        <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 font-medium print:border-none print:text-black print:bg-transparent print:p-0">Payée</Badge>
                      ) : vente.statut === "EN_ATTENTE" ? (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium print:border-none print:text-black print:bg-transparent print:p-0">En attente</Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 font-medium print:border-none print:text-black print:bg-transparent print:p-0">Annulée</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-brand-orange print:text-black print:border print:border-gray-300">
                      {formatHTG(parseFloat(vente.total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
