"use client";

import { motion, type Variants } from "motion/react";
import { Package, ShoppingBag } from "lucide-react";

const boutiqueCategories = ["Vêtements", "Électronique", "Maison"];

const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function Services() {
  return (
    <section id="services" className="scroll-mt-16 py-20 sm:scroll-mt-18">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-xl text-center"
        >
          <span className="text-xs font-bold tracking-wider text-brand-orange-text uppercase">
            Nos services
          </span>
          <h2 className="mt-2.5 mb-3 text-3xl font-extrabold text-white">
            Tout ce dont vous avez besoin, en un seul endroit
          </h2>
          <p className="text-[15.5px] text-white/70">
            Shipping et vente de produits — gérés avec la même rigueur et la
            même transparence, du dépôt à la livraison.
          </p>
        </motion.div>

        <motion.div
          variants={grid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-6 md:grid-cols-5"
        >
          <motion.div
            variants={card}
            className="flex flex-col justify-between rounded-2xl border border-[#f2e6d6] bg-brand-light p-8 md:col-span-3 md:p-10"
          >
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-orange to-brand-orange-dark text-white">
                <Package size={28} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-brand-dark md:text-2xl">
                Shipping USA — Haïti
              </h3>
              <p className="max-w-md text-[15px] text-brand-grey">
                Réception au dépôt de Miami, suivi complet du colis jusqu&apos;à
                Port-au-Prince ou Cap-Haïtien, notifications automatiques et
                retrait rapide avec reçu.
              </p>
            </div>
            <div className="mt-8">
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-brand-orange/20 bg-white px-4 py-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-brand-orange" />
                <p className="text-[13px] text-brand-grey">
                  Ex : colis{" "}
                  <span className="font-semibold text-brand-dark">
                    #KSE-1042
                  </span>{" "}
                  · Miami → Cap-Haïtien · remis en main propre
                </p>
              </div>
              <a
                href="#tracking"
                className="text-sm font-bold text-brand-orange-text"
              >
                Suivre un colis →
              </a>
            </div>
          </motion.div>

          <motion.div
            variants={card}
            className="flex flex-col justify-between rounded-2xl border border-[#f2e6d6] bg-white p-8 md:col-span-2"
          >
            <div>
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark text-brand-yellow">
                <ShoppingBag size={20} />
              </div>
              <span className="text-4xl font-extrabold text-brand-orange-text">
                40+
              </span>
              <p className="mt-1 text-xs font-bold tracking-wide text-brand-dark uppercase">
                références en boutique
              </p>
              <p className="mt-3 text-[14px] text-brand-grey">
                Commandez directement en magasin, on s&apos;occupe du reste.
              </p>
            </div>
            <div className="mt-6">
              <div className="mb-4 flex flex-wrap gap-2">
                {boutiqueCategories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand-dark"
                  >
                    {category}
                  </span>
                ))}
              </div>
              <a
                href="#contact"
                className="text-sm font-bold text-brand-orange-text"
              >
                Nous contacter →
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
