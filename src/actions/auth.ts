"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/auth/supabase-server";
import { syncUserFromAuth } from "@/lib/auth/sync-user";
import {
  redirectAfterLogin,
  type LoginIntent,
} from "@/lib/auth/redirect-after-login";

function getAuthRedirectUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/auth/callback`;
}

function parseLoginIntent(formData: FormData): LoginIntent {
  return formData.get("intent") === "staff" ? "staff" : "curator";
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const intent = parseLoginIntent(formData);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await syncUserFromAuth(data.user);
    await redirectAfterLogin(data.user.id, intent);
  }

  redirect(intent === "staff" ? "/uk/staff/login" : "/uk/my");
}

export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user && data.session) {
    await syncUserFromAuth(data.user);
    await redirectAfterLogin(data.user.id, "curator");
  }

  return {
    success: true,
    message:
      "Перевірте пошту та натисніть посилання для підтвердження. Після цього можете увійти.",
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/uk");
}
