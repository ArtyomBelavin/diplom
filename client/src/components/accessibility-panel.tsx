"use client";

import { useAccessibility } from "@/providers/accessibility-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export function AccessibilityPanel() {
  const { settings, setSettings, announce } = useAccessibility();

  return (
    <Card aria-labelledby="accessibility-title" className="overflow-hidden">
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
          Accessibility
        </p>
        <CardTitle
          className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text)]"
          id="accessibility-title"
        >
          Панель доступности
        </CardTitle>
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
          Управляй размером текста, контрастом и вспомогательными режимами с
          любого экрана.
        </p>
      </CardHeader>

      <CardContent className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-[color:var(--muted)]">
            Размер шрифта
          </span>
          <input
            className="accent-[color:var(--accent)]"
            max={150}
            min={90}
            type="range"
            value={settings.fontScale}
            onChange={(event) => {
              const fontScale = Number(event.target.value);
              setSettings({ fontScale });
              announce(`Размер шрифта изменён: ${fontScale} процентов.`);
            }}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[color:var(--muted)]">
            Контраст
          </span>
          <Select
            value={settings.contrastMode}
            onValueChange={(value: "default" | "high") => {
              const contrastMode = value;
              setSettings({ contrastMode });
              announce(
                contrastMode === "high"
                  ? "Включён высококонтрастный режим."
                  : "Возвращён стандартный контраст.",
              );
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите контраст" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Стандартный</SelectItem>
              <SelectItem value="high">Высокий</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[color:var(--muted)]">
            Межстрочный интервал
          </span>
          <Select
            value={settings.lineSpacing}
            onValueChange={(value: "normal" | "wide") => {
              setSettings({
                lineSpacing: value,
              });
              announce(
                value === "wide"
                  ? "Включен расширенный межстрочный интервал."
                  : "Возвращен обычный межстрочный интервал.",
              );
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите интервал" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Обычный</SelectItem>
              <SelectItem value="wide">Расширенный</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <div className="mt-2 grid gap-3">
          <label className="flex items-start gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3">
            <Checkbox
              checked={settings.hideImages}
              className="mt-1"
              onCheckedChange={(checked) => {
                const nextValue = checked === true;
                setSettings({ hideImages: nextValue });
                announce(
                  nextValue
                    ? "Изображения приглушены."
                    : "Изображения снова отображаются в обычном режиме.",
                );
              }}
            />
            <span className="text-sm leading-6 text-[color:var(--text)]">
              Скрывать изображения
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3">
            <Checkbox
              checked={settings.focusHighlight}
              className="mt-1"
              onCheckedChange={(checked) => {
                const nextValue = checked === true;
                setSettings({ focusHighlight: nextValue });
                announce(
                  nextValue
                    ? "Усиленный видимый фокус включен."
                    : "Усиленный видимый фокус отключен.",
                );
              }}
            />
            <span className="text-sm leading-6 text-[color:var(--text)]">
              Усиливать видимый фокус
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3">
            <Checkbox
              checked={settings.voiceHints}
              className="mt-1"
              onCheckedChange={(checked) => {
                const nextValue = checked === true;
                setSettings({ voiceHints: nextValue });
                announce(
                  nextValue
                    ? "Голосовые подсказки включены."
                    : "Голосовые подсказки отключены.",
                );
              }}
            />
            <span className="text-sm leading-6 text-[color:var(--text)]">
              Голосовые подсказки
            </span>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
