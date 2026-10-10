"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useFocusTrap } from "@/components/ui/overlay";
import { site } from "@/config/site";
import { company } from "@/config/company";
import { useI18n, useTheme } from "@/components/providers";
import { springSnappy, springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { MsgKey } from "@/lib/i18n";

const isChromium = () =>
  typeof navigator !== "undefined" &&
  /Chrome/.test(navigator.userAgent) &&
  !/Edg|OPR|Mobile/.test(navigator.userAgent);

export function LiquidNav() {
  const { t, locale } = useI18n();
  const { toggle } = useTheme();
  const pathname = usePathname() || `/${locale}`;
  const reduced = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const trap = useFocusTrap<HTMLElement>(open, () => setOpen(false));
  const [gooey, setGooey] = useState(false);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const [glowX, setGlowX] = useState(0);
  const lastY = useRef(0);

  const rest = pathname.split("/").slice(2).join("/");
  const pathFor = (l: string) => `/${l}${rest ? "/" + rest : ""}`;
  const activeHref = `/${locale}${rest ? "/" + rest : ""}`;

  useEffect(() => {
    setGooey(isChromium());
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastY.current && y > 320);
      setCompact(y > 40);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  const links = site.nav.map((n) => ({
    href: `/${locale}${n.href}`,
    label: t(n.key as MsgKey),
  }));

  function onPillMove(e: React.MouseEvent) {
    const r = pillRef.current?.getBoundingClientRect();
    if (!r) return;
    setGlowX(e.clientX - r.left);
  }

  return (
    <>
      <motion.header
        className="fixed inset-x-0 bottom-3 z-[70] flex justify-center px-3 md:bottom-auto md:top-4"
        animate={{
          y: hidden && !open ? -90 : 0,
          opacity: hidden && !open ? 0 : 1,
        }}
        transition={springSoft}
      >
        <div
          ref={pillRef}
          onMouseMove={onPillMove}
          onMouseLeave={() => setGlowX(-100)}
          className={cn(
            "glass relative flex w-full max-w-3xl items-center gap-1 overflow-hidden rounded-full transition-[padding] duration-300",
            compact ? "px-3 py-1.5" : "px-4 py-2.5",
          )}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-0 h-full w-40 bg-accent/10 blur-xl"
            animate={{ x: glowX - 80, opacity: glowX < 0 ? 0 : 1 }}
            transition={springSoft}
          />
          <Link
            href={`/${locale}`}
            className="relative z-10 mr-2 flex shrink-0 items-center gap-2 rounded-full px-1 font-display text-sm font-semibold tracking-tight"
          >
            <svg width="20" height="20" viewBox="0 0 64 64" aria-hidden>
              <path
                d="M32 8l18 7v14c0 12-7.5 20.5-18 25C21.5 49.5 14 41 14 29V15l18-7z"
                fill="none"
                stroke="rgb(var(--c-accent))"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">{company.name}</span>
          </Link>

          <nav
            aria-label="main"
            className="relative z-10 hidden flex-1 items-center justify-center gap-1 md:flex"
          >
            {links.map((l) => {
              const active =
                activeHref === l.href ||
                (l.href !== `/${locale}` && activeHref.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-3.5 py-1.5 text-sm transition-colors",
                    active ? "text-ink" : "text-mute hover:text-ink",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-blob"
                      className={cn(
                        "absolute inset-0 rounded-full border border-accent/40 bg-accent/10",
                        gooey && !reduced && "goo-blob",
                      )}
                      transition={springSnappy}
                    />
                  )}
                  <span className="relative z-10">{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="relative z-10 ml-auto flex items-center gap-1.5">
            <nav
              aria-label="language"
              className="hidden items-center rounded-full border border-line/70 p-0.5 sm:flex"
            >
              {site.locales.map((l) => (
                <Link
                  key={l}
                  href={pathFor(l)}
                  hrefLang={l}
                  aria-current={l === locale ? "true" : undefined}
                  className={cn(
                    "relative rounded-full px-2 py-1 text-xs font-medium uppercase",
                    l === locale ? "text-ink" : "text-mute hover:text-ink",
                  )}
                >
                  {l === locale && (
                    <motion.span
                      layoutId="lang-blob"
                      className="absolute inset-0 rounded-full bg-accent/15"
                      transition={springSnappy}
                    />
                  )}
                  <span className="relative z-10">{l}</span>
                </Link>
              ))}
            </nav>
            <button
              onClick={toggle}
              aria-label={t("theme.dark") + " / " + t("theme.light")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line/70 text-mute hover:text-ink"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            </button>
            <Link
              href={`/${locale}/platform/login`}
              className="hidden rounded-full border border-accent/50 bg-accent/10 px-3.5 py-1.5 text-sm font-medium text-ink transition hover:bg-accent/20 md:inline-flex"
            >
              {t("nav.signIn")}
            </Link>
            <button
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label={open ? t("nav.close") : t("nav.menu")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line/70 md:hidden"
            >
              <motion.span
                animate={{ rotate: open ? 45 : 0 }}
                className="text-lg leading-none"
              >
                {open ? "✕" : "☰"}
              </motion.span>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div
              className="absolute inset-0 bg-bg/80 backdrop-blur-2xl"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.nav
              ref={trap}
              role="dialog"
              aria-modal="true"
              aria-label={t("nav.signIn")}
              className="absolute inset-x-0 top-0 flex h-full flex-col justify-center gap-2 px-8 pb-[env(safe-area-inset-bottom)]"
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: {
                  transition: { staggerChildren: 0.05, delayChildren: 0.08 },
                },
              }}
            >
              <button
                className="absolute right-7 top-7 h-11 w-11 rounded-full border border-line"
                onClick={() => setOpen(false)}
                aria-label={t("common.close")}
              >
                ✕
              </button>
              {links.map((l) => (
                <motion.div
                  key={l.href}
                  variants={{
                    closed: { opacity: 0, y: 24 },
                    open: { opacity: 1, y: 0, transition: springSnappy },
                  }}
                >
                  <Link
                    href={l.href}
                    aria-current={activeHref === l.href ? "page" : undefined}
                    className="block py-2 font-display text-3xl tracking-tight"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                variants={{
                  closed: { opacity: 0, y: 24 },
                  open: { opacity: 1, y: 0, transition: springSnappy },
                }}
                className="mt-6 flex items-center gap-3"
              >
                {site.locales.map((l) => (
                  <Link
                    key={l}
                    href={pathFor(l)}
                    className={cn(
                      "rounded-full border border-line px-3 py-1.5 text-sm uppercase",
                      l === locale ? "border-accent/60 text-ink" : "text-mute",
                    )}
                  >
                    {l}
                  </Link>
                ))}
              </motion.div>
              <motion.div
                variants={{
                  closed: { opacity: 0, y: 24 },
                  open: { opacity: 1, y: 0, transition: springSnappy },
                }}
                className="mt-4"
              >
                <Link
                  href={`/${locale}/platform/login`}
                  className="glow-btn inline-flex h-12 items-center rounded-xl px-6 font-medium"
                  onClick={() => setOpen(false)}
                >
                  {t("nav.signIn")}
                </Link>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <svg aria-hidden className="absolute h-0 w-0">
        <defs>
          <filter id="gooey-nav">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.09"
              numOctaves="2"
              result="noise"
              seed="7"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" />
          </filter>
        </defs>
      </svg>
    </>
  );
}
