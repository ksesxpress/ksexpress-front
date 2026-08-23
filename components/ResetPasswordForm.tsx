"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
import { apiConfirmPasswordReset } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/types";

const fieldClass =
  "h-11 rounded-[10px] border-[1.5px] border-[#eadfcf] bg-white/70";
const labelClass = "mb-1.5 text-[12.5px] font-bold text-brand-dark";
const cardSpacing = { "--card-spacing": "2rem" } as CSSProperties;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!uid || !token) {
      setError("Lien de réinitialisation invalide ou incomplet.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!/(?=.*[A-Z])(?=.*\d).{8,}/.test(password)) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await apiConfirmPasswordReset(uid, token, password);
      router.push("/login?reset=1");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card
      className="rounded-[18px] border border-[#f2e6d6] bg-brand-light shadow-none ring-0"
      style={cardSpacing}
    >
      <CardContent>
        {(!uid || !token) && (
          <p className="mb-3.5 text-[13px] font-semibold text-red-600">
            Ce lien de réinitialisation est invalide ou incomplet. Demandez-en
            un nouveau depuis la page « Mot de passe oublié ».
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3.5">
            <Label htmlFor="reset-password" className={labelClass}>
              Nouveau mot de passe
            </Label>
            <InputGroup className={fieldClass}>
              <InputGroupInput
                id="reset-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <Separator orientation="vertical" className="mr-1 h-5" />
                <InputGroupButton
                  type="button"
                  aria-label={
                    showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
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

          <div className="mb-4">
            <Label htmlFor="reset-confirm-password" className={labelClass}>
              Confirmer le mot de passe
            </Label>
            <InputGroup className={fieldClass}>
              <InputGroupInput
                id="reset-confirm-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </InputGroup>
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
              "Réinitialiser le mot de passe"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
