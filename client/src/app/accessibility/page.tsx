"use client";

import { useAccessibility } from "@/providers/accessibility-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export default function AccessibilityPage() {
  const { settings } = useAccessibility();

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
          Настройки доступности
        </p>
        <CardTitle className="mt-3 text-4xl">
          Персонализация интерфейса без перезагрузки страницы
        </CardTitle>
        <CardDescription className="mt-3 text-base leading-7">
          Текущее состояние хранится локально для гостя и может
          синхронизироваться с сервером для авторизованного пользователя.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
            <CardContent className="p-5">
              <CardTitle className="text-xl">Размер текста</CardTitle>
              <CardDescription className="mt-2">
                {settings.fontScale}%
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
            <CardContent className="p-5">
              <CardTitle className="text-xl">Контраст</CardTitle>
              <CardDescription className="mt-2">
                {settings.contrastMode === "high" ? "Высокий" : "Стандартный"}
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="rounded-[1.75rem] bg-[color:var(--surface-strong)] shadow-none">
            <CardContent className="p-5">
              <CardTitle className="text-xl">Голосовые подсказки</CardTitle>
              <CardDescription className="mt-2">
                {settings.voiceHints ? "Включены" : "Выключены"}
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
