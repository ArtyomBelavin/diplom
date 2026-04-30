"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RegisterFormValues,
  registerSchema,
} from "@/lib/auth-form-schemas";
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

export default function RegisterPage() {
  const router = useRouter();
  const { announce, setAuth, sessionId } = useAccessibility();
  const registerMutation = useMutation({
    mutationFn: (values: RegisterFormValues) =>
      apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          password: values.password,
        }),
      }),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    const response = await registerMutation.mutateAsync(values);

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
          Регистрация
        </p>
        <CardTitle className="mt-3 text-4xl">
          Создай аккаунт для оформления заказов
        </CardTitle>
        <CardDescription className="mt-3 text-base leading-7">
          Гость может собирать корзину без входа, но оплата и история заказов
          доступны только после регистрации.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Имя и фамилия
            </span>
            <Input placeholder="Имя Фамилия" {...register("fullName")} />
            {errors.fullName ? (
              <span className="text-sm text-red-600">{errors.fullName.message}</span>
            ) : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Email
            </span>
            <Input placeholder="name@example.com" {...register("email")} />
            {errors.email ? (
              <span className="text-sm text-red-600">{errors.email.message}</span>
            ) : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Телефон
            </span>
            <Input placeholder="+7 (999) 000-00-00" {...register("phone")} />
            {errors.phone ? (
              <span className="text-sm text-red-600">{errors.phone.message}</span>
            ) : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Пароль
            </span>
            <PasswordInput {...register("password")} />
            {errors.password ? (
              <span className="text-sm text-red-600">{errors.password.message}</span>
            ) : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Повтори пароль
            </span>
            <PasswordInput {...register("confirmPassword")} />
            {errors.confirmPassword ? (
              <span className="text-sm text-red-600">
                {errors.confirmPassword.message}
              </span>
            ) : null}
          </label>

          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Создаём аккаунт..." : "Создать аккаунт"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Уже есть аккаунт</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
