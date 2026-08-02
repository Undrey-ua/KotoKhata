import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand-logo";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 sm:px-6">
      <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex justify-center">
          <BrandLogo size={72} />
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold text-foreground">
          {t("register")}
        </h1>
        <div className="mt-6">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
