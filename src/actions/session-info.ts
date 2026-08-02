"use server";

import { getAppSession } from "@/lib/auth/session";

export async function getProfileSessionInfo() {
  const session = await getAppSession();
  if (!session) return null;

  return {
    fullName: session.appUser.fullName,
    email: session.appUser.email,
  };
}
