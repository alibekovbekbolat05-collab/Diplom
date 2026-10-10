"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/providers";
import { useState } from "react";
export function LoginForm({ demoEnabled }: { demoEnabled: boolean }) {
  const { locale, messages: m } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(action: string, data?: object) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/auth/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data || {}),
      });
      if (!response.ok) {
        setError(
          response.status === 429
            ? m.platform.login.locked
            : m.platform.login.invalid,
        );
        return;
      }
      router.push(`/${locale}/platform`);
      router.refresh();
    } catch {
      setError(m.common.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Link href={`/${locale}`} className="mb-10 font-display text-accent">
        ← Aspan Security
      </Link>
      <div className="glass rounded-2xl p-8">
        <p className="mb-4 text-xs uppercase tracking-widest text-accent">
          SecureOps Console
        </p>
        <h1 className="font-display text-2xl">{m.platform.login.title}</h1>
        <p className="mt-4 text-sm text-mute">{m.platform.login.sub}</p>
        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.currentTarget));
            void submit("login", data);
          }}
        >
          <label className="block text-sm">
            {m.platform.login.email}
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="username"
              className="mt-2 w-full rounded-lg border border-line bg-bg p-3"
            />
          </label>
          <label className="block text-sm">
            {m.platform.login.password}
            <input
              name="password"
              type="password"
              required
              maxLength={256}
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-line bg-bg p-3"
            />
          </label>
          <button disabled={busy} className="glow-btn w-full rounded-xl p-3">
            {busy ? m.common.loading : m.platform.login.submit}
          </button>
        </form>
        <p role="alert" className="my-4 text-sm text-critical">
          {error}
        </p>
        {demoEnabled && (
          <button
            disabled={busy}
            onClick={() => void submit("demo")}
            className="w-full rounded-xl border border-line p-3 text-accent"
          >
            {m.platform.login.demo} ↗
          </button>
        )}
        <p className="mt-5 text-xs leading-relaxed text-mute">
          {m.platform.login.note}
        </p>
      </div>
    </main>
  );
}
