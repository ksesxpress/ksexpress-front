"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Check } from "lucide-react";

const checklist = [
  "Code client unique pour chaque envoi",
  "Notifications automatiques par Email et WhatsApp",
  "Reçus et factures professionnels à chaque étape",
];

export function About() {
  return (
    <section id="apropos" className="scroll-mt-16 py-20 sm:scroll-mt-18">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-15 px-6">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex min-h-85 flex-1 basis-95 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#FFE3B8] to-[#FFC59B]"
        >
          <Image
            src="/logo.png"
            alt="KS Express Service"
            width={440}
            height={300}
            className="h-35 w-auto drop-shadow-[0_10px_20px_rgba(255,89,13,0.25)]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="flex-1 basis-110"
        >
          <span className="text-xs font-bold tracking-wider text-brand-orange-text uppercase">
            À propos
          </span>
          <h2 className="mt-2.5 mb-4 text-[30px] font-extrabold text-white">
            Une entreprise haïtienne, un service moderne
          </h2>
          <p className="mb-4 text-[15px] text-white/70">
            KS Express Service accompagne ses clients entre Miami et les
            grandes villes d&apos;Haïti — Port-au-Prince, Gonaïves,
            Cap-Haïtien, Les Cayes — avec une mission simple : rendre chaque
            envoi, chaque vente et chaque paiement simple, rapide et
            transparent.
          </p>
          <p className="mb-4 text-[15px] text-white/70">
            Avec notre nouvelle plateforme digitale, nous offrons désormais à
            nos clients une autonomie complète : suivi en ligne,
            notifications automatiques et reçus professionnels — sans avoir
            à passer un coup de fil au bureau pour savoir où en est un
            colis.
          </p>
          <ul className="mt-5 space-y-2.5">
            {checklist.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[14.5px] text-white/80">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white">
                  <Check size={12} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
