import type { SecurityEvent, Alert } from "@/server/schema";
import { groups, windows, internal, entropy, makeAlert } from "./helpers";
import { thresholds as c } from "./config";
import intel from "@/content/threat-intel.json";
const snapshot = new Set(intel.indicators.map((i) => i.ip_address));
const demoIndicators = new Set([
  "45.155.204.10",
  "185.220.101.44",
  "91.240.118.170",
  "103.75.190.201",
  "222.186.30.15",
]);
const locations: Record<string, [number, number]> = {
  BR: [-14, -52],
  KZ: [48, 68],
  RU: [56, 38],
  CN: [35, 105],
  NL: [52, 5],
  DE: [51, 10],
  US: [39, -98],
  UA: [49, 32],
  GB: [54, -2],
};
function distance(a: [number, number], b: [number, number]) {
  const rad = (v: number) => (v * Math.PI) / 180;
  const x =
    Math.sin(rad(b[0] - a[0]) / 2) ** 2 +
    Math.cos(rad(a[0])) *
      Math.cos(rad(b[0])) *
      Math.sin(rad(b[1] - a[1]) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(x)));
}
export function decodePath(path: string) {
  let x = path;
  for (let i = 0; i < 2; i++) {
    try {
      const y = decodeURIComponent(x);
      if (y === x) break;
      x = y;
    } catch {
      break;
    }
  }
  return x.replace(/\+/g, " ").toLowerCase();
}
export const webSignatures = [
  {
    type: "sqli",
    pattern:
      /(?:union\s+(?:all\s+)?select|['"]\s*(?:or|and)\s+['"\d]|\b(?:sleep|benchmark)\s*\(|drop\s+table)/,
  },
  {
    type: "xss",
    pattern: /<\s*(?:script|iframe|svg)|on(?:error|load)\s*=|javascript:/,
  },
  { type: "traversal", pattern: /(?:\.\.[/\\]){2}|\/etc\/(?:passwd|shadow)/ },
  {
    type: "cmd_injection",
    pattern: /[;|]\s*(?:cat|curl|wget|bash|sh|powershell)\b/,
  },
];
export function detectBuiltins(input: SecurityEvent[]): Alert[] {
  const events = [...input].sort((a, b) => a.ts - b.ts);
  const alerts: Alert[] = [];
  function addWindow(
    type: string,
    mitre: string,
    rows: SecurityEvent[],
    key: (e: SecurityEvent) => string | undefined,
    ms: number,
    test: (w: SecurityEvent[]) => boolean,
    evidence: (w: SecurityEvent[]) => Record<string, unknown>,
    severity: "medium" | "high" | "critical" = "high",
  ) {
    for (const group of groups(rows, key)) {
      const hit = windows(group, ms).find(test);
      if (hit)
        alerts.push(makeAlert(type, severity, mitre, hit, evidence(hit)));
    }
  }
  const network = events.filter((e) => e.event_category === "network"),
    auth = events.filter((e) => e.event_category === "authentication"),
    failed = auth.filter((e) => e.outcome === "failure");
  addWindow(
    "port_scan",
    "T1046",
    network,
    (e) => (e.src_ip && e.dst_ip ? `${e.src_ip}:${e.dst_ip}` : undefined),
    120000,
    (w) =>
      new Set(w.map((e) => e.dst_port).filter(Boolean)).size >= c.scanPorts,
    (w) => ({
      distinct_ports: new Set(w.map((e) => e.dst_port)).size,
      window_seconds: 120,
    }),
  );
  addWindow(
    "bruteforce",
    "T1110.001",
    failed,
    (e) =>
      e.src_ip
        ? `${e.src_ip}:${e.dst_ip || e.host}:${e.dst_port || e.event_action}`
        : undefined,
    300000,
    (w) => w.length >= c.authFailures,
    (w) => ({ failed_logins: w.length, window_seconds: 300 }),
  );
  addWindow(
    "password_spray",
    "T1110.003",
    failed,
    (e) => e.src_ip,
    300000,
    (w) => new Set(w.map((e) => e.user).filter(Boolean)).size >= c.sprayUsers,
    (w) => ({ distinct_users: new Set(w.map((e) => e.user)).size }),
  );
  addWindow(
    "credential_stuffing",
    "T1110.004",
    failed.filter((e) => e.event_action === "web_login"),
    (e) => e.src_ip,
    300000,
    (w) => w.length >= 10 && new Set(w.map((e) => e.user)).size >= 6,
    (w) => ({ web_failures: w.length }),
  );
  for (const success of auth.filter((e) => e.outcome === "success")) {
    const before = failed.filter(
      (e) =>
        e.src_ip === success.src_ip &&
        e.user === success.user &&
        e.ts <= success.ts &&
        success.ts - e.ts <= 300000,
    );
    if (before.length >= c.authFailures)
      alerts.push(
        makeAlert(
          "success_after_failures",
          "high",
          "T1078",
          [...before, success],
          { failures: before.length },
        ),
      );
  }
  addWindow(
    "dos",
    "T1498",
    network,
    (e) => e.dst_ip,
    60000,
    (w) =>
      w.length >= c.dosEvents ||
      w.reduce((s, e) => s + e.packets, 0) >= c.dosPackets,
    (w) => ({
      events: w.length,
      packets: w.reduce((s, e) => s + e.packets, 0),
      window_seconds: 60,
    }),
    "critical",
  );
  const dns = events.filter((e) => e.dns);
  addWindow(
    "dns_tunneling",
    "T1071.004",
    dns,
    (e) => e.host,
    300000,
    (w) =>
      w.length >= 8 &&
      w.filter(
        (e) =>
          (e.dns!.query.length >= c.dnsLength &&
            entropy(e.dns!.query.split(".")[0]) > 3.6) ||
          ["TXT", "NULL"].includes(e.dns!.qtype),
      ).length /
        w.length >
        0.7 &&
      new Set(w.map((e) => e.dns!.query)).size >= 8,
    (w) => ({
      unique_queries: new Set(w.map((e) => e.dns!.query)).size,
      max_length: Math.max(...w.map((e) => e.dns!.query.length)),
    }),
  );
  for (const group of groups(
    network.filter((e) => !internal(e.dst_ip) && e.dst_ip),
    (e) => `${e.src_ip || e.host}:${e.dst_ip}:${e.dst_port}`,
  )) {
    const hit = windows(group, 15 * 60000).find((w) => {
      if (w.length < c.beaconSamples) return false;
      const gaps = w.slice(1).map((e, i) => (e.ts - w[i].ts) / 1000);
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const cv =
        Math.sqrt(gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length) /
        Math.max(mean, 1);
      return (
        mean >= 10 &&
        cv < c.beaconCv &&
        w.every(
          (e) =>
            e.bytes_in + e.bytes_out >= 64 && e.bytes_in + e.bytes_out < 2500,
        )
      );
    });
    if (hit)
      alerts.push(
        makeAlert("c2_beacon", "high", "T1071", hit, {
          samples: hit.length,
          periodicity_cv_max: c.beaconCv,
        }),
      );
  }
  addWindow(
    "exfiltration",
    "T1041",
    network.filter((e) => e.dst_ip && !internal(e.dst_ip)),
    (e) => e.host,
    300000,
    (w) =>
      w.reduce((s, e) => s + e.bytes_out, 0) >= c.exfilBytes &&
      w.reduce((s, e) => s + e.bytes_out, 0) /
        Math.max(
          1,
          w.reduce((s, e) => s + e.bytes_in, 0),
        ) >
        10,
    (w) => ({
      bytes_out: w.reduce((s, e) => s + e.bytes_out, 0),
      bytes_in: w.reduce((s, e) => s + e.bytes_in, 0),
    }),
    "critical",
  );
  addWindow(
    "lateral_movement",
    "T1021",
    network.filter(
      (e) =>
        internal(e.src_ip) &&
        internal(e.dst_ip) &&
        [22, 445, 3389, 5985].includes(e.dst_port || 0),
    ),
    (e) => e.src_ip,
    180000,
    (w) => new Set(w.map((e) => e.dst_ip)).size >= c.lateralHosts,
    (w) => ({ internal_targets: new Set(w.map((e) => e.dst_ip)).size }),
  );
  for (const e of events) {
    if (e.http) {
      const path = decodePath(e.http.path);
      for (const sig of webSignatures)
        if (sig.pattern.test(path))
          alerts.push(
            makeAlert(sig.type, "high", "T1190", [e], {
              method: e.http.method,
              path: e.http.path.slice(0, 500),
              signature: sig.type,
            }),
          );
    }
    if (
      e.event_category === "iam" &&
      [
        "account_create",
        "account_created",
        "group_change",
        "special_privileges",
      ].includes(e.event_action)
    )
      alerts.push(
        makeAlert(
          "privilege_abuse",
          "high",
          e.event_action.includes("account") ? "T1136" : "T1098",
          [e],
          { action: e.event_action, user: e.user || "unknown" },
        ),
      );
    if (
      e.process &&
      /(powershell.*(?:-enc|-nop)|svchost32\.exe|cmd\.exe.*(?:curl|wget))/i.test(
        e.process,
      )
    )
      alerts.push(
        makeAlert("malware_chain", "high", "T1059", [e], {
          process: e.process,
        }),
      );
    const indicator = [e.src_ip, e.dst_ip].find(
      (ip) =>
        ip && (snapshot.has(ip) || (e.simulation && demoIndicators.has(ip))),
    );
    if (indicator)
      alerts.push(
        makeAlert(
          "threat_intel",
          "medium",
          "T1071",
          [e],
          {
            indicator,
            source:
              e.simulation && demoIndicators.has(indicator)
                ? "Synthetic demo indicator"
                : intel.source,
            snapshot_date: intel.retrieved_at,
            note: intel.note,
          },
          0.65,
        ),
      );
  }
  addWindow(
    "web_error_burst",
    "T1595",
    events.filter((e) => e.http && e.http.status >= 400),
    (e) => e.src_ip,
    60000,
    (w) => w.length >= c.errorBurst,
    (w) => ({ errors: w.length }),
    "medium",
  );
  for (const group of groups(
    auth.filter((e) => e.outcome === "success" && e.user && e.country),
    (e) => e.user,
  )) {
    for (let i = 1; i < group.length; i++) {
      const a = group[i - 1],
        b = group[i];
      if (a.country === b.country) continue;
      const la = locations[a.country!],
        lb = locations[b.country!];
      if (!la || !lb) continue;
      const delta = (b.ts - a.ts) / 3600000,
        speed = distance(la, lb) / Math.max(0.01, delta);
      if (delta >= 0 && delta < 2 && speed > 900)
        alerts.push(
          makeAlert(
            "impossible_travel",
            "high",
            "T1078",
            [a, b],
            {
              from: a.country,
              to: b.country,
              approximate_speed_kmh: Math.round(speed),
              geo_accuracy: "country-centroid heuristic; verify VPN/proxy use",
            },
            0.7,
          ),
        );
    }
  }
  const files = events.filter((e) => e.event_category === "file");
  addWindow(
    "offhours_share",
    "T1078",
    files.filter(
      (e) => (Math.floor(e.ts / 3600000) + c.officeUtcOffset) % 24 < 6,
    ),
    (e) => `${e.user || e.src_ip}:${e.host}`,
    15 * 60000,
    (w) => w.length >= 6,
    (w) => ({ offhours_accesses: w.length, utc_offset: c.officeUtcOffset }),
    "medium",
  );
  addWindow(
    "insider_staging",
    "T1074",
    files,
    (e) => `${e.user || e.src_ip}:${e.host}`,
    10 * 60000,
    (w) => w.length >= c.stagingFiles,
    (w) => ({ file_accesses: w.length }),
    "medium",
  );
  return [...new Map(alerts.map((a) => [a.id, a])).values()];
}
