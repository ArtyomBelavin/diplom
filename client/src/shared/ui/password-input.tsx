"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 pr-12 text-[color:var(--text)] outline-none transition focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]",
          className,
        )}
        ref={ref}
        type={visible ? "text" : "password"}
      />
      <button
        aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
        className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[color:var(--muted)] transition hover:bg-black/5 hover:text-[color:var(--text)]"
        type="button"
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
