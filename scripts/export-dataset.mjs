import { generateDataset, FEATURES } from "./train-model.mjs";
process.stdout.write(JSON.stringify({features: FEATURES, rows:generateDataset(12000,42)}));
