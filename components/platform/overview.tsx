"use client";
import { alertLabel } from "@/lib/alert-labels";
import Link from "next/link";
import { useI18n } from "@/components/providers";
import { useConsole, DataControls } from "./context";
import { SeverityBadge } from "@/components/ui/panel";
import {
  TrafficChart,
  ThreatMap,
  AttackDonut,
  HostHeatmap,
} from "@/components/viz/charts";
export function OverviewView() {
  const { messages: m, locale } = useI18n(),
    { data } = useConsole();
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[.2em] text-accent">
            {m.console.operations}
          </p>
          <h1 className="font-display text-3xl">{m.platform.overview}</h1>
        </div>
        <span className="rounded-full border border-line px-3 py-1 text-xs text-mute">
          {data?.simulation ? m.common.simulation : m.common.ingested}
        </span>
      </div>
      <DataControls />
      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [m.console.total, data.total],
              [m.platform.ov.eps, data.eps.toFixed(1)],
              [m.platform.alerts, data.alerts.length],
              [m.platform.modules.cases, data.cases.length],
            ].map(([k, v]) => (
              <article key={k} className="panel p-6">
                <p className="text-xs text-mute">{k}</p>
                <p className="tnum mt-4 font-display text-3xl">{v}</p>
                <div className="mt-5 h-px bg-gradient-to-r from-accent/40 to-transparent" />
              </article>
            ))}
          </div>
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <section className="panel p-6">
              <h2 className="mb-6 text-sm">{m.console.live}</h2>
              <TrafficChart events={data.events} alerts={data.alerts} />
              <p className="mb-4 text-xs text-mute">{m.console.trafficNote}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {(["critical", "high", "medium", "low", "info"] as const).map(
                  (severity) => (
                    <div key={severity} className="flex gap-2 text-sm">
                      <SeverityBadge
                        severity={severity}
                        label={m.common.sev[severity]}
                      />
                      <span className="tnum text-mute">
                        {
                          data.alerts.filter((a) => a.severity === severity)
                            .length
                        }
                      </span>
                    </div>
                  ),
                )}
              </div>
            </section>
            <section className="panel p-6">
              <h2 className="text-sm">{m.platform.ov.map}</h2>
              <ThreatMap alerts={data.alerts} />
              <p className="text-xs text-mute">{m.console.illustration}</p>
            </section>
          </div>
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <section className="panel overflow-hidden">
              <h2 className="p-6 text-sm">{m.platform.ov.feed}</h2>
              <div className="divide-y divide-line">
                {data.alerts.slice(0, 8).map((a) => (
                  <Link
                    key={a.id}
                    href={`/${locale}/platform/alerts?id=${a.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-accent/5"
                  >
                    <SeverityBadge
                      severity={a.severity}
                      label={m.common.sev[a.severity]}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        {alertLabel(a.type, locale)}
                      </p>
                      <p className="mt-1 truncate font-mono text-xs text-mute">
                        {a.entities.slice(0, 2).join(" → ")}
                      </p>
                    </div>
                    <span className="tnum text-accent">{a.priority}</span>
                  </Link>
                ))}
              </div>
              {!data.alerts.length && (
                <p className="p-6 text-sm text-mute">{m.console.none}</p>
              )}
            </section>
            <section className="panel p-6">
              <h2 className="mb-6 text-sm">{m.platform.ov.risk}</h2>
              <div className="space-y-5">
                {data.assets.slice(0, 8).map((a) => (
                  <div key={a.host}>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="font-mono">{a.host}</span>
                      <span className="tnum text-mute">{a.risk}/100</span>
                    </div>
                    <div className="h-1 rounded-full bg-line">
                      <div
                        className={`h-1 rounded-full ${a.risk > 70 ? "bg-critical" : "bg-accent"}`}
                        style={{ width: `${a.risk}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <section className="panel p-6">
              <h2 className="mb-5 text-sm">{m.platform.ov.types}</h2>
              <AttackDonut alerts={data.alerts} />
            </section>
            <section className="panel p-6">
              <h2 className="mb-5 text-sm">{m.console.heatmap}</h2>
              <HostHeatmap events={data.events} />
              <p className="mt-4 text-xs text-mute">{m.console.trafficNote}</p>
            </section>
          </div>
        </>
      ) : (
        <p className="panel p-8 text-mute">{m.common.loading}</p>
      )}
    </>
  );
}
