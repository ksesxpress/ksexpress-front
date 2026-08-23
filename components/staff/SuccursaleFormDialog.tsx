"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  MapPin,
  Phone,
  MessageSquare,
  Mail,
  User,
  Clock,
  Code,
  Globe,
  Loader2,
  AlertCircle,
  Store,
  Sparkles,
} from "lucide-react";
import {
  createSuccursale,
  updateSuccursale,
  Succursale,
  TypeSuccursale,
  ActiviteSuccursale,
} from "@/lib/api/succursales";

interface SuccursaleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  succursale?: Succursale | null;
  onSuccess: () => void;
}

const labelClass = "text-[12px] font-bold text-white/70 uppercase tracking-wider mb-1 block flex items-center gap-1.5";
const fieldClass = "w-full h-11 px-3 bg-white/5 border border-white/10 rounded-[8px] text-[14px] text-white font-medium focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange placeholder:text-white/30";

const DAYS_OPTIONS = [
  "Lun - Sam",
  "Lun - Ven",
  "Lun - Dim",
  "Mar - Sam",
  "Sam - Dim",
];

const TIME_OPEN_OPTIONS = [
  "7:00 AM",
  "7:30 AM",
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
];

const TIME_CLOSE_OPTIONS = [
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "8:00 PM",
];

export function SuccursaleFormDialog({
  open,
  onOpenChange,
  succursale,
  onSuccess,
}: SuccursaleFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [nom, setNom] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<TypeSuccursale>("AGENCE_HAITI");
  const [activite, setActivite] = useState<ActiviteSuccursale>("SHIPPING");
  const [adresse, setAdresse] = useState("");
  const [ville, setVille] = useState("");
  const [pays, setPays] = useState("Haïti");
  const [telephone, setTelephone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [responsable, setResponsable] = useState("");
  const [horaires, setHoraires] = useState("");
  const [note, setNote] = useState("");

  // Time slot builder states
  const [selectedDays, setSelectedDays] = useState("Lun - Sam");
  const [selectedOpenTime, setSelectedOpenTime] = useState("8:00 AM");
  const [selectedCloseTime, setSelectedCloseTime] = useState("5:00 PM");

  useEffect(() => {
    setErrorMsg("");
    if (succursale) {
      setNom(succursale.nom);
      setCode(succursale.code);
      setType(succursale.type);
      setActivite(succursale.activite || "SHIPPING");
      setAdresse(succursale.adresse);
      setVille(succursale.ville);
      setPays(succursale.pays || "Haïti");
      setTelephone(succursale.telephone || "");
      setWhatsapp(succursale.whatsapp || "");
      setEmail(succursale.email || "");
      setResponsable(succursale.responsable || "");
      setHoraires(succursale.horaires || "Lun - Sam : 8:00 AM - 5:00 PM");
      setNote(succursale.note || "");
    } else {
      setNom("");
      setCode("");
      setType("AGENCE_HAITI");
      setActivite("SHIPPING");
      setAdresse("");
      setVille("");
      setPays("Haïti");
      setTelephone("");
      setWhatsapp("");
      setEmail("");
      setResponsable("");
      setHoraires("Lun - Sam : 8:00 AM - 5:00 PM");
      setNote("");
    }
  }, [succursale, open]);

  const applySlotBuilder = (days: string, openT: string, closeT: string) => {
    setSelectedDays(days);
    setSelectedOpenTime(openT);
    setSelectedCloseTime(closeT);
    setHoraires(`${days} : ${openT} - ${closeT}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!nom || !code || !adresse || !ville) {
      setErrorMsg("Veuillez remplir les champs obligatoires (Nom, Code, Adresse, Ville)");
      return;
    }

    setLoading(true);
    try {
      if (succursale) {
        await updateSuccursale(succursale.id, {
          nom,
          code,
          type,
          activite,
          adresse,
          ville,
          pays,
          telephone,
          whatsapp,
          email,
          responsable,
          horaires,
          note,
        });
      } else {
        await createSuccursale({
          nom,
          code,
          type,
          activite,
          adresse,
          ville,
          pays,
          telephone,
          whatsapp,
          email,
          responsable,
          horaires,
          note,
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur s'est produite lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto bg-[#0a0a0f] border-white/10 text-white rounded-[16px] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-extrabold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-orange" />
            {succursale ? "Modifier la succursale" : "Ajouter une succursale"}
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-sm font-semibold mt-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className={labelClass}>
                <Building2 className="h-3.5 w-3.5 text-brand-orange" />
                Nom de la succursale *
              </Label>
              <Input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Cap-Haïtien — Agence Principale"
                className={fieldClass}
                required
              />
            </div>

            <div>
              <Label className={labelClass}>
                <Code className="h-3.5 w-3.5 text-brand-orange" />
                Code d’identification *
              </Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: CAP-01, MIA-01"
                className={`${fieldClass} uppercase`}
                required
              />
            </div>

            <div>
              <Label className={labelClass}>
                <Globe className="h-3.5 w-3.5 text-brand-orange" />
                Type de succursale
              </Label>
              <Select value={type} onValueChange={(val: TypeSuccursale) => setType(val)}>
                <SelectTrigger className={fieldClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-[#0a0a0f] text-white rounded-[10px] z-[100]">
                  <SelectItem value="AGENCE_HAITI" className="focus:bg-white/10 cursor-pointer text-[14px] text-white focus:text-white">
                    Agence Haïti (Retrait & Distribution)
                  </SelectItem>
                  <SelectItem value="DEPOT_USA" className="focus:bg-white/10 cursor-pointer text-[14px] text-white focus:text-white">
                    Dépôt Transit USA (Réception)
                  </SelectItem>
                  <SelectItem value="POINT_RELAIS" className="focus:bg-white/10 cursor-pointer text-[14px] text-white focus:text-white">
                    Point Relais International
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className={labelClass}>
                <Store className="h-3.5 w-3.5 text-emerald-600" />
                Activité / Service principal *
              </Label>
              <Select value={activite} onValueChange={(val: ActiviteSuccursale) => setActivite(val)}>
                <SelectTrigger className={fieldClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-[#0a0a0f] text-white rounded-[10px] z-[100]">
                  <SelectItem value="SHIPPING" className="focus:bg-white/10 cursor-pointer text-[14px] text-white focus:text-white">
                    📦 Shipping & Colis
                  </SelectItem>
                  <SelectItem value="BOUTIQUE" className="focus:bg-white/10 cursor-pointer text-[14px] text-white focus:text-white">
                    🛍️ Boutique & Showroom
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label className={labelClass}>
                <MapPin className="h-3.5 w-3.5 text-brand-orange" />
                Adresse *
              </Label>
              <Input
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Ex: # 35, Angle des rues 20 I-J"
                className={fieldClass}
                required
              />
            </div>

            <div>
              <Label className={labelClass}>Ville *</Label>
              <Input
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                placeholder="Ex: Cap-Haïtien, Miami"
                className={fieldClass}
                required
              />
            </div>

            <div>
              <Label className={labelClass}>Pays</Label>
              <Input
                value={pays}
                onChange={(e) => setPays(e.target.value)}
                placeholder="Ex: Haïti, États-Unis"
                className={fieldClass}
              />
            </div>

            <div>
              <Label className={labelClass}>
                <Phone className="h-3.5 w-3.5 text-brand-orange" />
                Téléphone
              </Label>
              <Input
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex: +509 34 04 3288"
                className={fieldClass}
              />
            </div>

            <div>
              <Label className={labelClass}>
                <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                WhatsApp
              </Label>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ex: 50934043288"
                className={fieldClass}
              />
            </div>

            <div>
              <Label className={labelClass}>
                <Mail className="h-3.5 w-3.5 text-blue-600" />
                Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: cap@ksexpress.com"
                className={fieldClass}
              />
            </div>

            <div>
              <Label className={labelClass}>
                <User className="h-3.5 w-3.5 text-purple-600" />
                Responsable / Manager
              </Label>
              <Input
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                placeholder="Ex: Jean-Baptiste Marc"
                className={fieldClass}
              />
            </div>

            {/* Structured Time Slot Picker (Créneaux Horaires) */}
            <div className="sm:col-span-2 space-y-2 p-3.5 bg-white/5 border border-white/10 rounded-[10px]">
              <div className="flex items-center justify-between">
                <Label className={labelClass.replace("mb-1", "")}>
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  Créneaux Horaires d’Ouverture
                </Label>
                <span className="text-[11px] text-brand-grey font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-brand-orange" />
                  Générateur automatique
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applySlotBuilder("Lun - Sam", "8:00 AM", "5:00 PM")}
                  className="px-2.5 py-1 rounded-[6px] border border-white/10 text-[11px] font-bold text-white/80 hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-colors"
                >
                  ⚡ Haïti (Lun-Sam 8h-17h)
                </button>
                <button
                  type="button"
                  onClick={() => applySlotBuilder("Lun - Ven", "9:00 AM", "6:00 PM")}
                  className="px-2.5 py-1 rounded-[6px] border border-white/10 text-[11px] font-bold text-white/80 hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-colors"
                >
                  ⚡ USA (Lun-Ven 9h-18h)
                </button>
                <button
                  type="button"
                  onClick={() => applySlotBuilder("Lun - Ven", "8:00 AM", "4:30 PM")}
                  className="px-2.5 py-1 rounded-[6px] border border-white/10 text-[11px] font-bold text-white/80 hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-colors"
                >
                  ⚡ Continue (8h-16h30)
                </button>
                <button
                  type="button"
                  onClick={() => applySlotBuilder("Lun - Dim", "8:00 AM", "8:00 PM")}
                  className="px-2.5 py-1 rounded-[6px] border border-white/10 text-[11px] font-bold text-white/80 hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-colors"
                >
                  ⚡ 7j/7 (8h-20h)
                </button>
              </div>

              {/* Selectors grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <span className="text-[11px] font-semibold text-brand-grey block mb-1">Jours ouvrables</span>
                  <Select
                    value={selectedDays}
                    onValueChange={(d) => applySlotBuilder(d, selectedOpenTime, selectedCloseTime)}
                  >
                    <SelectTrigger className="h-9 px-2.5 border-white/10 bg-white/5 text-white text-[13px] font-medium rounded-[6px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0a0a0f] text-white rounded-[6px]">
                      {DAYS_OPTIONS.map((d) => (
                        <SelectItem key={d} value={d} className="text-[13px]">
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-brand-grey block mb-1">Heure ouverture</span>
                  <Select
                    value={selectedOpenTime}
                    onValueChange={(o) => applySlotBuilder(selectedDays, o, selectedCloseTime)}
                  >
                    <SelectTrigger className="h-9 px-2.5 border-white/10 bg-white/5 text-white text-[13px] font-medium rounded-[6px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0a0a0f] text-white rounded-[6px]">
                      {TIME_OPEN_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o} className="text-[13px]">
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-brand-grey block mb-1">Heure fermeture</span>
                  <Select
                    value={selectedCloseTime}
                    onValueChange={(c) => applySlotBuilder(selectedDays, selectedOpenTime, c)}
                  >
                    <SelectTrigger className="h-9 px-2.5 border-white/10 bg-white/5 text-white text-[13px] font-medium rounded-[6px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0a0a0f] text-white rounded-[6px]">
                      {TIME_CLOSE_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c} className="text-[13px]">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Result Preview Input */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-brand-grey block mb-1">Texte enregistré sur la succursale (Ajustable à la main)</span>
                <Input
                  value={horaires}
                  onChange={(e) => setHoraires(e.target.value)}
                  placeholder="Ex: Lun - Sam : 8:00 AM - 5:00 PM"
                  className={fieldClass}
                />
              </div>
            </div>

          </div>

          <DialogFooter className="pt-4 border-t border-white/10 gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-transparent border border-white/10 text-white hover:bg-white/10 font-bold h-11 rounded-[8px]"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 rounded-[8px] bg-gradient-to-br from-brand-orange to-brand-orange-dark text-[14px] font-bold text-white shadow-md hover:opacity-90 disabled:opacity-70 px-6"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {succursale ? "Enregistrer les modifications" : "Créer la succursale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
