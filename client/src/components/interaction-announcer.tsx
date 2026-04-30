"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAccessibility } from "@/providers/accessibility-provider";

function normalizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function getAnnouncementTitle(pathname: string) {
  if (pathname === "/") return "Главная";
  if (pathname === "/catalog") return "Каталог";
  if (pathname === "/cart") return "Корзина";
  if (pathname === "/checkout") return "Оформление заказа";
  if (pathname === "/favorites") return "Избранное";
  if (pathname === "/account") return "Профиль";
  if (pathname === "/login") return "Вход";
  if (pathname === "/register") return "Регистрация";
  if (pathname === "/accessibility") return "Панель доступности";
  if (pathname === "/admin") return "Администрирование";
  if (pathname === "/admin/orders") return "Заказы клиентов";
  if (pathname === "/admin/products/new") return "Создание товара";

  if (pathname.startsWith("/products/")) {
    const titleNode = document.querySelector<HTMLElement>("[data-page-title]");
    return normalizeText(titleNode?.textContent) || "Карточка товара";
  }

  return (
    normalizeText(
      document.querySelector<HTMLElement>("[data-page-title]")?.textContent,
    ) || ""
  );
}

export function InteractionAnnouncer() {
  const pathname = usePathname();
  const { announce, settings } = useAccessibility();
  const lastPathRef = useRef("");

  useEffect(() => {
    if (!settings.voiceHints) {
      return;
    }

    const timer = window.setTimeout(() => {
      const title = getAnnouncementTitle(pathname);
      const message = title ? `Открыта страница ${title}.` : "Открыта новая страница.";

      if (lastPathRef.current !== pathname) {
        lastPathRef.current = pathname;
        announce(message);
      }
    }, 160);

    return () => window.clearTimeout(timer);
  }, [announce, pathname, settings.voiceHints]);

  useEffect(() => {
    if (!settings.voiceHints) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const interactive = target.closest<HTMLElement>(
        "button, a, [role='button'], [data-radix-collection-item]",
      );

      if (!interactive) {
        return;
      }

      const label =
        normalizeText(interactive.getAttribute("aria-label")) ||
        normalizeText(interactive.textContent);

      if (!label) {
        return;
      }

      announce(label);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [announce, settings.voiceHints]);

  return null;
}
