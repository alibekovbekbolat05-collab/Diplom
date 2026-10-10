"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/providers";
import { useConsole, DataControls } from "./context";
import { Drawer } from "@/components/ui/overlay";
import type { SecurityEvent } from "@/server/schema";
export function EventsView() {
  const { messages: m, locale } = useI18n(),
    c = useConsole();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("");
  const [events, setEvents] = useState<SecurityEvent[]>([]),
    [total, setTotal] = useState(0),
    [error, setError] = useState("");
  const [selected, setSelected] = useState<SecurityEvent | null>(null);
  const [ipColumns, setIpColumns] = useState(true);
  const [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const params = new URLSearchParams({
    source: c.source,
    scenario: c.scenario,
    q: active,
  });
  if (from) params.set("from", new Date(from).toISOString());
  if (to) params.set("to", new Date(to).toISOString());
  const url = params.toString();
  useEffect(() => {
    const ctl = new AbortController();
    fetch(`/api/events?${url}`, { signal: ctl.signal })
      .then(async (r) => {
        if (!r.ok) throw Error();
        const x = await r.json();
        setEvents(x.events);
        setTotal(x.total);
        setError("");
      })
      .catch(() => {
        if (!ctl.signal.aborted) setError(m.common.error);
      });
    return () => ctl.abort();
  }, [url, c.data?.updated, m.common.error]);
  return (
    <>
      <h1 className="mb-7 font-display text-3xl">{m.platform.events}</h1>
      <DataControls />
      <form
        className="mb-5 flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setActive(query);
        }}
      >
        <input
          className="min-w-0 flex-1 rounded-lg border border-line bg-panel px-4 py-3 text-sm"
          aria-label={m.common.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={m.platform.ev.query}
          maxLength={1024}
        />
        <button className="glow-btn rounded-lg px-5 text-sm">
          {m.common.search}
        </button>
        <label className="flex items-center gap-2 text-xs text-mute">
          IP{" "}
          <input
            type="checkbox"
            checked={ipColumns}
            onChange={(e) => setIpColumns(e.target.checked)}
          />
        </label>
        <div className="flex w-full flex-wrap items-center gap-3">
          <label className="text-xs text-mute">
            {m.platform.ev.from}
            <input
              className="ml-2 rounded-lg border border-line bg-panel p-2"
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="text-xs text-mute">
            {m.platform.ev.to}
            <input
              className="ml-2 rounded-lg border border-line bg-panel p-2"
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <span className="ml-auto text-xs text-mute">
            {m.platform.ev.count}: {total}
          </span>
          {["csv", "json"].map((format) => (
            <a
              key={format}
              href={`/api/events?${url}&format=${format}`}
              className="rounded-lg border border-line px-3 py-2 text-xs uppercase"
            >
              {format} ↓
            </a>
          ))}
        </div>
      </form>
      <p role="alert" className="mb-3 text-sm text-critical">
        {error}
      </p>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel text-xs text-mute">
            <tr>
              {[
                m.common.time,
                m.console.host,
                m.common.actions,
                ...(ipColumns ? [m.console.sourceIp, m.console.targetIp] : []),
                m.common.status,
                m.common.details,
              ].map((k) => (
                <th key={k} scope="col" className="whitespace-nowrap p-4">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr
                key={e.id}
                className="border-t border-line hover:bg-accent/[.02]"
              >
                <td className="whitespace-nowrap p-4 text-xs text-mute">
                  {new Date(e.ts).toLocaleString(locale)}
                </td>
                <td className="p-4 font-mono text-accent">{e.host}</td>
                <td className="p-4">{e.event_action}</td>
                {ipColumns && (
                  <>
                    <td className="p-4 font-mono text-xs">{e.src_ip || "—"}</td>
                    <td className="p-4 font-mono text-xs">{e.dst_ip || "—"}</td>
                  </>
                )}
                <td
                  className={`p-4 text-xs ${e.outcome === "failure" ? "text-high" : "text-mute"}`}
                >
                  {m.console.outcomes[e.outcome]}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => setSelected(e)}
                    className="text-xs text-accent"
                  >
                    {m.common.open} ↗
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!events.length && <p className="p-8 text-mute">{m.console.none}</p>}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={m.platform.ev.raw}
      >
        <p className="mb-5 text-xs text-mute">{m.console.rawNote}</p>
        <pre className="whitespace-pre-wrap break-all rounded-xl border border-line p-4 text-xs leading-relaxed">
          {JSON.stringify(selected, null, 2)}
        </pre>
      </Drawer>
    </>
  );
}
