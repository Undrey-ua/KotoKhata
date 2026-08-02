import { setRequestLocale, getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/auth/login-form";

export default async function StaffLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-charcoal px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-8 shadow-xl">
        <div className="flex justify-center">
          <BrandLogo size={72} />
        </div>
        <p className="mt-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
          CRM · Котохата
        </p>
        <h1 className="mt-1 text-center text-2xl font-bold text-foreground">
          {t("staffSignIn")}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t("staffSignInHint")}
        </p>
        <div className="mt-6">
          <LoginForm
            urlError={error}
            intent="staff"
            showRegister={false}
          />
        </div>
      </div>
    </div>
  );
}
