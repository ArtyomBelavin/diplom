"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

const checkoutSchema = z.object({
  recipientName: z.string().min(2, "Укажи получателя."),
  recipientPhone: z.string().min(6, "Укажи номер телефона."),
  deliveryAddress: z.string().min(6, "Укажи адрес доставки."),
  deliveryMethodId: z.string().min(1, "Выбери способ доставки."),
  paymentMethodId: z.string().min(1, "Выбери способ оплаты."),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

type StoreMeta = {
  deliveryMethods: Array<{
    id: number;
    name: string;
    description?: string | null;
    price: number;
  }>;
  paymentMethods: Array<{
    id: number;
    name: string;
    description?: string | null;
  }>;
};

type CartResponse = {
  items: Array<{
    id: number;
    quantity: number;
    priceAtAdd: number;
    product: { id: number; name: string };
  }>;
  total: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { auth, sessionId, announce } = useAccessibility();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      recipientName: "",
      recipientPhone: "",
      deliveryAddress: "",
      deliveryMethodId: "",
      paymentMethodId: "",
    },
  });

  const metaQuery = useQuery({
    queryKey: ["store-meta"],
    queryFn: () => apiFetch<StoreMeta>("/meta"),
    enabled: Boolean(auth.token),
  });
  const cartQuery = useQuery({
    queryKey: ["checkout-cart", auth.token, sessionId],
    queryFn: () =>
      apiFetch<CartResponse>("/cart", {
        token: auth.token,
        sessionId,
      }),
    enabled: Boolean(auth.token),
  });
  const orderMutation = useMutation({
    mutationFn: (values: CheckoutFormValues) =>
      apiFetch<{ message: string }>("/orders", {
        method: "POST",
        token: auth.token,
        sessionId,
        body: JSON.stringify({
          recipientName: values.recipientName,
          recipientPhone: values.recipientPhone,
          deliveryAddress: values.deliveryAddress,
          deliveryMethodId: Number(values.deliveryMethodId),
          paymentMethodId: Number(values.paymentMethodId),
        }),
      }),
    onSuccess: async (response) => {
      announce(response.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["checkout-cart"] }),
        queryClient.invalidateQueries({ queryKey: ["cart"] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
      ]);
      router.push("/account");
    },
  });
  const meta = metaQuery.data ?? null;
  const cart = cartQuery.data ?? null;
  const isCartEmpty = !cart || cart.items.length === 0;

  const onSubmit = async (values: CheckoutFormValues) => {
    await orderMutation.mutateAsync(values);
  };

  if (!auth.token) {
    return (
      <Card>
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
            Оформление заказа
          </p>
          <CardTitle className="mt-3 text-4xl">
            Для оплаты нужен аккаунт
          </CardTitle>
          <CardDescription className="mt-3 text-base leading-7">
            Товары уже можно добавлять в корзину как гость, но оформить заказ и
            оплатить его можно только после входа.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/login">Войти</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Создать аккаунт</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
            Checkout
          </p>
          <CardTitle className="mt-3 text-4xl" data-page-title>
            Доставка и оплата
          </CardTitle>
          <CardDescription className="mt-3 text-base leading-7">
            Финальный шаг оформлен линейно: сначала данные получателя, затем
            доставка и способ оплаты.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCartEmpty ? (
            <Card className="mb-4 rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
              <CardContent className="p-5 text-sm leading-6 text-[color:var(--muted)]">
                Корзина сейчас пуста. Вернись в каталог или корзину и добавь товары перед оформлением заказа.
              </CardContent>
            </Card>
          ) : null}
          <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[color:var(--muted)]">
                Получатель
              </span>
              <Input placeholder="Имя и фамилия" {...register("recipientName")} />
              {errors.recipientName ? (
                <span className="text-sm text-red-600">
                  {errors.recipientName.message}
                </span>
              ) : null}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[color:var(--muted)]">
                Телефон
              </span>
              <Input placeholder="+7 (999) 000-00-00" {...register("recipientPhone")} />
              {errors.recipientPhone ? (
                <span className="text-sm text-red-600">
                  {errors.recipientPhone.message}
                </span>
              ) : null}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[color:var(--muted)]">
                Адрес доставки
              </span>
              <Input placeholder="Город, улица, дом" {...register("deliveryAddress")} />
              {errors.deliveryAddress ? (
                <span className="text-sm text-red-600">
                  {errors.deliveryAddress.message}
                </span>
              ) : null}
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[color:var(--muted)]">
                  Доставка
                </span>
                <Controller
                  control={control}
                  name="deliveryMethodId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выбери доставку" />
                      </SelectTrigger>
                      <SelectContent>
                        {meta?.deliveryMethods.map((method) => (
                          <SelectItem key={method.id} value={String(method.id)}>
                            {method.name} · {method.price.toLocaleString("ru-RU")} ₽
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.deliveryMethodId ? (
                  <span className="text-sm text-red-600">
                    {errors.deliveryMethodId.message}
                  </span>
                ) : null}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-[color:var(--muted)]">
                  Оплата
                </span>
                <Controller
                  control={control}
                  name="paymentMethodId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выбери оплату" />
                      </SelectTrigger>
                      <SelectContent>
                        {meta?.paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={String(method.id)}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.paymentMethodId ? (
                  <span className="text-sm text-red-600">
                    {errors.paymentMethodId.message}
                  </span>
                ) : null}
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button disabled={isSubmitting || isCartEmpty} type="submit">
                {isSubmitting ? "Оформляем..." : "Подтвердить заказ"}
              </Button>
              <Button asChild variant="outline">
                <Link href="/cart">Вернуться в корзину</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
            Заказ
          </p>
          <CardTitle className="mt-3 text-2xl">Состав покупки</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {cart?.items.map((item) => (
            <div
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4"
              key={item.id}
            >
              <p className="font-medium text-[color:var(--text)]">
                {item.product.name}
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {item.quantity} × {item.priceAtAdd.toLocaleString("ru-RU")} ₽
              </p>
            </div>
          ))}
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
            <p className="text-sm text-[color:var(--muted)]">Итого по товарам</p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]">
              {cart?.total.toLocaleString("ru-RU") || 0} ₽
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
