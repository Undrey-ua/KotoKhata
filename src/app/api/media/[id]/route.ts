import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth/session";
import { ANIMAL_MEDIA_BUCKET } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/storage/supabase-admin";

const PUBLIC_SIGNED_URL_TTL_SEC = 60 * 60 * 24;
const PRIVATE_SIGNED_URL_TTL_SEC = 60 * 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const media = await prisma.media.findUnique({
    where: { id },
    include: {
      animal: { select: { id: true, isPublic: true, shelterId: true } },
      lifeStory: {
        select: {
          isPublic: true,
          shelterId: true,
        },
      },
    },
  });

  if (!media?.storagePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const shelterId = media.animal?.shelterId ?? media.lifeStory?.shelterId;

  const isPubliclyVisible =
    media.isPublic &&
    ((media.animal?.isPublic ?? false) ||
      ((media.lifeStory?.isPublic ?? false) && !media.animal));

  if (!isPubliclyVisible) {
    const session = await getAppSession();

    const hasShelterAccess =
      shelterId &&
      session?.appUser.shelterMemberships.some((m) => m.shelterId === shelterId);

    let hasCuratorAccess = false;
    if (session && media.animalId && !hasShelterAccess) {
      const { userCanAccessAnimalMedia } = await import("@/lib/auth/curator");
      hasCuratorAccess = await userCanAccessAnimalMedia(
        session.appUser.id,
        media.animalId,
        media.animal!.shelterId,
      );
    }

    if (!hasShelterAccess && !hasCuratorAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const supabase = createAdminClient();
  const expiresIn = isPubliclyVisible
    ? PUBLIC_SIGNED_URL_TTL_SEC
    : PRIVATE_SIGNED_URL_TTL_SEC;

  const { data, error } = await supabase.storage
    .from(ANIMAL_MEDIA_BUCKET)
    .createSignedUrl(media.storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl, {
    status: 307,
    headers: {
      "Cache-Control": isPubliclyVisible
        ? "public, max-age=86400, stale-while-revalidate=604800"
        : "private, max-age=3600",
    },
  });
}
