import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Wifi } from "lucide-react";

export function TopHeader() {
  return (
    <header className="sticky top-0 z-50 hidden sm:flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:px-6 print:hidden">
      {/* Trigger de la Sidebar */}
      <div className="flex items-center">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      </div>

      {/* Barre de recherche au centre */}
      <div className="flex-1 flex justify-center px-4 max-w-xl mx-auto">
        <div className="relative w-full max-w-md">
          <Input 
            placeholder="Rechercher..." 
            className="w-full bg-muted/30 rounded-lg pl-3 pr-16 h-9 border-muted-foreground/20 focus-visible:ring-1 text-sm shadow-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 shadow-sm">
              Ctrl K
            </kbd>
          </div>
        </div>
      </div>

      {/* Statut Online à droite */}
      <div className="flex items-center">
        <div className="flex items-center gap-1.5 bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-3 py-1.5 rounded-md text-[13px] font-medium border border-emerald-500/20">
          <Wifi size={14} className="stroke-[2.5]" />
          Online
        </div>
      </div>
    </header>
  );
}
