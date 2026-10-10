"use client";
import Link from "next/link";
import { useI18n } from "@/components/providers";
export default function NotFound() {
  const { messages: m, locale } = useI18n();
  return (
    <main className="mx-auto max-w-xl px-5 py-32">
      <p className="mb-5 font-mono text-accent">404</p>
      <h1 className="font-display text-3xl">{m.p404.title}</h1>
      <p className="my-6 text-mute">{m.p404.text}</p>
      <Link className="text-accent" href={`/${locale}`}>
        {m.p404.home} ↗
      </Link>
    </main>
  );
}
