import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import { SignupForm } from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "Créer un compte — KS Express Service",
  description:
    "Créez votre compte KS Express Service pour suivre vos colis et gérer vos envois.",
};

export default function InscriptionPage() {
  return (
    <AuthLayout>
      <div className="mx-auto max-w-lg px-6">
        <div className="mb-10 text-center text-white">
          <h1 className="mb-3 text-3xl font-extrabold">Créer votre compte</h1>
          <p className="text-[15px] text-white/80">
            Aperçu de l&apos;espace client — pas encore connecté à un vrai
            compte, aucune donnée n&apos;est enregistrée.
          </p>
        </div>

        <SignupForm />

        <p className="mt-6 text-center text-[13.5px] text-white/80">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-bold text-white underline">
            Se connecter
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
