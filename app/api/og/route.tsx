import { ImageResponse } from "next/og";
import { company } from "@/config/company";
import { getMessages, isLocale } from "@/lib/i18n";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const localeParam = url.searchParams.get("locale") || "ru";
  const locale = isLocale(localeParam) ? localeParam : "ru";
  const m = getMessages(locale);
  const tagline = company.tagline[locale] || company.tagline.ru;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #07090d 0%, #0b1120 60%, #14082b 100%)",
          padding: 72,
          color: "#e4e9f1",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 64 64">
            <path d="M32 8l18 7v14c0 12-7.5 20.5-18 25C21.5 49.5 14 41 14 29V15l18-7z" fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 700 }}>{company.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
            {m.home.heroTitle}
          </div>
          <div style={{ fontSize: 32, color: "#7a8698" }}>{tagline}</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {["detect", "correlate", "respond"].map((s) => (
            <div
              key={s}
              style={{
                display: "flex",
                padding: "8px 20px",
                fontSize: 24,
                color: "#22d3ee",
                border: "1px solid rgba(34,211,238,0.5)",
                borderRadius: 999,
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
