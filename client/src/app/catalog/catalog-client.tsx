"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { apiFetch } from "@/lib/api";
import { useAccessibility } from "@/providers/accessibility-provider";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

type CatalogResponse = {
  items: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    stockQty: number;
    category?: { name: string; slug: string };
    media?: Array<{ fileUrl: string; altText: string }>;
  }>;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextPage: number | null;
  message: string;
};

type Categories = Array<{ id: number; name: string; slug: string }>;

type CatalogClientProps = {
  initialCategory: string;
  initialQuery: string;
  initialSort: string;
};

export function CatalogClient({
  initialCategory,
  initialQuery,
  initialSort,
}: CatalogClientProps) {
  const router = useRouter();
  const { announce } = useAccessibility();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<Categories>("/categories"),
  });
  const productsQuery = useInfiniteQuery({
    queryKey: ["catalog-products", query, category, sort],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      if (sort) params.set("sort", sort);
      params.set("page", String(pageParam));
      params.set("limit", "9");
      return apiFetch<CatalogResponse>(`/products?${params.toString()}`);
    },
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });

  const items = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [productsQuery.data],
  );
  const message = productsQuery.data?.pages[0]?.message ?? "";
  const total = productsQuery.data?.pages[0]?.total ?? 0;
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = productsQuery;

  useEffect(() => {
    if (message) {
      announce(message);
    }
  }, [announce, message]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    const queryString = params.toString();
    router.push(`/catalog${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-2 text-sm text-[color:var(--muted)]">
          <span>Главная</span>
          <span>/</span>
          <span>Каталог</span>
        </div>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
          Каталог
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[color:var(--text)]">
          Поиск, фильтрация и доступная навигация
        </h1>
        <p className="mt-3 text-base leading-7 text-[color:var(--muted)]">
          {message || "Подбирай товары по категориям и прокручивай каталог без перезагрузки."}
        </p>

        <form
          className="mt-6 grid gap-4 lg:grid-cols-2"
          onSubmit={handleSubmit}
        >
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Поиск по каталогу
            </span>
            <Input
              placeholder="Например, дисплей Брайля"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Категория
            </span>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categoriesQuery.data?.map((item) => (
                  <SelectItem key={item.id} value={item.slug}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Сортировка
            </span>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger>
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-asc">Сначала дешевле</SelectItem>
                <SelectItem value="price-desc">Сначала дороже</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <div className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Применить фильтры
            </span>
            <Button type="submit">Обновить список товаров</Button>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-between gap-3 text-sm text-[color:var(--muted)]">
          <span>Товаров найдено: {total}</span>
          {productsQuery.isFetching ? <span>Обновляем подборку...</span> : null}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div ref={loadMoreRef} className="mt-8 flex justify-center">
          {productsQuery.isFetchingNextPage ? (
            <p className="text-sm text-[color:var(--muted)]">Загружаем ещё товары...</p>
          ) : productsQuery.hasNextPage ? (
            <p className="text-sm text-[color:var(--muted)]">Прокрути ниже, чтобы подгрузить ещё</p>
          ) : (
            <p className="text-sm text-[color:var(--muted)]">Ты просмотрел весь каталог</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
