import { prisma } from "@/lib/db/prisma";

export async function getCuratorNoteCountsBySponsor(
  shelterId: string,
): Promise<Map<string, number>> {
  if (typeof prisma.curatorNote === "undefined") {
    return new Map();
  }

  try {
    const noteCounts = await prisma.curatorNote.groupBy({
      by: ["sponsorId"],
      where: { shelterId },
      _count: { id: true },
    });

    return new Map(noteCounts.map((row) => [row.sponsorId, row._count.id]));
  } catch {
    // Table not migrated yet — treat as no notes
    return new Map();
  }
}

export async function listCuratorNotes(shelterId: string, sponsorId: string) {
  if (typeof prisma.curatorNote === "undefined") {
    return [];
  }

  try {
    return await prisma.curatorNote.findMany({
      where: { shelterId, sponsorId },
      include: {
        author: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export function curatorNotesAvailable() {
  return typeof prisma.curatorNote !== "undefined";
}
