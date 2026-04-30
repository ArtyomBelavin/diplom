"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useAccessibility } from "@/providers/accessibility-provider";
import { Menu, Heart, Search, ShoppingCart, UserRound } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

const links = [
  { href: "/catalog", label: "Каталог" },
  { href: "/catalog?category=readers", label: "Устройства чтения" },
  { href: "/catalog?category=audio", label: "Аудио" },
  { href: "/catalog?category=navigation", label: "Навигация" },
];

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { auth, setAuth } = useAccessibility();
  const initialQuery = searchParams.get("q") || "";
  const [search, setSearch] = useState(initialQuery);
  const debouncedSearch = useDebounce(search.trim(), 500);
  const activeCategory = searchParams.get("category") || "";
  const lastSubmittedQueryRef = useRef(initialQuery);

  useEffect(() => {
    setSearch(initialQuery);
    lastSubmittedQueryRef.current = initialQuery;
  }, [initialQuery]);

  const buildCatalogUrl = useMemo(
    () => (query: string) => {
      const params = new URLSearchParams();
      if (query) {
        params.set("q", query);
      }
      if (activeCategory) {
        params.set("category", activeCategory);
      }
      return `/catalog${params.toString() ? `?${params.toString()}` : ""}`;
    },
    [activeCategory],
  );

  useEffect(() => {
    if (debouncedSearch === lastSubmittedQueryRef.current) {
      return;
    }

    lastSubmittedQueryRef.current = debouncedSearch;
    router.push(buildCatalogUrl(debouncedSearch));
  }, [buildCatalogUrl, debouncedSearch, router]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = search.trim();
    lastSubmittedQueryRef.current = nextQuery;
    router.push(buildCatalogUrl(nextQuery));
  };

  const canOpenAdmin =
    auth.role === "ADMIN" || auth.role === "CONTENT_MANAGER";

  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-6">
        <div className="flex flex-col gap-4 border-b border-[color:var(--border)] pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--muted)]">
            <p>Технологии доступности с доставкой по РФ</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/accessibility">Панель доступности</Link>
              {canOpenAdmin ? <Link href="/admin">Управление каталогом</Link> : null}
            </div>
          </div>

          <div className="hidden items-start justify-between gap-4 md:flex">
            <nav
              aria-label="Навигация по сайту"
              className="flex flex-wrap gap-2"
            >
              {links.map((link) => (
                <Button
                  asChild
                  key={link.href}
                  size="sm"
                  variant={
                    link.href === "/catalog"
                      ? pathname === "/catalog" && !activeCategory
                        ? "default"
                        : "outline"
                      : pathname === "/catalog" &&
                          link.href.includes(`category=${activeCategory}`)
                        ? "default"
                        : "outline"
                  }
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </nav>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {auth.email ? (
                <>
                  <Button
                    asChild
                    size="sm"
                    variant={pathname === "/account" ? "default" : "outline"}
                  >
                    <Link href="/account">
                      <UserRound className="size-4" />
                      Профиль
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAuth({ token: null, email: null, role: null })}
                  >
                    Выйти
                  </Button>
                </>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <Link href="/login">
                    <UserRound className="size-4" />
                    Войти
                  </Link>
                </Button>
              )}

              <Button
                asChild
                size="sm"
                variant={pathname === "/cart" ? "default" : "outline"}
              >
                <Link href="/cart">
                  <ShoppingCart className="size-4" />
                  Корзина
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant={pathname === "/favorites" ? "default" : "outline"}
              >
                <Link href="/favorites">
                  <Heart className="size-4" />
                  Избранное
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
          <div className="grid gap-1">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
              Adaptive Market
            </p>
            <Link
              className="text-3xl font-bold tracking-tight text-[color:var(--text)] no-underline"
              href="/"
            >
              Маркет доступных устройств
            </Link>
          </div>

          <div className="flex justify-end md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="Открыть навигационное меню" size="icon" variant="outline">
                  <Menu className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Навигация</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {links.map((link) => (
                  <DropdownMenuItem asChild key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/cart">Корзина</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/favorites">Избранное</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={auth.email ? "/account" : "/login"}>
                    {auth.email ? "Профиль" : "Войти"}
                  </Link>
                </DropdownMenuItem>
                {canOpenAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Управление</Link>
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid gap-3 md:hidden">
          <nav
            aria-label="Мобильная навигация по сайту"
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          >
            {links.map((link) => (
              <Button
                asChild
                key={link.href}
                size="sm"
                variant={
                  link.href === "/catalog"
                    ? pathname === "/catalog" && !activeCategory
                      ? "default"
                      : "outline"
                    : pathname === "/catalog" &&
                        link.href.includes(`category=${activeCategory}`)
                      ? "default"
                      : "outline"
                }
              >
                <Link className="whitespace-nowrap" href={link.href}>
                  {link.label}
                </Link>
              </Button>
            ))}
          </nav>

          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              size="sm"
              variant={pathname === "/cart" ? "default" : "outline"}
            >
              <Link href="/cart">
                <ShoppingCart className="size-4" />
                Корзина
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={pathname === "/favorites" ? "default" : "outline"}
            >
              <Link href="/favorites">
                <Heart className="size-4" />
                Избранное
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={pathname === "/account" ? "default" : "outline"}
            >
              <Link href={auth.email ? "/account" : "/login"}>
                <UserRound className="size-4" />
                {auth.email ? "Профиль" : "Войти"}
              </Link>
            </Button>
            {canOpenAdmin ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/admin">Админка</Link>
              </Button>
            ) : null}
          </div>
        </div>

        <form
          className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={handleSearch}
        >
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[color:var(--muted)]" />
            <Input
              className="pl-10"
              placeholder="Искать товары, например дисплей Брайля"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Button className="xl:min-w-32" type="submit">
            Найти
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
