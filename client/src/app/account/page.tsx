"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
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

type ProfileResponse = {
  fullName: string;
  email: string;
  role: string;
  favorites: Array<{ id: number; productId: number }>;
};

type OrdersResponse = Array<{
  id: number;
  status: string;
  totalAmount: number;
  items: Array<{ id: number; quantity: number; product?: { name: string } }>;
}>;

export default function AccountPage() {
  const { auth } = useAccessibility();
  const profileQuery = useQuery({
    queryKey: ["profile", auth.token],
    queryFn: () => apiFetch<ProfileResponse>("/users/profile", { token: auth.token }),
    enabled: Boolean(auth.token),
  });
  const ordersQuery = useQuery({
    queryKey: ["orders", auth.token],
    queryFn: () => apiFetch<OrdersResponse>("/orders/my", { token: auth.token }),
    enabled: Boolean(auth.token),
  });
  const profile = profileQuery.data ?? null;
  const orders = ordersQuery.data ?? [];
  const error = profileQuery.error instanceof Error ? profileQuery.error.message : "";

  if (!auth.token) {
    return (
      <Card>
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
            Личный кабинет
          </p>
          <CardTitle className="mt-3 text-4xl">
            Профиль, избранное и история заказов
          </CardTitle>
          <CardDescription className="mt-3 text-base leading-7">
            Чтобы открыть персональный кабинет, сначала выполните вход.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/login">Открыть страницу входа</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
          Личный кабинет
        </p>
        <CardTitle className="mt-3 text-4xl" data-page-title>
          {profile?.fullName || "Загрузка профиля"}
        </CardTitle>
        <CardDescription className="mt-3 text-base leading-7">
          {error || `${profile?.email || ""}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
            <CardContent className="p-5">
              <CardTitle className="text-xl">Избранное</CardTitle>
              <CardDescription className="mt-2">
                {profile?.favorites.length || 0} товаров сохранено для быстрого
                возврата.
              </CardDescription>
              <Button asChild className="mt-3 w-full sm:w-auto" variant="outline">
                <Link href="/favorites">Открыть подборку</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
            <CardContent className="p-5">
              <CardTitle className="text-xl">История заказов</CardTitle>
              <CardDescription className="mt-2">
                {orders.length} заказов с текстовыми статусами и суммами.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
            <CardContent className="p-5">
              <CardTitle className="text-xl">Настройки доступности</CardTitle>
              <Button asChild className="mt-3 w-full sm:w-auto" variant="outline">
                <Link href="/accessibility">Быстро изменить параметры</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {orders.map((order) => (
            <Card
              className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none"
              key={order.id}
            >
              <CardContent className="p-5">
                <h2 className="text-xl font-semibold text-[color:var(--text)]">
                  Заказ #{order.id}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  Статус: {order.status}
                </p>
                <p className="text-sm leading-6 text-[color:var(--muted)]">
                  Сумма: {order.totalAmount.toLocaleString("ru-RU")} ₽
                </p>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-[color:var(--muted)]">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.product?.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
