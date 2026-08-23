"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useActiveSection } from "@/lib/use-active-section";

const links = [
  { id: "accueil", href: "/#accueil", label: "Accueil" },
  { id: "services", href: "/#services", label: "Services" },
  { id: "tracking", href: "/#tracking", label: "Suivi de colis" },
  { id: "apropos", href: "/#apropos", label: "À propos" },
  { id: "contact", href: "/#contact", label: "Contact" },
] as const;

const SECTION_IDS = links.map((link) => link.id);

export function Navbar() {
  const [open, setOpen] = useState(false);
  const activeId = useActiveSection(SECTION_IDS);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_2px_14px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/#accueil" className="shrink-0">
          <Image
            src="/logo.png"
            alt="KS Express Service"
            width={440}
            height={300}
            priority
            className="h-10 w-auto sm:h-12"
          />
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {links.map((link) => {
            const isActive = link.id === activeId;
            return (
              <li key={link.href} className="relative">
                <a
                  href={link.href}
                  aria-current={isActive ? "true" : undefined}
                  className={`block py-1 text-sm font-semibold transition-colors ${isActive
                    ? "text-brand-orange-text"
                    : "text-[#3a3128] hover:text-brand-orange-text"
                    }`}
                >
                  {link.label}
                </a>
                {isActive && (
                  <motion.span
                    layoutId="nav-active-underline"
                    className="absolute right-0 -bottom-0.5 left-0 h-0.5 rounded-full bg-brand-orange-dark"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-full bg-gradient-to-br from-brand-orange to-brand-orange-dark px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,89,13,0.35)] sm:inline-block"
          >
            Connexion
          </Link>
          <button
            type="button"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="text-brand-dark md:hidden"
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {open && (
        <ul className="flex flex-col gap-4 border-t border-black/5 bg-white px-6 py-5 shadow-[0_10px_20px_rgba(0,0,0,0.08)] md:hidden">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block text-sm font-semibold text-[#3a3128]"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="inline-block rounded-full bg-gradient-to-br from-brand-orange to-brand-orange-dark px-5 py-2.5 text-sm font-bold text-white"
            >
              Connexion
            </Link>
          </li>
        </ul>
      )}
    </header>
  );
}
