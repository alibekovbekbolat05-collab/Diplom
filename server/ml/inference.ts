import modelData from "./model.json";
import type { SecurityEvent } from "@/server/schema";
type Tree =
  | { leaf: true; v: number }
  | { leaf: false; f: number; t: number; l: Tree; r: Tree };
export const model = modelData as unknown as {
  features: string[];
  base: number;
  lr: number;
  trees: Tree[];
  trained_on: string;
  parity_fixture: { x: number[]; p: number }[];
};
function leaf(tree: Tree, x: number[]): number {
  let node = tree;
  while (!node.leaf) node = x[node.f] <= node.t ? node.l : node.r;
  return node.v;
}
export function probability(x: number[]): number {
  if (x.length !== model.features.length || x.some((v) => !Number.isFinite(v)))
    throw new Error("Invalid flow features");
  const score =
    model.base + model.lr * model.trees.reduce((s, t) => s + leaf(t, x), 0);
  return 1 / (1 + Math.exp(-score));
}
export function features(e: SecurityEvent): number[] {
  const duration = Math.max(0.001, e.duration_ms / 1000),
    packets = Math.max(1, e.packets);
  return [
    duration,
    e.bytes_in,
    e.bytes_out,
    packets,
    packets / duration,
    e.bytes_out / Math.max(1, e.bytes_in),
    e.dst_port || 0,
    (e.bytes_in + e.bytes_out) / packets,
    e.syn_count ?? 1,
    e.fin_count ?? (e.outcome === "success" ? 1 : 0),
  ];
}
export function classify(e: SecurityEvent) {
  if (e.event_category !== "network" || e.duration_ms <= 0 || e.packets <= 0)
    return null;
  const x = features(e);
  const p = probability(x);
  const changes = x
    .map((v, i) => {
      const changed = [...x];
      changed[i] = 0;
      return {
        name: model.features[i],
        value: Math.abs(p - probability(changed)) * 100,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  return {
    probability: p,
    contributions: changes,
    explanation:
      "Feature ablation against zero; not causal attribution. SYN/FIN counts may be inferred when absent.",
  };
}
