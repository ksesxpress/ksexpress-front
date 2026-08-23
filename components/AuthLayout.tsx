"use client";

import { useEffect, type ReactNode } from "react";
import { motion, animate, useMotionValue } from "motion/react";
import {
  Package,
  PackageOpen,
  Plane,
  Lock,
  Mail,
  ShieldCheck,
  Truck,
  UserRound,
  KeyRound,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

// Icônes décoratives en fond des pages Connexion/Inscription : dispersées
// sur toute la page (pas alignées sur un tracé, contrairement au Hero),
// chacune tourne sur elle-même en continu — la moitié dans le sens des
// aiguilles d'une montre, l'autre dans le sens inverse, pour un rendu
// organique plutôt que mécanique.
type SpinnerConfig = {
  icon: LucideIcon;
  top: string;
  left: string;
  size: number;
  opacity: number;
  duration: number;
  clockwise: boolean;
};

const spinners: SpinnerConfig[] = [
  { icon: Package, top: "5%", left: "5%", size: 28, opacity: 0.4, duration: 14, clockwise: true },
  { icon: Plane, top: "8%", left: "27%", size: 24, opacity: 0.35, duration: 12, clockwise: false },
  { icon: KeyRound, top: "4%", left: "50%", size: 26, opacity: 0.38, duration: 17, clockwise: true },
  { icon: Mail, top: "9%", left: "73%", size: 24, opacity: 0.36, duration: 15, clockwise: false },
  { icon: Plane, top: "6%", left: "93%", size: 30, opacity: 0.4, duration: 19, clockwise: true },
  { icon: Lock, top: "24%", left: "14%", size: 22, opacity: 0.34, duration: 11, clockwise: false },
  { icon: Smartphone, top: "27%", left: "38%", size: 22, opacity: 0.32, duration: 13, clockwise: true },
  { icon: ShieldCheck, top: "22%", left: "62%", size: 26, opacity: 0.38, duration: 20, clockwise: false },
  { icon: Truck, top: "26%", left: "87%", size: 28, opacity: 0.36, duration: 16, clockwise: true },
  { icon: UserRound, top: "45%", left: "6%", size: 24, opacity: 0.34, duration: 13, clockwise: true },
  { icon: PackageOpen, top: "48%", left: "30%", size: 22, opacity: 0.32, duration: 15, clockwise: false },
  { icon: KeyRound, top: "46%", left: "70%", size: 20, opacity: 0.3, duration: 12, clockwise: true },
  { icon: ShieldCheck, top: "44%", left: "92%", size: 26, opacity: 0.36, duration: 18, clockwise: false },
  { icon: Lock, top: "64%", left: "10%", size: 24, opacity: 0.34, duration: 15, clockwise: false },
  { icon: Mail, top: "68%", left: "35%", size: 22, opacity: 0.32, duration: 14, clockwise: true },
  { icon: Smartphone, top: "65%", left: "60%", size: 22, opacity: 0.32, duration: 17, clockwise: false },
  { icon: Truck, top: "70%", left: "86%", size: 28, opacity: 0.38, duration: 17, clockwise: true },
  { icon: Package, top: "88%", left: "16%", size: 24, opacity: 0.34, duration: 15, clockwise: false },
  { icon: Plane, top: "90%", left: "50%", size: 22, opacity: 0.32, duration: 22, clockwise: true },
  { icon: PackageOpen, top: "88%", left: "82%", size: 26, opacity: 0.36, duration: 16, clockwise: false },
];

function Spinner({ icon: Icon, top, left, size, opacity, duration, clockwise }: SpinnerConfig) {
  const prefersReducedMotion = useSafeReducedMotion();
  const rotate = useMotionValue(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      rotate.set(0);
      return;
    }
    const controls = animate(rotate, clockwise ? 360 : -360, {
      duration,
      ease: "linear",
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [prefersReducedMotion, rotate, duration, clockwise]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute text-white"
      style={{ top, left, opacity, rotate }}
    >
      <Icon size={size} strokeWidth={1.75} />
    </motion.div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="bg-brand-gradient relative flex-1 overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0">
          {spinners.map((s, i) => (
            <Spinner key={i} {...s} />
          ))}
        </div>
        <div className="relative z-10">{children}</div>
      </main>
    </div>
  );
}
