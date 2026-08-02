import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth/session";
import { ANIMAL_MEDIA_BUCKET } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/storage/supabase-admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const media = await prisma.media.findUnique({
    where: { id },
    include: {
      animal: { select: { id: true, isPublic: true, shelterId: true } },
    },
  });

  if (!media?.storagePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const isPubliclyVisible = media.isPublic && media.animal.isPublic;

  if (!isPubliclyVisible) {
    const session = await getAppSession();
    const hasShelterAccess = session?.appUser.shelterMemberships.some(
      (m) => m.shelterId === media.animal.shelterId,
    );

    let hasCuratorAccess = false;
    if (session && !hasShelterAccess) {
      const { userCanAccessAnimalMedia } = await import("@/lib/auth/curator");
      hasCuratorAccess = await userCanAccessAnimalMedia(
        session.appUser.id,
        media.animalId,
        media.animal.shelterId,
      );
    }

    if (!hasShelterAccess && !hasCuratorAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(ANIMAL_MEDIA_BUCKET)
    .download(media.storagePath);

  if (error || !data) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = Buffer.from(await data.arrayBuffer());

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": media.mimeType ?? "image/jpeg",
      "Cache-Control": isPubliclyVisible
        ? "public, max-age=86400, stale-while-revalidate=604800"
        : "private, max-age=3600",
    },
  });
}
