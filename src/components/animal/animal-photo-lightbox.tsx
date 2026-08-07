"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { SafeImage } from "@/components/shared/safe-image";
import { cn } from "@/lib/utils";

export type AnimalPhoto = {
  id: string;
  url: string;
};

type LightboxLabels = {
  close: string;
  prev: string;
  next: string;
  photoCounter: string;
  openGallery: string;
};

type LightboxContextValue = {
  photos: AnimalPhoto[];
  animalName: string;
  labels: LightboxLabels;
  openAt: (index: number) => void;
};

const LightboxContext = createContext<LightboxContextValue | null>(null);

function useLightbox() {
  const ctx = useContext(LightboxContext);
  if (!ctx) {
    throw new Error("AnimalPhotoLightbox components must be used within Root");
  }
  return ctx;
}

type RootProps = {
  photos: AnimalPhoto[];
  animalName: string;
  labels: LightboxLabels;
  children: ReactNode;
};

export function AnimalPhotoLightboxRoot({
  photos,
  animalName,
  labels,
  children,
}: RootProps) {
  const [index, setIndex] = useState<number | null>(null);

  const close = useCallback(() => setIndex(null), []);

  const showPrev = useCallback(() => {
    setIndex((current) => {
      if (current === null || photos.length === 0) return current;
      return (current - 1 + photos.length) % photos.length;
    });
  }, [photos.length]);

  const showNext = useCallback(() => {
    setIndex((current) => {
      if (current === null || photos.length === 0) return current;
      return (current + 1) % photos.length;
    });
  }, [photos.length]);

  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      const startX = touchStartX.current;
      const endX = event.changedTouches[0]?.clientX;
      touchStartX.current = null;

      if (startX == null || endX == null || photos.length <= 1) return;

      const delta = endX - startX;
      if (Math.abs(delta) < 48) return;

      if (delta > 0) showPrev();
      else showNext();
    },
    [photos.length, showNext, showPrev],
  );

  useEffect(() => {
    if (index === null) return;

    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") showPrev();
      if (event.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [index, close, showPrev, showNext]);

  const openAt = useCallback(
    (photoIndex: number) => {
      if (photos.length === 0) return;
      setIndex(photoIndex);
    },
    [photos.length],
  );

  return (
    <LightboxContext.Provider value={{ photos, animalName, labels, openAt }}>
      {children}
      {index !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex flex-col bg-black/95"
            role="dialog"
            aria-modal="true"
            aria-label={labels.openGallery}
            onClick={close}
          >
            <div
              className="flex items-center justify-between gap-3 px-4 py-3 text-white"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-sm font-medium tabular-nums">
                {labels.photoCounter
                  .replace("{current}", String(index + 1))
                  .replace("{total}", String(photos.length))}
              </p>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-2 text-white/90 transition-colors hover:bg-white/10"
                aria-label={labels.close}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div
              className="relative flex min-h-0 flex-1 items-center justify-center px-14 pb-8 pt-2"
              onClick={(event) => event.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={showPrev}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:left-4"
                  aria-label={labels.prev}
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>
              )}

              <SafeImage
                src={photos[index]!.url}
                alt={animalName}
                className="max-h-[calc(100vh-8rem)] max-w-full object-contain"
              />

              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={showNext}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:right-4"
                  aria-label={labels.next}
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </LightboxContext.Provider>
  );
}

type TriggerProps = {
  index: number;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

export function AnimalPhotoLightboxTrigger({
  index,
  children,
  className,
  disabled,
}: TriggerProps) {
  const { openAt, labels } = useLightbox();

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => openAt(index)}
      className={cn(
        "cursor-zoom-in text-left transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className,
      )}
      aria-label={labels.openGallery}
    >
      {children}
    </button>
  );
}
