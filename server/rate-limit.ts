import { redisCommand } from "@/server/adapters/store";
import { createHash } from "node:crypto";
const buckets = new Map<string, { count: number; until: number }>();
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
) {
  const current = buckets.get(key);
  if (!current || current.until <= now) {
    if (buckets.size >= 10000) {
      for (const [k, b] of buckets) if (b.until <= now) buckets.delete(k);
      if (buckets.size >= 10000) return false;
    }
    buckets.set(key, { count: 1, until: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count++;
  return true;
}
export function clientIp(request: Request) {
  return (request.headers.get("x-forwarded-for")?.split(",")[0] || "local")
    .trim()
    .slice(0, 100);
}

export async function distributedRateLimit(
  key: string,
  limit: number,
  windowMs: number,
) {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    const hash = createHash("sha256").update(key).digest("hex");
    const count = await redisCommand([
      "EVAL",
      "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end; return n",
      1,
      `secureops:rate:${hash}`,
      windowMs,
    ]);
    return Number(count) <= limit;
  }
  return rateLimit(key, limit, windowMs);
}
