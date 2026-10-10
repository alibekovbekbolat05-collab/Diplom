# Local log shipping agent

Run on a machine that has the logs; Vercel does not host the tailing process. Requires Node.js 20+. Read-only access to one regular UTF-8, line-delimited file; no shell commands or log execution.

```sh
AGENT_LOG_FILE=/var/log/auth.log \
AGENT_INGEST_URL=https://YOUR_HOST/api/ingest \
AGENT_TOKEN=YOUR_INGEST_TOKEN node agent/index.mjs
```

Starts at EOF. Set `AGENT_FROM_START=1` to replay a small existing file. Sends complete lines, at most 128 KiB per poll, every two seconds. Failed batches retry; server event IDs deduplicate repeats. Copy/truncate rotation is supported; rename rotation must restart the agent. Offsets are in memory and not retained across restart. Local stdin, multipart files, TLS syslog listeners and endpoint monitoring are not implemented. Never place tokens in committed files.
