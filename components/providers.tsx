"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { createT, type Messages, type MsgKey, type TFunc } from "@/lib/i18n";
import type { Locale } from "@/config/site";

interface I18nCtx {
  messages: Messages;
  locale: Locale;
  t: TFunc;
}

const Ctx = createContext<I18nCtx | null>(null);

export function MessagesProvider({
  messages,
  locale,
  children,
}: {
  messages: Messages;
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nCtx>(
    () => ({ messages, locale, t: createT(messages as unknown as Record<string, unknown>) }),
    [messages, locale]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside MessagesProvider");
  return ctx;
}

export function useT(): TFunc {
  return useI18n().t;
}

export function useTheme() {
  const toggle = useCallback(() => {
    const el = document.documentElement;
    const isLight = el.classList.toggle("light");
    try {
      localStorage.setItem("theme", isLight ? "light" : "dark");
    } catch {
      /* private mode */
    }
  }, []);
  return { toggle };
}
