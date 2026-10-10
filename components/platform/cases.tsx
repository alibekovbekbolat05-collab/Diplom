"use client";
import { alertLabel } from "@/lib/alert-labels";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/providers";
import { useConsole, DataControls } from "./context";
import { Drawer } from "@/components/ui/overlay";
import { SeverityBadge } from "@/components/ui/panel";
import type { Incident } from "@/server/schema";
export function CasesView({ initialId }: { initialId?: string }) {
  const { messages: m, locale } = useI18n(),
    c = useConsole();
  const [selected, setSelected] = useState<Incident | null>(null),
    [error, setError] = useState(""),
    [summary, setSummary] = useState<{
      text: string;
      ai_generated: boolean;
    } | null>(null);
  useEffect(() => {
    if (initialId && c.data)
      setSelected(c.data.cases.find((x) => x.id === initialId) || null);
  }, [initialId, c.data]);
  useEffect(() => {
    if (!selected) return;
    const ctl = new AbortController();
    const params = new URLSearchParams({
      source: c.source,
      scenario: c.scenario,
      locale,
    });
    fetch(`/api/cases/${selected.id}?${params}`, { signal: ctl.signal })
      .then(async (r) => {
        if (r.ok) setSummary((await r.json()).summary);
      })
      .catch(() => {});
    return () => ctl.abort();
  }, [selected, c.source, c.scenario, locale]);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    if (!fields.comment) delete fields.comment;
    try {
      const r = await fetch(`/api/cases/${selected.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": c.session.csrf || "",
        },
        body: JSON.stringify(fields),
      });
      if (!r.ok) throw Error();
      setSelected((await r.json()).incident);
      setError("");
      c.refresh();
    } catch {
      setError(m.common.error);
    }
  }
  return (
    <>
      <h1 className="mb-7 font-display text-3xl">{m.platform.modules.cases}</h1>
      <DataControls />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {c.data?.cases.map((row) => (
          <article key={row.id} className="panel p-6">
            <div className="flex items-center justify-between">
              <SeverityBadge
                severity={row.severity}
                label={m.common.sev[row.severity]}
              />
              <span className="text-xs text-mute">
                {m.console.statuses[row.status]}
              </span>
            </div>
            <h2 className="mt-5 text-lg">{row.entity}</h2>
            <p className="mt-3 truncate font-mono text-sm text-accent">
              {row.entity}
            </p>
            <p className="mt-3 text-xs text-mute">
              {row.alert_ids.length} {m.platform.alerts}
            </p>
            <button
              className="mt-7 text-sm text-accent"
              onClick={() => {
                setSelected(row);
                setSummary(null);
              }}
            >
              {m.platform.cases.openCase} ↗
            </button>
          </article>
        ))}
      </div>
      {!c.data?.cases.length && (
        <p className="p-8 text-mute">{m.console.none}</p>
      )}
      <Drawer
        wide
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.entity}
      >
        {selected && (
          <>
            <button
              className="text-xs text-accent"
              onClick={() =>
                void navigator.clipboard
                  .writeText(
                    `${window.location.origin}/${locale}/platform/cases/${selected.id}?source=${c.source}&scenario=${c.scenario}`,
                  )
                  .catch(() => setError(m.common.error))
              }
            >
              {m.console.copyLink} ↗
            </button>
            <p className="my-5 font-mono text-xs text-mute">
              {selected.entity} /{" "}
              {new Date(selected.first_seen).toLocaleString(locale)}
            </p>
            {summary && (
              <div className="panel mb-6 p-4">
                <p className="text-sm leading-relaxed">{summary.text}</p>
                {summary.ai_generated && (
                  <p className="mt-3 text-xs text-accent">
                    {m.common.aiGenerated}
                  </p>
                )}
              </div>
            )}
            <h3 className="mb-4 text-sm text-accent">
              {m.platform.cases.timeline}
            </h3>
            <ol className="mb-8 space-y-3 border-l border-line pl-5">
              {c.data?.alerts
                .filter((a) => selected.alert_ids.includes(a.id))
                .map((a) => (
                  <li key={a.id} className="text-sm">
                    <p>{alertLabel(a.type, locale)}</p>
                    <p className="mt-1 font-mono text-xs text-mute">
                      {a.mitre} / {new Date(a.ts).toLocaleTimeString(locale)}
                    </p>
                  </li>
                ))}
            </ol>
            <form onSubmit={save} className="space-y-4">
              <fieldset
                disabled={
                  c.session.demo ||
                  c.session.role === "viewer" ||
                  selected.simulation
                }
                className="space-y-4 disabled:opacity-60"
              >
                <label className="block text-xs">
                  {m.common.status}
                  <select
                    name="status"
                    defaultValue={selected.status}
                    className="ml-3 rounded-lg border border-line bg-panel p-2"
                  >
                    {[
                      "open",
                      "investigating",
                      "resolved",
                      "false_positive",
                    ].map((s) => (
                      <option key={s} value={s}>
                        {
                          m.console.statuses[
                            s as keyof typeof m.console.statuses
                          ]
                        }
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs">
                  {m.platform.cases.assignee}
                  <input
                    name="assignee"
                    maxLength={254}
                    defaultValue={selected.assignee}
                    className="mt-2 w-full rounded-lg border border-line bg-bg p-3"
                  />
                </label>
                <label className="block text-xs">
                  {m.platform.cases.notes}
                  <textarea
                    name="notes"
                    maxLength={4000}
                    defaultValue={selected.notes}
                    className="mt-2 w-full rounded-lg border border-line bg-bg p-3"
                  />
                </label>
                <label className="block text-xs">
                  {m.platform.cases.comments}
                  <textarea
                    name="comment"
                    maxLength={2000}
                    className="mt-2 w-full rounded-lg border border-line bg-bg p-3"
                  />
                </label>
                <button className="glow-btn rounded-xl px-5 py-3 text-sm">
                  {m.common.save}
                </button>
              </fieldset>
              <p role="alert" className="text-sm text-critical">
                {error}
              </p>
            </form>
            {selected.comments.map((x, i) => (
              <article key={i} className="mt-4 border-t border-line pt-4">
                <p className="text-xs text-mute">{x.email}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{x.text}</p>
              </article>
            ))}
          </>
        )}
      </Drawer>
    </>
  );
}
