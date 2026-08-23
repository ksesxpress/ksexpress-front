"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, MapPin, Eye, EyeOff, Loader2 } from "lucide-react";
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
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { apiRegister, apiVerify } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/types";

const departments = [
  "Artibonite",
  "Centre",
  "Grand'Anse",
  "Nippes",
  "Nord",
  "Nord-Est",
  "Nord-Ouest",
  "Ouest",
  "Sud",
  "Sud-Est",
];

const fieldClass =
  "h-11 rounded-[10px] border-[1.5px] border-[#eadfcf] bg-white/70";
const labelClass = "mb-1.5 text-[12.5px] font-bold text-brand-dark";
const cardSpacing = { "--card-spacing": "2rem" } as CSSProperties;

// Découpe "Prénom Nom" en (prenom, nom) — RegisterDto exige `nom`, `prenom`
// est optionnel. Un seul mot saisi : traité comme `nom` sans prénom.
function splitFullName(fullName: string): { prenom?: string; nom: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { nom: parts[0] ?? "" };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [department, setDepartment] = useState<string | null>(null);
  const [commune, setCommune] = useState("");
  const [postal, setPostal] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Étape 2 : code de vérification (RF-AUT-001).
  const [step, setStep] = useState<"form" | "verify">("form");
  const [utilisateurId, setUtilisateurId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email && !phone) {
      setError("Renseignez au moins un email ou un numéro de téléphone.");
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

    const { prenom, nom } = splitFullName(fullName);
    const adresseParts = [address, commune, department, postal].filter(Boolean);

    setIsSubmitting(true);
    try {
      const res = await apiRegister({
        email: email || undefined,
        telephone: phone || undefined,
        motDePasse: password,
        nom,
        prenom,
        adresse: adresseParts.length ? adresseParts.join(", ") : undefined,
      });
      setUtilisateurId(res.utilisateurId);
      setStep("verify");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!utilisateurId) return;
    setCodeError(null);
    setIsVerifying(true);
    try {
      await apiVerify(utilisateurId, code);
      router.push("/login?verified=1");
    } catch (err) {
      setCodeError(
        err instanceof ApiError ? err.message : "Code invalide. Réessayez.",
      );
    } finally {
      setIsVerifying(false);
    }
  }

  if (step === "verify") {
    return (
      <Card
        className="rounded-[18px] border border-[#f2e6d6] bg-brand-light shadow-none ring-0"
        style={cardSpacing}
      >
        <CardContent>
          <p className="mb-4 text-[14px] text-brand-dark">
            Un code à 6 chiffres a été envoyé à votre email pour confirmer
            votre compte.
          </p>
          <form onSubmit={handleVerify}>
            <div className="mb-3.5">
              <Label htmlFor="verify-code" className={labelClass}>
                Code de vérification
              </Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput
                  id="verify-code"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </InputGroup>
            </div>

            {codeError && (
              <p className="mb-3.5 text-[13px] font-semibold text-red-600">
                {codeError}
              </p>
            )}

            <Button
              type="submit"
              disabled={isVerifying}
              className="h-auto w-full rounded-full bg-gradient-to-br from-brand-orange to-brand-orange-dark py-3.5 text-[15px] font-bold text-white hover:opacity-90 disabled:opacity-70"
            >
              {isVerifying ? (
                <Loader2 className="mx-auto animate-spin" size={18} />
              ) : (
                "Confirmer mon compte"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="rounded-[18px] border border-[#f2e6d6] bg-brand-light shadow-none ring-0"
      style={cardSpacing}
    >
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="mb-3.5">
            <Label htmlFor="signup-name" className={labelClass}>
              Nom complet
            </Label>
            <InputGroup className={fieldClass}>
              <InputGroupInput
                id="signup-name"
                required
                placeholder="Votre nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <Separator orientation="vertical" className="mr-1 h-5" />
                <User className="text-brand-grey" size={16} />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="signup-email" className={labelClass}>
                Email
              </Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput
                  id="signup-email"
                  type="email"
                  placeholder="vous@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <Separator orientation="vertical" className="mr-1 h-5" />
                  <Mail className="text-brand-grey" size={16} />
                </InputGroupAddon>
              </InputGroup>
            </div>
            <div>
              <Label htmlFor="signup-phone" className={labelClass}>
                Téléphone
              </Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput
                  id="signup-phone"
                  type="tel"
                  placeholder="+509 __ __ __ __"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <Separator orientation="vertical" className="mr-1 h-5" />
                  <Phone className="text-brand-grey" size={16} />
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>

          <div className="mb-3.5">
            <Label htmlFor="signup-address" className={labelClass}>
              Adresse
            </Label>
            <InputGroup className={fieldClass}>
              <InputGroupInput
                id="signup-address"
                placeholder="Rue, numéro..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <Separator orientation="vertical" className="mr-1 h-5" />
                <MapPin className="text-brand-grey" size={16} />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="signup-department" className={labelClass}>
                Département
              </Label>
              <Combobox
                items={departments}
                value={department}
                onValueChange={(value) => setDepartment(value)}
              >
                <ComboboxInput
                  id="signup-department"
                  placeholder="Choisir..."
                  className={fieldClass}
                />
                <ComboboxContent>
                  <ComboboxEmpty>Aucun résultat.</ComboboxEmpty>
                  <ComboboxList>
                    {(item: string) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <div>
              <Label htmlFor="signup-commune" className={labelClass}>
                Commune
              </Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput
                  id="signup-commune"
                  placeholder="Ex : Cap-Haïtien"
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <Separator orientation="vertical" className="mr-1 h-5" />
                  <MapPin className="text-brand-grey" size={16} />
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>

          <div className="mb-3.5">
            <Label htmlFor="signup-postal" className={labelClass}>
              Code postal{" "}
              <span className="font-normal text-brand-grey">
                (optionnel)
              </span>
            </Label>
            <InputGroup className={fieldClass}>
              <InputGroupInput
                id="signup-postal"
                value={postal}
                onChange={(e) => setPostal(e.target.value)}
              />
            </InputGroup>
          </div>

          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="signup-password" className={labelClass}>
                Mot de passe
              </Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
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
            <div>
              <Label htmlFor="signup-confirm-password" className={labelClass}>
                Confirmer le mot de passe
              </Label>
              <InputGroup className={fieldClass}>
                <InputGroupInput
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                />
                <InputGroupAddon align="inline-end">
                  <Separator orientation="vertical" className="mr-1 h-5" />
                  <InputGroupButton
                    type="button"
                    aria-label={
                      showConfirmPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    onClick={() => setShowConfirmPassword((v) => !v)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="text-brand-grey" size={16} />
                    ) : (
                      <Eye className="text-brand-grey" size={16} />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
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
              "Créer mon compte"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
