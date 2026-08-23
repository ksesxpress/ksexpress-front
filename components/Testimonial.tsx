"use client";

import { motion } from "motion/react";
import { Star } from "lucide-react";

export function Testimonial() {
  return (
    <section className="bg-brand-light py-16">
      <div className="mx-auto max-w-4xl px-6">
        <motion.figure
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="flex flex-col items-start gap-5 rounded-[20px] border border-[#f2e6d6] bg-white p-8 sm:flex-row sm:items-center sm:p-10"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-brand-orange-dark text-lg font-extrabold text-white">
            WP
          </div>
          <div>
            <div className="mb-2 flex gap-0.5 text-brand-yellow">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={15} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <blockquote className="mb-3 text-[16px] leading-relaxed text-brand-dark">
              « Ma sœur m&apos;envoie des colis depuis Miami presque chaque
              mois. Avant, j&apos;appelais le bureau tous les deux jours pour
              savoir si mon colis était arrivé. Maintenant je reçois un
              message WhatsApp le jour même où il faut aller le chercher — ça
              change tout. »
            </blockquote>
            <figcaption className="text-[13.5px] font-semibold text-brand-grey">
              Widelene P.{" "}
              <span className="font-normal">— cliente à Cap-Haïtien</span>
            </figcaption>
          </div>
        </motion.figure>
      </div>
    </section>
  );
}
