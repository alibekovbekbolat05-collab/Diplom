import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function truncate(s: string, max = 200): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export function sanitizeCsvCell(value: unknown): string {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]|^@/.test(s)) s = "'" + s;
  return s.replace(/[\r\n]+/g, " ");
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = sanitizeCsvCell(cell);
          return /[,;"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\n");
}

export function maskIp(ip: string | null | undefined): string {
  if (!ip) return "";
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.x.x`;
    return ip;
  }
  return ip.split(":").slice(0, 3).join(":") + ":xxxx";
}

export function maskUser(user: string | null | undefined): string {
  if (!user) return "";
  if (user.length <= 2) return user[0] + "*";
  return user.slice(0, 2) + "*".repeat(Math.min(user.length - 2, 6));
}

export function formatTime(ts: number, locale = "ru"): string {
  return new Date(ts).toLocaleTimeString(locale, { hour12: false });
}

export function formatDateTime(ts: number, locale = "ru"): string {
  return new Date(ts).toLocaleString(locale, {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shortNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(Math.round(n * 10) / 10);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
