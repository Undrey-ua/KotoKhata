"use client";

import { useRef, useState, useTransition } from "react";
import type { MediaItem } from "@/lib/serialize";
import { SafeImage } from "@/components/shared/safe-image";
import { Button } from "@/components/ui/button";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadResult = { error?: string; success?: boolean } | void;

type AnimalPhotosProps = {
  photos: MediaItem[];
  uploadAction: (formData: FormData) => Promise<UploadResult>;
  setCoverAction: (mediaId: string) => Promise<UploadResult>;
  deletePhotoAction: (mediaId: string) => Promise<UploadResult>;
};

export function AnimalPhotos({
  photos: initialPhotos,
  uploadAction,
  setCoverAction,
  deletePhotoAction,
}: AnimalPhotosProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const hasPhotos = photos.length > 0;
  const coverPhoto = photos.find((p) => p.isCover);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await uploadAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      setFileName(null);
      window.location.reload();
    });
  }

  function handleSetCover(mediaId: string) {
    startTransition(async () => {
      await setCoverAction(mediaId);
      window.location.reload();
    });
  }

  function handleDelete(mediaId: string) {
    if (!confirm("Видалити це фото?")) return;
    startTransition(async () => {
      await deletePhotoAction(mediaId);
      setPhotos((prev) => prev.filter((p) => p.id !== mediaId));
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Фото котика</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <strong className="font-medium text-foreground">Обкладинка</strong> — головне
          фото в каталозі на сайті. Інші фото показуються в профілі котика.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {hasPhotos ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className={cn(
                "group overflow-hidden rounded-xl border bg-surface-cool/30",
                photo.isCover ? "border-primary ring-2 ring-primary/20" : "border-border",
              )}
            >
              {photo.url ? (
                <SafeImage
                  src={photo.url}
                  alt=""
                  className="aspect-[3/4] w-full object-contain"
                />
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center text-4xl">
                  🐱
                </div>
              )}
              <div className="space-y-2 border-t border-border bg-card p-2">
                {photo.isCover ? (
                  <p className="flex items-center gap-1 text-xs font-medium text-primary">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    Обкладинка
                  </p>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 w-full text-xs"
                    disabled={pending}
                    onClick={() => handleSetCover(photo.id)}
                  >
                    <Star className="mr-1 h-3.5 w-3.5" />
                    Зробити обкладинкою
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-full text-xs text-red-600 hover:text-red-700"
                  disabled={pending}
                  onClick={() => handleDelete(photo.id)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Видалити
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-border-cool bg-surface-cool/40 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Ще немає фото. Завантажте перше — воно стане обкладинкою в каталозі.
          </p>
        </div>
      )}

      {coverPhoto && (
        <p className="text-xs text-muted-foreground">
          Зараз обкладинка: фото з позначкою «Обкладинка». Її можна змінити на будь-яке
          інше.
        </p>
      )}

      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="rounded-xl border border-dashed border-border-cool bg-surface-cool/20 p-4"
      >
        <p className="mb-3 text-sm font-medium text-foreground">
          {hasPhotos ? "Додати ще фото" : "Завантажити фото"}
        </p>

        <label
          htmlFor="gallery-photo"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-border bg-card px-4 py-6 transition-colors hover:border-primary/40 hover:bg-surface-cool/50"
        >
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {fileName ?? "Натисніть, щоб обрати файл"}
          </span>
          <span className="text-xs text-muted-foreground">JPEG, PNG, WebP · до 10 МБ</span>
          <input
            id="gallery-photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setFileName(file?.name ?? null);
            }}
          />
        </label>

        {hasPhotos && (
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="setAsCover"
              className="mt-0.5 h-4 w-4 rounded border-border"
            />
            <span>
              <span className="font-medium text-foreground">Зробити обкладинкою</span>
              <span className="block text-xs text-muted-foreground">
                Якщо не обрано — фото додасться лише до галереї профілю
              </span>
            </span>
          </label>
        )}

        {!hasPhotos && (
          <input type="hidden" name="setAsCover" value="on" />
        )}

        <Button type="submit" className="mt-4 w-full sm:w-auto" disabled={pending}>
          {pending ? "Завантаження…" : "Завантажити"}
        </Button>
      </form>
    </div>
  );
}
