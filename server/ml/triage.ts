import type { Alert } from "@/server/schema";
import { severityWeight } from "@/server/detection/config";
export function triage(alert: Alert, ml = 0, anomaly = 0, criticality = 0) {
  const factors = [
    { name: "rule_severity", value: severityWeight[alert.severity] * 0.55 },
    { name: "ml_probability", value: Math.max(0, Math.min(1, ml)) * 20 },
    {
      name: "behavior_anomaly",
      value: Math.max(0, Math.min(100, anomaly)) * 0.15,
    },
    {
      name: "asset_criticality",
      value: Math.max(0, Math.min(100, criticality)) * 0.05,
    },
    { name: "threat_intel", value: alert.type === "threat_intel" ? 5 : 0 },
  ];
  return {
    ...alert,
    priority: Math.min(
      100,
      Math.round(factors.reduce((s, f) => s + f.value, 0)),
    ),
    factors: factors.sort((a, b) => b.value - a.value),
  };
}
