import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: "KS Express Service — Shipping & Vente USA–Haïti",
  description:
    "KS Express Service connecte les États-Unis et Haïti : suivez vos colis en temps réel, recevez vos notifications automatiquement et retirez vos envois sans attente.",
  openGraph: {
    title: "KS Express Service — Vos colis, vos paiements, votre tranquillité d'esprit.",
    description:
      "Shipping USA–Haïti, boutique et paiements digitaux : suivi en temps réel, notifications automatiques, reçus professionnels.",
    images: ["/logo.png"],
    locale: "fr_HT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col overflow-x-hidden bg-[#0a0f44]">
        <AuthProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
