import Image from "next/image";

const navLinks = [
  { href: "/#accueil", label: "Accueil" },
  { href: "/#services", label: "Services" },
  { href: "/#tracking", label: "Suivi de colis" },
  { href: "/#apropos", label: "À propos" },
  { href: "/#contact", label: "Contact" },
];

const clientLinks = [
  { href: "/login", label: "Connexion" },
  { href: "/register", label: "Créer un compte" },
  { href: "/#tracking", label: "Suivi public" },
];

export function Footer() {
  return (
    <footer className="bg-brand-gradient py-12 text-[#cfc6ba]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap justify-between gap-8 border-b border-white/8 pb-8">
          <div className="max-w-58">
            <Image
              src="/logo.png"
              alt="KS Express Service"
              width={440}
              height={300}
              className="mb-3 h-9.5 w-auto"
            />
            <p className="text-[13px]">
              Votre partenaire de confiance entre les États-Unis et Haïti —
              shipping, vente et paiements digitaux.
            </p>
          </div>

          <div>
            <h5 className="mb-3.5 text-sm text-white">Navigation</h5>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href} className="text-[13.5px]">
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="mb-3.5 text-sm text-white">Espace client</h5>
            <ul className="space-y-2">
              {clientLinks.map((link) => (
                <li key={link.label} className="text-[13.5px]">
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-4.5 text-center text-xs text-[#8a8072]">
          © 2026 KS Express Service — Tous droits réservés · Site développé
          par Nekzoris
        </div>
      </div>
    </footer>
  );
}
