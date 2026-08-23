"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getPublicSettings } from "@/lib/api/parametres";

// Valeurs par défaut = repli si l'appel API échoue ou pendant le
// chargement — voir ParametresService.getEntrepriseInfo côté backend
// (même contenu que les anciennes valeurs en dur ici).
const ADRESSE_DEFAUT = "# 35, Angle des rues 20 I-J, Cap-Haïtien, Haïti";
const TELEPHONE_DEFAUT = "+509 34 04 3288 (depuis l'étranger : +1 567 366-6696)";
const EMAIL_DEFAUT = "ksexpressservice2025@gmail.com";
const WHATSAPP_DEFAUT = "50934043288";

export function Contact() {
  const [adresse, setAdresse] = useState(ADRESSE_DEFAUT);
  const [telephone, setTelephone] = useState(TELEPHONE_DEFAUT);
  const [emailSupport, setEmailSupport] = useState(EMAIL_DEFAUT);
  const [whatsapp, setWhatsapp] = useState(WHATSAPP_DEFAUT);

  useEffect(() => {
    getPublicSettings()
      .then((info) => {
        if (info.adresse) setAdresse(info.adresse);
        if (info.telephone) setTelephone(info.telephone);
        if (info.emailSupport) setEmailSupport(info.emailSupport);
        if (info.whatsapp) setWhatsapp(info.whatsapp);
      })
      .catch(() => {
        // Site vitrine — pas de blocage, on garde les valeurs par défaut.
      });
  }, []);

  const infoItems = [
    { icon: MapPin, title: "Adresse", value: adresse },
    { icon: Phone, title: "Téléphone / WhatsApp", value: telephone },
    { icon: Mail, title: "Email", value: emailSupport },
    {
      icon: Clock,
      title: "Horaires",
      value: "Lun – Ven : 8h00 – 16h00 · Sam : 8h00 – 14h00",
    },
  ];

  return (
    <section id="contact" className="scroll-mt-16 py-20 sm:scroll-mt-18">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-xl text-center"
        >
          <span className="text-xs font-bold tracking-wider text-brand-orange-text uppercase">
            Contact
          </span>
          <h2 className="mt-2.5 mb-3 text-3xl font-extrabold text-white">
            Une question ? Écrivez-nous
          </h2>
          <p className="text-[15.5px] text-white/70">
            Notre équipe vous répond rapidement, par email, téléphone ou
            WhatsApp — le canal le plus rapide pour la plupart de nos
            clients.
          </p>
        </motion.div>

        <div className="flex flex-wrap gap-12">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            onSubmit={(e) => e.preventDefault()}
            className="flex-1 basis-105 rounded-[18px] border border-[#f2e6d6] bg-brand-light p-8"
          >
            <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
              <div>
                <Label htmlFor="name" className="mb-1.5 text-[12.5px] font-bold text-brand-dark">
                  Nom complet
                </Label>
                <Input
                  id="name"
                  placeholder="Votre nom"
                  className="h-11 rounded-[10px] border-[1.5px] border-[#eadfcf] px-3.5 focus-visible:border-brand-orange focus-visible:ring-brand-orange/30"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="mb-1.5 text-[12.5px] font-bold text-brand-dark">
                  Téléphone
                </Label>
                <Input
                  id="phone"
                  placeholder="+509 __ __ __ __"
                  className="h-11 rounded-[10px] border-[1.5px] border-[#eadfcf] px-3.5 focus-visible:border-brand-orange focus-visible:ring-brand-orange/30"
                />
              </div>
            </div>
            <div className="mb-3.5">
              <Label htmlFor="email" className="mb-1.5 text-[12.5px] font-bold text-brand-dark">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@email.com"
                className="h-11 rounded-[10px] border-[1.5px] border-[#eadfcf] px-3.5 focus-visible:border-brand-orange focus-visible:ring-brand-orange/30"
              />
            </div>
            <div className="mb-3.5">
              <Label htmlFor="message" className="mb-1.5 text-[12.5px] font-bold text-brand-dark">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="Comment pouvons-nous vous aider ?"
                className="min-h-27.5 rounded-[10px] border-[1.5px] border-[#eadfcf] px-3.5 py-3 focus-visible:border-brand-orange focus-visible:ring-brand-orange/30"
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="mt-1.5 w-full rounded-full bg-gradient-to-br from-brand-orange to-brand-orange-dark py-3.5 text-[15px] font-bold text-white"
            >
              Envoyer le message
            </motion.button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-1 basis-80"
          >
            <div className="mb-5.5 flex h-42.5 items-center justify-center gap-2 rounded-2xl border border-[#ffe4c4] bg-[repeating-linear-gradient(45deg,#FFE3B8,#FFE3B8_10px,#FFF3E2_10px,#FFF3E2_20px)] text-[13px] font-bold text-brand-orange-text">
              <MapPin size={16} />
              Carte — {adresse}
            </div>
            {infoItems.map(({ icon: Icon, title, value }) => (
              <div key={title} className="mb-4.5 flex items-start gap-3.5">
                <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand-orange to-brand-orange-dark text-white">
                  <Icon size={16} />
                </div>
                <div>
                  <h5 className="text-[13.5px] font-semibold text-brand-dark">
                    {title}
                  </h5>
                  <span className="text-[13px] text-brand-grey">{value}</span>
                </div>
              </div>
            ))}
            <p className="mb-4 text-[12.5px] text-brand-grey">
              Paiements acceptés : espèces, paiements digitaux.
            </p>
            <motion.a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-[13.5px] font-bold text-white"
            >
              <MessageCircle size={16} />
              Discuter sur WhatsApp
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
