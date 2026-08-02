import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/storage/supabase-admin";

async function findAuthUserByEmail(
  email: string,
): Promise<SupabaseUser | null> {
  const admin = createAdminClient();
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;

    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match;

    if (data.users.length < 200) break;
    page += 1;
  }

  return null;
}

export async function createOrUpdateConfirmedAuthUser(params: {
  email: string;
  password: string;
  fullName?: string;
}): Promise<{ user: SupabaseUser; created: boolean }> {
  const admin = createAdminClient();
  const email = params.email.toLowerCase();
  const userMetadata = params.fullName ? { full_name: params.fullName } : {};

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: params.password,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (!error && data.user) {
    return { user: data.user, created: true };
  }

  const alreadyExists =
    error &&
    (error.status === 422 ||
      error.message.toLowerCase().includes("already registered"));

  if (!alreadyExists) {
    throw error ?? new Error("Не вдалося створити користувача");
  }

  const existing = await findAuthUserByEmail(email);
  if (!existing) {
    throw error ?? new Error("Користувач уже існує, але не знайдений у Supabase");
  }

  const { data: updated, error: updateError } =
    await admin.auth.admin.updateUserById(existing.id, {
      password: params.password,
      email_confirm: true,
      user_metadata: userMetadata,
    });

  if (updateError || !updated.user) {
    throw updateError ?? new Error("Не вдалося оновити користувача");
  }

  return { user: updated.user, created: false };
}
