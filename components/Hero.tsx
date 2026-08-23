"use client";

import { useEffect, useState } from "react";
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
  type Variants,
} from "motion/react";
import {
  Plane,
  Package as PackageIcon,
  PackageOpen,
  Van,
  Car,
  Motorbike,
  Bike,
  PersonStanding,
  type LucideIcon,
} from "lucide-react";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";



const LB_TO_KG = 0.453592;

function PriceCalculator() {
  const [grids, setGrids] = useState<any[]>([]);
  const [weight, setWeight] = useState<number | "">("");
  const [unit, setUnit] = useState<"kg" | "lb">("kg");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    import("@/lib/api/tarification").then((mod) => {
      mod.getPublicPricingGrids().then((data) => {
        setGrids(data);
      }).catch(console.error);
    });
  }, []);

  const grid = grids.find((g) => g.id === categoryId);
  const safeWeight = typeof weight === "number" && Number.isFinite(weight) ? weight : 0;
  const weightInLb = unit === "kg" ? safeWeight / LB_TO_KG : safeWeight;
  
  let price = 0;
  if (grid) {
    const enModePoids = grid.calculMode === "POIDS";
    const poidsFacture = enModePoids ? weightInLb : 0;
    const prixUnitaire = Number(grid.prixParLb);
    const fraisFixes = Number(grid.fraisFixes);
    const tauxTaxes = Number(grid.taxes);

    const sousTotal = (enModePoids ? poidsFacture * prixUnitaire : prixUnitaire) + fraisFixes;
    const montantTaxes = sousTotal * (tauxTaxes / 100);
    price = sousTotal + montantTaxes;
  }

  return (
    <>
      <h4 className="mb-1 text-xs font-semibold tracking-wide text-white/70 uppercase">
        Calculateur de prix — estimation
      </h4>
      <p className="mb-4 text-[11px] text-white/50">
        Indicatif, tarif final confirmé au dépôt.
      </p>

      <span className="mb-1.5 block text-[12px] font-semibold text-white/80">
        Poids
      </span>
      <div className="mb-3.5 flex gap-2">
        <input
          aria-label="Poids"
          type="number"
          min={0}
          step={0.5}
          value={weight}
          onChange={(e) => setWeight(Number.isNaN(e.target.valueAsNumber) ? "" : e.target.valueAsNumber)}
          className="w-full rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/50 disabled:opacity-50"
          disabled={!grid || grid.calculMode === "FIXE"}
        />
        <div className="flex shrink-0 rounded-lg border border-white/25 bg-white/10 p-0.5 text-xs font-bold">
          {(["kg", "lb"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              aria-pressed={unit === u}
              disabled={!grid || grid.calculMode === "FIXE"}
              className={`rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50 ${unit === u
                ? "bg-white text-brand-orange-text"
                : "text-white/70"
                }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <label
        htmlFor="calc-category"
        className="mb-1.5 block text-[12px] font-semibold text-white/80"
      >
        Catégorie
      </label>
      <select
        id="calc-category"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="mb-4 w-full rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/50 [&>option]:text-brand-dark disabled:opacity-50"
        disabled={grids.length === 0}
      >
        {grids.length === 0 ? (
          <option value="">Chargement...</option>
        ) : (
          <>
            <option value="" disabled>Sélectionnez une catégorie</option>
            {grids.map((g) => (
              <option key={g.id} value={g.id}>
                {g.categorie} {g.calculMode === "FIXE" ? "(Prix fixe)" : ""}
              </option>
            ))}
          </>
        )}
      </select>

      <div className="rounded-xl bg-white/10 px-4 py-3.5 text-center">
        <span className="block text-[11px] tracking-wide text-white/60 uppercase">
          Estimation
        </span>
        <span className="block text-2xl font-extrabold text-brand-yellow">
          ${price.toFixed(2)}
        </span>
      </div>
    </>

  );
}

const stats = [
  { value: "100%", label: "Colis tracés" },
  { value: "0", label: "Saisie manuelle" },
  { value: "24/7", label: "Suivi en ligne" },
  { value: "3", label: "Services intégrés" },
];

const textColumn: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

// Tracés décoratifs en fond du Hero, en écho au motif avion + lignes de
// trajectoire du logo. Chaque tracé a ses propres dimensions fixes (px) :
// le SVG du tracé et le offset-path de l'icône partagent exactement le même
// système de coordonnées locales, quel que soit l'écran. Masqués sur mobile
// (breakpoint propre à chaque tracé, voir className) pour ne pas surcharger
// le hero mobile.
type TrailConfig = {
  path: string;
  width: number;
  height: number;
  className: string;
  icon: LucideIcon;
  iconSize: number;
  // Correction de rotation propre au dessin de l'icône (déterminée à l'oeil),
  // combinée à offsetRotate:"auto" pour suivre la tangente du tracé.
  iconRotation: number;
  maxOpacity: number;
  duration: number;
  delay: number;
  // false pour les véhicules/silhouette (voiture, moto, vélo, piéton) :
  // ils glissent le long du tracé sans basculer pour suivre sa pente,
  // contrairement à un avion ou un colis. Par défaut true.
  followPath?: boolean;
  // Couleur du tracé pointillé et de l'icône. Blanc par défaut (hero clair
  // en dégradé) ; orange sur fond sombre (barre de stats).
  color?: string;
  // "absolute" (défaut) : positionné via className (top/left/right/bottom).
  // "static" : élément de grille normal, pour la grille mobile 4 colonnes
  // de la barre de stats plutôt qu'un positionnement en pourcentage.
  position?: "absolute" | "static";
};

// Le hero passe de 2 colonnes (texte + carte) à empilé entre ~1024 et
// ~1100px selon le contenu — pas exactement au breakpoint lg (1024px).
// - Les 2 premiers tracés sont réservés au mobile (sm:hidden) : versions
//   réduites logées dans la marge py-16 au-dessus du contenu.
// - Les 3 suivants, ancrés aux coins du hero, restent sûrs dès sm, car
//   ils suivent les coins de la section quel que soit l'agencement interne.
// - Les 3 derniers, ancrés au centre ou sous les boutons, dépendent du
//   layout 2 colonnes : réservés à xl (1280px), large marge de sécurité
//   au-delà du point de bascule observé.
const trails: TrailConfig[] = [
  {
    // Mobile uniquement — avion, coin supérieur droit. Tient entièrement
    // dans la marge py-16 du hero (au-dessus du titre, jamais dessous :
    // le contenu ne commence qu'après ce padding), donc sûr quel que soit
    // le nombre de lignes que prend le titre en dessous.
    path: "M 6 42 C 30 38, 48 12, 104 5",
    width: 110,
    height: 48,
    className: "top-1 right-2 sm:hidden",
    icon: Plane,
    iconSize: 13,
    iconRotation: 45,
    maxOpacity: 0.55,
    duration: 3.7,
    delay: 0.3,
  },
  {
    // Mobile uniquement — colis, coin supérieur gauche. Même logique de
    // marge que ci-dessus.
    path: "M 4 6 Q 45 34 92 12",
    width: 96,
    height: 40,
    className: "top-2 left-2 sm:hidden",
    icon: PackageIcon,
    iconSize: 12,
    iconRotation: 0,
    maxOpacity: 0.5,
    duration: 4.2,
    delay: 1.1,
  },
  {
    // Avion 1 — montée depuis le coin supérieur gauche.
    path: "M 12 108 C 90 104, 110 55, 175 48 S 270 18, 292 8",
    width: 300,
    height: 130,
    className: "hidden top-2 left-1 sm:top-3 sm:left-3 sm:block",
    icon: Plane,
    iconSize: 18,
    iconRotation: 45,
    maxOpacity: 0.85,
    duration: 4.6,
    delay: 0.2,
  },
  {
    // Avion 2 — tracé plus court et plus cambré, en haut à droite.
    path: "M 8 78 C 55 74, 80 32, 138 26 S 196 10, 208 6",
    width: 300,
    height: 130,
    className: "hidden top-0 right-6 sm:right-10 sm:block",
    icon: Plane,
    iconSize: 15,
    iconRotation: 45,
    maxOpacity: 0.7,
    duration: 5.4,
    delay: 1.6,
  },
  {
    // Colis 1 — tracé court et bas, direction différente (descend puis
    // remonte légèrement) pour ne pas ressembler aux avions.
    path: "M 8 12 Q 80 48 152 18",
    width: 160,
    height: 50,
    className: "hidden bottom-8 right-4 sm:bottom-10 sm:right-16 sm:block",
    icon: PackageIcon,
    iconSize: 15,
    iconRotation: 0,
    maxOpacity: 0.6,
    duration: 3.8,
    delay: 0.9,
  },
  {
    // Avion 3 — tracé vertical, centré entre le texte et la carte de suivi.
    // Réservé à xl : n'a de sens que quand les 2 colonnes sont côte à côte.
    path: "M 42 206 Q 8 105 40 14",
    width: 300,
    height: 130,
    className: "hidden top-16 left-1/2 -translate-x-1/2 xl:block",
    icon: Plane,
    iconSize: 14,
    iconRotation: 45,
    maxOpacity: 0.5,
    duration: 6.2,
    delay: 2.4,
  },
  {
    // Colis 2 — sous le bouton "Suivre mon colis".
    path: "M 6 20 Q 60 44 130 14",
    width: 140,
    height: 46,
    className: "hidden bottom-6 left-4 xl:block",
    icon: PackageIcon,
    iconSize: 14,
    iconRotation: 0,
    maxOpacity: 0.55,
    duration: 4.1,
    delay: 3.1,
  },
  {
    // Colis 3 — sous le bouton "Découvrir nos services".
    path: "M 6 16 Q 55 46 128 22",
    width: 140,
    height: 48,
    className: "hidden bottom-6 left-52 xl:block",
    icon: PackageIcon,
    iconSize: 14,
    iconRotation: 0,
    maxOpacity: 0.55,
    duration: 4.4,
    delay: 3.9,
  },
];

// Tracés obliques et courbes en fond de la barre de stats sombre —
// répartis sur toute la largeur (assez d'espace pour des tracés plus
// amples que ceux du hero), indépendants des 4 chiffres. Alternance
// montée/descente, en orange sur le fond sombre. Avions et colis basculent
// pour suivre la pente (followPath par défaut) ; véhicules et silhouette
// restent à plat en glissant (followPath: false).
const STATS_TRAIL_UP = "M 6 88 C 40 84, 60 30, 104 8";
const STATS_TRAIL_DOWN = "M 6 8 C 40 12, 60 66, 104 88";
// const STATS_TRAIL_COLOR = "#FFAF03";
const STATS_TRAIL_COLOR = "#ffffff";

const statsTrails: TrailConfig[] = [
  {
    path: STATS_TRAIL_UP,
    width: 110,
    height: 96,
    className: "hidden top-2 left-[2%] lg:block",
    icon: Plane,
    iconSize: 16,
    iconRotation: 45,
    maxOpacity: 0.55,
    duration: 3.4,
    delay: 0,
    color: STATS_TRAIL_COLOR,
  },
  {
    path: STATS_TRAIL_DOWN,
    width: 110,
    height: 96,
    className: "hidden top-2 left-[14%] lg:block",
    icon: Van,
    iconSize: 16,
    iconRotation: 0,
    maxOpacity: 0.55,
    duration: 4.1,
    delay: 0.5,
    followPath: false,
    color: STATS_TRAIL_COLOR,
  },
  {
    path: STATS_TRAIL_UP,
    width: 110,
    height: 96,
    className: "hidden top-2 left-[27%] lg:block",
    icon: Car,
    iconSize: 16,
    iconRotation: 0,
    maxOpacity: 0.55,
    duration: 3.8,
    delay: 1.1,
    followPath: false,
    color: STATS_TRAIL_COLOR,
  },
  {
    path: STATS_TRAIL_DOWN,
    width: 110,
    height: 96,
    className: "hidden top-2 left-[39%] lg:block",
    icon: Motorbike,
    iconSize: 16,
    iconRotation: 0,
    maxOpacity: 0.55,
    duration: 4.6,
    delay: 1.7,
    followPath: false,
    color: STATS_TRAIL_COLOR,
  },
  {
    path: STATS_TRAIL_UP,
    width: 110,
    height: 96,
    className: "hidden top-2 left-[51%] lg:block",
    icon: Bike,
    iconSize: 16,
    iconRotation: 0,
    maxOpacity: 0.55,
    duration: 3.6,
    delay: 2.2,
    followPath: false,
    color: STATS_TRAIL_COLOR,
  },
  {
    path: STATS_TRAIL_DOWN,
    width: 110,
    height: 96,
    className: "hidden top-2 left-[63%] lg:block",
    icon: PersonStanding,
    iconSize: 16,
    iconRotation: 0,
    maxOpacity: 0.55,
    duration: 4.3,
    delay: 2.8,
    followPath: false,
    color: STATS_TRAIL_COLOR,
  },
  {
    path: STATS_TRAIL_UP,
    width: 110,
    height: 96,
    className: "hidden top-2 left-[75%] lg:block",
    icon: PackageIcon,
    iconSize: 16,
    iconRotation: 0,
    maxOpacity: 0.55,
    duration: 3.9,
    delay: 3.3,
    color: STATS_TRAIL_COLOR,
  },
  {
    path: STATS_TRAIL_DOWN,
    width: 110,
    height: 96,
    className: "hidden top-2 left-[87%] lg:block",
    icon: PackageOpen,
    iconSize: 16,
    iconRotation: 0,
    maxOpacity: 0.55,
    duration: 4.5,
    delay: 3.8,
    color: STATS_TRAIL_COLOR,
  },
];

// Même 8 tracés, en grille statique 4 colonnes × 2 lignes pour mobile
// (position: "static" — élément de grille normal plutôt qu'ancré en
// pourcentage). Tracé réduit pour tenir dans une cellule ~1/4 de largeur.
const MOBILE_STATS_TRAIL_UP = "M 3 34 C 16 32, 25 12, 44 4";
const MOBILE_STATS_TRAIL_DOWN = "M 3 4 C 16 6, 25 26, 44 34";

const statsTrailsMobile: TrailConfig[] = [
  {
    path: MOBILE_STATS_TRAIL_UP,
    width: 48,
    height: 38,
    className: "",
    icon: Plane,
    iconSize: 11,
    iconRotation: 45,
    maxOpacity: 0.55,
    duration: 3.4,
    delay: 0,
    color: STATS_TRAIL_COLOR,
    position: "static",
  },
  {
    path: MOBILE_STATS_TRAIL_DOWN,
    width: 48,
    height: 38,
    className: "",
    icon: Van,
    iconSize: 11,
    iconRotation: 0,
    maxOpacity: 0.55,
    duration: 4.1,
    delay: 0.5,
    followPath: false,
    color: STATS_TRAIL_COLOR,
    position: "static",
  },
  {
    path: MOBILE_STATS_TRAIL_UP,
    width: 48,
    height: 38,
    className: "",
    icon: Car,
    iconSize: 11,
    iconRotation: 0,
    maxOpacity: 0.55,
    duration: 3.8,
    delay: 1.1,
    followPath: false,
    color: STATS_TRAIL_COLOR,
    position: "static",
  },
  {
    path: MOBILE_STATS_TRAIL_DOWN,
    width: 48,
    height: 38,
    className: "",
    icon: Motorbike,
    iconSize: 11,
    iconRotation: 0,
    maxOpacity: 0.55,
    duration: 4.6,
    delay: 1.7,
    followPath: false,
    color: STATS_TRAIL_COLOR,
    position: "static",
  },
  {
    path: MOBILE_STATS_TRAIL_UP,
    width: 48,
    height: 38,
    className: "",
    icon: Bike,
    iconSize: 11,
    iconRotation: 0,
    maxOpacity: 0.55,
    duration: 3.6,
    delay: 2.2,
    followPath: false,
    color: STATS_TRAIL_COLOR,
    position: "static",
  },
  {
    path: MOBILE_STATS_TRAIL_DOWN,
    width: 48,
    height: 38,
    className: "",
    icon: PersonStanding,
    iconSize: 11,
    iconRotation: 0,
    maxOpacity: 0.55,
    duration: 4.3,
    delay: 2.8,
    followPath: false,
    color: STATS_TRAIL_COLOR,
    position: "static",
  },
  {
    path: MOBILE_STATS_TRAIL_UP,
    width: 48,
    height: 38,
    className: "",
    icon: PackageIcon,
    iconSize: 11,
    iconRotation: 0,
    maxOpacity: 0.55,
    duration: 3.9,
    delay: 3.3,
    color: STATS_TRAIL_COLOR,
    position: "static",
  },
  {
    path: MOBILE_STATS_TRAIL_DOWN,
    width: 48,
    height: 38,
    className: "",
    icon: PackageOpen,
    iconSize: 11,
    iconRotation: 0,
    maxOpacity: 0.55,
    duration: 4.5,
    delay: 3.8,
    color: STATS_TRAIL_COLOR,
    position: "static",
  },
];

function Trail({
  path,
  width,
  height,
  className,
  icon: Icon,
  iconSize,
  iconRotation,
  maxOpacity,
  duration,
  delay,
  followPath = true,
  color = "white",
  position = "absolute",
}: TrailConfig) {
  const prefersReducedMotion = useSafeReducedMotion();
  const progress = useMotionValue(0);
  const offsetDistance = useTransform(progress, (v) => `${v}%`);
  const opacity = useTransform(
    progress,
    [0, 10, 85, 100],
    [0, maxOpacity, maxOpacity, 0],
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      // Position figée, à mi-parcours plutôt qu'à une extrémité: rendu
      // "en vol" plausible sans mouvement.
      progress.set(55);
      return;
    }
    const controls = animate(progress, 100, {
      duration,
      delay,
      ease: "linear",
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [prefersReducedMotion, progress, duration, delay]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none z-0 ${position === "absolute" ? "absolute" : "relative mx-auto"} ${className}`}
      style={{ width, height }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
      >
        <path
          d={path}
          stroke={color}
          strokeOpacity={maxOpacity * 0.4}
          strokeWidth={1.4}
          strokeDasharray="5 8"
          strokeLinecap="round"
        />
      </svg>
      <motion.div
        className="absolute top-0 left-0"
        style={{
          offsetPath: `path("${path}")`,
          offsetRotate: followPath ? "auto" : "0deg",
          offsetDistance,
          opacity,
          color,
        }}
      >
        <Icon
          size={iconSize}
          strokeWidth={2}
          style={{ transform: `rotate(${iconRotation}deg)` }}
        />
      </motion.div>
    </div>
  );
}

export function Hero() {
  return (
    <>
      <section
        id="accueil"
        className="bg-brand-gradient relative scroll-mt-16 overflow-hidden py-16 text-white sm:scroll-mt-18 sm:py-20"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-28 h-130 w-130 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_70%)]"
        />
        {trails.map((trail) => (
          <Trail key={trail.path} {...trail} />
        ))}
        <div className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-6">
          <motion.div
            variants={textColumn}
            initial="hidden"
            animate="show"
            className="min-w-70 flex-1 basis-120"
          >
            <motion.span
              variants={rise}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold tracking-wide text-white uppercase backdrop-blur-sm"
            >
              Pi Rapid · Pi Safe
            </motion.span>
            <motion.h1
              variants={rise}
              className="mb-4 text-4xl leading-tight font-extrabold sm:text-[44px]"
            >
              Vos colis, vos paiements,
              <br />
              votre tranquillité d&apos;esprit.
            </motion.h1>
            <motion.p
              variants={rise}
              className="mb-7 max-w-lg text-[17px] opacity-95"
            >
              KS Express Service connecte les États-Unis et Haïti : suivez
              vos colis en temps réel, recevez vos notifications
              automatiquement et retirez vos envois sans attente — tout est
              tracé, tout est sous contrôle.
            </motion.p>
            <motion.div variants={rise} className="flex flex-wrap gap-3.5">
              <motion.a
                href="/register"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-full bg-white px-6.5 py-3.5 text-[15px] font-bold text-brand-orange-text"
              >
                S&apos;inscrire
              </motion.a>
              <motion.a
                href="#services"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-full border-2 border-white/70 px-6.5 py-3.5 text-[15px] font-bold text-white"
              >
                Découvrir nos services
              </motion.a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
            className="flex flex-1 basis-95 justify-center"
          >
            <div className="w-full max-w-95 rounded-2xl border border-white/25 bg-white/15 p-6 text-white shadow-[0_25px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
              <PriceCalculator />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="bg-brand-gradient relative overflow-hidden py-8">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-6xl px-6">
          {statsTrails.map((trail, i) => (
            <Trail key={i} {...trail} />
          ))}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 mx-auto flex max-w-6xl flex-col justify-between px-6 py-1.5 lg:hidden"
        >
          <div className="grid grid-cols-4 justify-items-center">
            {statsTrailsMobile.slice(0, 4).map((trail, i) => (
              <Trail key={i} {...trail} />
            ))}
          </div>
          <div className="grid grid-cols-4 justify-items-center">
            {statsTrailsMobile.slice(4, 8).map((trail, i) => (
              <Trail key={i} {...trail} />
            ))}
          </div>
        </div>
        <div className="relative z-10 mx-auto flex max-w-6xl flex-wrap justify-center gap-5 px-6 text-center sm:justify-between">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex-1 basis-37.5"
            >
              <b className="block text-2xl text-brand-yellow">
                {stat.value}
              </b>
              <span className="text-xs tracking-wide text-[#cfc6ba]">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
