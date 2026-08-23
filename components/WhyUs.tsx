"use client";

import { motion, type Variants } from "motion/react";
import { MapPin, Bell, Receipt, Lock } from "lucide-react";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

const card: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

export function WhyUs() {
  const reduceMotion = useSafeReducedMotion();

  return (
    <section className="bg-brand-gradient py-20 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <span className="text-xs font-bold tracking-wider text-brand-orange-dark uppercase">
              Pourquoi KS Express
            </span>
            <h2 className="mt-2.5 max-w-md text-3xl font-extrabold text-white">
              Une expérience digitale complète
            </h2>
          </div>
          <p className="max-w-sm text-[15.5px] text-[#cfc6ba] lg:text-right">
            Fini les appels au bureau pour savoir si un colis est arrivé : de
            Miami à Port-au-Prince ou Cap-Haïtien, chaque étape est visible
            en ligne — et confirmée par WhatsApp.
          </p>
        </motion.div>

        <motion.div
          variants={grid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-5.5 lg:grid-cols-3"
        >
          <motion.div
            variants={card}
            className="rounded-2xl border border-white/10 bg-white/6 p-7 lg:col-span-2"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange">
                <MapPin size={22} />
              </div>
              <h4 className="text-[15px] font-bold">Suivi en temps réel</h4>
            </div>
            <p className="mb-5 max-w-md text-[13.5px] text-[#cfc6ba]">
              Sachez toujours où se trouve votre colis, à chaque étape du
              trajet — de la réception au dépôt jusqu&apos;au retrait.
            </p>
            <div className="flex items-center gap-3 rounded-xl bg-black/25 px-4 py-3">
              <span className="relative flex h-2.5 w-2.5">
                <motion.span
                  className="absolute inline-flex h-full w-full rounded-full bg-brand-orange"
                  animate={
                    reduceMotion
                      ? { opacity: 0.6, scale: 1 }
                      : { opacity: [0.6, 0, 0.6], scale: [1, 1.8, 1] }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 1.8, repeat: Infinity }
                  }
                />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-orange" />
              </span>
              <span className="text-[12.5px] text-[#e8e1d6]">
                Colis #KSE-1042 · en transit vers Cap-Haïtien
              </span>
            </div>
          </motion.div>

          <motion.div
            variants={card}
            className="rounded-2xl border border-white/10 bg-white/6 p-7 text-center"
          >
            <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange">
              <Bell size={22} />
            </div>
            <h4 className="mb-2 text-[14.5px] font-bold">
              Notifications automatiques
            </h4>
            <p className="text-[12.5px] text-[#cfc6ba]">
              Email et WhatsApp dès qu&apos;un événement important survient.
            </p>
          </motion.div>

          <motion.div
            variants={card}
            className="rounded-2xl border border-white/10 bg-white/6 p-7 text-center"
          >
            <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange">
              <Receipt size={22} />
            </div>
            <h4 className="mb-2 text-[14.5px] font-bold">
              Reçus professionnels
            </h4>
            <p className="text-[12.5px] text-[#cfc6ba]">
              Facture et reçu générés automatiquement à chaque transaction.
            </p>
          </motion.div>

          <motion.div
            variants={card}
            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/6 p-7 sm:flex-row sm:items-center lg:col-span-2"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange">
              <Lock size={22} />
            </div>
            <div>
              <h4 className="mb-1 text-[14.5px] font-bold">
                Paiements sécurisés
              </h4>
              <p className="text-[12.5px] text-[#cfc6ba]">
                Paiements digitaux, espèces — tout est enregistré et tracé,
                avec un reçu à chaque transaction.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
