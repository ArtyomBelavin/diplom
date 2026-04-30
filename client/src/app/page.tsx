"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
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

type ProductResponse = {
  items: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    stockQty: number;
    badge?: string;
    category?: { name: string };
    media?: Array<{ fileUrl: string; altText: string }>;
  }>;
};

export default function HomePage() {
  const { auth } = useAccessibility();
  const { data } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => apiFetch<ProductResponse>("/products?limit=6"),
  });

  const products = data?.items ?? [];

  return (
    <>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
      <Card>
        <CardContent className="p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
            Adaptive Market
          </p>
          <h1
            className="mt-3 max-w-5xl text-4xl font-bold tracking-tight text-[color:var(--text)] sm:text-5xl"
            data-page-title
          >
            Устройства и аксессуары для комфортной повседневной жизни.
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-[color:var(--muted)]">
            Каталог объединяет устройства чтения, аудиорешения и навигационные
            аксессуары с понятной подачей характеристик, отзывов и заказа.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/catalog">Перейти в каталог</Link>
            </Button>
            {auth.token ? (
              <Button asChild variant="outline">
                <Link href="/account">Открыть профиль</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/register">Создать аккаунт</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      </motion.div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
        >
        <Card>
          <CardHeader>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
              Выбор покупателей
            </p>
            <CardTitle className="mt-3 text-3xl">
              Почему выбирают этот магазин
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-[1.5rem] bg-[color:var(--surface-strong)] shadow-none">
              <CardContent className="p-5">
                <CardTitle className="text-xl">Понятный каталог</CardTitle>
                <CardDescription className="mt-2">
                  Быстрый поиск, фильтры по категориям и подробные карточки без
                  перегруженного интерфейса.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] bg-[color:var(--surface-strong)] shadow-none">
              <CardContent className="p-5">
                <CardTitle className="text-xl">Простой заказ</CardTitle>
                <CardDescription className="mt-2">
                  Корзина доступна гостю, а оформление проходит по линейному и
                  предсказуемому сценарию.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] bg-[color:var(--surface-strong)] shadow-none">
              <CardContent className="p-5">
                <CardTitle className="text-xl">Гибкие настройки</CardTitle>
                <CardDescription className="mt-2">
                  Размер текста, контраст, фокус и другие параметры можно менять
                  с любого экрана.
                </CardDescription>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, delay: 0.14, ease: "easeOut" }}
        >
        <Card>
          <CardHeader>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
              Сервис
            </p>
            <CardTitle className="mt-3 text-3xl">Покупка без лишних шагов</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 text-sm leading-6 text-[color:var(--muted)]">
              <li>Гость может изучать каталог и собирать корзину без регистрации.</li>
              <li>После входа доступны оформление, история заказов и профиль.</li>
              <li>Карточки товаров показывают характеристики, отзывы и фото.</li>
              <li>Интерфейс остаётся читаемым и на десктопе, и на мобильных устройствах.</li>
            </ul>
          </CardContent>
        </Card>
        </motion.div>
      </section>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" }}
      >
      <Card>
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
            Из каталога
          </p>
          <CardTitle className="mt-3 text-3xl">
            Рекомендованные товары
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </>
  );
}
