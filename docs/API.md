# API reference

All mutation requests using sessions require an exact matching `Origin` and `x-csrf-token` returned with the signed session. Bearer ingestion is independent of browser cookies. Demo/viewer cannot mutate. Private responses are `Cache-Control: no-store`. Errors use `{error:{code}}` without stack traces.

| Endpoint | Access | Behavior |
|---|---|---|
| GET /api/health | public | Signing configuration and storage mode |
| GET /api/stats | public/session | Simulation counters by default; ingested only for real sessions |
| POST /api/auth/login | same-origin | Email/password → HttpOnly session |
| POST /api/auth/demo | same-origin | Read-only simulation session |
| POST /api/auth/logout | session + CSRF | Revoke browser cookie |
| POST /api/ingest | Bearer token | JSON, NDJSON, CSV, TSV, syslog, access log → normalized events |
| GET /api/overview | session | Events, alerts, cases, assets and source health |
| GET /api/events | session | q, from, to, source, scenario, format=csv|json |
| GET /api/alerts, /api/cases, /api/assets, /api/sources | session | Selected source snapshots |
| GET /api/cases/:id | session | Case details and summary; source/scenario/locale |
| PATCH /api/cases/:id | analyst/admin + CSRF | Status, assignee, notes, comment for real cases |
| GET /api/stream | session | SSE, 25-second lifetime, retry/reconnect, Last-Event-ID |
| POST /api/detect | analyst/admin + CSRF | Stateless detection over an uploaded batch |
| POST /api/analyze-file | analyst/admin + CSRF | 2 MiB / 5000 events, text body, stateless analysis |
| GET /api/rules | session | 25 built-in or configured rules |
| POST /api/rules | analyst/admin + CSRF | Test {rule, events} on up to 500 normalized events |
| PUT /api/rules | admin + CSRF | Save a full validated rule array, maximum 100 |
| GET /api/reports | session | Download JSON or CSV report, ISO mapping is indicative |
| GET /api/settings | admin | Safe configuration and token metadata |
| PATCH /api/settings | admin + CSRF | {ipMask:boolean} |
| POST /api/tokens | admin + CSRF | {label} → token shown once; only SHA-256 hash retained |
| DELETE /api/tokens | admin + CSRF | {id} → revoke token |
| GET /api/audit | admin | Last 500 audit records |
| POST /api/contact | same-origin | Validated contact form → configured Telegram channel |
| GET /api/og | public | Localized PNG Open Graph image |

Source defaults to `simulation`. Choose `source=ingested` with a real session for stored events. Scenarios: `all`, `scheduled`, `baseline`, or one scenario ID returned by overview. No demo request can access real events.

```sh
curl -X POST https://YOUR_HOST/api/ingest \
  -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  --data '[{"ts":1700000000000,"host":"server","event_category":"authentication","event_action":"login","outcome":"failure","src_ip":"192.0.2.5","user":"alice"}]'
```

Schema: `server/schema.ts`; supported field/operator rules: `server/rules/index.ts`. Query syntax: `src_ip:10.0.0.0/24 AND outcome:failure`, parentheses and AND/OR/NOT. Bare words search the event JSON. Unsupported fields/operators fail validation. Queries are limited to 1024 characters / 100 tokens. No arbitrary regular expressions or executable code. File data is parsed as text, never executed.
