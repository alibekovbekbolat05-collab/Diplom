export function RiskGauge({
  value,
  size = 72,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const color =
    v >= 75 ? "rgb(var(--c-critical))" : v >= 50 ? "rgb(var(--c-high))" : v >= 25 ? "rgb(var(--c-medium))" : "rgb(var(--c-low))";
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label ?? "risk"}: ${v}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--c-line))" strokeWidth="5" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(v / 100) * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text
          x="50%"
          y="52%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="tnum fill-current text-[13px] font-semibold"
          style={{ fontSize: size / 4.2 }}
        >
          {v}
        </text>
      </svg>
      {label && <span className="text-xs text-mute">{label}</span>}
    </div>
  );
}
