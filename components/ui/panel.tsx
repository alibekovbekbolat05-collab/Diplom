import { cn } from "@/lib/utils";

export function GlassPanel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass rounded-2xl", className)} {...props}>
      {children}
    </div>
  );
}

export function Panel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("panel", className)} {...props}>
      {children}
    </div>
  );
}

export function Chip({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-line bg-surface/60 px-2.5 py-0.5 text-xs text-mute",
        className
      )}
    >
      {children}
    </span>
  );
}

export type Severity = "critical" | "high" | "medium" | "low" | "info";

const sevStyles: Record<Severity, string> = {
  critical: "border-critical/50 bg-critical/10 text-critical",
  high: "border-high/50 bg-high/10 text-high",
  medium: "border-medium/50 bg-medium/10 text-medium",
  low: "border-low/50 bg-low/10 text-low",
  info: "border-info/50 bg-info/10 text-info",
};

export function SeverityBadge({ severity, label }: { severity: Severity; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        sevStyles[severity] ?? sevStyles.info
      )}
    >
      {label ?? severity}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-line/40", className)} />;
}
