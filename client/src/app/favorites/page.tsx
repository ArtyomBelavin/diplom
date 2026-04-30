"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/product-card";
import { apiFetch } from "@/lib/api";
import { FavoriteItem } from "@/lib/favorites";
import { useAccessibility } from "@/providers/accessibility-provider";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export default function FavoritesPage() {
  const { auth } = useAccessibility();
  const favoritesQuery = useQuery({
    queryKey: ["favorites", auth.token],
    queryFn: () =>
      apiFetch<FavoriteItem[]>("/users/favorites", {
        token: auth.token,
      }),
    enabled: Boolean(auth.token),
  });

  if (!auth.token) {
    return (
      <Card>
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
            Избранное
          </p>
          <CardTitle className="mt-3 text-4xl">
            Сохраняй товары в подборку
          </CardTitle>
          <CardDescription className="mt-3 text-base leading-7">
            Войди в аккаунт, чтобы собирать избранные товары и быстро
            возвращаться к ним позже.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/login">Войти</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const favorites = favoritesQuery.data ?? [];

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card>
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
            Избранное
          </p>
          <CardTitle className="mt-3 text-4xl">
            Сохранённые товары
          </CardTitle>
          <CardDescription className="mt-3 text-base leading-7">
            {favorites.length > 0
              ? `В подборке сейчас ${favorites.length} товаров.`
              : "Пока здесь пусто. Добавляй товары в избранное прямо из каталога или карточки товара."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {favorites.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {favorites.map((favorite, index) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 18 }}
                  key={favorite.id}
                  transition={{ duration: 0.28, delay: index * 0.04 }}
                >
                  <ProductCard product={favorite.product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6 text-sm leading-6 text-[color:var(--muted)]">
              Ничего не добавлено в избранное. Открой каталог и нажми на сердце
              у интересующего товара.
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
