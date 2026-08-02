type SafeImageProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Native img — avoids Next/Image remote config issues with Supabase Storage */
export function SafeImage({ src, alt, className }: SafeImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading="lazy" />
  );
}
