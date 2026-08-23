import { useState, useEffect } from "react";
import { Check, Plane, Truck, Home, Package } from "lucide-react";
import type { StatutColis } from "@/lib/api/types";
import { ColisStatusBadge } from "@/components/app-shell/StatusBadge";

// Define the 4 main stages of a package's lifecycle
const STAGES = [
  {
    id: "confirmed",
    label: "Colis Confirmé",
    icon: Package,
    matchStatuses: ["CREATED", "RECEIVED_USA"],
  },
  {
    id: "shipped",
    label: "Colis Expédié",
    icon: Plane,
    matchStatuses: ["WAITING_SHIPMENT", "IN_TRANSIT", "CUSTOM_CLEARANCE"],
  },
  {
    id: "available",
    label: "Colis Disponible",
    icon: Truck,
    matchStatuses: ["ARRIVED_HAITI", "READY_PICKUP"],
  },
  {
    id: "delivered",
    label: "Colis Livré",
    icon: Home,
    matchStatuses: ["DELIVERED"],
  },
];

function getStageIndex(statut?: StatutColis | null): number {
  if (!statut) return -1;
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (STAGES[i].matchStatuses.includes(statut)) {
      return i;
    }
  }
  return -1; // If Cancelled, Lost, Returned etc.
}

export function PackageProgress({ statut }: { statut?: StatutColis | null }) {
  const currentIndex = getStageIndex(statut);
  
  // Use state to trigger the animation on mount
  const [animatedWidth, setAnimatedWidth] = useState('0%');

  useEffect(() => {
    // Small delay to ensure the component is mounted before setting the width, triggering the CSS transition
    const timeout = setTimeout(() => {
      setAnimatedWidth(currentIndex >= 0 ? `${(currentIndex / (STAGES.length - 1)) * 90}%` : '0%');
    }, 50);
    return () => clearTimeout(timeout);
  }, [currentIndex]);
  
  // If it's an error status, we might not want to show the happy path progress.
  // But for now, we'll just show it empty or up to where it was.
  const isErrorStatus = statut ? ["CANCELLED", "RETURNED", "LOST"].includes(statut) : false;

  return (
    <div className="w-full rounded-[10px] shadow-sm">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <p className="text-[12px] font-extrabold tracking-widest text-[#4caf50] uppercase mb-1">
            Progression
          </p>
          <h2 className="text-[20px] font-extrabold text-white">
            Parcours du colis
          </h2>
        </div>
        <div className="scale-110 origin-top-right">
          {statut ? <ColisStatusBadge statut={statut} /> : <div className="h-6" />}
        </div>
      </div>

      <div className="relative flex items-center justify-between w-full mt-10 mb-4 px-2">
        {/* Background Line */}
        <div className="absolute left-[5%] right-[5%] top-[21px] h-[3px] -translate-y-1/2 bg-white/10 z-0 rounded-full" />
        
        {/* Active Line (Progress) */}
        <div 
          className="absolute left-[5%] top-[21px] h-[3px] -translate-y-1/2 bg-[#4caf50] z-0 rounded-full transition-all duration-1000 ease-in-out" 
          style={{ width: animatedWidth }}
        />

        {STAGES.map((stage, idx) => {
          const isCompleted = idx <= currentIndex && !isErrorStatus;
          const isCurrent = idx === currentIndex && !isErrorStatus;
          const Icon = stage.icon;

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center group w-1/4">
              {/* Circle Icon */}
              <div
                className={`flex h-[42px] w-[42px] items-center justify-center rounded-full border-[3px] transition-colors duration-300 ${
                  isCompleted
                    ? "border-[#4caf50] bg-[#4caf50] text-white"
                    : "border-white/10 bg-white/5 text-white/40"
                }`}
              >
                {isCompleted ? (
                  <Check strokeWidth={3} size={20} />
                ) : (
                  <Icon strokeWidth={2.5} size={20} />
                )}
              </div>
              
              {/* Animated bottom icon (appears when current) */}
              <div className={`mt-4 mb-2 h-6 transition-all duration-300 ${isCurrent ? 'scale-110' : 'scale-100'}`}>
                <Icon 
                  size={24} 
                  strokeWidth={2} 
                  className={isCurrent ? "text-[#4caf50]" : "text-white/30"} 
                />
              </div>

              {/* Label */}
              <p
                className={`text-[13px] font-bold text-center transition-colors duration-300 ${
                  isCurrent || isCompleted
                    ? "text-white"
                    : "text-white/50"
                }`}
              >
                {stage.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
