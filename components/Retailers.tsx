"use client";

import { motion } from "motion/react";

// Noms en texte brut (pas de logos stylisés) — évite l'exposition liée à
// l'usage de marques déposées, tout en gardant l'effet "mur de confiance"
// classique des services de shipping/forwarding.
const retailers = [
  "Amazon",
  "Walmart",
  "eBay",
  "Target",
  "Best Buy",
  "Macy's",
  "Home Depot",
  "Lowe's",
  "Kohl's",
  "JCPenney",
  "Nike",
  "Apple",
  "Zara",
  "Shein",
  "Temu",
  "Costco",
];

export function Retailers() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="mb-14 flex items-center justify-center gap-5"
        >
          <span className="hidden h-px flex-1 bg-[#eadfcf] sm:block" />
          <h2 className="min-w-0 text-center text-2xl font-extrabold text-white sm:shrink-0 sm:text-3xl">
            Achetez chez n&apos;importe quel détaillant en ligne
          </h2>
          <span className="hidden h-px flex-1 bg-[#eadfcf] sm:block" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 gap-x-8 gap-y-8 text-center sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        >
          {retailers.map((name) => (
            <span
              key={name}
              className="text-lg font-bold text-brand-grey/70 transition-colors hover:text-brand-orange-dark"
            >
              {name}
            </span>
          ))}
        </motion.div>

        <p className="mt-10 text-center text-[13.5px] text-white/70">
          Achetez où vous voulez aux États-Unis — nous recevons, vérifions et
          expédions votre colis vers Haïti.
        </p>
      </div>
    </section>
  );
}
