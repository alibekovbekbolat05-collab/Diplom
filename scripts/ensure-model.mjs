import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
if (!existsSync("server/ml/model.json") || !existsSync("content/metrics.json")) {
  const result=spawnSync(process.execPath,["scripts/train-model.mjs"],{stdio:"inherit"});
  process.exit(result.status || 0);
}
