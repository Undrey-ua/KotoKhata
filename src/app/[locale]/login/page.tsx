import { setRequestLocale, getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/auth/login-form";

export default async function CuratorLoginPage({
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
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 sm:px-6">
      <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex justify-center">
          <BrandLogo size={72} />
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold text-foreground">
          {t("curatorSignIn")}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t("curatorSignInHint")}
        </p>
        <div className="mt-6">
          <LoginForm urlError={error} intent="curator" staffLink />
        </div>
      </div>
    </div>
  );
}
