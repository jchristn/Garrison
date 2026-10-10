# Configuration

Garrison has three layers of configuration, and it helps to know which one a value lives in before you go looking for it.

| Layer | Where it lives | Scope | How it changes |
|---|---|---|---|
| Node settings | A JSON file per process, overridden by environment variables | One control-plane or worker process | Edit the file or the environment, or use the settings API for the control plane; most need a restart |
| Cluster settings | The database | Every control-plane replica | Settings API or dashboard; applied live, within about three seconds, on every replica |
| Tenant configuration | The database | One tenant | REST, manifests, or dashboard: harness profiles, prompt templates, MCP servers, secrets, workspaces, artifact stores, agents, deployments |

This page covers the first two. Tenant configuration is covered in `docs/HARNESSES.md`, `docs/PROMPTS.md`, `docs/MANIFESTS.md`, and `REST_API.md`.

## Precedence

For node settings, an environment variable wins over the settings file, and the file wins over the built-in default. When a value comes from the environment, the settings API reports its source as `Environment` and refuses to edit it, because the next restart would undo the change. If `Cluster.SettingsFileReadOnly` is true (typical when the file is a Kubernetes ConfigMap), the source is reported as `ConfigMap` and file settings cannot be edited through the API at all.

Cluster settings have a built-in default and an optional stored value. A stored value applies to every replica.

## Control-plane settings file

The server reads `garrison.json` from its working directory, or the path in `GARRISON_SETTINGS_FILE`. Property names in the file are PascalCase and match the paths below.

```json
{
  "Rest": { "Hostname": "*", "Port": 8700, "Ssl": false, "PublicBaseUrl": "http://garrison-server:8700", "ExternalBaseUrl": "https://garrison.example.com" },
  "Mcp": { "Enable": true, "Hostname": "*", "Port": 8701, "Path": "/mcp", "PublicUrl": "http://garrison-server:8701" },
  "Database": { "Type": "Postgresql", "Host": "postgres", "Port": 5432, "DatabaseName": "garrison", "Username": "garrison" },
  "Auth": { "TokenLifetimeMinutes": 480 },
  "Logging": { "ConsoleLogging": true, "MinimumSeverity": 1 },
  "Telemetry": { "PrometheusEnable": true }
}
```

Keep secrets (`Auth.SigningKey`, `Auth.AdminApiKey`, `Security.*` keys, `Database.Password`) out of the file in shared environments and supply them through environment variables backed by Kubernetes secrets.

### Rest

| Path | Default | Applies | Meaning |
|---|---|---|---|
| `Rest.Hostname` | `*` | Restart | Bind address; `*` means every interface |
| `Rest.Port` | `8700` | Restart | REST, A2A, and WebSocket port. Environment: `GARRISON_REST_PORT` |
| `Rest.Ssl` | `false` | Restart | Serve TLS on the listener. Usually TLS ends at the ingress instead |
| `Rest.PublicBaseUrl` | none | Restart | Internal URL handed to runs (the `garrison.apiUrl` template variable) so harnesses on workers can call back, for example `http://garrison-server:8700`. Never shown in A2A agent cards. Defaults to the bind address (`http://127.0.0.1:<port>` when bound to every interface). The name is kept for compatibility. Environment: `GARRISON_PUBLIC_BASE_URL` |
| `Rest.ExternalBaseUrl` | none | Live | External URL that people and clients outside the cluster use, for example `https://garrison.example.com`. Used in A2A agent cards and server info. When unset, Garrison uses the scheme (`X-Forwarded-Proto` when present) and `Host` header of each request. Environment: `GARRISON_EXTERNAL_BASE_URL` |

Garrison keeps two REST URLs because they answer different questions. `Rest.PublicBaseUrl` (with `Mcp.PublicUrl`) is where workers inside the cluster or Compose network reach the server, so it is usually a service name. `Rest.ExternalBaseUrl` is what an A2A agent card fetched from outside should advertise, so it is usually your ingress host. Earlier builds used `Rest.PublicBaseUrl` for both, so cards fetched from outside showed the internal host.

### Mcp

| Path | Default | Applies | Meaning |
|---|---|---|---|
| `Mcp.Enable` | `true` | Restart | Run the MCP listener |
| `Mcp.Hostname` | `*` | Restart | Bind address |
| `Mcp.Port` | `8701` | Restart | MCP port. Environment: `GARRISON_MCP_PORT` |
| `Mcp.Path` | `/mcp` | Restart | MCP endpoint path |
| `Mcp.PublicUrl` | none | Restart | Base URL (no path) that harnesses on workers use to reach MCP for delegation. Defaults to `http://127.0.0.1:<port>`, which only works when the worker shares the host. Environment: `GARRISON_MCP_PUBLIC_URL` |
| `Mcp.MaxMessageSize` | `16777216` | Restart | Largest MCP message in bytes, 65536 to 268435456 |
| `Mcp.MaxToolWaitSeconds` | `90` | Live | Longest a synchronous MCP invoke or A2A `SendMessage` waits, 1 to 600 |

### Database

Garrison supports Sqlite and PostgreSQL. Sqlite is fine for one control-plane replica; more than one needs PostgreSQL.

| Path | Default | Meaning |
|---|---|---|
| `Database.Type` | `Sqlite` | `Sqlite` or `Postgresql`. Environment: `GARRISON_DB_TYPE` |
| `Database.Filename` | `data/garrison.db` | Sqlite file. Environment: `GARRISON_DB_FILENAME` |
| `Database.Host` | `127.0.0.1` | PostgreSQL host. Environment: `GARRISON_DB_HOST` |
| `Database.Port` | `5432` | PostgreSQL port. Environment: `GARRISON_DB_PORT` |
| `Database.DatabaseName` | `garrison` | Database name. Environment: `GARRISON_DB_DATABASE` |
| `Database.Username` | `postgres` | User. Environment: `GARRISON_DB_USERNAME` |
| `Database.Password` | none | Password. Environment: `GARRISON_DB_PASSWORD` |
| `Database.Schema` | none | PostgreSQL schema. Environment: `GARRISON_DB_SCHEMA` |
| `Database.TablePrefix` | none | Prefix for every table name |
| `Database.ManageSchema` | `true` | Create and migrate tables at startup. When false, Garrison only checks that they exist, for environments where a DBA runs migrations |
| `Database.MaxPoolSize` | `100` | Connection pool size, 1 to 1000 |
| `Database.AdditionalOptions` | none | Appended verbatim to the provider connection string, for example `SSL Mode=Require` |

All database settings need a restart.

### Auth

| Path | Default | Applies | Meaning |
|---|---|---|---|
| `Auth.Issuer` | `garrison` | Restart | Token issuer name |
| `Auth.SigningKey` | placeholder | Restart | Key for session tokens. Changing it invalidates every token. Environment: `GARRISON_AUTH_SIGNING_KEY` |
| `Auth.TokenLifetimeMinutes` | `480` | Restart | Session token lifetime, 1 to 10080 |
| `Auth.AdminApiKey` | `garrisonadmin` | Live | System administrator key for `x-api-key`. Environment: `GARRISON_ADMIN_API_KEY` |
| `Auth.SignedRequestSkewSeconds` | `300` | Live | Allowed clock difference for signed requests, 10 to 3600 |
| `Auth.RateLimitPerMinute` | `60` | Live | Token requests allowed per source address per minute |

### Security

These seed the first boot and protect stored secrets.

| Path | Default | Meaning |
|---|---|---|
| `Security.MasterKey` | placeholder | Key that encrypts stored secrets: base64 of 32 bytes, or a passphrase. Losing it makes every secret unreadable. Environment: `GARRISON_MASTER_KEY` |
| `Security.MasterKeyVersion` | `1` | Version written with each encrypted value, 1 to 255 |
| `Security.AdminEmail` | `admin@garrison` | Email of the seeded administrator (first start only). Environment: `GARRISON_ADMIN_EMAIL` |
| `Security.AdminPassword` | `password` | Password of the seeded `admin@garrison`. Environment: `GARRISON_ADMIN_PASSWORD` |
| `Security.DefaultAccessKey`, `Security.DefaultSecretKey` | `access_garrison_default`, `secret_garrison_default_change_me` | Seeded administrator credential. Environment: `GARRISON_DEFAULT_ACCESS_KEY`, `GARRISON_DEFAULT_SECRET_KEY` |
| `Security.NodeAccessKey`, `Security.NodeSecretKey` | `access_garrison_node`, `secret_garrison_node_change_me` | Seeded worker credential. Environment: `GARRISON_NODE_ACCESS_KEY`, `GARRISON_NODE_SECRET_KEY` |

Seeding happens only when the records do not exist yet. Changing these values later does not change existing users or credentials; rotate those through the API.

### Logging, request history, telemetry, cluster

| Path | Default | Applies | Meaning |
|---|---|---|---|
| `Logging.ConsoleLogging` | `true` | Restart | Log to the console |
| `Logging.FileLogging` | `false` | Restart | Log to a file |
| `Logging.LogDirectory` | `logs/` | Restart | Log directory |
| `Logging.LogFilename` | `garrison.log` | Restart | Log file name |
| `Logging.MinimumSeverity` | `1` | Live | 0 (debug) to 7 (emergency) |
| `RequestHistory.MaxRequestBodyBytes` | `65536` | Live | Request body bytes captured per request, 0 to 1048576 |
| `RequestHistory.MaxResponseBodyBytes` | `65536` | Live | Response body bytes captured per request, 0 to 1048576 |
| `Telemetry.Enabled` | `true` | Restart | Collect metrics. Environment: `GARRISON_TELEMETRY_ENABLE` |
| `Telemetry.ServiceName` | `garrison-server` | Restart | Service name on exported metrics |
| `Telemetry.PrometheusEnable` | `true` | Restart | Serve a Prometheus scrape endpoint |
| `Telemetry.PrometheusHostname`, `Telemetry.PrometheusPort`, `Telemetry.PrometheusPath` | `*`, `9464`, `/metrics` | Restart | Where it is served |
| `Telemetry.OtlpEnable` | `false` | Restart | Export over OTLP. Environment: `GARRISON_OTLP_ENABLE` |
| `Telemetry.OtlpEndpoint` | `http://127.0.0.1:4317` | Restart | OTLP collector (gRPC). Environment: `GARRISON_OTLP_ENDPOINT` |
| `Telemetry.ServeMetricsOnServicePort` | `true` | Live | Also serve `GET /metrics` on the REST port, without authentication, relayed from the Prometheus listener, so `kubectl port-forward` and in-pod `127.0.0.1` scrapes work (see `docs/TELEMETRY.md`) |
| `Cluster.ExpectedReplicas` | `1` | Restart | Control-plane replicas you intend to run. Above 1, Garrison refuses to start on Sqlite. Environment: `GARRISON_EXPECTED_REPLICAS` |
| `Cluster.SettingsFileReadOnly` | `false` | Restart | The file is managed outside Garrison. Environment: `GARRISON_SETTINGS_READONLY` |
| `NodeId` | the host name | Restart | This replica's identifier in logs and leader election. Environment: `GARRISON_NODE_ID` |

`RequestHistory.Enabled` and `RequestHistory.RetentionDays` can be set in the file, but only as the starting values of the cluster settings of the same name.

## Cluster settings

These are stored in the database and shared by every replica. Changes apply without a restart.

| Key | Default | Range | Meaning |
|---|---|---|---|
| `Scheduling.LeaseDurationMs` | `30000` | 5000 to 600000 | How long a worker holds a run between heartbeats |
| `Scheduling.LeaseWaitMs` | `20000` | 0 to 60000 | Longest a lease long poll waits for work |
| `Scheduling.NodeHeartbeatTimeoutMs` | `20000` | 5000 to 600000 | Silence after which a node is marked lost |
| `Scheduling.EventPollMs` | `250` | 50 to 10000 | How often streaming subscribers check for new events |
| `Runs.DefaultTimeoutSeconds` | `1800` | 5 to 86400 | Run deadline when neither the deployment nor the profile sets one |
| `Runs.MaxDelegationDepth` | `3` | 0 to 10 | Deepest allowed chain of agents calling agents |
| `Runs.RetentionDays` | `30` | 1 to 3650 | How long finished runs are kept |
| `Runs.EventRetentionDays` | `14` | 1 to 3650 | How long run events are kept |
| `Runtime.FailBlockedAfterSeconds` | `0` | 0 to 604800 | How long a queued run may wait while no Ready worker can run it (its `blockedReason` is not null) before the leader fails it with outcome `NoCapableWorker`. The clock starts when the leader first sees the run blocked. `0` means wait forever |
| `Audit.RetentionDays` | `365` | 1 to 3650 | How long audit records are kept |
| `RequestHistory.Enabled` | `true` | | Capture HTTP requests |
| `RequestHistory.RetentionDays` | `30` | 1 to 3650 | How long captured requests are kept |

### Observability

These cluster settings tell Garrison where Grafana, Prometheus, Loki, and Tempo are. They are empty (not configured) by default, accept only absolute `http` or `https` URLs (a trailing slash is removed), and apply live. Each has an environment variable; when the variable is set on the server it wins, the setting shows source `Environment`, and the settings API refuses to change it.

| Key | Environment variable | Meaning |
|---|---|---|
| `Observability.GrafanaUrl` | `GARRISON_GRAFANA_URL` | Grafana URL as a browser reaches it. Enables the Grafana card and every deep link (trace, logs, dashboards) |
| `Observability.PrometheusUrl` | `GARRISON_PROMETHEUS_URL` | Prometheus URL as a browser reaches it |
| `Observability.LokiUrl` | `GARRISON_LOKI_URL` | Loki URL as a browser reaches it |
| `Observability.TempoUrl` | `GARRISON_TEMPO_URL` | Tempo URL as a browser reaches it |
| `Observability.GrafanaInternalUrl` | `GARRISON_GRAFANA_INTERNAL_URL` | URL the server uses to check Grafana, for example `http://garrison-grafana:3000`. Empty uses `Observability.GrafanaUrl` |
| `Observability.PrometheusInternalUrl` | `GARRISON_PROMETHEUS_INTERNAL_URL` | URL the server uses to check Prometheus. Empty uses `Observability.PrometheusUrl` |
| `Observability.LokiInternalUrl` | `GARRISON_LOKI_INTERNAL_URL` | URL the server uses to check Loki. Empty uses `Observability.LokiUrl` |
| `Observability.TempoInternalUrl` | `GARRISON_TEMPO_INTERNAL_URL` | URL the server uses to check Tempo. Empty uses `Observability.TempoUrl` |

A service counts as configured when its browser URL is set. The browser URLs appear in `GET /v1.0/api/server-info`, and `GET /v1.0/api/observability/status` reports whether each one answers (see `docs/TELEMETRY.md`).

## The settings API

`GET /v1.0/api/settings` returns every node and cluster setting with its value, description, type, whether it is a secret (secrets show `********` and `isSet`), its source (`File`, `Environment`, `ConfigMap`, or `Database`), its `applyMode` (`Live` or `RestartRequired`), and whether it is editable. The response also says which file was loaded, whether it is writable, and whether a restart is pending.

```bash
curl -s -X PUT http://127.0.0.1:8700/v1.0/api/settings \
  -H "x-api-key: garrisonadmin" -H "Content-Type: application/json" \
  -d '{"values":[{"path":"Runs.MaxDelegationDepth","value":"2"},{"path":"Logging.MinimumSeverity","value":"0"}]}'
```

The whole request is validated first, and any rejected value fails it with 400 and per-field messages. File settings are written back to the settings file; on a multi-replica cluster each replica has its own file, so prefer environment variables or a ConfigMap for those. `POST /v1.0/api/settings/restart` exits the process so Kubernetes (or your supervisor) starts it again. Every settings route needs a system administrator.

## Worker settings file

The worker reads `garrison-worker.json` from its working directory, or the path in `GARRISON_WORKER_SETTINGS_FILE`, and writes a default file there if none exists.

| Property | Default | Meaning |
|---|---|---|
| `ServerUrl` | `http://127.0.0.1:8700` | Control-plane REST URL. Environment: `GARRISON_WORKER_SERVER_URL` |
| `NodeName` | `HOSTNAME`, then the machine name | Must be unique; in Kubernetes it is the pod name. Environment: `GARRISON_WORKER_NODE_NAME` |
| `AccessKey`, `SecretKey` | the seeded node credential | Credential with the NodeAgent role. Environment: `GARRISON_WORKER_ACCESS_KEY`, `GARRISON_WORKER_SECRET_KEY` |
| `Labels` | `garrison.io/pool=default` | Labels matched by deployment node selectors. Environment: `GARRISON_WORKER_LABELS` as `key=value,key=value`, added to the file's labels |
| `NodePool` | the default pool | Pool name. Environment: `GARRISON_WORKER_NODE_POOL` |
| `MaxConcurrentRuns` | `4` | Runs at once, 1 to 256. Environment: `GARRISON_WORKER_MAX_CONCURRENT_RUNS` |
| `WorkRoot` | `workspaces` | Root of per-run workspace, home, and config directories. Environment: `GARRISON_WORKER_WORK_ROOT` |
| `HealthHostname`, `HealthPort` | `*`, `8710` | Health listener. Environment: `GARRISON_WORKER_HEALTH_PORT` |
| `HeartbeatIntervalMs` | `5000` | Heartbeat interval; the server can override it at registration |
| `LeaseWaitMs` | `20000` | Lease long-poll wait; the server can override it at registration |
| `EventFlushIntervalMs` | `250` | How often buffered events are sent |
| `EventBatchSize` | `100` | Events per batch |
| `MaxBufferedEvents` | `20000` | Events kept per run while the control plane is unreachable; beyond this the oldest text events are dropped |
| `DrainTimeoutSeconds` | `900` | On shutdown, how long to let running runs finish before cancelling them |
| `CompletionRetrySeconds` | `600` | How long to keep retrying a completion report |
| `ProbeIntervalSeconds` | `600` | How often to re-check which harnesses are installed; 0 disables it |
| `McpPreflightTimeoutMs` | `20000` | Per-server MCP pre-flight timeout |
| `EnvironmentAllowlist` | `PATH`, `LANG`, `LC_ALL`, `TZ`, `USER`, temp directories, `DOTNET_ROOT`, certificate and proxy variables, and Windows system variables | Variables copied from the worker's own environment into each harness. Everything else starts empty |
| `Probes` | `claude`, `codex`, `mux`, `gemini`, `garrison-fake-harness`, each with `--version` | Harness checks run at startup. An available harness adds the label `garrison.io/harness-<label>=true` |
| `Logging.ConsoleLogging`, `Logging.MinimumSeverity` | `true`, `1` | Logging |
| `Telemetry` | service `garrison-worker`, Prometheus on `*:9465/metrics`, OTLP off, `/metrics` also served on the health port | Same fields as the server's `Telemetry` block; `ServeMetricsOnServicePort` applies to the health listener. Environment: `GARRISON_WORKER_TELEMETRY_ENABLE`, `GARRISON_WORKER_PROMETHEUS_PORT`, `GARRISON_WORKER_OTLP_ENABLE`, `GARRISON_WORKER_OTLP_ENDPOINT` |

The environment allowlist is a security boundary: credentials in the worker's environment never reach a harness unless you add them here. The supported way to give a harness a key is a Garrison secret mapped in the harness profile or deployment (see `docs/HARNESSES.md`).

## Dashboard

The dashboard image reads two variables at startup: `GARRISON_API_UPSTREAM`, where nginx proxies `/v1.0` and `/openapi.json` (default `http://garrison-server:8700`), and `GARRISON_API_URL`, the API URL the browser should call directly (empty means the same origin, through the proxy). For local development, `npm run dev` proxies to `http://127.0.0.1:8700`.
