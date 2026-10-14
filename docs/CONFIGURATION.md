# Configuration

Garrison has three layers of configuration, and it helps to know which one a value lives in before you go looking for it.

| Layer | Where it lives | Scope | How it changes |
|---|---|---|---|
| Node settings | A JSON file per process, overridden by environment variables | One control-plane or worker process | Edit the file or the environment, or use the settings API for the control plane; most need a restart |
| Cluster settings | The database | Every control-plane replica | Settings API or dashboard; applied live on every replica, at once through the event backplane and within about three seconds at worst |
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
| `Rest.LivenessPort` | `8702` | Restart | Separate liveness port, 0 to 65535 (0 turns it off). It answers only `GET /v1.0/api/health/live`, from its own thread, from the moment the process starts, without the database or the REST request queue, so liveness probes keep passing under overload. Must differ from `Rest.Port` and `Mcp.Port`. Environment: `GARRISON_LIVENESS_PORT` |
| `Rest.DatabaseRetryAfterSeconds` | `2` | Live | Seconds in the `Retry-After` header of `503 DatabaseBusy` and `503 DatabaseUnavailable` answers, 1 to 300 |

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
| `Mcp.SessionIdleTimeoutSeconds` | `3600` | Live | Idle time after which an MCP session expires on every replica, 60 to 604800 |
| `Mcp.InternalPort` | `0` | Restart | Loopback port of the internal Voltaic endpoint. Garrison serves `Mcp.Port` itself and relays to this port so that MCP sessions work on every replica (see `docs/SCALING.md`). 0 picks a free port at startup; set it only if something on the host needs a fixed port |

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
| `Database.MaxPoolSize` | `100` | Most pooled connections per replica, 1 to 1000. The shipped `garrison.json` files (Kubernetes, Helm, Docker Compose) set 40, and the production overlay and Helm production values set 20 through the environment. Environment: `GARRISON_DB_MAX_POOL_SIZE` |
| `Database.MinPoolSize` | `0` | Connections each replica keeps open while idle (PostgreSQL), 0 to 1000. Environment: `GARRISON_DB_MIN_POOL_SIZE` |
| `Database.ConnectionTimeoutSeconds` | `15` | How long to wait for a pooled connection before failing (PostgreSQL), 1 to 600. Environment: `GARRISON_DB_CONNECTION_TIMEOUT` |
| `Database.CommandTimeoutSeconds` | `30` | How long one command may run (PostgreSQL), 0 (no limit) to 3600. Environment: `GARRISON_DB_COMMAND_TIMEOUT` |
| `Database.ConnectionIdleLifetimeSeconds` | `300` | How long an idle pooled connection is kept (PostgreSQL), 1 to 3600 |
| `Database.AdditionalOptions` | none | Appended verbatim to the provider connection string, for example `SSL Mode=Require` |

All database settings need a restart. Size the pool so that `max_connections >= maxReplicas x (Database.MaxPoolSize + 2) + 13`: the 2 are the listen connection for the PostgreSQL backplane and the short-lived startup lock connection, and the 13 are PostgreSQL's reserved connections plus room for the bootstrap Job and operators. `docs/SCALING.md` has the table for each shipped configuration. When the pool is exhausted anyway, requests answer `503 DatabaseBusy` with `Retry-After` instead of failing with a 500.

### Auth

| Path | Default | Applies | Meaning |
|---|---|---|---|
| `Auth.Issuer` | `garrison` | Restart | Token issuer name |
| `Auth.SigningKey` | placeholder | Restart | Key for session tokens. Changing it invalidates every token. Environment: `GARRISON_AUTH_SIGNING_KEY` |
| `Auth.TokenLifetimeMinutes` | `480` | Restart | Session token lifetime, 1 to 10080 |
| `Auth.AdminApiKey` | `garrisonadmin` | Live | System administrator key for `x-api-key`. Environment: `GARRISON_ADMIN_API_KEY` |
| `Auth.SignedRequestSkewSeconds` | `300` | Live | Allowed clock difference for signed requests, 10 to 3600 |
| `Auth.RateLimitPerMinute` | `60` | Live | Token requests allowed per source address per minute, counted in the database across all replicas |
| `Auth.PasswordHashIterations` | `600000` | Live | PBKDF2-HMAC-SHA256 iterations for new password hashes, 10000 to 10000000. Existing hashes with fewer iterations, and legacy SHA-256 hashes, are rehashed at the next successful sign-in. Values below the default are for tests |

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
| `Telemetry.MaxLabelValues` | `200` | Restart | Distinct values each metric label (tenant, agent, deployment, model, and so on) may take before new values are reported as `other`; 10 to 10000. Environment: `GARRISON_TELEMETRY_MAX_LABEL_VALUES` |
| `Telemetry.Exemplars` | `true` | Restart | Attach the current trace to duration histogram samples, so Grafana can jump from a panel to the trace (sets `OTEL_METRICS_EXEMPLAR_FILTER=trace_based` unless it is set) |
| `Cluster.ExpectedReplicas` | `1` | Restart | Control-plane replicas you intend to run. Above 1, Garrison refuses to start on Sqlite. Environment: `GARRISON_EXPECTED_REPLICAS` |
| `Cluster.SettingsFileReadOnly` | `false` | Restart | The file is managed outside Garrison. Environment: `GARRISON_SETTINGS_READONLY` |
| `Cluster.Backplane` | `Auto` | Restart | How replicas tell each other about run changes, new work, and cache invalidations: `Auto` (PostgreSQL LISTEN/NOTIFY on PostgreSQL, `Local` on Sqlite), `Local` (none), `Polling` (a table every replica polls; works on both providers), or `PostgresNotify`. Environment: `GARRISON_BACKPLANE` |
| `Cluster.BackplanePollMs` | `250` | Restart | Poll interval of the `Polling` backplane, 50 to 10000 |
| `Archive.Directory` | none | Restart | Directory that receives JSON Lines archives of runs and events before retention deletes them; empty deletes without archiving. With several replicas, mount one shared volume at this path in each. Environment: `GARRISON_ARCHIVE_DIRECTORY` |
| `NodeId` | the host name | Restart | This replica's identifier in logs and leader election. Environment: `GARRISON_NODE_ID` |

`RequestHistory.Enabled` and `RequestHistory.RetentionDays` can be set in the file, but only as the starting values of the cluster settings of the same name.

### Codex

How the control plane refreshes ChatGPT logins stored in `CodexAuthJson` secrets (G-22; see `docs/HARNESSES.md`, ChatGPT logins). Every value applies live.

| Path | Default | Applies | Meaning |
|---|---|---|---|
| `Codex.RefreshBeforeExpirySeconds` | `86400` | Live | Refresh a login when its access token expires within this many seconds, 300 to 2592000. For a token that lives less than twice this long, half its lifetime is used instead. Keep it above `Runtime.MaxRunSeconds` so that the token a run receives outlives the run. Environment: `GARRISON_CODEX_REFRESH_BEFORE_EXPIRY_SECONDS` |
| `Codex.RefreshCheckIntervalSeconds` | `900` | Live | How often the leader checks every active `CodexAuthJson` secret and refreshes the ones near expiry, so idle logins do not lapse, 0 to 86400. `0` turns the background check off; runs still refresh the logins they use |
| `Codex.RefreshTimeoutSeconds` | `15` | Live | Longest one refresh request may take, 5 to 300. The refresh happens while a run is handed to a worker, and a run waiting on another replica's refresh waits up to this plus 5 seconds, so keep it well below `Scheduling.LeaseDurationMs` |
| `Codex.TokenEndpoint` | `https://auth.openai.com/oauth/token` | Live | OAuth token endpoint, the one the Codex CLI uses. Empty restores the default. Environment: `GARRISON_CODEX_TOKEN_ENDPOINT` |
| `Codex.ClientId` | `app_EMoamEEZ73f0CkXaXp7hrann` | Live | OAuth client identifier sent with each refresh, the Codex CLI's client. It must match the client the login was issued to. Empty restores the default. Environment: `GARRISON_CODEX_CLIENT_ID` |

## Cluster settings

These are stored in the database and shared by every replica. Changes apply without a restart.

| Key | Default | Range | Meaning |
|---|---|---|---|
| `Scheduling.LeaseDurationMs` | `30000` | 5000 to 600000 | How long a worker holds a run between heartbeats |
| `Scheduling.LeaseWaitMs` | `20000` | 0 to 60000 | Longest a lease long poll waits for work |
| `Scheduling.NodeHeartbeatTimeoutMs` | `20000` | 5000 to 600000 | Silence after which a node is marked lost |
| `Scheduling.EventPollMs` | `250` | 50 to 10000 | How often streaming subscribers check for new events |
| `Scheduling.InvocationWaitPollMs` | `5000` | 250 to 60000 | How often a synchronous invocation (`invoke?wait=true`, MCP `garrison_invoke_agent`, blocking A2A `message/send`) re-reads its run if no completion signal has arrived. Waiters wake as soon as their run finishes on any replica, so this is only a safety net; event batches do not wake them |
| `Scheduling.PauseGraceMs` | `5000` | 1000 to 600000 | Pause tolerance. When a leader maintenance tick comes more than the maintenance interval (2 seconds) plus this long after the previous one, or a pass stalls this long between two steps, the leader treats it as a pause (host sleep, frozen VM, clock jump). It then expires no leases, enforces no deadlines, marks no node `Lost` and no control node `Offline`, and fails no blocked run until one heartbeat window (the larger of the worker and control-plane heartbeat intervals) plus this grace has passed since the resume: 10 seconds with the defaults. Keep it above your slowest maintenance query. See `docs/SCALING.md`, "Pauses" |
| `Runs.DefaultTimeoutSeconds` | `1800` | 5 to 86400 | Run deadline when neither the deployment nor the profile sets one |
| `Runs.MaxDelegationDepth` | `3` | 0 to 10 | Deepest allowed chain of agents calling agents |
| `Runs.DelegationChildQueueDepth` | `100` | 1 to 100000 | Most queued delegated runs whose parent waits on them, across the cluster. A run that starts waiting on another delegated run beyond this fails at once with `DelegationCapacityExhausted`. See `docs/SCALING.md`, "Delegation capacity" |
| `Runs.DelegationRetryAfterSeconds` | `5` | 1 to 300 | Seconds in the `Retry-After` header of a REST `DelegationCapacityExhausted` (429) answer |
| `Runs.RetentionDays` | `30` | 1 to 3650 | How long finished runs are kept |
| `Runs.EventRetentionDays` | `14` | 1 to 3650 | How long run events are kept. With `Archive.Directory` set, removed runs and events are archived first (see `docs/SCALING.md`) |
| `Runtime.MaxRunSeconds` | `3600` | 60 to 604800 | Cap on every run's deadline. A run's timeout (deployment `timeoutSeconds`, a per-run `timeoutSeconds` override, or the profile default) is lowered to this when it is larger, and the leader times out any run that started longer ago than this plus the deadline grace |
| `Runtime.RepetitionGuard` | `true` | | Default run guard for deployments that leave `repetitionGuard` null: the worker stops a run with outcome `RepetitionDetected` when its last 2,000 characters of assistant text are one unit of 1 to 64 characters repeated at least 30 times, or its last 1,000 characters contain no letter or digit |
| `Runtime.MaxAssistantChars` | `200000` | 0 to 100000000 | Default for deployments that leave `maxAssistantChars` null: characters of assistant text after which the worker stops a run with outcome `OutputLimitExceeded`. `0` is unlimited |
| `Runtime.NoProgressSeconds` | `300` | 0 to 86400 | Default for deployments that leave `noProgressSeconds` null: seconds without assistant text, thinking, a tool call, or a tool result, while no tool call is open, after which the worker stops a run with outcome `NoProgress`. `0` turns the guard off |
| `Runtime.FailBlockedAfterSeconds` | `0` | 0 to 604800 | How long a queued run may wait while no Ready worker can run it (its `blockedReason` is not null) before the leader fails it with outcome `NoCapableWorker`. The clock starts when the leader first sees the run blocked. `0` means wait forever |
| `Runtime.ConversationAffinityWaitMs` | `30000` | 0 to 600000 | How long a conversation turn waits for the node that holds the conversation's harness session. Other nodes leave the turn queued for this long while that node is Ready, then take it and start a fresh session seeded with the transcript (a fallback). They take it at once when the node is not Ready. `0` never waits |
| `Runtime.ConversationTranscriptTurns` | `20` | 1 to 200 | Most earlier turns repeated to a fallback turn; the newest are kept |
| `Runtime.ConversationTranscriptChars` | `4000` | 200 to 200000 | Most characters of each earlier input and answer repeated to a fallback turn; longer ones are cut and marked |
| `Runtime.PipelineSweepIntervalMs` | `5000` | 500 to 600000 | How often the leader sweeps pipeline runs: it advances pipeline runs whose stage finished without a completion hook (for example on a replica that stopped), links stage runs that were claimed but not linked, retries stage starts refused for a transient reason (such as `QuotaExceeded`), applies stage review timeouts and pipeline deadlines, and cancels stage runs left under finished pipeline runs |
| `Runtime.PipelineMaxStages` | `20` | 1 to 100 | Most stages a pipeline may have; creating or updating a pipeline (REST or a `Pipeline` manifest) with more fails validation |
| `ControlPlane.HeartbeatIntervalMs` | `5000` | 1000 to 60000 | How often each control-plane replica heartbeats its row in `control_nodes` (status, activity counters) |
| `ControlPlane.OfflineAfterMs` | `30000` | 5000 to 600000 | Silence after which the leader marks a control-plane replica `Offline`. Keep it several heartbeat intervals long |
| `ControlPlane.OfflineRetentionHours` | `24` | 1 to 8760 | How long an `Offline` control-plane replica stays listed (counted from its last heartbeat) before the leader deletes its row |
| `Audit.RetentionDays` | `365` | 1 to 3650 | How long audit records are kept |
| `RequestHistory.Enabled` | `true` | | Capture HTTP requests |
| `RequestHistory.CaptureNodeProtocol` | `false` | | Also capture successful worker node protocol calls (`/v1.0/api/node/...`: lease, watch, heartbeat, events, started, complete). Each run makes dozens of them, so they are left out by default; failed node calls are captured either way, and calls a worker abandoned (its cancellation watch) are not failures |
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
| `ChildReserveSlots` | `2` | Child reserve, 0 to 64: extra slots that only a delegated run whose parent waits on it may use. One opens for each of this worker's runs that is waiting on a child, so waiting parents lend their slots to children. The worker runs at most `MaxConcurrentRuns` plus this many processes; size its memory for that. `0` turns lending off, and then at most `MaxConcurrentRuns - 1` runs may wait at once. Environment: `GARRISON_WORKER_CHILD_RESERVE_SLOTS` |
| `MaxResidentWaiters` | `0` | Most runs on this worker that may wait on a delegated run at once while keeping their process, 0 to 1024; `0` means `MaxConcurrentRuns`. The control plane also never lets more than `MaxConcurrentRuns + ChildReserveSlots - 1` wait. A delegation beyond it fails at once with `DelegationCapacityExhausted`. Environment: `GARRISON_WORKER_MAX_RESIDENT_WAITERS` |
| `WorkRoot` | `workspaces` | Root of per-run workspace, home, and config directories. Conversation turns use `<WorkRoot>/conversations/<conversationId>/` instead, kept between turns. Environment: `GARRISON_WORKER_WORK_ROOT` |
| `ConversationRetentionHours` | `24` | Hours a conversation's directories may go unused before the worker deletes them, 0 to 8760; `0` keeps them until the work root is emptied. The next turn of a removed conversation starts a fresh session seeded with the transcript. Environment: `GARRISON_WORKER_CONVERSATION_RETENTION_HOURS` |
| `ConversationSweepIntervalSeconds` | `600` | How often the worker looks for unused conversation directories, 10 to 86400 |
| `HealthHostname`, `HealthPort` | `*`, `8710` | Health listener. Environment: `GARRISON_WORKER_HEALTH_PORT` |
| `HeartbeatIntervalMs` | `5000` | Heartbeat interval; the server can override it at registration |
| `PauseGraceMs` | `5000` | Pause tolerance, 1000 to 600000. When the heartbeat loop finds that more than its sleep plus this long passed (host sleep, frozen container, clock jump), it logs a Warning (`event=worker.pause`) and heartbeats at once, which renews every lease it holds |
| `LeaseWaitMs` | `20000` | Lease long-poll wait; the server can override it at registration |
| `EventFlushIntervalMs` | `250` | How often buffered events are sent |
| `EventTextCoalesceMaxChars` | `2048` | Merge consecutive `AssistantText` or `Thinking` deltas within one flush window, up to this character count (0 to 1048576); `0` disables merging. Larger individual events remain intact. Environment: `GARRISON_WORKER_EVENT_TEXT_COALESCE_MAX_CHARS` |
| `EventBatchSize` | `100` | Stored events per batch after text merging |
| `MaxBufferedEvents` | `20000` | Events kept per run while the control plane is unreachable; beyond this the oldest text events are dropped |
| `DrainTimeoutSeconds` | `900` | On shutdown, how long to let running runs finish before cancelling them |
| `CompletionRetrySeconds` | `600` | How long to keep retrying a completion report |
| `ProbeIntervalSeconds` | `600` | How often to re-check which harnesses are installed; 0 disables it |
| `McpPreflightTimeoutMs` | `20000` | Per-server MCP pre-flight timeout |
| `EnvironmentAllowlist` | `PATH`, `LANG`, `LC_ALL`, `TZ`, `USER`, temp directories, `DOTNET_ROOT`, certificate and proxy variables, and Windows system variables | Variables copied from the worker's own environment into each harness. Everything else starts empty |
| `Probes` | `claude`, `codex`, `mux`, `gemini`, `garrison-fake-harness`, each with `--version` | Harness checks run at startup. An available harness adds the label `garrison.io/harness-<label>=true` |
| `Kubernetes` | disabled | The KubernetesJob (pod-per-run) executor: `Enabled`, `RunNamespace`, `RunImage`, `ImagePullPolicy`, `ImagePullSecrets`, `ServiceAccountName`, `RuntimeClassName`, `NodeSelector`, `PodLabels`, `JobTtlSeconds`, `PendingTimeoutSeconds`, `DefaultResources`, `RunAsUser`, `RunAsGroup`, `EmptyDirSizeLimit`, `EgressCanary`, `ReconcileIntervalSeconds`, and more. Environment: `GARRISON_WORKER_KUBERNETES_ENABLED` and `GARRISON_WORKER_RUN_*`. Every field is described in `docs/KUBERNETES.md`, "Pod-per-run executor" |
| `Logging.ConsoleLogging`, `Logging.MinimumSeverity` | `true`, `1` | Logging |
| `Telemetry` | service `garrison-worker`, Prometheus on `*:9465/metrics`, OTLP off, `/metrics` also served on the health port | Same fields as the server's `Telemetry` block; `ServeMetricsOnServicePort` applies to the health listener. Environment: `GARRISON_WORKER_TELEMETRY_ENABLE`, `GARRISON_WORKER_PROMETHEUS_PORT`, `GARRISON_WORKER_OTLP_ENABLE`, `GARRISON_WORKER_OTLP_ENDPOINT`, `GARRISON_WORKER_TELEMETRY_MAX_LABEL_VALUES` |

The environment allowlist is a security boundary: credentials in the worker's environment never reach a harness unless you add them here. The supported way to give a harness a key is a Garrison secret mapped in the harness profile or deployment (see `docs/HARNESSES.md`).

## Dashboard

The dashboard image reads two variables at startup: `GARRISON_API_UPSTREAM`, where nginx proxies `/v1.0` and `/openapi.json` (default `http://garrison-server:8700`), and `GARRISON_API_URL`, the API URL the browser should call directly (empty means the same origin, through the proxy). For local development, `npm run dev` proxies to `http://127.0.0.1:8700`.

## Operator model prices

Use Configuration > Model Prices or the tenant `/model-prices` API to supply USD rates per million tokens. The table starts empty. Entries match a harness and exact, case-sensitive served model; no provider aliases or prices are supplied automatically. Reported cost, including zero, takes precedence. Unknown or inactive prices keep missing cost unknown.

Both token inclusion flags default to true. Disable input inclusion for Claude Code because its parser reports cache reads separately. Empty cache/reasoning rates use input/output rates; zero is free. Included subtotals are deducted before applying their own rates. Completion stores the estimate once; later edits do not change historical run costs. See [REST API](../REST_API.md#model-prices) for fields and permissions.

## Daily usage quotas

Configuration > Usage Quotas sets run, token, known-cost, and active-concurrency limits for a tenant, agent, or deployment. Each scope/target has one entry. Limits start unlimited; zero disallows usage. Administrators manage limits, and read roles can inspect Daily usage.

Windows reset at midnight UTC. Run counts use admission day; tokens and cost use completion day. Active concurrency spans days. Deleted and archived runs remain in the accounting ledger. Missing cost leaves admissions open and appears as incomplete accounting; known cost still enforces the configured limit.

The compiler lowers `deployment.maxBudgetUsd` to the remaining known allowance. Built-in Claude Code passes it to its CLI; other profiles must support and render that value. In-flight runs can overshoot completed-usage limits. See [REST API](../REST_API.md#usage-quotas) for fields, ranges, permissions, and error handling.

Quota enforcement is optional and off by default: set `enforcementEnabled: true` on an active Usage Quota to enforce its limits. Otherwise it only reports usage and never alters admission, claims, or harness budgets. Existing quotas upgrade to monitoring-only in migration 16. Delegation-tree budgeting is outside the current scope.

## Artifact collection

Deployments may set `artifactStoreId` and explicit `artifactGlobs`, for example `["reports/**/*.json"]`. Empty globs disable collection. See [Run artifacts](ARTIFACTS.md) for filesystem/S3 configuration, limits, downloads, and API examples.

## Optional coordination provider

`Leases.Provider` defaults to `Database`. Selecting `Clutch` adds an external coordination gate for leadership and credential refresh, with durable database fencing retained. Configure all replicas consistently and restart them. See [Clutch leases](CLUTCH_LEASES.md) for settings, environment overrides, failure behavior, and the temporary-service verification command.
