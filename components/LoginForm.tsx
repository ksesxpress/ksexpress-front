"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, Eye, EyeOff, Loader2, Store } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth, landingPathForRole } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/types";
import { setActiveSuccursale, setAvailableSuccursales } from "@/lib/auth/tokens";

const fieldClass =
  "h-11 rounded-[10px] border-[1.5px] border-[#eadfcf] bg-white/70";
const labelClass = "mb-1.5 text-[12.5px] font-bold text-brand-dark";
const cardSpacing = { "--card-spacing": "2rem" } as CSSProperties;

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pour la sélection de succursale après login si on est rattaché à plusieurs
  const [pendingSuccursales, setPendingSuccursales] = useState<any[] | null>(null);
  const [pendingUser, setPendingUser] = useState<any | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { user, succursales } = await login(identifier, password);
      const isSuperAdmin = user.isSuperAdmin;

      // Validation de succursale gérée par le backend (qui accepte maintenant les rôles globaux)
      if (succursales && succursales.length > 1 && !isSuperAdmin) {
        setPendingUser(user);
        setPendingSuccursales(succursales);
      } else {
        if (succursales && succursales.length > 0) {
          setAvailableSuccursales(succursales);
          // Set active succursale unless it's a super admin with many (they choose locally on pages)
          if (!isSuperAdmin || succursales.length === 1) {
            setActiveSuccursale(succursales[0].id);
          }
        }
        router.push(landingPathForRole(user, succursales?.[0]?.activite));
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Une erreur est survenue. Réessayez.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSelectSuccursale(succursaleId: string) {
    setActiveSuccursale(succursaleId);
    if (pendingSuccursales) {
      setAvailableSuccursales(pendingSuccursales);
    }
    if (pendingUser) {
      const succursale = pendingSuccursales?.find((s) => s.id === succursaleId);
      router.push(landingPathForRole(pendingUser, succursale?.activite));
    }
  }

  function toggleMode() {
    setMode((m) => (m === "email" ? "phone" : "email"));
    setIdentifier("");
  }

  return (
    <>
      <Dialog open={!!pendingSuccursales} onOpenChange={() => setPendingSuccursales(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choisir une succursale</DialogTitle>
            <DialogDescription>
              Veuillez sélectionner la succursale pour accéder à votre session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {pendingSuccursales?.map((s) => (
              <Button
                key={s.id}
                variant="outline"
                className="justify-start gap-3 h-14"
                onClick={() => handleSelectSuccursale(s.id)}
              >
                <Store className="text-brand-grey" size={20} />
                <div className="flex flex-row items-center gap-2">
                  <span className="font-semibold">{s.nom}</span>
                  <span className="text-[11px] tracking-wide text-muted-foreground uppercase font-medium">[{s.activite}]</span>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Card
        className="rounded-[18px] border border-[#f2e6d6] bg-brand-light shadow-none ring-0"
        style={cardSpacing}
      >
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-3.5">
              <Label htmlFor="login-identifier" className={labelClass}>
                {mode === "email" ? "Email" : "Téléphone"}
              </Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput
                  id="login-identifier"
                  type={mode === "email" ? "email" : "tel"}
                  required
                  placeholder={
                    mode === "email" ? "vous@email.com" : "+509 __ __ __ __"
                  }
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <Separator orientation="vertical" className="mr-1 h-5" />
                  <InputGroupButton
                    type="button"
                    aria-label={
                      mode === "email"
                        ? "Utiliser le téléphone"
                        : "Utiliser l'email"
                    }
                    onClick={toggleMode}
                  >
                    {mode === "email" ? (
                      <Phone className="text-brand-grey" size={16} />
                    ) : (
                      <Mail className="text-brand-grey" size={16} />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="mb-2">
              <Label htmlFor="login-password" className={labelClass}>
                Mot de passe
              </Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <Separator orientation="vertical" className="mr-1 h-5" />
                  <InputGroupButton
                    type="button"
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeOff className="text-brand-grey" size={16} />
                    ) : (
                      <Eye className="text-brand-grey" size={16} />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="mb-4 text-right">
              <Link
                href="/forgot-password"
                className="text-[12.5px] font-semibold text-brand-orange-text"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {error && (
              <p className="mb-3.5 text-[13px] font-semibold text-red-600">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-auto w-full rounded-full bg-gradient-to-br from-brand-orange to-brand-orange-dark py-3.5 text-[15px] font-bold text-white hover:opacity-90 disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="mx-auto animate-spin" size={18} />
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
