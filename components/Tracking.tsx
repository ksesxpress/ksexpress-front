"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { trackPublicColis } from "@/lib/api/colis";

const STEPS = [
  { label: "Reçu USA", id: "RECEIVED" },
  { label: "En transit", id: "TRANSIT" },
  { label: "Disponible", id: "READY" },
  { label: "Livré", id: "DELIVERED" },
];

function getTimelineState(statut: string) {
  let currentIndex = -1;
  switch (statut) {
    case "RECEIVED_USA":
    case "WAITING_SHIPMENT":
      currentIndex = 0;
      break;
    case "IN_TRANSIT":
    case "CUSTOM_CLEARANCE":
    case "ARRIVED_HAITI":
      currentIndex = 1;
      break;
    case "READY_PICKUP":
      currentIndex = 2;
      break;
    case "DELIVERED":
      currentIndex = 3;
      break;
    default:
      currentIndex = -1;
  }
  
  return STEPS.map((step, i) => {
    if (i < currentIndex || (i === 3 && currentIndex === 3)) return { ...step, state: "done" };
    if (i === currentIndex) return { ...step, state: "active" };
    return { ...step, state: "pending", number: i + 1 };
  });
}

const STATUT_LABELS: Record<string, string> = {
  CREATED: "Enregistré",
  RECEIVED_USA: "Reçu à Miami",
  WAITING_SHIPMENT: "En attente d'expédition",
  IN_TRANSIT: "En transit",
  CUSTOM_CLEARANCE: "Dédouanement (Transit)",
  ARRIVED_HAITI: "Arrivé en Haïti (Transit)",
  READY_PICKUP: "Disponible en succursale",
  DELIVERED: "Livré",
  CANCELLED: "Annulé",
  RETURNED: "Retourné",
};

export function Tracking() {
  const [code, setCode] = useState("");
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const trackingFromUrl = params.get("tracking");
      if (trackingFromUrl) {
        setCode(trackingFromUrl);
        handleTrackLoad(trackingFromUrl);
        // Scroll automatically to tracking section
        setTimeout(() => {
          document.getElementById('tracking')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  }, []);

  async function handleTrackLoad(codeToTrack: string) {
    if (!codeToTrack.trim()) return;

    setLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      const data = await trackPublicColis(codeToTrack.trim());
      setTrackingData(data);
    } catch (err: any) {
      setError(err?.message || "Colis introuvable avec ce code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    handleTrackLoad(code);
  }

  const timeline = trackingData ? getTimelineState(trackingData.statut) : STEPS.map((s, i) => ({ ...s, state: "pending", number: i + 1 }));
  const activeIndex = timeline.findIndex(s => s.state === "active");
  const doneIndex = timeline.findLastIndex(s => s.state === "done");
  const progressPercent = Math.max(0, (doneIndex >= 0 ? doneIndex : (activeIndex >= 0 ? activeIndex : -1)) / (STEPS.length - 1)) * 100;

  return (
    <section
      id="tracking"
      className="scroll-mt-16 bg-[linear-gradient(180deg,#fff,#FFF3E2)] py-20 sm:scroll-mt-18"
    >
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-xl text-center"
        >
          <span className="text-xs font-bold tracking-wider text-brand-orange-text uppercase">
            Suivi public
          </span>
          <h2 className="mt-2.5 mb-3 text-3xl font-extrabold text-brand-dark">
            Où est mon colis ?
          </h2>
          <p className="text-[15.5px] text-brand-grey">
            Entrez votre numéro de tracking ou votre code colis pour suivre
            son parcours en temps réel.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto max-w-3xl rounded-[20px] border border-[#ffe4c4] bg-white p-9 shadow-[0_20px_50px_rgba(255,89,13,0.08)]"
        >
          <form
            onSubmit={handleTrack}
            className="mb-7 flex flex-wrap gap-2.5"
          >
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex : KSE-1045 ou numéro de tracking transporteur"
              className="min-w-55 flex-1 rounded-full border-[1.5px] border-[#eadfcf] px-4.5 py-3.5 text-[14.5px] outline-none focus:border-brand-orange disabled:opacity-50"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="rounded-full flex items-center justify-center min-w-[120px] bg-gradient-to-br from-brand-orange to-brand-orange-dark px-7 py-3.5 text-[14.5px] font-bold text-white disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Suivre"}
            </button>
          </form>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle size={18} />
              <p>{error}</p>
            </div>
          )}

          {trackingData && (
            <div className="border-t border-dashed border-[#eadfcf] pt-5.5">
              <div className="mb-4.5 flex flex-wrap justify-between gap-2 text-[13px] text-brand-grey">
                <span>
                  Statut actuel :{" "}
                  <strong className="text-brand-orange-text">
                    {STATUT_LABELS[trackingData.statut] || trackingData.statut}
                  </strong>
                </span>
                <span>Destination : {trackingData.destination}</span>
              </div>

              <div className="relative flex justify-between">
                <div className="absolute top-3.5 right-0 left-0 h-0.75 bg-[#eee4d6]" />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="absolute top-3.5 left-0 h-0.75 bg-brand-orange"
                />
                {timeline.map((step: any, i: number) => (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.35, delay: 0.15 + i * 0.1 }}
                    className="relative z-10 flex-1 text-center text-[11px] text-brand-grey"
                  >
                    <div
                      className={`mx-auto mb-2 flex h-7.5 w-7.5 items-center justify-center rounded-full border-[3px] bg-white text-[13px] ${
                        step.state === "done"
                          ? "border-brand-orange bg-brand-orange text-white"
                          : step.state === "active"
                            ? "border-brand-orange text-brand-dark"
                            : "border-[#eee4d6]"
                      }`}
                    >
                      {step.state === "done" ? (
                        <Check size={14} />
                      ) : step.state === "active" ? (
                        "●"
                      ) : (
                        step.number
                      )}
                    </div>
                    <span className="hidden sm:inline">{step.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
