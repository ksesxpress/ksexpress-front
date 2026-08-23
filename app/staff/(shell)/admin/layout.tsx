import { RequireRole } from "@/components/auth/RequireRole";

// Sur-couche de garde pour les pages Super Admin uniquement — l'AppShell et
// la navigation viennent déjà de app/staff/layout.tsx (layout parent).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole allow={["SUPER_ADMIN"]}>{children}</RequireRole>;
}
