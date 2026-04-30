"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { ProductMedia } from "@/components/product-media";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

type ProductCardProps = {
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    stockQty?: number;
    badge?: string;
    media?: Array<{ fileUrl: string; altText: string }>;
    category?: { name: string };
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const image = product.media?.[0];

  return (
    <motion.div
      className="h-full"
      transition={{ duration: 0.22, ease: "easeOut" }}
      whileHover={{ y: -6, scale: 1.01 }}
    >
      <Card className="flex h-full flex-col overflow-hidden">
        <div className="relative">
          {image ? (
            <ProductMedia
              alt={image.altText}
              className="aspect-[16/11] w-full object-cover"
              height={320}
              src={image.fileUrl}
              sizes="(min-width: 1536px) 420px, (min-width: 768px) 50vw, 100vw"
              width={640}
            />
          ) : (
            <div className="aspect-[16/11] w-full bg-[color:var(--accent-soft)]" />
          )}

          <FavoriteButton
            className="absolute right-4 top-4 shadow-sm"
            productId={product.id}
          />
        </div>

        <CardContent className="grid h-full grid-rows-[auto_auto_1fr_auto] gap-4 p-5">
          <div className="flex min-h-6 items-start justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">
              {product.category?.name || product.badge}
            </p>
          </div>
          <h3 className="break-words text-xl font-semibold tracking-tight text-[color:var(--text)]">
            {product.name}
          </h3>
          <p className="break-words text-sm text-[color:var(--muted)]">
            {product.description}
          </p>
          <div className="flex flex-col items-start gap-3">
            <strong className="text-lg text-[color:var(--text)]">
              {product.price.toLocaleString("ru-RU")} ₽
            </strong>
            {typeof product.stockQty === "number" ? (
              product.stockQty > 0 ? (
                <span className="text-sm text-[color:var(--muted)]">
                  {product.stockQty <= 3
                    ? `Осталось ${product.stockQty} шт.`
                    : `В наличии: ${product.stockQty} шт.`}
                </span>
              ) : (
                <span className="text-sm font-medium text-red-600">
                  Товара больше нет на складе
                </span>
              )
            ) : null}
            <Button asChild className="w-full sm:w-auto" size="sm" variant="outline">
              <Link href={`/products/${product.id}`}>Открыть карточку</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
