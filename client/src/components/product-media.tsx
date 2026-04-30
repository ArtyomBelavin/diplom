"use client";

import Image from "next/image";
import { isLocalUploadUrl, normalizeMediaUrl } from "@/lib/media";

type ProductMediaProps = {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
};

export function ProductMedia({
  src,
  alt,
  className,
  width,
  height,
  fill = false,
  sizes,
}: ProductMediaProps) {
  const normalizedSrc = normalizeMediaUrl(src);

  if (!normalizedSrc) {
    return null;
  }

  if (isLocalUploadUrl(normalizedSrc)) {
    return (
      <img
        alt={alt}
        className={className}
        sizes={sizes}
        src={normalizedSrc}
      />
    );
  }

  if (fill) {
    return (
      <Image
        alt={alt}
        className={className}
        fill
        sizes={sizes}
        src={normalizedSrc}
      />
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      height={height ?? 400}
      sizes={sizes}
      src={normalizedSrc}
      width={width ?? 400}
    />
  );
}
