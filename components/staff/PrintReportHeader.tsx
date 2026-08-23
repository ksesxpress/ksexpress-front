"use client";

import { useEffect, useState } from "react";
import { getPublicSettings } from "@/lib/api/parametres";
import type { PublicSettings } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";

export function PrintReportHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  useEffect(() => {
    getPublicSettings().then(setSettings).catch(() => {});
  }, []);

  return (
    <div className="hidden print:block mb-8 border-b border-black pb-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain" />
          ) : (
            <div className="h-16 w-16 bg-gray-200 flex items-center justify-center font-bold text-gray-500">
              LOGO
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-black">{settings?.nom ?? "KS Express"}</h2>
            <p className="text-sm text-gray-600">{settings?.adresse}</p>
            <p className="text-sm text-gray-600">
              Tel: {settings?.telephone} {settings?.whatsapp ? `| WA: ${settings?.whatsapp}` : ""}
            </p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-extrabold text-black uppercase tracking-wider">{title}</h1>
          {subtitle && <p className="text-md text-gray-700 mt-1">{subtitle}</p>}
          <p className="text-sm text-gray-500 mt-2">Généré le {formatDateTime(new Date().toISOString())}</p>
        </div>
      </div>
    </div>
  );
}
