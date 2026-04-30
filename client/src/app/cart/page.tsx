"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import Link from "next/link";
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

type CartResponse = {
  items: Array<{
    id: number;
    quantity: number;
    priceAtAdd: number;
    product: {
      id: number;
      name: string;
      stockQty: number;
      characteristics?: Record<string, string>;
      media?: Array<{ fileUrl: string; altText: string }>;
    };
  }>;
  total: number;
  message: string;
};

export default function CartPage() {
  const { auth, sessionId, announce } = useAccessibility();
  const queryClient = useQueryClient();
  const cartQuery = useQuery({
    queryKey: ["cart", auth.token, sessionId],
    queryFn: () =>
      apiFetch<CartResponse>("/cart", {
        token: auth.token,
        sessionId,
      }),
  });
  const cart = cartQuery.data ?? null;
  const updateItemMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      apiFetch<{ message: string }>(`/cart/items/${id}`, {
        method: "PATCH",
        token: auth.token,
        sessionId,
        body: JSON.stringify({ quantity }),
      }),
    onSuccess: async (response) => {
      announce(response.message);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => {
      announce(error instanceof Error ? error.message : "Не удалось обновить корзину.");
    },
  });

  const updateQuantity = async (id: number, quantity: number) => {
    await updateItemMutation.mutateAsync({ id, quantity });
  };

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
          Корзина
        </p>
        <CardTitle className="mt-3 text-4xl" data-page-title>Корзина</CardTitle>
        <CardDescription className="mt-3 text-base leading-7">
          Изменение количества сопровождается текстовым уведомлением и может
          быть озвучено через voice hints.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5">
        {cart && cart.items.length === 0 ? (
          <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
            <CardContent className="p-6 text-sm leading-6 text-[color:var(--muted)]">
              Корзина пока пуста. Добавь товары из каталога, чтобы перейти к оформлению.
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          {cart?.items.map((item) => (
            (() => {
              const hasStock = item.product.stockQty > 0;
              const isAtStockLimit = item.quantity >= item.product.stockQty;

              return (
            <Card
              className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none"
              key={item.id}
            >
              <CardContent className="flex gap-4 p-5">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white/70">
                  {item.product.media?.[0] ? (
                    <ProductMedia
                      alt={item.product.media[0].altText}
                      className="absolute inset-0 h-full w-full object-cover"
                      fill
                      src={item.product.media[0].fileUrl}
                      sizes="96px"
                    />
                  ) : null}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[color:var(--text)]">
                        {item.product.name}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                        {item.priceAtAdd.toLocaleString("ru-RU")} ₽ за штуку
                      </p>
                      {item.product.characteristics &&
                      Object.keys(item.product.characteristics).length > 0 ? (
                        <p className="mt-1 text-sm text-[color:var(--muted)]">
                          {Object.entries(item.product.characteristics)
                            .slice(0, 2)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(" · ")}
                        </p>
                      ) : null}
                    </div>
                    <strong className="text-lg text-[color:var(--text)]">
                      {(item.quantity * item.priceAtAdd).toLocaleString("ru-RU")} ₽
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-white/80 p-1 shadow-sm">
                      <button
                        aria-label="Уменьшить количество"
                        className="inline-flex size-9 items-center justify-center rounded-full text-[color:var(--text)] transition hover:bg-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={item.quantity <= 1 || updateItemMutation.isPending}
                        type="button"
                        onClick={() =>
                          void updateQuantity(item.id, Math.max(1, item.quantity - 1))
                        }
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="min-w-12 px-3 text-center text-sm font-semibold text-[color:var(--text)]">
                        {item.quantity}
                      </span>
                      <button
                        aria-label="Увеличить количество"
                        className="inline-flex size-9 items-center justify-center rounded-full text-[color:var(--text)] transition hover:bg-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={updateItemMutation.isPending || !hasStock || isAtStockLimit}
                        type="button"
                        onClick={() => void updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-[color:var(--muted)]">
                        В корзине: {item.quantity} шт.
                      </p>
                      {!hasStock ? (
                        <p className="mt-1 text-sm font-medium text-red-600">
                          Товара больше нет на складе
                        </p>
                      ) : isAtStockLimit ? (
                        <p className="mt-1 text-sm font-medium text-amber-700">
                          Доступен максимум: {item.product.stockQty} шт.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
              );
            })()
          ))}
        </div>

        <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold text-[color:var(--text)]">
              Итог
            </h2>
            <p className="mt-2 text-lg text-[color:var(--muted)]">
              {cart?.total.toLocaleString("ru-RU") || 0} ₽
            </p>
            {auth.token && cart && cart.items.length > 0 ? (
              <Button asChild className="mt-4">
                <Link href="/checkout">Перейти к оформлению</Link>
              </Button>
            ) : auth.token ? (
              <div className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
                Добавь товары в корзину, чтобы перейти к оформлению заказа.
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                <p className="text-sm leading-6 text-[color:var(--muted)]">
                  Добавлять товары в корзину можно без входа, но оформить и
                  оплатить заказ можно только после авторизации.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/login">Войти для оформления</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/register">Создать аккаунт</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
