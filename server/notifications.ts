import { readStore } from "@/server/adapters/store";
import { maskData } from "@/server/export";
export async function notifyNewCases(ids: string[]) {
  if (!ids.length) return;
  const store = await readStore();
  for (const incident of store.cases.filter(
    (c) =>
      ids.includes(c.id) &&
      !c.simulation &&
      ["high", "critical"].includes(c.severity),
  )) {
    const message = JSON.stringify(
      maskData({
        id: incident.id,
        severity: incident.severity,
        entity: incident.entity,
        alerts: incident.alert_ids.length,
      }),
    );
    const requests: Promise<unknown>[] = [];
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
      requests.push(
        fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: process.env.TELEGRAM_CHAT_ID,
              text: `SecureOps incident: ${message}`,
            }),
            signal: AbortSignal.timeout(5000),
          },
        ),
      );
    if (process.env.NOTIFICATION_WEBHOOK_URL) {
      try {
        const url = new URL(process.env.NOTIFICATION_WEBHOOK_URL);
        if (url.protocol === "https:")
          requests.push(
            fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(process.env.NOTIFICATION_WEBHOOK_SECRET
                  ? {
                      Authorization: `Bearer ${process.env.NOTIFICATION_WEBHOOK_SECRET}`,
                    }
                  : {}),
              },
              body: message,
              signal: AbortSignal.timeout(5000),
            }),
          );
      } catch {}
    }
    await Promise.allSettled(requests);
  }
}
