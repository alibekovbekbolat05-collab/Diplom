"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/providers";
export function LiveStats() {
  const { m, locale } = { m: useI18n().messages, locale: useI18n().locale };
  const [stats, setStats] = useState<{ eps: number; alerts: number; cases: number; assets: number } | null>(null);
  useEffect(() => { const controller = new AbortController(); let timer: ReturnType<typeof setTimeout>;
    async function poll() { try { const response = await fetch("/api/stats", { signal: controller.signal }); if (response.ok) setStats(await response.json()); } catch {} if (!controller.signal.aborted) timer = setTimeout(poll, 10000); }
    void poll(); return () => { controller.abort(); clearTimeout(timer); };
  }, []);
  return <div className="glass mx-auto max-w-6xl rounded-2xl p-6"><p className="mb-5 flex items-center gap-2 text-xs text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{m.common.simulation}</p><dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">{(["eps", "alerts", "cases", "assets"] as const).map(key => <div key={key}><dd className="tnum font-display text-3xl">{stats ? stats[key].toLocaleString(locale) : "—"}</dd><dt className="mt-2 text-sm text-mute">{m.home.live[key]}</dt></div>)}</dl></div>;
}
