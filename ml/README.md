# Reproducible model training

```sh
python -m pip install -r ml/requirements.txt
python ml/train.py --synthetic
python ml/parity.py
npm test -- tests/ml.test.ts
```

Seed 42, 12,000 synthetic flows, 10,000 train / 2,000 held-out test, 24 gradient boosting trees of depth four. The split and generator match the original Node pipeline. `content/metrics.json` is produced by the actual run; no results are hard-coded into pages. The exported JSON contains 32 probabilities used for Python/TypeScript parity. Current synthetic F1 = 0.993865, ROC AUC = 0.999951. These are not measured real-world detection rates.

For your own dataset, provide CSV columns `duration_s,bytes_in,bytes_out,packets,pkts_per_s,bytes_ratio,dst_port,mean_pkt_size,syn_count,fin_count,label`, with finite numbers and binary label 0/1:

```sh
python ml/train.py --csv dataset.csv --dataset-name YOUR_DATASET_NAME
```

Real CSV mode uses a stratified random 80/20 split. For publication, deduplicate flows and use a time- or host-separated external evaluation set. Do not describe the synthetic model as trained on CIC-IDS2017 or UNSW-NB15. No external labeled dataset is bundled. SYN/FIN features are inferred when unavailable, and this reduces reliability.

The synthetic model is deliberately advisory by default: its probability contributes to alert priority but does not independently create alerts. Full-pipeline validation found dataset shift between ordinary simulator flows and the training generator. Enable `ML_FLOW_ALERTS=1` only after calibration on your own flows. UEBA separates network/web histories and requires at least 20 volume samples. Feature ablation against zero is an approximation, not causal attribution.
