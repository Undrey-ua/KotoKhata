import { redirect } from "next/navigation";
import { ShelterMemberRole } from "@prisma/client";
import { createClient } from "@/lib/auth/supabase-server";
import { prisma } from "@/lib/db/prisma";
import { acceptVolunteerInvites } from "@/lib/crm/volunteers";
import { syncUserFromAuth } from "@/lib/auth/sync-user";

const userInclude = {
  shelterMemberships: { include: { shelter: true } },
} as const;

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function loadAppUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });
}

export async function getAppSession() {
  const authUser = await getAuthUser();
  if (!authUser?.email) return null;

  const email = authUser.email.toLowerCase();
  let appUser = await loadAppUser(authUser.id);

  if (!appUser) {
    await syncUserFromAuth(authUser);
    appUser = await loadAppUser(authUser.id);
  } else {
    const pendingInvites = await prisma.volunteerInvite.count({
      where: { email, acceptedAt: null },
    });
    if (pendingInvites > 0) {
      await acceptVolunteerInvites(authUser.id, email);
      appUser = await loadAppUser(authUser.id);
    }
  }

  return appUser ? { authUser, appUser } : null;
}

export async function requireShelterMember(shelterSlug: string) {
  const session = await getAppSession();

  if (!session) {
    redirect("/uk/staff/login");
  }

  const membership = session.appUser.shelterMemberships.find(
    (m) => m.shelter.slug === shelterSlug,
  );

  if (!membership) {
    redirect("/uk/staff/login?error=no_access");
  }

  return {
    userId: session.appUser.id,
    shelterId: membership.shelterId,
    shelter: membership.shelter,
    role: membership.role,
    isAdmin: membership.role === ShelterMemberRole.ADMIN,
  };
}
