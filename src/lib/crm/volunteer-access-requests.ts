import { VolunteerAccessRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type VolunteerAccessRequestItem = {
  id: string;
  fullName: string;
  email: string | null;
  telegramUsername: string | null;
  createdAt: Date;
};

export async function getPendingVolunteerAccessRequests(
  shelterId: string,
): Promise<VolunteerAccessRequestItem[]> {
  const rows = await prisma.volunteerAccessRequest.findMany({
    where: {
      shelterId,
      status: VolunteerAccessRequestStatus.PENDING,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      telegramUsername: true,
      createdAt: true,
    },
  });

  return rows;
}
