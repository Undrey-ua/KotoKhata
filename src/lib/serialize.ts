import type { Animal, Media } from "@prisma/client";
import { decimalToNumber } from "@/lib/animal-funding";
import { splitBirthDate } from "@/lib/animal-age";

/** Fields the CRM animal form needs — plain objects safe for Client Components */
export type AnimalFormData = {
  id: string;
  name: string;
  slug: string;
  sex: Animal["sex"];
  status: Animal["status"];
  personality: Animal["personality"];
  description: string | null;
  characterTraits: string | null;
  location: string | null;
  vaccinated: boolean;
  sterilized: boolean;
  isPublic: boolean;
  isFeatured: boolean;
  monthlyGoal: number | null;
  minCuratorshipAmount: number | null;
  birthMonth: number | null;
  birthYear: number | null;
};

export type MediaItem = {
  id: string;
  url: string;
  isCover: boolean;
};

export type MediaUrlFields = {
  id: string;
  publicUrl?: string | null;
  isPublic?: boolean;
};

export function mediaDisplayUrl(mediaId: string) {
  return `/api/media/${mediaId}`;
}

/** Prefer app media route — bucket may be private; publicUrl alone is not enough. */
export function resolveMediaDisplayUrl(media: MediaUrlFields): string {
  return mediaDisplayUrl(media.id);
}

export function toAnimalFormData(animal: Animal): AnimalFormData {
  const { birthMonth, birthYear } = splitBirthDate(animal.birthDate);

  return {
    id: animal.id,
    name: animal.name,
    slug: animal.slug,
    sex: animal.sex,
    status: animal.status,
    personality: animal.personality,
    description: animal.description,
    characterTraits: animal.characterTraits,
    location: animal.location,
    vaccinated: animal.vaccinated,
    sterilized: animal.sterilized,
    isPublic: animal.isPublic,
    isFeatured: animal.isFeatured,
    monthlyGoal: decimalToNumber(animal.monthlyGoal),
    minCuratorshipAmount: decimalToNumber(animal.minCuratorshipAmount),
    birthMonth,
    birthYear,
  };
}

export function toMediaItems(media: Media[]): MediaItem[] {
  return media.map((m) => ({
    id: m.id,
    url: resolveMediaDisplayUrl(m),
    isCover: m.isCover,
  }));
}

export function coverMediaUrl(
  media: (MediaUrlFields & { isCover?: boolean })[],
): string | null {
  const cover = media.find((m) => m.isCover);
  const item = cover ?? media[0];
  return item ? resolveMediaDisplayUrl(item) : null;
}
