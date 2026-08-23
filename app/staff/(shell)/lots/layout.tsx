import { RequireRole } from "@/components/auth/RequireRole";

export default function LotsLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole allow={["SUPER_ADMIN", "MANAGER"]}>{children}</RequireRole>;
}
