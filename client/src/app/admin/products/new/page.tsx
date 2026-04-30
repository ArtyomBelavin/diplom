"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/shared/ui/textarea";

const productSchema = z.object({
  categoryId: z.string().min(1, "Выбери категорию."),
  sku: z.string().min(3, "Укажи артикул."),
  name: z.string().min(3, "Укажи название товара."),
  description: z.string().min(10, "Добавь описание товара."),
  price: z.string().min(1, "Укажи цену."),
  stockQty: z.string().min(1, "Укажи количество на складе."),
  fileUrl: z.string().min(1, "Загрузи изображение товара."),
  altText: z.string().min(3, "Добавь alt-текст для изображения."),
  characteristics: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;
type CategoriesResponse = Array<{ id: number; name: string; slug: string }>;
type UploadResponse = { message: string; fileUrl: string };

function parseCharacteristics(raw: string | undefined) {
  if (!raw?.trim()) {
    return {};
  }

  return raw.split("\n").reduce<Record<string, string>>((acc, line, index) => {
    const normalizedLine = line.trim();
    if (!normalizedLine) {
      return acc;
    }

    const [key, ...valueParts] = line.split(":");
    const normalizedKey = key?.trim();
    const normalizedValue = valueParts.join(":").trim();

    if (normalizedKey && normalizedValue) {
      acc[normalizedKey] = normalizedValue;
    } else if (normalizedLine) {
      acc[`Параметр ${index + 1}`] = normalizedLine;
    }

    return acc;
  }, {});
}

export default function AdminNewProductPage() {
  const { auth, announce } = useAccessibility();
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => apiFetch<CategoriesResponse>("/categories"),
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: "onChange",
    defaultValues: {
      categoryId: "",
      sku: "",
      name: "",
      description: "",
      price: "0",
      stockQty: "0",
      fileUrl: "",
      altText: "",
      characteristics: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      apiFetch<{ message: string }>("/admin/products", {
        method: "POST",
        token: auth.token,
        body: JSON.stringify({
          categoryId: Number(values.categoryId),
          sku: values.sku,
          name: values.name,
          description: values.description,
          price: Number(values.price),
          stockQty: Number(values.stockQty),
          characteristics: parseCharacteristics(values.characteristics),
          media: [
            {
              mediaType: "IMAGE",
              fileUrl: values.fileUrl,
              altText: values.altText,
            },
          ],
        }),
      }),
    onSuccess: (response) => {
      reset({
        categoryId: "",
        sku: "",
        name: "",
        description: "",
        price: "0",
        stockQty: "0",
        fileUrl: "",
        altText: "",
        characteristics: "",
      });
      setPreviewUrl("");
      setSelectedFileName("");
      setFileInputKey((current) => current + 1);
      announce(response.message);
    },
  });
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      return apiFetch<UploadResponse>("/admin/uploads/image", {
        method: "POST",
        token: auth.token,
        body: formData,
      });
    },
    onSuccess: (response) => {
      setValue("fileUrl", response.fileUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      announce(response.message);
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
    await createMutation.mutateAsync(values);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    void uploadMutation.mutateAsync(file);
  };

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
          Новый товар
        </p>
        <CardTitle className="mt-3 text-4xl" data-page-title>Создание карточки товара</CardTitle>
        <CardDescription className="mt-3 text-base leading-7">
          Заполни основные данные, изображение и alt-текст, чтобы карточка
          товара корректно публиковалась в каталоге.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6">
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[color:var(--muted)]">
                Категория
              </span>
              <Select
                value={watch("categoryId")}
                onValueChange={(value) => setValue("categoryId", value, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выбери категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesQuery.data?.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId ? (
                <span className="text-sm text-red-600">{errors.categoryId.message}</span>
              ) : null}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[color:var(--muted)]">
                Артикул SKU
              </span>
              <Input placeholder="BRAILLE-001" {...register("sku")} />
              {errors.sku ? (
                <span className="text-sm text-red-600">{errors.sku.message}</span>
              ) : null}
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Название товара
            </span>
            <Input placeholder="Портативный дисплей Брайля" {...register("name")} />
            {errors.name ? (
              <span className="text-sm text-red-600">{errors.name.message}</span>
            ) : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Описание
            </span>
            <Textarea
              placeholder="Кратко опиши назначение товара и основные преимущества."
              {...register("description")}
            />
            {errors.description ? (
              <span className="text-sm text-red-600">{errors.description.message}</span>
            ) : null}
          </label>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[color:var(--muted)]">
                Цена
              </span>
              <Input min="0" step="1" type="number" {...register("price")} />
              {errors.price ? (
                <span className="text-sm text-red-600">{errors.price.message}</span>
              ) : null}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[color:var(--muted)]">
                Остаток на складе
              </span>
              <Input min="0" step="1" type="number" {...register("stockQty")} />
              {errors.stockQty ? (
                <span className="text-sm text-red-600">{errors.stockQty.message}</span>
              ) : null}
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[color:var(--muted)]">
                Изображение товара
              </span>
              <input
                accept="image/*"
                className="sr-only"
                id="product-image-upload"
                key={fileInputKey}
                type="file"
                onChange={handleFileChange}
              />
              <label
                className="flex min-h-14 cursor-pointer flex-wrap items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm text-[color:var(--text)]"
                htmlFor="product-image-upload"
              >
                <span className="inline-flex rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--text)]">
                  Выбрать файл
                </span>
                <span className="min-w-0 flex-1 break-all text-[color:var(--muted)]">
                  {selectedFileName || "Файл не выбран"}
                </span>
              </label>
              {selectedFileName ? (
                <span className="text-sm text-[color:var(--muted)]">
                  Выбран файл: {selectedFileName}
                </span>
              ) : null}
              {uploadMutation.isPending ? (
                <span className="text-sm text-[color:var(--muted)]">
                  Загружаем изображение...
                </span>
              ) : null}
              <input type="hidden" {...register("fileUrl")} />
              {errors.fileUrl ? (
                <span className="text-sm text-red-600">{errors.fileUrl.message}</span>
              ) : null}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[color:var(--muted)]">
                Alt-текст
              </span>
              <Input
                placeholder="Компактный дисплей Брайля на светлом столе"
                {...register("altText")}
              />
              {errors.altText ? (
                <span className="text-sm text-red-600">{errors.altText.message}</span>
              ) : null}
            </label>
          </div>

          {previewUrl ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
                <Image
                  alt={watch("altText") || "Предпросмотр изображения товара"}
                  className="object-cover"
                  fill
                  src={previewUrl}
                  unoptimized
                />
              </div>
            </div>
          ) : null}

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--muted)]">
              Характеристики
            </span>
            <Textarea
              className="min-h-40"
              placeholder={"Формат: ключ: значение\nНапример:\nВес: 420 г\nПодключение: USB-C"}
              {...register("characteristics")}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <Button disabled={isSubmitting || uploadMutation.isPending} type="submit">
              {isSubmitting ? "Сохраняем..." : "Создать товар"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin">Вернуться в админку</Link>
            </Button>
          </div>
        </form>

        {createMutation.error instanceof Error ? (
          <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
            <CardContent className="p-5 text-sm text-red-600">
              {createMutation.error.message}
            </CardContent>
          </Card>
        ) : null}

        {uploadMutation.error instanceof Error ? (
          <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
            <CardContent className="p-5 text-sm text-red-600">
              {uploadMutation.error.message}
            </CardContent>
          </Card>
        ) : null}

        {createMutation.data ? (
          <Card className="rounded-[1.75rem] border-green-200 bg-green-50/70 shadow-none">
            <CardContent className="p-5 text-sm text-green-700">
              {createMutation.data.message}
            </CardContent>
          </Card>
        ) : null}
      </CardContent>
    </Card>
  );
}
