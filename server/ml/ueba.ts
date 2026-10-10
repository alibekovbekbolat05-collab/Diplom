import type { SecurityEvent } from "@/server/schema";
import { groups } from "@/server/detection/helpers";
export function median(a: number[]) {
  if (!a.length) return 0;
  const b = [...a].sort((x, y) => x - y),
    m = Math.floor(b.length / 2);
  return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
}
export function robustZ(value: number, baseline: number[]) {
  if (baseline.length < 20) return 0;
  const center = median(baseline),
    mad = median(baseline.map((v) => Math.abs(v - center)));
  return Math.abs(value - center) / Math.max(128, 1.4826 * mad);
}
export function behavior(events: SecurityEvent[]) {
  const eligible = events.filter(
    (e) => e.bytes_out > 0 && ["network", "web"].includes(e.event_category),
  );
  const entities = [
    ...groups(eligible, (e) =>
      e.user ? `${e.user}:${e.event_category}` : undefined,
    ).map((list) => ({ entity: list[0].user!, list })),
    ...groups(eligible, (e) => `${e.host}:${e.event_category}`).map((list) => ({
      entity: list[0].host,
      list,
    })),
  ];
  return entities.map(({ entity, list }) => {
    const sorted = [...list].sort((a, b) => a.ts - b.ts);
    let mean = 0;
    let samples = 0;
    let maxScore = 0;
    let suspicious: SecurityEvent | undefined;
    const volumes: number[] = [];
    const hours = new Map<number, number>();
    const destinations = new Map<string, number>();
    for (const e of sorted) {
      const volume = e.bytes_out;
      const hour = new Date(e.ts).getUTCHours();
      const z = robustZ(volume, volumes);
      const novelty =
        samples >= 30 && e.dst_ip && !destinations.has(e.dst_ip) ? 15 : 0;
      const unusualHour = samples >= 50 && !hours.has(hour) ? 10 : 0;
      const score = Math.min(100, z * 5 + novelty + unusualHour);
      if (score > maxScore) {
        maxScore = score;
        suspicious = e;
      }
      mean = samples === 0 ? volume : 0.15 * volume + 0.85 * mean;
      samples++;
      volumes.push(volume);
      if (volumes.length > 500) volumes.shift();
      hours.set(hour, (hours.get(hour) || 0) + 1);
      if (e.dst_ip)
        destinations.set(e.dst_ip, (destinations.get(e.dst_ip) || 0) + 1);
    }
    return {
      entity,
      score: Math.round(maxScore),
      ewma: mean,
      samples,
      suspicious,
    };
  });
}
