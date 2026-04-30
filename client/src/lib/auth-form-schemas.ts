import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Укажи корректный email."),
  password: z
    .string()
    .min(8, "Пароль должен содержать минимум 8 символов."),
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, "Укажи имя и фамилию."),
  email: z.email("Укажи корректный email."),
  phone: z
    .string()
    .min(6, "Укажи номер телефона."),
  password: z
    .string()
    .min(8, "Пароль должен содержать минимум 8 символов."),
  confirmPassword: z
    .string()
    .min(8, "Подтверди пароль."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают.",
  path: ["confirmPassword"],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
