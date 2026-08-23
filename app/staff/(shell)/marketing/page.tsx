import { PageHeader } from "@/components/app-shell/PageHeader";
import { Hammer } from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader>
        <h1 className="text-2xl font-extrabold text-white">Campagnes Marketing</h1>
      </PageHeader>
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-[16px] bg-white/10 p-5 backdrop-blur-xl border border-white/20">
          <Hammer size={48} className="text-brand-orange" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">Page en construction</h1>
        <p className="text-brand-grey max-w-md">
          L'outil de campagnes marketing arrive très bientôt.
        </p>
      </div>
    </div>
  );
}
