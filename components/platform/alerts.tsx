"use client";
import { alertLabel } from "@/lib/alert-labels";
import { useState, useEffect } from "react";
import { useI18n } from "@/components/providers";
import { useConsole, DataControls } from "./context";
import { Drawer } from "@/components/ui/overlay";
import { SeverityBadge } from "@/components/ui/panel";
import type { Alert } from "@/server/schema";
export function AlertDetails({ alert }: { alert: Alert }) {
  const { messages: m } = useI18n();
  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3">
        <SeverityBadge severity={alert.severity} />
        <span className="text-xs text-mute">
          {alert.mitre} / {m.console.priority}: {alert.priority}
        </span>
      </div>
      <section>
        <h3 className="mb-3 text-sm text-accent">{m.platform.al.why}</h3>
        <pre className="whitespace-pre-wrap break-all text-xs leading-relaxed">
          {JSON.stringify(alert.evidence, null, 2)}
        </pre>
      </section>
      <section>
        <h3 className="mb-4 text-sm text-accent">{m.platform.al.factors}</h3>
        {alert.factors.map((f) => (
          <div key={f.name} className="mb-3">
            <div className="mb-1 flex justify-between text-xs">
              <span>{f.name.replaceAll("_", " ")}</span>
              <span className="tnum text-mute">{f.value.toFixed(1)}</span>
            </div>
            <div className="h-1 bg-line">
              <div
                className="h-1 bg-accent"
                style={{ width: `${Math.min(100, f.value)}%` }}
              />
            </div>
          </div>
        ))}
        <p className="mt-5 text-xs text-mute">{m.console.featureNote}</p>
      </section>
      <section>
        <h3 className="mb-3 text-sm text-accent">{m.platform.al.recommend}</h3>
        <p className="text-sm leading-relaxed text-mute">
          {m.console.recommendation}
        </p>
      </section>
      <p className="text-xs text-mute">{m.console.illustration}</p>
    </div>
  );
}
export function AlertsView() {
  const { messages: m, locale } = useI18n(),
    { data } = useConsole();
  const [severity, setSeverity] = useState("all"),
    [selected, setSelected] = useState<Alert | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id && data) setSelected(data.alerts.find((a) => a.id === id) || null);
  }, [data]);
  return (
    <>
      <h1 className="mb-7 font-display text-3xl">{m.platform.alerts}</h1>
      <DataControls />
      <label className="mb-5 block text-xs text-mute">
        {m.common.severity}
        <select
          className="ml-3 rounded-lg border border-line bg-panel p-2 text-ink"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        >
          <option value="all">{m.common.all}</option>
          {Object.entries(m.common.sev).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel text-xs text-mute">
            <tr>
              {[
                m.common.severity,
                m.platform.al.rule,
                m.platform.al.mitre,
                m.console.priority,
                m.common.time,
                m.common.details,
              ].map((k) => (
                <th key={k} scope="col" className="p-4">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.alerts
              .filter((a) => severity === "all" || a.severity === severity)
              .map((a) => (
                <tr key={a.id} className="border-t border-line">
                  <td className="p-4">
                    <SeverityBadge
                      severity={a.severity}
                      label={m.common.sev[a.severity]}
                    />
                  </td>
                  <td className="p-4">
                    <p>{alertLabel(a.type, locale)}</p>
                    <p className="mt-1 max-w-56 truncate font-mono text-xs text-mute">
                      {a.entities.slice(0, 2).join(" / ")}
                    </p>
                  </td>
                  <td className="p-4 font-mono text-xs text-mute">{a.mitre}</td>
                  <td className="tnum p-4 text-accent">{a.priority}</td>
                  <td className="whitespace-nowrap p-4 text-xs text-mute">
                    {new Date(a.ts).toLocaleTimeString(locale)}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelected(a)}
                      className="text-xs text-accent"
                    >
                      {m.platform.al.explain} ↗
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!data?.alerts.length && (
        <p className="p-8 text-mute">{m.console.none}</p>
      )}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? alertLabel(selected.type, locale) : undefined}
      >
        {selected && <AlertDetails alert={selected} />}
      </Drawer>
    </>
  );
}
