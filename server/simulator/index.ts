/**
 * Deterministic event simulator: a PURE function of (seed, time).
 * Every serverless instance produces the same stream for the same window,
 * with no shared storage. Baseline office traffic + scheduled attack scenarios.
 * Everything produced here is labeled "simulation" by callers.
 */

export const SIM_SEED = 20260101;

export interface SimEvent {
  ts: number;
  id: string;
  source: "simulator";
  sim: true;
  sim_scenario?: string;
  host: string;
  event_category: string;
  event_action: string;
  outcome: "success" | "failure" | "unknown";
  src_ip?: string;
  dst_ip?: string;
  src_port?: number;
  dst_port?: number;
  proto?: string;
  bytes_in?: number;
  bytes_out?: number;
  packets?: number;
  duration_ms?: number;
  user?: string;
  process?: string;
  country?: string;
  http?: { method: string; path: string; status: number; user_agent: string };
  dns?: { query: string; qtype: string };
}

// ---------- office inventory ----------
export const SIM_HOSTS = [
  "pc-01", "pc-02", "pc-03", "pc-04", "pc-05", "pc-06", "pc-07", "pc-08",
  "srv-ad", "srv-file", "srv-mail", "srv-web",
];
export const SIM_USERS = ["alice", "bob", "carol", "dave", "erin", "frank", "gina", "hradmin"];

const INTERNAL: Record<string, string> = {
  "srv-ad": "10.10.0.10",
  "srv-file": "10.10.0.11",
  "srv-mail": "10.10.0.12",
  "srv-web": "10.10.0.20",
  "pc-01": "10.10.0.31",
  "pc-02": "10.10.0.32",
  "pc-03": "10.10.0.33",
  "pc-04": "10.10.0.34",
  "pc-05": "10.10.0.35",
  "pc-06": "10.10.0.36",
  "pc-07": "10.10.0.37",
  "pc-08": "10.10.0.38",
};

const BENIGN_DOMAINS = [
  "mail.aspan-security.kz", "portal.aspan-security.kz", "update.microsoft.com",
  "cdn.jsdelivr.net", "fonts.googleapis.com", "docs.google.com", "github.com",
  "kz.gov.pki", "news.tengrinews.kz", "wiki.internal", "api.telegram.org",
];

// external attacker pool (documented fictional ranges)
const BAD_ACTORS = [
  { ip: "45.155.204.10", country: "RU" },
  { ip: "185.220.101.44", country: "NL" },
  { ip: "91.240.118.170", country: "UA" },
  { ip: "103.75.190.201", country: "CN" },
  { ip: "222.186.30.15", country: "CN" },
];

const DAY_MS = 86_400_000;

// ---------- deterministic PRNG ----------
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rnd: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

/** Local office hour (UTC+5, Almaty). */
function localHour(ts: number): number {
  return (Math.floor(ts / 3_600_000) + 5) % 24;
}

function isWorkHours(ts: number): boolean {
  const h = localHour(ts);
  return h >= 9 && h < 19;
}

// ---------- baseline ----------
function baselineBucket(seed: number, bucketStart: number): SimEvent[] {
  const rnd = mulberry32((seed ^ (bucketStart | 0)) >>> 0);
  const work = isWorkHours(bucketStart);
  const n = work ? 20 + Math.floor(rnd() * 16) : 2 + Math.floor(rnd() * 5);
  const events: SimEvent[] = [];
  for (let i = 0; i < n; i++) {
    const ts = bucketStart + Math.floor(rnd() * 10_000);
    const user = pick(rnd, SIM_USERS);
    const host = pick(rnd, SIM_HOSTS);
    const r = rnd();
    if (r < 0.34) {
      const status = rnd() < 0.92 ? 200 : rnd() < 0.7 ? 404 : 302;
      events.push({
        ts, id: `b:${bucketStart}:${i}`, source: "simulator", sim: true,
        host, event_category: "web", event_action: "http_request",
        outcome: status < 400 ? "success" : "failure",
        src_ip: INTERNAL[host] || "10.10.0.31", dst_ip: "23.45.10.8", dst_port: 443, proto: "tcp",
        bytes_in: 800 + Math.floor(rnd() * 20000), bytes_out: 500 + Math.floor(rnd() * 80000),
        user, country: "KZ",
        http: {
          method: pick(rnd, ["GET", "GET", "GET", "POST"]),
          path: pick(rnd, ["/", "/api/data", "/assets/app.js", "/reports", "/login"]),
          status,
          user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      });
    } else if (r < 0.55) {
      events.push({
        ts, id: `b:${bucketStart}:${i}`, source: "simulator", sim: true,
        host, event_category: "dns", event_action: "query", outcome: "success",
        src_ip: INTERNAL[host] || "10.10.0.31", dst_ip: "10.10.0.1", dst_port: 53, proto: "udp",
        user, dns: { query: pick(rnd, BENIGN_DOMAINS), qtype: rnd() < 0.8 ? "A" : "AAAA" },
      });
    } else if (r < 0.78) {
      events.push({
        ts, id: `b:${bucketStart}:${i}`, source: "simulator", sim: true,
        host, event_category: "network", event_action: "connection", outcome: "success",
        src_ip: INTERNAL[host] || "10.10.0.31", dst_ip: "23.45.10.8",
        dst_port: pick(rnd, [443, 443, 80, 993]), proto: "tcp",
        bytes_in: 2000 + Math.floor(rnd() * 50000), bytes_out: 1000 + Math.floor(rnd() * 30000),
        packets: 20 + Math.floor(rnd() * 200), duration_ms: 200 + Math.floor(rnd() * 20000),
        user,
      });
    } else if (r < 0.9) {
      events.push({
        ts, id: `b:${bucketStart}:${i}`, source: "simulator", sim: true,
        host: "srv-ad", event_category: "authentication", event_action: "login",
        outcome: "success", src_ip: INTERNAL[host] || "10.10.0.31", dst_ip: "10.10.0.10",
        dst_port: 389, proto: "tcp", user,
      });
    } else if (r < 0.95) {
      events.push({
        ts, id: `b:${bucketStart}:${i}`, source: "simulator", sim: true,
        host: "pc-01", event_category: "authentication", event_action: "vpn_login",
        outcome: "success", src_ip: "94.10.20.30", dst_ip: "10.10.0.1", dst_port: 1194,
        proto: "udp", user, country: "KZ",
      });
    } else {
      events.push({
        ts, id: `b:${bucketStart}:${i}`, source: "simulator", sim: true,
        host: "srv-file", event_category: "file", event_action: "open",
        outcome: "success", src_ip: INTERNAL[host] || "10.10.0.31", dst_ip: "10.10.0.11",
        dst_port: 445, proto: "tcp", user,
      });
    }
  }
  return events;
}

// ---------- attack scenarios ----------
type ScenarioFn = (rnd: () => number, startMs: number) => SimEvent[];

function ev(partial: Partial<SimEvent> & { ts: number; id: string; host: string; event_category: string; event_action: string }): SimEvent {
  return { source: "simulator", sim: true, outcome: "unknown", ...partial } as SimEvent;
}

const portScan: ScenarioFn = (rnd, t0) => {
  const actor = pick(rnd, BAD_ACTORS);
  const ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 1433, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9200];
  return ports.map((p, i) =>
    ev({
      ts: t0 + i * 4000, id: `scan:${t0}:${i}`, host: "srv-web", sim_scenario: "port_scan",
      event_category: "network", event_action: "connection", outcome: rnd() < 0.6 ? "failure" : "success",
      src_ip: actor.ip, dst_ip: "10.10.0.20", src_port: 40000 + i, dst_port: p, proto: "tcp",
      bytes_in: rnd() < 0.6 ? 0 : 60, bytes_out: 0, packets: 1, duration_ms: 100,
      country: actor.country,
    })
  );
};

const sshBrute: ScenarioFn = (rnd, t0) => {
  const actor = pick(rnd, BAD_ACTORS);
  const evs: SimEvent[] = [];
  const total = 26;
  for (let i = 0; i < total; i++) {
    const last = i === total - 1;
    evs.push(
      ev({
        ts: t0 + i * 18000, id: `sshb:${t0}:${i}`, host: "srv-ad", sim_scenario: "ssh_bruteforce",
        event_category: "authentication", event_action: "login",
        outcome: last ? "success" : "failure",
        src_ip: actor.ip, dst_ip: "10.10.0.10", dst_port: 22, proto: "tcp",
        user: last ? "root" : pick(rnd, ["root", "admin", "oracle", "postgres", "test"]),
        country: actor.country,
      })
    );
  }
  return evs;
};

const rdpBrute: ScenarioFn = (rnd, t0) => {
  const actor = pick(rnd, BAD_ACTORS);
  const evs: SimEvent[] = [];
  for (let i = 0; i < 18; i++) {
    const last = i === 17;
    evs.push(
      ev({
        ts: t0 + i * 15000, id: `rdpb:${t0}:${i}`, host: "pc-02", sim_scenario: "rdp_bruteforce",
        event_category: "authentication", event_action: "login",
        outcome: last ? "success" : "failure",
        src_ip: actor.ip, dst_ip: "10.10.0.32", dst_port: 3389, proto: "tcp",
        user: last ? "bob" : pick(rnd, ["bob", "administrator", "user1"]),
        country: actor.country,
      })
    );
  }
  return evs;
};

const passwordSpray: ScenarioFn = (rnd, t0) => {
  const actor = pick(rnd, BAD_ACTORS);
  return SIM_USERS.slice(0, 6).map((u, i) =>
    ev({
      ts: t0 + i * 45000, id: `spray:${t0}:${i}`, host: "srv-ad", sim_scenario: "password_spray",
      event_category: "authentication", event_action: "login", outcome: "failure",
      src_ip: actor.ip, dst_ip: "10.10.0.10", dst_port: 389, proto: "tcp",
      user: u, country: actor.country,
    })
  );
};

const credStuffing: ScenarioFn = (rnd, t0) => {
  const actor = pick(rnd, BAD_ACTORS);
  return Array.from({ length: 12 }, (_, i) =>
    ev({
      ts: t0 + i * 20000, id: `stuff:${t0}:${i}`, host: "srv-web", sim_scenario: "credential_stuffing",
      event_category: "authentication", event_action: "web_login", outcome: "failure",
      src_ip: actor.ip, dst_ip: "10.10.0.20", dst_port: 443, proto: "tcp",
      user: pick(rnd, SIM_USERS), country: actor.country,
      http: { method: "POST", path: "/login", status: 401, user_agent: "python-requests/2.31" },
    })
  );
};

const impossibleTravel: ScenarioFn = (rnd, t0) => [
  ev({
    ts: t0, id: `trav:${t0}:0`, host: "srv-ad", sim_scenario: "impossible_travel",
    event_category: "authentication", event_action: "login", outcome: "success",
    src_ip: "88.12.44.9", dst_ip: "10.10.0.10", dst_port: 389, proto: "tcp",
    user: "alice", country: "DE",
  }),
  ev({
    ts: t0 + 12 * 60_000, id: `trav:${t0}:1`, host: "srv-ad", sim_scenario: "impossible_travel",
    event_category: "authentication", event_action: "login", outcome: "success",
    src_ip: "177.54.128.77", dst_ip: "10.10.0.10", dst_port: 389, proto: "tcp",
    user: "alice", country: "BR",
  }),
];

const privEsc: ScenarioFn = (rnd, t0) => [
  ev({
    ts: t0, id: `prv:${t0}:0`, host: "srv-ad", sim_scenario: "priv_esc",
    event_category: "iam", event_action: "account_create", outcome: "success",
    src_ip: "10.10.0.38", dst_ip: "10.10.0.10", dst_port: 389, proto: "tcp",
    user: "hradmin", process: "net.exe",
  }),
  ev({
    ts: t0 + 90_000, id: `prv:${t0}:1`, host: "srv-ad", sim_scenario: "priv_esc",
    event_category: "iam", event_action: "group_change", outcome: "success",
    src_ip: "10.10.0.38", dst_ip: "10.10.0.10", dst_port: 389, proto: "tcp",
    user: "hradmin", process: "net.exe",
  }),
];

const lateral: ScenarioFn = (rnd, t0) => {
  const targets = ["10.10.0.10", "10.10.0.11", "10.10.0.12", "10.10.0.32", "10.10.0.34", "10.10.0.36"];
  return targets.map((d, i) =>
    ev({
      ts: t0 + i * 45000, id: `lat:${t0}:${i}`, host: "pc-03", sim_scenario: "lateral_movement",
      event_category: "network", event_action: "connection", outcome: "success",
      src_ip: "10.10.0.33", dst_ip: d, dst_port: pick(rnd, [445, 3389, 5985]), proto: "tcp",
      bytes_in: 2000, bytes_out: 4000, user: "bob",
    })
  );
};

const dnsTunnel: ScenarioFn = (rnd, t0) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 30 }, (_, i) => {
    let sub = "";
    for (let j = 0; j < 40; j++) sub += chars[Math.floor(rnd() * chars.length)];
    return ev({
      ts: t0 + i * 20000, id: `dnst:${t0}:${i}`, host: "pc-06", sim_scenario: "dns_tunneling",
      event_category: "dns", event_action: "query", outcome: "success",
      src_ip: "10.10.0.36", dst_ip: "10.10.0.1", dst_port: 53, proto: "udp",
      user: "erin", dns: { query: `${sub}.tunneldns.ru`, qtype: rnd() < 0.7 ? "TXT" : "NULL" },
    });
  });
};

const c2Beacon: ScenarioFn = (rnd, t0) =>
  Array.from({ length: 20 }, (_, i) =>
    ev({
      ts: t0 + i * 60_000 + Math.floor(rnd() * 8000), id: `c2:${t0}:${i}`, host: "pc-05",
      sim_scenario: "c2_beacon", event_category: "network", event_action: "connection",
      outcome: "success", src_ip: "10.10.0.35", dst_ip: "185.220.101.44", dst_port: 8080,
      proto: "tcp", bytes_in: 120 + Math.floor(rnd() * 60), bytes_out: 90 + Math.floor(rnd() * 50),
      packets: 6 + Math.floor(rnd() * 6), duration_ms: 300 + Math.floor(rnd() * 200), user: "frank",
      country: "NL",
    })
  );

const exfil: ScenarioFn = (rnd, t0) =>
  Array.from({ length: 5 }, (_, i) =>
    ev({
      ts: t0 + i * 240_000, id: `exf:${t0}:${i}`, host: "pc-07", sim_scenario: "exfiltration",
      event_category: "network", event_action: "connection", outcome: "success",
      src_ip: "10.10.0.37", dst_ip: "91.240.118.170", dst_port: 8443, proto: "tcp",
      bytes_in: 40_000, bytes_out: 20_000_000 + Math.floor(rnd() * 60_000_000),
      packets: 3000 + Math.floor(rnd() * 5000), duration_ms: 60_000 + Math.floor(rnd() * 120000),
      user: "carol", country: "UA",
    })
  );

const dosSyn: ScenarioFn = (rnd, t0) => {
  const spoofed = Array.from({ length: 30 }, () => `${11 + Math.floor(rnd() * 200)}.${Math.floor(rnd() * 255)}.${Math.floor(rnd() * 255)}.${1 + Math.floor(rnd() * 254)}`);
  return Array.from({ length: 120 }, (_, i) =>
    ev({
      ts: t0 + i * 500, id: `dos:${t0}:${i}`, host: "srv-web", sim_scenario: "dos_synflood",
      event_category: "network", event_action: "connection", outcome: "failure",
      src_ip: pick(rnd, spoofed), dst_ip: "10.10.0.20", src_port: 1024 + Math.floor(rnd() * 60000),
      dst_port: 443, proto: "tcp", bytes_in: 0, bytes_out: 0, packets: 1,
      country: pick(rnd, ["RU", "CN", "NL"]),
    })
  );
};

const sqli: ScenarioFn = (rnd, t0) => {
  const payloads = [
    "/product?id=1' OR '1'='1",
    "/product?id=1 UNION SELECT username, password FROM users--",
    "/search?q='; DROP TABLE users;--",
    "/item?x=1' AND SLEEP(5)--",
  ];
  return Array.from({ length: 12 }, (_, i) =>
    ev({
      ts: t0 + i * 9000, id: `sqli:${t0}:${i}`, host: "srv-web", sim_scenario: "sqli",
      event_category: "web", event_action: "http_request",
      outcome: i % 3 === 0 ? "success" : "failure",
      src_ip: "45.155.204.10", dst_ip: "10.10.0.20", dst_port: 443, proto: "tcp",
      country: "RU",
      http: {
        method: "GET",
        path: pick(rnd, payloads),
        status: pick(rnd, [500, 403, 200, 500]),
        user_agent: "sqlmap/1.7",
      },
    })
  );
};

const xssTraversal: ScenarioFn = (rnd, t0) => [
  ev({
    ts: t0, id: `xsst:${t0}:0`, host: "srv-web", sim_scenario: "xss",
    event_category: "web", event_action: "http_request", outcome: "failure",
    src_ip: "103.75.190.201", dst_ip: "10.10.0.20", dst_port: 443, proto: "tcp", country: "CN",
    http: { method: "GET", path: "/search?q=<script>alert(1)</script>", status: 400, user_agent: "Mozilla/5.0" },
  }),
  ev({
    ts: t0 + 30000, id: `xsst:${t0}:1`, host: "srv-web", sim_scenario: "traversal",
    event_category: "web", event_action: "http_request", outcome: "failure",
    src_ip: "103.75.190.201", dst_ip: "10.10.0.20", dst_port: 443, proto: "tcp", country: "CN",
    http: { method: "GET", path: "/download?file=../../../../etc/passwd", status: 403, user_agent: "Mozilla/5.0" },
  }),
  ev({
    ts: t0 + 60000, id: `xsst:${t0}:2`, host: "srv-web", sim_scenario: "cmd_injection",
    event_category: "web", event_action: "http_request", outcome: "failure",
    src_ip: "103.75.190.201", dst_ip: "10.10.0.20", dst_port: 443, proto: "tcp", country: "CN",
    http: { method: "POST", path: "/api/ping?host=127.0.0.1;cat+/etc/shadow", status: 500, user_agent: "curl/8.0" },
  }),
];

const badIpConn: ScenarioFn = (rnd, t0) => [
  ev({
    ts: t0, id: `badip:${t0}:0`, host: "pc-08", sim_scenario: "bad_ip",
    event_category: "network", event_action: "connection", outcome: "success",
    src_ip: "10.10.0.38", dst_ip: "45.155.204.10", dst_port: 443, proto: "tcp",
    bytes_in: 50_000, bytes_out: 20_000, user: "gina", country: "RU",
  }),
];

const malwareChain: ScenarioFn = (rnd, t0) => [
  ev({
    ts: t0, id: `mal:${t0}:0`, host: "pc-04", sim_scenario: "malware_chain",
    event_category: "process", event_action: "execute", outcome: "success",
    user: "dave", process: "WINWORD.EXE", src_ip: "10.10.0.34",
  }),
  ev({
    ts: t0 + 45_000, id: `mal:${t0}:1`, host: "pc-04", sim_scenario: "malware_chain",
    event_category: "process", event_action: "execute", outcome: "success",
    user: "dave", process: "cmd.exe", src_ip: "10.10.0.34",
  }),
  ev({
    ts: t0 + 60_000, id: `mal:${t0}:2`, host: "pc-04", sim_scenario: "malware_chain",
    event_category: "process", event_action: "execute", outcome: "success",
    user: "dave", process: "powershell.exe -nop -enc SQBFAFgA", src_ip: "10.10.0.34",
  }),
  ev({
    ts: t0 + 90_000, id: `mal:${t0}:3`, host: "pc-04", sim_scenario: "malware_chain",
    event_category: "process", event_action: "execute", outcome: "success",
    user: "dave", process: "svchost32.exe", src_ip: "10.10.0.34",
  }),
  ev({
    ts: t0 + 120_000, id: `mal:${t0}:4`, host: "pc-04", sim_scenario: "malware_chain",
    event_category: "network", event_action: "connection", outcome: "success",
    src_ip: "10.10.0.34", dst_ip: "185.220.101.44", dst_port: 443, proto: "tcp",
    user: "dave", country: "NL",
  }),
];

const offhoursShare: ScenarioFn = (rnd, t0) =>
  Array.from({ length: 8 }, (_, i) =>
    ev({
      ts: t0 + i * 60_000, id: `ohs:${t0}:${i}`, host: "srv-file", sim_scenario: "offhours_share",
      event_category: "file", event_action: "open", outcome: "success",
      src_ip: "10.10.0.35", dst_ip: "10.10.0.11", dst_port: 445, proto: "tcp", user: "gina",
    })
  );

const insiderStaging: ScenarioFn = (rnd, t0) =>
  Array.from({ length: 40 }, (_, i) =>
    ev({
      ts: t0 + i * 9000, id: `ins:${t0}:${i}`, host: "srv-file", sim_scenario: "insider_staging",
      event_category: "file", event_action: "open", outcome: "success",
      src_ip: "10.10.0.31", dst_ip: "10.10.0.11", dst_port: 445, proto: "tcp", user: "dave",
    })
  );

interface Scenario {
  id: string;
  fn: ScenarioFn;
  night: boolean; // scheduled only at night (01:00-05:00 local)
}

const SCENARIOS: Scenario[] = [
  { id: "port_scan", fn: portScan, night: false },
  { id: "ssh_bruteforce", fn: sshBrute, night: false },
  { id: "rdp_bruteforce", fn: rdpBrute, night: false },
  { id: "password_spray", fn: passwordSpray, night: false },
  { id: "credential_stuffing", fn: credStuffing, night: false },
  { id: "impossible_travel", fn: impossibleTravel, night: false },
  { id: "priv_esc", fn: privEsc, night: true },
  { id: "lateral_movement", fn: lateral, night: false },
  { id: "dns_tunneling", fn: dnsTunnel, night: false },
  { id: "c2_beacon", fn: c2Beacon, night: false },
  { id: "exfiltration", fn: exfil, night: true },
  { id: "dos_synflood", fn: dosSyn, night: false },
  { id: "sqli", fn: sqli, night: false },
  { id: "xss_traversal", fn: xssTraversal, night: false },
  { id: "bad_ip", fn: badIpConn, night: false },
  { id: "malware_chain", fn: malwareChain, night: false },
  { id: "offhours_share", fn: offhoursShare, night: true },
  { id: "insider_staging", fn: insiderStaging, night: false },
];

function scenarioEventsForDay(seed: number, dayStart: number): SimEvent[] {
  const rnd = mulberry32((seed ^ (dayStart | 0)) >>> 0);
  const out: SimEvent[] = [];
  for (const sc of SCENARIOS) {
    let start: number;
    if (sc.night) {
      // 01:00-05:00 local (UTC+5) => 20:00-24:00 UTC of previous day
      const off = 20 * 3600 + Math.floor(rnd() * 4 * 3600);
      start = dayStart + off * 1000;
    } else {
      start = dayStart + Math.floor(rnd() * DAY_MS);
    }
    out.push(...sc.fn(rnd, start));
  }
  return out;
}

// ---------- public API ----------
export function generateWindow(
  seed: number,
  fromMs: number,
  toMs: number,
  cap = 4000
): SimEvent[] {
  const out: SimEvent[] = [];
  const bucket = 10_000;
  const firstBucket = Math.floor(fromMs / bucket) * bucket;
  for (let b = firstBucket; b < toMs; b += bucket) {
    if (b + bucket >= fromMs) out.push(...baselineBucket(seed, b).filter(e => e.ts >= fromMs && e.ts < toMs));
  }
  const firstDay = Math.floor(fromMs / DAY_MS) * DAY_MS - DAY_MS;
  for (let d = firstDay; d <= toMs; d += DAY_MS) {
    for (const e of scenarioEventsForDay(seed, d)) {
      if (e.ts >= fromMs && e.ts < toMs) out.push(e);
    }
  }
  out.sort((a, b) => a.ts - b.ts);
  if (out.length > cap) {
    const step = out.length / cap;
    const sampled: SimEvent[] = [];
    for (let i = 0; i < cap; i++) sampled.push(out[Math.floor(i * step)]);
    return sampled;
  }
  return out;
}

export const scenarioIds = SCENARIOS.map(s => s.id);
export function generateScenario(id: string, seed = SIM_SEED, at = 1791669600000): SimEvent[] {
  const scenario = SCENARIOS.find(s => s.id === id);
  if (!scenario) throw new Error("Unknown scenario");
  return scenario.fn(mulberry32(seed), at);
}
export function generateBaseline(seed: number, fromMs: number, toMs: number): SimEvent[] {
  const result: SimEvent[] = [];
  for (let b = Math.floor(fromMs / 10000) * 10000; b < toMs; b += 10000) result.push(...baselineBucket(seed, b).filter(e => e.ts >= fromMs && e.ts < toMs));
  return result.sort((a,b) => a.ts-b.ts);
}
