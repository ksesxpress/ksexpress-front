import type { Metadata } from "next";
import { AuthLayout } from "@/components/AuthLayout";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié — KS Express Service",
  description: "Réinitialisez le mot de passe de votre compte KS Express Service.",
};

export default function MotDePasseOubliePage() {
  return (
    <AuthLayout>
      <div className="mx-auto max-w-lg px-6">
        <div className="mb-10 text-center text-white">
          <h1 className="mb-3 text-3xl font-extrabold">Mot de passe oublié</h1>
          <p className="text-[15px] text-white/80">
            Indiquez votre email ou téléphone, nous vous enverrons un lien de
            réinitialisation.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </AuthLayout>
  );
}
