"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAction } from "@/actions/auth";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LoginIntent } from "@/lib/auth/redirect-after-login";

type LoginFormProps = {
  intent?: LoginIntent;
  urlError?: string | null;
  showRegister?: boolean;
  staffLink?: boolean;
};

export function LoginForm({
  intent = "curator",
  urlError,
  showRegister = true,
  staffLink = false,
}: LoginFormProps) {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) =>
      loginAction(formData),
    null,
  );

  const displayError =
    state?.error ??
    (urlError ? t(`errors.${urlError}` as "errors.no_access") : null);

  return (
    <form action={action} className="w-full space-y-4">
      <input type="hidden" name="intent" value={intent} />

      {displayError && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {displayError}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("signingIn") : t("signIn")}
      </Button>

      {showRegister && (
        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href="/register" className="text-primary hover:underline">
            {t("register")}
          </Link>
        </p>
      )}

      {staffLink && (
        <p className="text-center text-sm text-muted-foreground">
          {t("staffPrompt")}{" "}
          <Link href="/staff/login" className="text-primary hover:underline">
            {t("staffSignIn")}
          </Link>
        </p>
      )}

      {intent === "staff" && (
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← {t("backToSite")}
          </Link>
        </p>
      )}
    </form>
  );
}
