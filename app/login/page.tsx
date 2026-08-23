import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Connexion — KS Express Service",
  description: "Connectez-vous à votre compte KS Express Service.",
};

export default function ConnexionPage() {
  return (
    <AuthLayout>
      <div className="mx-auto max-w-lg px-6">
        <div className="mb-10 text-center text-white">
          <h1 className="mb-3 text-3xl font-extrabold">Bon retour</h1>
          <p className="text-[15px] text-white/80">
            Connectez-vous à votre espace KS Express Service.
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-[13.5px] text-white/80">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="font-bold text-white underline"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
