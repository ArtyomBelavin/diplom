"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginFormValues, loginSchema } from "@/lib/auth-form-schemas";
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
import { PasswordInput } from "@/shared/ui/password-input";

type AuthResponse = {
  accessToken: string;
  message: string;
  user: { email: string; role: string };
};

export default function LoginPage() {
  const router = useRouter();
  const { announce, setAuth, sessionId } = useAccessibility();
  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) =>
      apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      }),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "user@inclusive-shop.local",
      password: "User123!",
    },
  });

  const handleLogin = async (values: LoginFormValues) => {
    const response = await loginMutation.mutateAsync(values);

    setAuth({
      token: response.accessToken,
      email: response.user.email,
      role: response.user.role,
    });
    await apiFetch("/cart", {
      token: response.accessToken,
      sessionId,
    }).catch(() => undefined);
    announce(response.message);
    router.push("/account");
  };

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
          Авторизация
        </p>
        <CardTitle className="mt-3 text-4xl">
          Вход для оформления, заказов и профиля
        </CardTitle>
        <CardDescription className="mt-3 text-base leading-7">
          Корзину можно собрать как гость, а для оплаты и истории заказов нужен
          вход в аккаунт.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit(handleLogin)}>
          <label className="grid gap-2 lg:col-span-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Email
            </span>
            <Input placeholder="user@example.com" {...register("email")} />
            {errors.email ? (
              <span className="text-sm text-red-600">{errors.email.message}</span>
            ) : null}
          </label>

          <label className="grid gap-2 lg:col-span-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Пароль
            </span>
            <PasswordInput {...register("password")} />
            {errors.password ? (
              <span className="text-sm text-red-600">
                {errors.password.message}
              </span>
            ) : null}
          </label>

          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Выполняем вход..." : "Войти"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Создать аккаунт</Link>
            </Button>
          </div>
        </form>

        <Card className="mt-5 rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
          <CardContent className="p-5">
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              Для демо можно использовать `user@inclusive-shop.local / User123!`
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
