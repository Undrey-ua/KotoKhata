import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireShelterMember } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { toAnimalFormData, toMediaItems } from "@/lib/serialize";
import {
  hideAnimalFromSiteAction,
  permanentlyDeleteAnimalAction,
  updateAnimalAction,
} from "@/actions/animals";
import {
  deletePhotoAction,
  setCoverPhotoAction,
  uploadAnimalPhotoAction,
} from "@/actions/media";
import { AnimalForm } from "@/components/crm/animal-form";
import { AnimalPhotos } from "@/components/crm/animal-photos";
import { DeleteAnimalButton } from "@/components/crm/delete-animal-button";
import { Button } from "@/components/ui/button";
import { SponsorshipStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function EditAnimalPage({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string; id: string }>;
}) {
  const { locale, shelterSlug, id } = await params;
  setRequestLocale(locale);
  const ctx = await requireShelterMember(shelterSlug);

  const animal = await prisma.animal.findFirst({
    where: { id, shelterId: ctx.shelterId },
    include: {
      media: {
        where: { type: "PHOTO" },
        orderBy: [{ isCover: "desc" }, { createdAt: "desc" }],
      },
      sponsorships: {
        where: {
          status: {
            in: [SponsorshipStatus.ACTIVE, SponsorshipStatus.PENDING],
          },
        },
        select: { id: true },
      },
    },
  });

  if (!animal) {
    notFound();
  }

  const hideAction = hideAnimalFromSiteAction.bind(null, shelterSlug, id);
  const saveAction = updateAnimalAction.bind(null, shelterSlug, id);
  const uploadPhotoAction = uploadAnimalPhotoAction.bind(null, shelterSlug, id);
  const setCoverAction = setCoverPhotoAction.bind(null, shelterSlug, id);
  const deletePhoto = deletePhotoAction.bind(null, shelterSlug, id);
  const deletePermanently = permanentlyDeleteAnimalAction.bind(null, shelterSlug);
  const { media, sponsorships, ...animalRecord } = animal;
  const deleteBlocked = sponsorships.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Редагувати: {animal.name}
        </h1>
        <form action={hideAction}>
          <Button type="submit" variant="outline">
            Приховати з сайту
          </Button>
        </form>
      </div>
      <AnimalPhotos
        photos={toMediaItems(media)}
        uploadAction={uploadPhotoAction}
        setCoverAction={setCoverAction}
        deletePhotoAction={deletePhoto}
      />
      <AnimalForm
        shelterSlug={shelterSlug}
        animal={toAnimalFormData(animalRecord)}
        saveAction={saveAction}
      />
      <DeleteAnimalButton
        animalId={id}
        animalName={animal.name}
        blocked={deleteBlocked}
        deleteAction={deletePermanently}
        variant="page"
      />
    </div>
  );
}
