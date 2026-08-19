import { SafeImage } from "@/components/shared/safe-image";
import { cn } from "@/lib/utils";

type AnimalCardImageProps = {
  src: string | null | undefined;
  name: string;
  className?: string;
  objectFit?: "contain" | "cover";
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
};

export function AnimalCardImage({
  src,
  name,
  className,
  objectFit = "contain",
  loading,
  fetchPriority,
}: AnimalCardImageProps) {
  if (src) {
    return (
      <div
        className={cn(
          "overflow-hidden bg-surface-cool",
          className ?? "aspect-[4/3] w-full",
        )}
      >
        <SafeImage
          src={src}
          alt={name}
          loading={loading}
          fetchPriority={fetchPriority}
          className={cn(
            "h-full w-full",
            objectFit === "cover" ? "object-cover" : "object-contain",
          )}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-surface-cool to-surface-stone text-4xl sm:text-5xl",
        className ?? "aspect-[4/3] w-full",
      )}
    >
      🐱
    </div>
  );
}
