"use client";

import {
  AnimalPhotoLightboxRoot,
  AnimalPhotoLightboxTrigger,
} from "@/components/animal/animal-photo-lightbox";
import { SafeImage } from "@/components/shared/safe-image";

type LifeFeedPhotosProps = {
  photoUrls: string[];
  altLabel: string;
  labels: {
    close: string;
    prev: string;
    next: string;
    photoCounter: string;
    openGallery: string;
  };
};

export function LifeFeedPhotos({ photoUrls, altLabel, labels }: LifeFeedPhotosProps) {
  if (photoUrls.length === 0) return null;

  const photos = photoUrls.map((url, index) => ({
    id: `${index}-${url}`,
    url,
  }));

  return (
    <AnimalPhotoLightboxRoot photos={photos} animalName={altLabel} labels={labels}>
      <ul className="mt-4 flex flex-wrap gap-2">
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <AnimalPhotoLightboxTrigger
              index={index}
              className="block h-24 w-24 overflow-hidden rounded-lg border border-border-cool"
            >
              <SafeImage
                src={photo.url}
                alt=""
                className="h-full w-full bg-surface-stone object-cover"
              />
            </AnimalPhotoLightboxTrigger>
          </li>
        ))}
      </ul>
    </AnimalPhotoLightboxRoot>
  );
}
