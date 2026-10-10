"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/providers";
import type { SecurityEvent } from "@/server/schema";
export function EventList() {
  const { messages: m, locale } = useI18n();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/events", { signal: c.signal })
      .then(async (r) => {
        if (!r.ok) throw Error();
        setEvents((await r.json()).events);
      })
      .catch(() => {
        if (!c.signal.aborted) setError(m.common.error);
      });
    return () => c.abort();
  }, [m.common.error]);
  return (
    <>
      <p role="alert" className="text-critical">
        {error}
      </p>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel text-mute">
            <tr>
              {[m.common.time, "Host", m.common.actions, m.common.source].map(
                (s) => (
                  <th key={s} className="p-4">
                    {s}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-line">
                <td className="whitespace-nowrap p-4 text-mute">
                  {new Date(e.ts).toLocaleTimeString(locale)}
                </td>
                <td className="p-4 font-mono text-accent">{e.host}</td>
                <td className="p-4">{e.event_action}</td>
                <td className="p-4">
                  {e.simulation ? m.common.simulation : e.source}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!events.length && <p className="py-8 text-mute">{m.common.empty}</p>}
    </>
  );
}
