"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { Mail, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { apiRequestPasswordReset } from "@/lib/api/auth";

const fieldClass =
  "h-11 rounded-[10px] border-[1.5px] border-[#eadfcf] bg-white/70";
const labelClass = "mb-1.5 text-[12.5px] font-bold text-brand-dark";
const cardSpacing = { "--card-spacing": "2rem" } as CSSProperties;

export function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Réponse toujours générique côté backend (ne révèle jamais si le
      // compte existe) — on affiche donc le même message dans tous les cas.
      await apiRequestPasswordReset(identifier);
    } finally {
      setIsSubmitting(false);
      setSent(true);
    }
  }

  return (
    <Card
      className="rounded-[18px] border border-[#f2e6d6] bg-brand-light shadow-none ring-0"
      style={cardSpacing}
    >
      <CardContent>
        {sent ? (
          <p className="text-[14px] font-semibold text-brand-dark">
            Si un compte correspond à ces informations, un email de
            réinitialisation a été envoyé.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Label htmlFor="forgot-identifier" className={labelClass}>
                Email ou téléphone
              </Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput
                  id="forgot-identifier"
                  required
                  placeholder="vous@email.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <Separator orientation="vertical" className="mr-1 h-5" />
                  <Mail className="text-brand-grey" size={16} />
                </InputGroupAddon>
              </InputGroup>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-auto w-full rounded-full bg-gradient-to-br from-brand-orange to-brand-orange-dark py-3.5 text-[15px] font-bold text-white hover:opacity-90 disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="mx-auto animate-spin" size={18} />
              ) : (
                "Envoyer le lien"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
