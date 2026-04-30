"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FavoriteButton } from "@/components/favorite-button";
import { ProductMedia } from "@/components/product-media";
import { apiFetch } from "@/lib/api";
import { useAccessibility } from "@/providers/accessibility-provider";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

type ProductDetail = {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQty: number;
  characteristics: Record<string, string>;
  media: Array<{ fileUrl: string; altText: string; transcriptUrl?: string }>;
  reviews: Array<{ id: number; rating: number; comment: string; authorName: string }>;
};

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { auth, sessionId, announce } = useAccessibility();
  const [status, setStatus] = React.useState("");
  const productQuery = useQuery({
    queryKey: ["product", params.id],
    queryFn: () => apiFetch<ProductDetail>(`/products/${params.id}`),
  });
  const addToCartMutation = useMutation({
    mutationFn: (productId: number) =>
      apiFetch<{ message: string }>("/cart/items", {
        method: "POST",
        token: auth.token,
        sessionId,
        body: JSON.stringify({ productId, quantity: 1 }),
      }),
    onError: (error) => {
      const nextMessage =
        error instanceof Error ? error.message : "Не удалось добавить товар в корзину.";
      setStatus(nextMessage);
      announce(nextMessage);
    },
  });
  const product = productQuery.data ?? null;
  const isOutOfStock = (product?.stockQty ?? 0) <= 0;

  const addToCart = async () => {
    if (!product) return;

    const response = await addToCartMutation.mutateAsync(product.id);

    setStatus(response.message);
    announce(response.message);
  };

  if (!product) {
    return (
      <Card>
        <CardContent>
          {status ||
            (productQuery.error instanceof Error
              ? productQuery.error.message
              : "Загрузка карточки товара...")}
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-2 text-sm text-[color:var(--muted)]">
          <Link href="/">Главная</Link>
          <span>/</span>
          <Link href="/catalog">Каталог</Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
            <CardContent className="p-3">
              {product.media[0] ? (
                <ProductMedia
                  alt={product.media[0].altText}
                  className="h-[420px] w-full rounded-[1.2rem] object-cover"
                  height={420}
                  src={product.media[0].fileUrl}
                  sizes="(min-width: 1280px) 50vw, 100vw"
                  width={960}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
            <CardHeader>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
                Карточка товара
              </p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <CardTitle className="text-4xl" data-page-title>{product.name}</CardTitle>
                <FavoriteButton productId={product.id} />
              </div>
              <CardDescription className="mt-4 text-base leading-7">
                {product.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-base text-[color:var(--muted)]">
                <strong className="text-2xl text-[color:var(--text)]">
                  {product.price.toLocaleString("ru-RU")} ₽
                </strong>{" "}
                · В наличии: {product.stockQty} шт.
              </p>
              {isOutOfStock ? (
                <p className="mt-3 text-sm font-medium text-red-600">
                  Товара сейчас нет на складе. Добавление в корзину недоступно.
                </p>
              ) : product.stockQty <= 3 ? (
                <p className="mt-3 text-sm font-medium text-amber-700">
                  Осталось всего {product.stockQty} шт. на складе.
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  disabled={isOutOfStock || addToCartMutation.isPending}
                  onClick={() => void addToCart()}
                >
                  {isOutOfStock ? "Нет в наличии" : "Добавить в корзину"}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/cart">Перейти в корзину</Link>
                </Button>
              </div>
              {status ? (
                <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
                  {status}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
            <CardHeader>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
                Характеристики
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="grid gap-3 text-sm leading-6 text-[color:var(--muted)]">
                {Object.entries(product.characteristics).map(([key, value]) => (
                  <li key={key}>
                    <strong className="text-[color:var(--text)]">{key}:</strong>{" "}
                    {value}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
            <CardHeader>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
                Отзывы
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              {product.reviews.length > 0 ? (
                <ul className="grid gap-4">
                  {product.reviews.map((review) => (
                    <li
                      className="rounded-2xl border border-[color:var(--border)] bg-white/50 p-4"
                      key={review.id}
                    >
                      <strong className="text-[color:var(--text)]">
                        {review.authorName}
                      </strong>{" "}
                      · {review.rating}/5
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        {review.comment}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-2xl border border-[color:var(--border)] bg-white/50 p-4 text-sm leading-6 text-[color:var(--muted)]">
                  У этого товара пока нет отзывов. Добавь его в избранное или
                  вернись к нему позже, когда появятся оценки покупателей.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}
