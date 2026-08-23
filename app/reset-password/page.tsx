import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe — KS Express Service",
  description: "Définissez un nouveau mot de passe pour votre compte.",
};

export default function ReinitialiserMotDePassePage() {
  return (
    <AuthLayout>
      <div className="mx-auto max-w-lg px-6">
        <div className="mb-10 text-center text-white">
          <h1 className="mb-3 text-3xl font-extrabold">Nouveau mot de passe</h1>
          <p className="text-[15px] text-white/80">
            Choisissez un nouveau mot de passe pour votre compte.
          </p>
        </div>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </AuthLayout>
  );
}
