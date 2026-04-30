"use client";

import { ShieldCheck, ShoppingBag, SquarePen } from "lucide-react";
import Link from "next/link";
import { useAccessibility } from "@/providers/accessibility-provider";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export default function AdminPage() {
  const { auth } = useAccessibility();

  if (!auth.token) {
    return (
      <Card>
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
            Администрирование
          </p>
          <CardTitle className="mt-3 text-4xl">
            Для входа в административный контур нужна авторизация
          </CardTitle>
          <CardDescription className="mt-3 text-base leading-7">
            Войди под администратором или контент-менеджером, чтобы управлять
            товарами и заказами.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/login">Перейти ко входу</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
          Административная панель
        </p>
        <CardTitle className="mt-3 text-4xl" data-page-title>
          Управление товарами и заказами
        </CardTitle>
        <CardDescription className="mt-3 text-base leading-7">
          Отсюда можно создавать карточки товаров и просматривать заказы
          клиентов в одном месте.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
          <CardContent className="grid gap-4 p-6">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
              <SquarePen className="size-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Новый товар</CardTitle>
              <CardDescription className="mt-2">
                Создай полноценную карточку с артикулом, категорией, ценой,
                изображением и alt-текстом.
              </CardDescription>
            </div>
            <Button asChild className="w-fit">
              <Link href="/admin/products/new">Открыть форму товара</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
          <CardContent className="grid gap-4 p-6">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
              <ShoppingBag className="size-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Все заказы</CardTitle>
              <CardDescription className="mt-2">
                Посмотри список заказов клиентов, состав покупки, способ оплаты
                и контакты получателя.
              </CardDescription>
            </div>
            <Button asChild className="w-fit" variant="outline">
              <Link href="/admin/orders">Перейти к заказам</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none lg:col-span-2">
          <CardContent className="flex flex-wrap items-start gap-4 p-6">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
              <ShieldCheck className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-2xl">Роли и доступ</CardTitle>
              <CardDescription className="mt-2">
                Страница доступна администраторам и контент-менеджерам, а
                список всех заказов открыт только администратору.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
