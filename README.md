# Aspan Security / SecureOps

[Передача проекта и инструкции на русском](docs/HANDOVER.ru.md)

Fictional managed-security company website and diploma SIEM showcase. Next.js 15 / React 19 / TypeScript, three locales (RU/EN/KK), dark/light themes, liquid navigation, authenticated console. No commercial certification or real-world model accuracy is claimed.

## Local run and first login

Requires Node.js 22 and npm.

```sh
npm ci
cp .env.example .env.local
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
node -e "console.log(require('bcryptjs').hashSync(process.argv[1],10))" 'YOUR_PASSWORD'
npm run dev -- -H 127.0.0.1
```

Copy generated values into `AUTH_SECRET` and `ADMIN_PASSWORD_HASH`; set `ADMIN_EMAIL`. Visit `/ru` or `/ru/platform/login`. The demo button provides a viewer simulation session. Your configured administrator can switch to ingested data. No production password is committed. `USERS_JSON` supports admin/analyst/viewer accounts with bcrypt hashes. Analysts can analyze/detect and edit real cases. Administrators also configure rules, tokens and settings. Viewers have read-only access.

## GitHub and Vercel

The source is tracked at https://github.com/alibekovbekbolat05-collab/Diplom on `main`. CI uses Node 22 and runs model presence checks, lint, typecheck, tests and build.

1. Install the Vercel GitHub app for this repository.
2. In the intended Vercel team, import this GitHub repository or connect it to the existing `diplom` project. Root directory: repository root. Framework: Next.js. Install: `npm ci`; build: `npm run build`; output: default. Node 22.
3. Set `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `NEXT_PUBLIC_SITE_URL`, `DEMO_MODE_ENABLED=1`; optionally `INGEST_TOKEN`. Use separate development/preview/production secrets.
4. Deploy `main`; after Ready, open the generated URL and `/ru/platform/login`. If the company site should be public, ensure deployment protection matches that choice.
5. For real persistent ingestion set both Upstash Redis variables. Local memory and `/tmp` are ephemeral and may differ across Vercel instances.

Installing the GitHub app does not by itself connect a repository to an existing unlinked Vercel project. A successful local build is not proof of a successful hosted deployment.

## Architecture and source tree

```text
app/[locale]/(site)/              company pages and methodology
app/[locale]/(platform)/          protected console and login
app/api/                         validated session/Bearer APIs
components/site/                 hero, navigation, public UI
components/platform/             overview, search, cases, admin modules
components/viz/                   lightweight SVG charts
config/                          editable company and diploma defaults
content/messages/                RU / EN / KK UI dictionaries
content/metrics.json              measured synthetic benchmark
content/threat-intel.json         dated offline intelligence snapshot
server/parsers/                   normalized ingestion adapters
server/detection/                 deterministic detectors
server/rules/                     25 safe field/threshold rules
server/correlation/               incident grouping and asset risk
server/ml/                        exported trees, inference, UEBA, summary
server/adapters/                  memory/tmp or Upstash store
ml/                              Python training and parity scripts
agent/                           local read-only log shipper
tests/                           behavioral and security tests
docs/                            API and verification notes
```

Flow: logs → bounded text parser → normalized schema → detectors/rules + advisory flow probability + behavior baselines → priority/correlation → cases/assets → session-protected console and SSE. Simulation is deterministic by seed/time; real ingest forcibly clears simulation flags. Every mutation validates Origin, CSRF and role. Upload analysis is stateless. Raw text is escaped by React; CSV exports neutralize formulas.

## Detector reference

| Detector | Evidence | MITRE |
|---|---|---|
| Port scan | 20 unique destination ports / 120s | T1046 |
| Brute force / spray / stuffing | Failed logins, account and address diversity | T1110 |
| Success after failures | Successful login after a failure burst | T1078 |
| SYN/packet flood | Burst rate or packet count | T1498 |
| DNS tunneling | Long/high-entropy subdomain or TXT/NULL | T1071.004 |
| C2 beacon | Repeated low-jitter intervals | T1071 |
| Exfiltration | Outbound volume/ratio | T1041 |
| Lateral movement | SMB/RDP/SSH across internal hosts | T1021 |
| SQLi/XSS/traversal/command injection | Decoded suspicious HTTP path | T1190 |
| Privilege abuse | IAM group change / special privileges | T1098 |
| Malware chain | Encoded PowerShell / suspicious process | T1059 |
| Threat intelligence | Exact match to dated offline snapshot | T1071 |
| HTTP error burst | Repeated server errors | T1595 |
| Impossible travel | Country-centroid speed heuristic | T1078 |
| Off-hours share access | Access outside UTC+5 office hours | T1078 |
| Insider staging | Per-user file access burst | T1074 |
| UEBA | Robust volume outlier with adequate history | T1078 |

Actual thresholds and MITRE mappings live in `server/detection/config.ts` and `detectors.ts`. Built-in rules: SSH/RDP/VPN failures, failed authentication, account creation (two source spellings), group change, privileges, encoded/no-profile PowerShell, suspicious svchost, SQLMap/Nikto/Nmap, UNION/script/traversal/passwd/shadow payloads, HTTP errors, TXT/NULL volume, large transfer, packet flood and per-user file staging. Rule editor supports safe conditions, thresholds, windows, grouping, enable/disable and optional ordered sequence. No eval or arbitrary regex.

## ML and behavior

See [ml/README.md](ml/README.md). Python-trained 24-tree model, 10 features, seed 42. Current held-out **synthetic** F1 0.993865; TP405/FP0/TN1590/FN5. Python/TypeScript fixtures agree. These results do not generalize automatically to production. Model probability is advisory by default; standalone ML alerts are disabled until separately calibrated. UEBA histories separate event categories and use median/MAD with minimum samples. LLM is optional and only summarizes already-detected cases. It receives no raw logs, IPs, hosts or users, never executes actions and falls back deterministically.

## Optional integrations and limits

- **Redis:** set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`; activates a shared JSON store, lease-checked writes and distributed rate limits. Current caps: 20k events, 5k alerts/audit, 2k cases. Suitable for a diploma/small demo, not enterprise retention.
- **PostgreSQL:** not implemented. Replace the `readStore`/`updateStore` adapter with transactional tables and migrations before setting up long-term retention. Merely setting `DATABASE_URL` does nothing.
- **Notifications/contact:** Telegram bot + chat ID or HTTPS notification webhook. Only new real high/critical cases are sent; contact form requires Telegram and returns unavailable when unconfigured. Delivery currently best-effort with no durable retry queue.
- **LLM:** set HTTPS `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` for an OpenAI-compatible chat endpoint. No provider configured by default.
- **Threat intelligence:** bundled dated Feodo snapshot (historical, may be stale), with separate simulation-only demo indicators. For live feeds add a scheduled vetted snapshot refresh and preserve provenance; no automatic live refresh is implemented.
- **Analytics:** disabled and no cookies for analytics. Add a consent-gated provider before introducing third-party analytics.
- **Payments:** disabled; no billing or card collection. Add provider checkout/webhook verification and plan permissions before enabling paid features.
- **Agent:** see [agent/README.md](agent/README.md). Runs on your own log host, never inside Vercel. In-memory offset, bounded line batches, retry and server deduplication.
- **Geography/topology:** illustrations based on observed entities, not verified geolocation or discovered physical links. Impossible travel uses coarse country centroids and may misinterpret VPNs.
- **Performance:** lightweight charts, bounded tables, visibility-aware refresh and reduced-motion support. No measured guarantee of 60FPS, Lighthouse targets or production latency.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run build
python ml/parity.py
```

See [docs/VERIFICATION.md](docs/VERIFICATION.md) for actual final results, browser flow coverage, fixtures and remaining limits. [docs/API.md](docs/API.md) lists authentication and endpoints.
