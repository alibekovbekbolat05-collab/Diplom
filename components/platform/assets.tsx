"use client";
import { useI18n } from "@/components/providers";
import { useConsole, DataControls } from "./context";
import { Topology, RiskGauge } from "@/components/viz/charts";
export function AssetsView() {
  const { messages: m, locale } = useI18n(),
    { data } = useConsole();
  return (
    <>
      <h1 className="mb-7 font-display text-3xl">
        {m.platform.modules.assets}
      </h1>
      <DataControls />
      <section className="panel mb-5 p-6">
        <h2 className="text-sm">{m.platform.assets.topology}</h2>
        <Topology assets={data?.assets || []} />
        <p className="mt-4 text-xs text-mute">{m.console.illustration}</p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data?.assets.map((a) => (
          <article key={a.host} className="panel p-5">
            <h2 className="font-mono text-sm text-accent">{a.host}</h2>
            <RiskGauge value={a.risk} label={m.platform.assets.risk} />
            <p className="mt-4 text-xs text-mute">
              {a.events} {m.platform.events} / {a.alerts} {m.platform.alerts}
            </p>
            <p className="mt-3 text-xs text-mute">
              {m.platform.assets.lastSeen}:{" "}
              {new Date(a.last_seen).toLocaleString(locale)}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
