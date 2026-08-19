type SafeImageProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
};

/** Native img — avoids Next/Image remote config issues with Supabase Storage */
export function SafeImage({
  src,
  alt,
  className,
  loading = "lazy",
  fetchPriority,
}: SafeImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
    />
  );
}
