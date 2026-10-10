"use client";
import { useI18n } from "@/components/providers";
import { alertLabel } from "@/lib/alert-labels";
import type { SecurityEvent, Alert } from "@/server/schema";
export function TrafficChart({
  events,
  alerts = [],
}: {
  events: SecurityEvent[];
  alerts?: Alert[];
}) {
  const { messages: m } = useI18n();
  const end = Math.max(Date.now(), ...events.map((e) => e.ts)),
    bins = Array.from(
      { length: 30 },
      (_, i) =>
        events.filter(
          (e) =>
            e.ts >= end - (30 - i) * 60000 && e.ts < end - (29 - i) * 60000,
        ).length,
    ),
    max = Math.max(1, ...bins),
    points = bins.map((v, i) => `${i * 20},${150 - (v / max) * 125}`).join(" ");
  return (
    <svg
      role="img"
      aria-label={m.console.live}
      viewBox="0 0 600 175"
      className="h-48 w-full"
    >
      <defs>
        <linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="rgb(var(--c-accent))" stopOpacity=".3" />
          <stop offset="1" stopColor="rgb(var(--c-accent))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 65, 105, 150].map((y) => (
        <line
          key={y}
          x1="0"
          x2="600"
          y1={y}
          y2={y}
          stroke="rgb(var(--c-line))"
          strokeDasharray="3 8"
        />
      ))}
      <polygon points={`0,150 ${points} 580,150`} fill="url(#traffic-fill)" />
      {alerts
        .filter((a) => a.ts >= end - 1800000 && a.ts <= end)
        .slice(0, 30)
        .map((a) => (
          <line
            key={a.id}
            x1={((a.ts - (end - 1800000)) / 1800000) * 580}
            x2={((a.ts - (end - 1800000)) / 1800000) * 580}
            y1="20"
            y2="150"
            stroke="rgb(var(--c-critical))"
            opacity=".2"
          >
            <title>{a.type}</title>
          </line>
        ))}
      <polyline
        points={points}
        fill="none"
        stroke="rgb(var(--c-accent))"
        strokeWidth="2"
      />
      <text x="0" y="170" fill="rgb(var(--c-mute))" fontSize="10">
        −30m
      </text>
      <text x="545" y="170" fill="rgb(var(--c-mute))" fontSize="10">
        {m.console.updated}
      </text>
    </svg>
  );
}
export function ThreatMap({ alerts }: { alerts: Alert[] }) {
  const { messages: m } = useI18n();
  const dots: { x: number; y: number }[] = [];
  const ellipses = [
    [130, 75, 80, 40],
    [175, 150, 35, 70],
    [295, 78, 32, 25],
    [310, 138, 45, 65],
    [420, 85, 100, 42],
    [485, 177, 45, 20],
  ];
  for (let x = 35; x < 570; x += 9)
    for (let y = 25; y < 220; y += 9)
      if (
        ellipses.some(
          ([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1,
        )
      )
        dots.push({ x, y });
  return (
    <svg
      role="img"
      aria-label={m.console.illustration}
      viewBox="0 0 600 240"
      className="h-56 w-full"
    >
      {dots.map((d) => (
        <circle
          key={`${d.x}:${d.y}`}
          cx={d.x}
          cy={d.y}
          r="1.4"
          fill="rgb(var(--c-accent))"
          opacity=".25"
        />
      ))}
      {alerts.slice(0, 5).map((a, i) => (
        <g key={a.id}>
          <path
            d={`M ${100 + i * 85} ${65 + i * 23} Q 290 5 390 80`}
            fill="none"
            stroke="rgb(var(--c-critical))"
            opacity=".5"
            strokeWidth="1"
          />
          <circle
            cx={100 + i * 85}
            cy={65 + i * 23}
            r="3"
            fill="rgb(var(--c-critical))"
          />
        </g>
      ))}
      <circle cx="390" cy="80" r="5" fill="rgb(var(--c-accent))" />
      <text x="404" y="84" fill="rgb(var(--c-mute))" fontSize="10">
        SOC
      </text>
    </svg>
  );
}
export function Topology({
  assets,
}: {
  assets: { host: string; risk: number }[];
}) {
  const { messages: m } = useI18n();
  return (
    <svg
      viewBox="0 0 600 320"
      role="img"
      aria-label={m.platform.assets.topology}
      className="h-80 w-full"
    >
      {assets.slice(0, 12).map((a, i) => {
        const x =
            300 +
            210 * Math.cos((i * 2 * Math.PI) / Math.min(assets.length, 12)),
          y =
            155 +
            110 * Math.sin((i * 2 * Math.PI) / Math.min(assets.length, 12));
        return (
          <g key={a.host}>
            <line x1="300" y1="155" x2={x} y2={y} stroke="rgb(var(--c-line))" />
            <circle
              cx={x}
              cy={y}
              r={6 + a.risk / 15}
              fill={
                a.risk > 50 ? "rgb(var(--c-critical))" : "rgb(var(--c-accent))"
              }
              opacity=".8"
            />
            <text
              x={x}
              y={y + 28}
              textAnchor="middle"
              fill="rgb(var(--c-mute))"
              fontSize="10"
            >
              {a.host.slice(0, 20)}
            </text>
          </g>
        );
      })}
      <circle
        cx="300"
        cy="155"
        r="20"
        fill="rgb(var(--c-panel))"
        stroke="rgb(var(--c-accent))"
      />
      <text
        x="300"
        y="159"
        textAnchor="middle"
        fill="rgb(var(--c-accent))"
        fontSize="10"
      >
        SOC
      </text>
    </svg>
  );
}

export function AttackDonut({ alerts }: { alerts: Alert[] }) {
  const { messages: m, locale } = useI18n();
  const counts = new Map<string, number>();
  alerts.forEach((a) => counts.set(a.type, (counts.get(a.type) || 0) + 1));
  const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const rest = alerts.length - top.reduce((n, [, c]) => n + c, 0);
  const rows = rest ? [...top, ["other", rest] as [string, number]] : top;
  const colors = [
    "#31e6ff",
    "#a78bfa",
    "#f97316",
    "#f43f5e",
    "#fbbf24",
    "#64748b",
  ];
  let cursor = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg
        viewBox="0 0 200 200"
        className="h-48 w-48"
        role="img"
        aria-label={m.platform.ov.types}
      >
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="rgb(var(--c-line))"
          strokeWidth="20"
        />
        {rows.map(([type, count], i) => {
          const length = (count / Math.max(1, alerts.length)) * 439.82,
            start = cursor;
          cursor += length;
          return (
            <circle
              key={type}
              cx="100"
              cy="100"
              r="70"
              fill="none"
              stroke={colors[i]}
              strokeWidth="20"
              strokeDasharray={`${length} ${439.82 - length}`}
              strokeDashoffset={-start}
              transform="rotate(-90 100 100)"
            />
          );
        })}
        <text
          x="100"
          y="106"
          textAnchor="middle"
          fill="rgb(var(--c-ink))"
          fontSize="25"
        >
          {alerts.length}
        </text>
      </svg>
      <ul className="flex-1 space-y-3 text-xs">
        {rows.map(([type, count], i) => (
          <li key={type} className="flex justify-between gap-4">
            <span>
              <span
                style={{ background: colors[i] }}
                className="mr-2 inline-block h-2 w-2 rounded-full"
              />
              {type === "other" ? m.common.more : alertLabel(type, locale)}
            </span>
            <span>{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
export function HostHeatmap({ events }: { events: SecurityEvent[] }) {
  const { messages: m } = useI18n();
  const hosts = [...new Set(events.map((e) => e.host))].slice(0, 8);
  const now = Math.floor(Date.now() / 3600000) * 3600000;
  const cells = hosts.map((host) =>
    Array.from(
      { length: 12 },
      (_, i) =>
        events.filter(
          (e) =>
            e.host === host &&
            e.ts >= now - (11 - i) * 3600000 &&
            e.ts < now - (10 - i) * 3600000,
        ).length,
    ),
  );
  const max = Math.max(1, ...cells.flat());
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-xs">
        <thead>
          <tr>
            <th className="p-2">{m.console.host}</th>
            {Array.from({ length: 12 }, (_, i) => (
              <th className="p-2 text-center text-mute" key={i}>
                {new Date(now - (11 - i) * 3600000).getHours()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hosts.map((host, row) => (
            <tr key={host}>
              <th className="p-2 font-mono font-normal">{host}</th>
              {cells[row].map((n, col) => (
                <td key={col} className="p-1">
                  <div
                    className="rounded p-2 text-center"
                    style={{
                      background: `rgb(var(--c-accent) / ${0.05 + (0.75 * n) / max})`,
                      color: n / max > 0.5 ? "#080c11" : "rgb(var(--c-mute))",
                    }}
                    title={`${host}: ${n}`}
                  >
                    {n || "·"}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function RiskGauge({ value, label }: { value: number; label: string }) {
  const safe = Math.min(100, Math.max(0, value));
  return (
    <svg
      viewBox="0 0 120 75"
      role="img"
      aria-label={`${label}: ${safe}/100`}
      className="h-24 w-36"
    >
      <path
        d="M 10 60 A 50 50 0 0 1 110 60"
        fill="none"
        stroke="rgb(var(--c-line))"
        strokeWidth="8"
        pathLength="100"
      />
      <path
        d="M 10 60 A 50 50 0 0 1 110 60"
        fill="none"
        stroke={safe > 70 ? "rgb(var(--c-critical))" : "rgb(var(--c-accent))"}
        strokeWidth="8"
        pathLength="100"
        strokeDasharray={`${safe} 100`}
      />
      <text
        x="60"
        y="57"
        fill="rgb(var(--c-ink))"
        textAnchor="middle"
        fontSize="22"
      >
        {safe}
      </text>
    </svg>
  );
}
