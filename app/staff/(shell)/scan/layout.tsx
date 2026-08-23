import { RequireRole } from "@/components/auth/RequireRole";

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole allow={["SUPER_ADMIN", "MANAGER", "CAISSIER", "CASHIER"]}>{children}</RequireRole>;
}
