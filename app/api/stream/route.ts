import { NextRequest } from "next/server";
import { authorize } from "@/server/auth/access";
import { privateData } from "@/server/privacy";
import { snapshot } from "@/server/services/pipeline";
import { errorResponse } from "@/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
export async function GET(req: NextRequest) {
  try {
    const session = await authorize(req);
    const source = req.nextUrl.searchParams.get("source") || "simulation";
    const encoder = new TextEncoder();
    let timer: ReturnType<typeof setTimeout>;
    let closed = false;
    let stop: () => void = () => {};
    const seen = new Set<string>();
    const resume = Number(
      req.headers.get("last-event-id") ||
        req.nextUrl.searchParams.get("since") ||
        0,
    );
    const stream = new ReadableStream({
      start(controller) {
        const end = Date.now() + 25000;
        stop = () => {
          if (closed) return;
          closed = true;
          clearTimeout(timer);
          req.signal.removeEventListener("abort", stop);
          try {
            controller.close();
          } catch {}
        };
        req.signal.addEventListener("abort", stop, { once: true });
        async function tick() {
          if (closed) return;
          try {
            const s = await privateData(
              await snapshot(
                session,
                source,
                req.nextUrl.searchParams.get("scenario") || "scheduled",
              ),
              session,
            );
            const newAlerts = s.alerts.filter(
              (a) => !seen.has(a.id) && a.ts > resume,
            );
            s.alerts.forEach((a) => seen.add(a.id));
            const now = Date.now();
            controller.enqueue(
              encoder.encode(
                `id: ${now}\nevent: update\ndata: ${JSON.stringify({ alerts: newAlerts.slice(0, 30), cases: s.cases.slice(0, 30), counters: { events: s.events.length, alerts: s.alerts.length, cases: s.cases.length }, simulation: s.simulation })}\n\n: heartbeat\n\n`,
              ),
            );
          } catch {
            stop();
            return;
          }
          if (Date.now() >= end) stop();
          else timer = setTimeout(tick, 5000);
        }
        controller.enqueue(encoder.encode("retry: 3000\n\n"));
        void tick();
      },
      cancel() {
        closed = true;
        clearTimeout(timer);
        req.signal.removeEventListener("abort", stop);
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
