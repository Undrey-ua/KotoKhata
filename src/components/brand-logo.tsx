import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: number;
  className?: string;
};

export function BrandLogo({ size = 44, className }: BrandLogoProps) {
  return (
    <Image
      src="/brand/logo.png"
      alt="KotoXata"
      width={size}
      height={size}
      className={cn("rounded-full", className)}
      priority
    />
  );
}
