"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

type AdminOrdersResponse = Array<{
  id: number;
  status: string;
  totalAmount: number;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  createdAt: string;
  user?: { email: string; fullName: string } | null;
  deliveryMethod: { name: string; price: number };
  paymentMethod: { name: string };
  items: Array<{
    id: number;
    quantity: number;
    unitPrice: number;
    product: {
      name: string;
      media?: Array<{ fileUrl: string; altText: string }>;
    };
  }>;
}>;

export default function AdminOrdersPage() {
  const { auth, announce } = useAccessibility();
  const queryClient = useQueryClient();
  const [statuses, setStatuses] = useState<Record<number, string>>({});
  const ordersQuery = useQuery({
    queryKey: ["admin-orders", auth.token],
    queryFn: () => apiFetch<AdminOrdersResponse>("/admin/orders", { token: auth.token }),
    enabled: Boolean(auth.token),
  });
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch<{ message: string }>(`/admin/orders/${id}/status`, {
        method: "PATCH",
        token: auth.token,
        body: JSON.stringify({ status }),
      }),
    onSuccess: async (response) => {
      announce(response.message);
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  const orders = ordersQuery.data ?? [];
  const error =
    ordersQuery.error instanceof Error ? ordersQuery.error.message : "";

  useEffect(() => {
    if (orders.length === 0) {
      return;
    }

    setStatuses((current) => {
      const next = { ...current };
      for (const order of orders) {
        if (!next[order.id]) {
          next[order.id] = order.status;
        }
      }
      return next;
    });
  }, [orders]);

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
          Заказы клиентов
        </p>
        <CardTitle className="mt-3 text-4xl" data-page-title>Все оформленные заказы</CardTitle>
        <CardDescription className="mt-3 text-base leading-7">
          Контрольный список по покупателям, составу заказов, доставке и
          оплате.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5">
        {error ? (
          <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
            <CardContent className="p-5 text-sm text-[color:var(--muted)]">
              {error}
            </CardContent>
          </Card>
        ) : null}

        {orders.map((order) => (
          <Card
            className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none"
            key={order.id}
          >
            <CardContent className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="grid gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-[color:var(--text)]">
                      Заказ #{order.id}
                    </h2>
                    <p className="text-sm text-[color:var(--muted)]">
                      {new Date(order.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                  <div className="rounded-full bg-[color:var(--accent-soft)] px-4 py-2 text-sm font-medium text-[color:var(--accent)]">
                    {order.status}
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[220px] flex-1">
                    <p className="mb-2 text-sm text-[color:var(--muted)]">
                      Изменить статус
                    </p>
                    <Select
                      value={statuses[order.id] ?? order.status}
                      onValueChange={(value) =>
                        setStatuses((current) => ({ ...current, [order.id]: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выбери статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">NEW</SelectItem>
                        <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                        <SelectItem value="ASSEMBLING">ASSEMBLING</SelectItem>
                        <SelectItem value="SHIPPED">SHIPPED</SelectItem>
                        <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                        <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    disabled={
                      updateStatusMutation.isPending ||
                      (statuses[order.id] ?? order.status) === order.status
                    }
                    type="button"
                    variant="outline"
                    onClick={() =>
                      void updateStatusMutation.mutateAsync({
                        id: order.id,
                        status: statuses[order.id] ?? order.status,
                      })
                    }
                  >
                    Сохранить статус
                  </Button>
                </div>

                <div className="grid gap-2 text-sm text-[color:var(--muted)]">
                  <p>
                    Покупатель:{" "}
                    <strong className="text-[color:var(--text)]">
                      {order.user?.fullName || order.recipientName}
                    </strong>
                  </p>
                  <p>Email: {order.user?.email || "Не указан"}</p>
                  <p>Телефон: {order.recipientPhone}</p>
                  <p>Адрес: {order.deliveryAddress}</p>
                  <p>
                    Доставка: {order.deliveryMethod.name} ·{" "}
                    {order.deliveryMethod.price.toLocaleString("ru-RU")} ₽
                  </p>
                  <p>Оплата: {order.paymentMethod.name}</p>
                </div>

                <div className="grid gap-3">
                  {order.items.map((item) => (
                    <div
                      className="grid items-start gap-4 rounded-2xl border border-[color:var(--border)] bg-white/50 p-4 md:grid-cols-[88px_minmax(0,1fr)]"
                      key={item.id}
                    >
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[color:var(--surface-strong)]">
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
                      <div className="min-w-0">
                        <p className="break-words font-medium text-[color:var(--text)]">
                          {item.product.name}
                        </p>
                        <p className="mt-1 text-sm text-[color:var(--muted)]">
                          {item.quantity} × {item.unitPrice.toLocaleString("ru-RU")} ₽
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white/55 p-5">
                <p className="text-sm text-[color:var(--muted)]">Сумма заказа</p>
                <p className="mt-2 text-3xl font-semibold text-[color:var(--text)]">
                  {order.totalAmount.toLocaleString("ru-RU")} ₽
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
