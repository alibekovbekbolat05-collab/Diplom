/**
 * Trains the shipped flow classifier on a documented SYNTHETIC generator
 * (no external dataset required) and exports:
 *   - server/ml/model.json   (GBDT ensemble + parity fixture)
 *   - content/metrics.json   (held-out evaluation, labeled "synthetic benchmark")
 *
 * Reproduce: node scripts/train-model.mjs
 * For real-dataset training (CIC-IDS2017 / UNSW-NB15), see ml/train.py.
 * All metrics produced here are from this synthetic benchmark and are labeled as such.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---------- deterministic PRNG ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- documented synthetic flow generator ----------
export const FEATURES = [
  "duration_s",
  "bytes_in",
  "bytes_out",
  "packets",
  "pkts_per_s",
  "bytes_ratio",
  "dst_port",
  "mean_pkt_size",
  "syn_count",
  "fin_count",
];

function feat(f) {
  return FEATURES.map((k) => f[k]);
}

function benignFlow(rnd) {
  // benign classes that overlap with attacks: nightly backups (large out),
  // monitoring probes (small flows), everything else ordinary office traffic
  const r = rnd();
  if (r < 0.04) {
    // scheduled backup: large bytes_out over SMB/HTTPS, long duration
    const pkts = Math.floor(1500 + rnd() * 2500);
    const bytesOut = Math.floor(2_000_000 + rnd() * 6_000_000);
    const bytesIn = Math.floor(bytesOut * (0.05 + rnd() * 0.15));
    const duration = 120 + rnd() * 600;
    return {
      label: 0,
      duration_s: duration,
      bytes_in: bytesIn,
      bytes_out: bytesOut,
      packets: pkts,
      pkts_per_s: pkts / duration,
      bytes_ratio: bytesOut / Math.max(1, bytesIn),
      dst_port: rnd() < 0.5 ? 445 : 443,
      mean_pkt_size: (bytesIn + bytesOut) / pkts,
      syn_count: 1,
      fin_count: 1,
    };
  }
  if (r < 0.07) {
    // monitoring probes: many short flows to low ports
    return {
      label: 0,
      duration_s: 0.01 + rnd() * 0.4,
      bytes_in: Math.floor(rnd() * 80),
      bytes_out: Math.floor(rnd() * 80),
      packets: 1 + Math.floor(rnd() * 3),
      pkts_per_s: 8 + rnd() * 30,
      bytes_ratio: 1,
      dst_port: Math.floor(rnd() * 2000),
      mean_pkt_size: 40 + rnd() * 70,
      syn_count: 1,
      fin_count: 0,
    };
  }
  const commonPorts = [80, 443, 53, 993, 587, 445, 3389];
  const port = commonPorts[Math.floor(rnd() * commonPorts.length)];
  const duration = 0.5 + rnd() * 300;
  const pkts = Math.floor(8 + rnd() * 400);
  const bytesIn = Math.floor(pkts * (200 + rnd() * 800));
  const bytesOut = Math.floor(bytesIn * (0.1 + rnd() * 0.5));
  const pktsPerS = pkts / duration;
  return {
    label: 0,
    duration_s: duration,
    bytes_in: bytesIn,
    bytes_out: bytesOut,
    packets: pkts,
    pkts_per_s: pktsPerS,
    bytes_ratio: bytesOut / Math.max(1, bytesIn),
    dst_port: port,
    mean_pkt_size: (bytesIn + bytesOut) / pkts,
    syn_count: 1,
    fin_count: 1,
  };
}

function attackFlow(rnd, kind) {
  if (kind === "exfil") {
    // 25% of "exfil" is a benign-looking transfer (moderate volume, common port)
    if (rnd() < 0.25) {
      const pkts = Math.floor(400 + rnd() * 900);
      const bytesOut = Math.floor(300_000 + rnd() * 900_000);
      const bytesIn = Math.floor(bytesOut * (0.2 + rnd() * 0.6));
      const duration = 20 + rnd() * 200;
      return {
        label: 1,
        duration_s: duration,
        bytes_in: bytesIn,
        bytes_out: bytesOut,
        packets: pkts,
        pkts_per_s: pkts / duration,
        bytes_ratio: bytesOut / Math.max(1, bytesIn),
        dst_port: 443,
        mean_pkt_size: (bytesIn + bytesOut) / pkts,
        syn_count: 1,
        fin_count: 1,
      };
    }
    const pkts = Math.floor(2000 + rnd() * 4000);
    const bytesOut = Math.floor(5_000_000 + rnd() * 40_000_000);
    const bytesIn = Math.floor(bytesOut * (0.01 + rnd() * 0.05));
    const duration = 30 + rnd() * 300;
    return {
      label: 1,
      duration_s: duration,
      bytes_in: bytesIn,
      bytes_out: bytesOut,
      packets: pkts,
      pkts_per_s: pkts / duration,
      bytes_ratio: bytesOut / Math.max(1, bytesIn),
      dst_port: rnd() < 0.7 ? 443 : 8000 + Math.floor(rnd() * 2000),
      mean_pkt_size: (bytesIn + bytesOut) / pkts,
      syn_count: 1,
      fin_count: 1,
    };
  }
  if (kind === "brute") {
    const port = rnd() < 0.5 ? 22 : 3389;
    return {
      label: 1,
      duration_s: 0.05 + rnd() * 1.5,
      bytes_in: Math.floor(40 + rnd() * 300),
      bytes_out: Math.floor(40 + rnd() * 300),
      packets: Math.floor(3 + rnd() * 12),
      pkts_per_s: 6 + rnd() * 30,
      bytes_ratio: 0.5 + rnd() * 1.5,
      dst_port: port,
      mean_pkt_size: 60 + rnd() * 120,
      syn_count: 1,
      fin_count: rnd() < 0.3 ? 1 : 0,
    };
  }
  if (kind === "scan") {
    return {
      label: 1,
      duration_s: 0.01 + rnd() * 0.3,
      bytes_in: Math.floor(0 + rnd() * 60),
      bytes_out: Math.floor(0 + rnd() * 60),
      packets: 1 + Math.floor(rnd() * 2),
      pkts_per_s: 10 + rnd() * 40,
      bytes_ratio: 1,
      dst_port: Math.floor(rnd() * 65536),
      mean_pkt_size: 40 + rnd() * 60,
      syn_count: 1,
      fin_count: 0,
    };
  }
  // c2 beacon: small periodic flows to an unusual port
  return {
    label: 1,
    duration_s: 0.2 + rnd() * 2,
    bytes_in: Math.floor(80 + rnd() * 400),
    bytes_out: Math.floor(80 + rnd() * 600),
    packets: Math.floor(4 + rnd() * 16),
    pkts_per_s: 2 + rnd() * 8,
    bytes_ratio: 0.6 + rnd() * 1.2,
    dst_port: 8000 + Math.floor(rnd() * 5000),
    mean_pkt_size: 80 + rnd() * 160,
    syn_count: 1,
    fin_count: 1,
  };
}

export function generateDataset(n = 12000, seed = 42) {
  const rnd = mulberry32(seed);
  const rows = [];
  for (let i = 0; i < n; i++) {
    const r = rnd();
    if (r < 0.8) rows.push(benignFlow(rnd));
    else {
      const k = rnd();
      rows.push(attackFlow(rnd, k < 0.3 ? "exfil" : k < 0.6 ? "brute" : k < 0.8 ? "scan" : "c2"));
    }
  }
  // shuffle
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows;
}

// ---------- tiny gradient-boosted trees (logistic loss, depth-limited) ----------
function varianceSplit(rows, idx, minLeaf) {
  const m = idx.length;
  if (m < 2 * minLeaf) return null;
  let best = null;
  for (let f = 0; f < FEATURES.length; f++) {
    const vals = idx.map((i) => rows[i].x[f]);
    const uniq = [...new Set(vals)].sort((a, b) => a - b);
    if (uniq.length < 2) continue;
    for (let q = 0; q < 8; q++) {
      const thr = uniq[Math.floor(((q + 1) / 9) * (uniq.length - 1))];
      let ls = 0,
        rs = 0,
        lc = 0,
        rc = 0;
      for (const i of idx) {
        if (rows[i].x[f] <= thr) {
          ls += rows[i].g;
          lc++;
        } else {
          rs += rows[i].g;
          rc++;
        }
      }
      if (lc < minLeaf || rc < minLeaf) continue;
      const score = (ls * ls) / lc + (rs * rs) / rc; // variance reduction proxy
      if (!best || score > best.score) best = { f, thr, score };
    }
  }
  return best;
}

function buildTree(rows, idx, depth, minLeaf) {
  if (depth === 0 || idx.length < minLeaf * 2) {
    let s = 0;
    for (const i of idx) s += rows[i].g;
    return { leaf: true, v: s / Math.max(1, idx.length) };
  }
  const split = varianceSplit(rows, idx, minLeaf);
  if (!split) {
    let s = 0;
    for (const i of idx) s += rows[i].g;
    return { leaf: true, v: s / Math.max(1, idx.length) };
  }
  const li = [],
    ri = [];
  for (const i of idx) (rows[i].x[split.f] <= split.thr ? li : ri).push(i);
  return {
    leaf: false,
    f: split.f,
    t: split.thr,
    l: buildTree(rows, li, depth - 1, minLeaf),
    r: buildTree(rows, ri, depth - 1, minLeaf),
  };
}

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

export function trainGBC(dataset, opts = {}) {
  const { nTrees = 24, depth = 4, lr = 0.4, minLeaf = 20 } = opts;
  const rows = dataset.map((d) => ({ x: feat(d), y: d.label, g: 0 }));
  const nPos = rows.reduce((s, r) => s + r.y, 0);
  const base = Math.log(Math.max(nPos, 1) / Math.max(rows.length - nPos, 1));
  const F = rows.map(() => base);
  const trees = [];
  for (let m = 0; m < nTrees; m++) {
    for (let i = 0; i < rows.length; i++) {
      const p = sigmoid(F[i]);
      rows[i].g = rows[i].y - p; // negative gradient of logloss
    }
    const idx = rows.map((_, i) => i);
    const tree = buildTree(rows, idx, depth, minLeaf);
    trees.push(tree);
    for (let i = 0; i < rows.length; i++) F[i] += lr * predictTree(tree, rows[i].x);
  }
  return { base, trees, lr };
}

function predictTree(node, x) {
  let n = node;
  while (!n.leaf) n = x[n.f] <= n.t ? n.l : n.r;
  return n.v;
}

export function predict(model, x) {
  let f = model.base;
  for (const t of model.trees) f += model.lr * predictTree(t, x);
  return sigmoid(f);
}

// ---------- evaluation ----------
function rocAuc(yTrue, yScore) {
  const pairs = yTrue.map((y, i) => [y, yScore[i]]).sort((a, b) => a[1] - b[1]);
  let rank = 1,
    posRankSum = 0,
    nPos = 0,
    nNeg = 0;
  let i = 0;
  while (i < pairs.length) {
    let j = i;
    while (j + 1 < pairs.length && pairs[j + 1][1] === pairs[i][1]) j++;
    const avgRank = (2 * rank + (j - i)) / 2; // average rank of the tie group
    for (let k = i; k <= j; k++) {
      if (pairs[k][0] === 1) {
        posRankSum += avgRank;
        nPos++;
      } else nNeg++;
    }
    rank += j - i + 1;
    i = j + 1;
  }
  if (nPos === 0 || nNeg === 0) return 0.5;
  return (posRankSum - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
}

function evaluate(model, dataset) {
  let tp = 0,
    fp = 0,
    tn = 0,
    fn = 0;
  const scores = [];
  const ys = [];
  for (const d of dataset) {
    const p = predict(model, feat(d));
    scores.push(p);
    ys.push(d.label);
    const yhat = p >= 0.5 ? 1 : 0;
    if (yhat === 1 && d.label === 1) tp++;
    else if (yhat === 1 && d.label === 0) fp++;
    else if (yhat === 0 && d.label === 0) tn++;
    else fn++;
  }
  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  return {
    accuracy: (tp + tn) / dataset.length,
    precision,
    recall,
    f1: (2 * precision * recall) / Math.max(1e-9, precision + recall),
    roc_auc: rocAuc(ys, scores),
    confusion: { tp, fp, tn, fn },
  };
}

// ---------- main ----------
const dataset = generateDataset(12000, 42);
const testSize = 2000;
const test = dataset.slice(0, testSize);
const train = dataset.slice(testSize);

const model = trainGBC(train, { nTrees: 24, depth: 4, lr: 0.4, minLeaf: 20 });
const metrics = evaluate(model, test);

// parity fixture: deterministic samples with expected outputs from THIS model
const fixture = test.slice(0, 8).map((d) => ({
  x: feat(d),
  p: Number(predict(model, feat(d)).toFixed(6)),
}));

const modelJson = {
  version: 1,
  kind: "gbdt-logistic",
  features: FEATURES,
  base: model.base,
  lr: model.lr,
  trees: model.trees,
  trained_on: "synthetic-flows v1 (scripts/train-model.mjs, seed 42)",
  parity_fixture: fixture,
};

mkdirSync(join(root, "server", "ml"), { recursive: true });
writeFileSync(join(root, "server", "ml", "model.json"), JSON.stringify(modelJson));

mkdirSync(join(root, "content"), { recursive: true });
writeFileSync(
  join(root, "content", "metrics.json"),
  JSON.stringify(
    {
      benchmark: "synthetic",
      generator: "scripts/train-model.mjs seed=42",
      test_size: testSize,
      train_size: train.length,
      ...metrics,
    },
    null,
    2
  )
);

console.log("model trees:", model.trees.length);
console.log("metrics:", JSON.stringify(metrics, null, 2));
