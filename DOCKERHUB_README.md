<p align="center">
  <img src="https://raw.githubusercontent.com/jchristn/Garrison/main/assets/logo.png" alt="Garrison" width="160" height="160" />
</p>

# Garrison

> **Alpha (v0.2.0).** A 0.x version means alpha: APIs, schema, settings, and image layout can change without notice.

**Build, deploy, and run agentic apps on the agent harnesses you already use.** Garrison is a self-hosted, multi-tenant platform for agentic applications. Its runtime turns Claude Code, Codex, Gemini CLI, Mux, opencode, pi, provider APIs, and any command-line agent into managed services on pull-based workers, reachable over REST, MCP, and A2A. Garrison Agent Studio, new in 0.2.0, sits on top: an architect agent drafts apps with you, you review the diff and try the draft in a playground, a person approves it, and the app goes live at its own URL with a branded chat UI for its end users.

The release covers the whole loop. **Build** with the agent architect, versioned agent assets, and a capability catalog. **Test** in the playground against draft revisions. **Deploy** through approvals into `dev`, then promote to `staging` and `prod` with rollback. **Run and scale** on leased workers with Process or KubernetesJob executors, fan-out and gather, and conversation file spaces. **Operate** apps with RBAC, quotas, triggers, and notifications. **Observe** runs, run trees, transcripts, metrics, traces, and Grafana dashboards.

- Website: [usegarrison.ai](https://usegarrison.ai)
- Source and documentation: [github.com/jchristn/Garrison](https://github.com/jchristn/Garrison) ([docs index](https://github.com/jchristn/Garrison/blob/main/docs/README.md), [Agent Studio](https://github.com/jchristn/Garrison/blob/main/docs/STUDIO.md), [agent architect](https://github.com/jchristn/Garrison/blob/main/docs/ARCHITECT.md), [agentic apps](https://github.com/jchristn/Garrison/blob/main/docs/APPS.md), [changelog](https://github.com/jchristn/Garrison/blob/main/CHANGELOG.md))

## Images

| Image | Contents | Ports |
|---|---|---|
| `jchristn77/garrison-server` | Control plane: REST, A2A, WebSocket, MCP, app gateway, scheduler | 8700 (REST, A2A, WebSocket, app gateway), 8701 (MCP), 9464 (Prometheus) |
| `jchristn77/garrison-worker` | Worker node with Claude Code, Codex, Mux, the provider API harness, and the fake test harness installed | 8710 (health), 9465 (Prometheus) |
| `jchristn77/garrison-dashboard` | nginx serving the React operator console at `/` and the end-user app UI at `/apps/{slug}/`, proxying `/v1.0` to the server | 80 |

Each image is published under version tags such as `v0.2.0` and under `latest`:

| Tag | Meaning |
|---|---|
| `v0.2.0` | The Agent Studio release. Pin this in anything you keep |
| `latest` | The most recent release, currently `v0.2.0` |

All three images are built for `linux/amd64` and `linux/arm64/v8`. Server and worker run as UID 10001; the dashboard runs nginx. Use the same tag for all three: the server, worker, and dashboard of one release are tested together, and the Compose file and Kubernetes manifests in the repository reference `v0.2.0` for each.

The worker records its bundled harness versions in labels (`io.garrison.harness.claude-code`, `io.garrison.harness.codex`, `io.garrison.harness.mux`, `io.garrison.harness.mux-ref`, `io.garrison.harness.gemini-cli`, `io.garrison.harness.opencode`, `io.garrison.harness.pi`, `io.garrison.tools.docs`). The `v0.2.0` worker pins Claude Code 2.1.296, Codex 0.159.3, and Mux 1.3.0.

### Building a worker with more tools

The published worker is the default build. Gemini CLI, opencode, pi, and the document tools are off by default and can be added by building the worker from the repository with build arguments:

| Build argument | Default | Installs |
|---|---|---|
| `INCLUDE_GEMINI` | `false` | Gemini CLI (`GEMINI_CLI_VERSION`, default 0.55.1) |
| `INCLUDE_OPENCODE` | `false` | opencode (`OPENCODE_VERSION`, default 1.19.5) |
| `INCLUDE_PI` | `false` | pi coding agent (`PI_VERSION`, default 1.4.0) |
| `INCLUDE_DOC_TOOLS` | `false` | pandoc, headless LibreOffice Writer, and fonts, for document conversion agents such as the doc-converter example |

```bash
git clone https://github.com/jchristn/Garrison && cd Garrison
docker build -f src/Garrison.Worker/Dockerfile --build-arg INCLUDE_DOC_TOOLS=true --build-arg INCLUDE_OPENCODE=true \
  -t my-registry/garrison-worker:v0.2.0-tools .
```

Workers report the tools they find, so runs that need pandoc or LibreOffice go only to workers built with them, and wait with `blockedReason` `NoToolWorker` until one is Ready. See [capabilities](https://github.com/jchristn/Garrison/blob/main/docs/CAPABILITIES.md) and [harnesses](https://github.com/jchristn/Garrison/blob/main/docs/HARNESSES.md).

## Docker Compose

The repository's `docker/` directory runs one server, two workers, the dashboard, PostgreSQL, and Prometheus, Grafana, Tempo, Loki, and Alloy. Its update script generates keys and passwords into `docker/.env`; provider credentials are optional and enable the matching sample deployments.

```bash
git clone https://github.com/jchristn/Garrison && cd Garrison/docker
./update.sh --pull        # pull the v0.2.0 images and start the stack; without --pull it builds them from the checkout
```

Open http://127.0.0.1:8080 and sign in to tenant `default` as `admin@garrison` with the password `update.sh` printed (`GARRISON_ADMIN_PASSWORD` in `docker/.env`). Allow 8 GB of Docker memory and about 10 GB of disk as a starting point; harness workloads and telemetry retention can need more. See [docs/DOCKER.md](https://github.com/jchristn/Garrison/blob/main/docs/DOCKER.md).

### A first app in the studio

With the stack up, this builds a one-agent app on the fake harness, so no model credentials are needed. Run it from the repository root:

```bash
API=http://127.0.0.1:8700/v1.0/api/tenants/default
GARRISON_ADMIN_PASSWORD=$(grep -E '^GARRISON_ADMIN_PASSWORD=' docker/.env | cut -d= -f2-)
TOKEN=$(jq -n --arg p "$GARRISON_ADMIN_PASSWORD" '{email:"admin@garrison",password:$p,tenantId:"default"}' |
  curl -s -X POST http://127.0.0.1:8700/v1.0/token -H "Content-Type: application/json" --data-binary @- | jq -r .token)
D=$API/studio/drafts
DRAFT=$(curl -s -X POST $D -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"title":"Help desk"}' | jq -r .id)
put() { curl -s -X PUT "$D/$DRAFT/items/$1/$2" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "$(jq -n --argjson v "$3" --arg doc "$4" '{version:$v,document:$doc}')" | jq -r .version; }
V=$(put Agent desk-entry 1 $'apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: desk-entry\nspec:\n  displayName: Help desk\n')
V=$(put Deployment desk-entry-dev $V $'apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: desk-entry-dev\nspec:\n  agent: desk-entry\n  harnessProfile: builtin/fake\n  environment: dev\n')
V=$(put AgenticApp desk $V $'apiVersion: garrison/v1\nkind: AgenticApp\nmetadata:\n  name: desk\nspec:\n  entry: desk-entry\n  members:\n    - { agent: desk-entry }\n  environments:\n    - { environment: dev, deployment: desk-entry-dev }\n  liveEnvironment: dev\n  authMode: Anonymous\n  anonymousEnabled: true\n')
APPROVAL=$(curl -s -X POST $D/$DRAFT/request-apply -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"version\":$V}" | jq -r .id)
curl -s -X POST $API/approvals/$APPROVAL/decide -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"decision":"Allow"}' | jq -r .status
```

Approving the `DraftApply` approval applies the draft and deploys it to `dev`. Open http://127.0.0.1:8080/apps/desk/ and send a message. The [quickstart](https://github.com/jchristn/Garrison/blob/main/docs/QUICKSTART.md) continues with the playground and promotion, and the [example apps](https://github.com/jchristn/Garrison/blob/main/examples/agentic-apps/README.md) include a research app that fans out to two researchers and hands back a PDF.

## Kubernetes

The repository's `k8s/` directory has a Kustomize base with overlays for minikube, K3S, and production, a Helm chart, and scripts that generate secrets, deploy, smoke-test, and port-forward. The supplied ingresses send `/v1.0` to the server and everything else to the dashboard, which covers both the app gateway (`/v1.0/apps/`) and the app UI (`/apps/`). See [docs/KUBERNETES.md](https://github.com/jchristn/Garrison/blob/main/docs/KUBERNETES.md).

## Trying it with plain Docker

The containers below use Sqlite and a user-defined network, which is enough to see a run go end to end. The server has no usable default keys or passwords: it refuses to start while any of them is empty or a public built-in default (unless `GARRISON_ALLOW_INSECURE_DEFAULTS=true`, which is for local development only), so generate them first and keep them.

```bash
docker network create garrison
rand() { openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c "$1"; }
MASTER_KEY=$(openssl rand -base64 32); SIGNING_KEY=$(rand 48); ADMIN_API_KEY=$(rand 40); ADMIN_PASSWORD=$(rand 20)
DEFAULT_SECRET_KEY=secret_$(rand 48); NODE_ACCESS_KEY=access_$(rand 32); NODE_SECRET_KEY=secret_$(rand 48)

docker run -d --name garrison-server --network garrison \
  -v garrison-server-data:/app/data \
  -p 127.0.0.1:8700:8700 -p 127.0.0.1:8701:8701 \
  -e GARRISON_MASTER_KEY="$MASTER_KEY" -e GARRISON_AUTH_SIGNING_KEY="$SIGNING_KEY" \
  -e GARRISON_ADMIN_API_KEY="$ADMIN_API_KEY" -e GARRISON_ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  -e GARRISON_DEFAULT_SECRET_KEY="$DEFAULT_SECRET_KEY" \
  -e GARRISON_NODE_ACCESS_KEY="$NODE_ACCESS_KEY" -e GARRISON_NODE_SECRET_KEY="$NODE_SECRET_KEY" \
  -e GARRISON_DB_FILENAME=/app/data/garrison.db \
  -e GARRISON_MCP_PUBLIC_URL=http://garrison-server:8701 \
  -e GARRISON_PUBLIC_BASE_URL=http://garrison-server:8700 \
  -e GARRISON_EXTERNAL_BASE_URL=http://127.0.0.1:8700 \
  jchristn77/garrison-server:v0.2.0

docker run -d --name garrison-worker-0 --network garrison \
  -e GARRISON_WORKER_SERVER_URL=http://garrison-server:8700 \
  -e GARRISON_WORKER_NODE_NAME=worker-0 \
  -e GARRISON_WORKER_ACCESS_KEY="$NODE_ACCESS_KEY" -e GARRISON_WORKER_SECRET_KEY="$NODE_SECRET_KEY" \
  jchristn77/garrison-worker:v0.2.0

docker run -d --name garrison-dashboard --network garrison \
  -p 127.0.0.1:8080:80 \
  jchristn77/garrison-dashboard:v0.2.0
```

Open http://127.0.0.1:8080 and sign in as `admin@garrison` with `$ADMIN_PASSWORD`, or call the API directly:

```bash
curl -s http://127.0.0.1:8700/v1.0/api/health
curl -s http://127.0.0.1:8700/v1.0/api/nodes -H "x-api-key: $ADMIN_API_KEY"
```

The example keeps server data in the `garrison-server-data` volume at `/app/data`; back up that volume and the generated keys together. Worker workspaces are ephemeral here. Multiple control-plane replicas need PostgreSQL (`GARRISON_DB_TYPE=Postgresql` plus the `GARRISON_DB_*` variables below).

## Server environment variables

| Variable | Setting | Default |
|---|---|---|
| `GARRISON_SETTINGS_FILE` | Settings file path | `/app/garrison.json` in the image |
| `GARRISON_DB_TYPE` | `Sqlite` or `Postgresql` | `Sqlite` |
| `GARRISON_DB_FILENAME` | Sqlite file | `data/garrison.db` |
| `GARRISON_DB_HOST`, `GARRISON_DB_PORT`, `GARRISON_DB_DATABASE`, `GARRISON_DB_USERNAME`, `GARRISON_DB_PASSWORD`, `GARRISON_DB_SCHEMA` | PostgreSQL connection | `127.0.0.1`, `5432`, `garrison`, `postgres`, none, none |
| `GARRISON_REST_PORT` | REST port | `8700` |
| `GARRISON_MCP_PORT` | MCP port | `8701` |
| `GARRISON_EXTERNAL_BASE_URL` | External REST URL advertised in A2A agent cards and server info | the scheme and `Host` of each request |
| `GARRISON_PUBLIC_BASE_URL` | Internal REST URL handed to runs (the `garrison.apiUrl` template variable); never shown in cards | `http://127.0.0.1:<REST port>` |
| `GARRISON_MCP_PUBLIC_URL` | Internal MCP URL handed to harnesses for delegation | `http://127.0.0.1:<MCP port>` |
| `GARRISON_ADMIN_API_KEY` | Administrator API key | required (public placeholder `garrisonadmin` is refused) |
| `GARRISON_AUTH_SIGNING_KEY` | Session token key | required |
| `GARRISON_MASTER_KEY` | Secret encryption key (base64 of 32 random bytes) | required |
| `GARRISON_ADMIN_EMAIL` | Seeded administrator email | `admin@garrison` |
| `GARRISON_ADMIN_PASSWORD` | Seeded administrator password | required |
| `GARRISON_DEFAULT_ACCESS_KEY`, `GARRISON_DEFAULT_SECRET_KEY` | Seeded administrator credential | `access_garrison_default`, secret required |
| `GARRISON_NODE_ACCESS_KEY`, `GARRISON_NODE_SECRET_KEY` | Seeded worker credential | `access_garrison_node`, secret required |
| `GARRISON_ALLOW_INSECURE_DEFAULTS` | Development mode: start with the public built-in keys and passwords instead of refusing | `false` |
| `GARRISON_NODE_ID` | Control-plane node identifier | the host name |
| `GARRISON_EXPECTED_REPLICAS` | Control-plane replicas (above 1 needs PostgreSQL) | `1` |
| `GARRISON_SETTINGS_READONLY` | Treat the settings file as read-only (ConfigMap) | `false` |
| `GARRISON_TELEMETRY_ENABLE`, `GARRISON_OTLP_ENABLE`, `GARRISON_OTLP_ENDPOINT` | Metrics and OTLP export | `true`, `false`, `http://127.0.0.1:4317` |
| `GARRISON_APPS_SESSION_MINUTES`, `GARRISON_APPS_ANONYMOUS_SESSION_MINUTES`, `GARRISON_APPS_MESSAGES_PER_MINUTE` | App UI session lengths and per-session message rate | `480`, `60`, `30` |
| `GARRISON_ASSETS_MAX_FILE_BYTES`, `GARRISON_FILESPACES_MAX_FILE_BYTES` | Largest agent asset file and largest file space file | 16 MiB, 32 MiB |

## Worker environment variables

| Variable | Setting | Default |
|---|---|---|
| `GARRISON_WORKER_SERVER_URL` | Control-plane REST URL | `http://127.0.0.1:8700` |
| `GARRISON_WORKER_NODE_NAME` | Unique node name | the host name |
| `GARRISON_WORKER_ACCESS_KEY`, `GARRISON_WORKER_SECRET_KEY` | Node credential | the seeded worker credential |
| `GARRISON_WORKER_MAX_CONCURRENT_RUNS` | Concurrent runs | `4` |
| `GARRISON_WORKER_NODE_POOL` | Node pool name | the default pool |
| `GARRISON_WORKER_LABELS` | Extra labels, `key=value,key=value` | none |
| `GARRISON_WORKER_WORK_ROOT` | Run directories | `/workspaces` in the image |
| `GARRISON_WORKER_HEALTH_PORT` | Health listener | `8710` |
| `GARRISON_WORKER_TELEMETRY_ENABLE`, `GARRISON_WORKER_PROMETHEUS_PORT`, `GARRISON_WORKER_OTLP_ENABLE`, `GARRISON_WORKER_OTLP_ENDPOINT` | Worker metrics and traces | `true`, `9465`, `false`, `http://127.0.0.1:4317` |
| `GARRISON_WORKER_SETTINGS_FILE` | Settings file path | `/opt/garrison/worker/garrison-worker.json` in the image |

The full list, with ranges and every other setting, is in [docs/CONFIGURATION.md](https://github.com/jchristn/Garrison/blob/main/docs/CONFIGURATION.md).

Harness credentials such as `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` do not belong in the worker's environment: the worker passes only an allowlist of variables (`PATH`, `LANG`, proxy and certificate settings, and a few others) to harnesses. Store keys as Garrison secrets and map them to harness variables in the deployment.

## Dashboard environment variables

| Variable | Meaning | Default |
|---|---|---|
| `GARRISON_API_UPSTREAM` | Where nginx proxies `/v1.0` and `/openapi.json` | `http://garrison-server:8700` |
| `GARRISON_API_URL` | API URL the browser calls; empty means same origin through the proxy | empty |
| `GARRISON_CSP_CONNECT_SRC` | Extra space-separated origins the browser may call; non-empty also shows "Use a different server" on the sign-in page | empty |

## Health

| Container | Endpoint |
|---|---|
| Server | `GET /v1.0/api/health` on 8700 (no authentication) |
| Worker | `GET /health/live` and `GET /health/ready` on 8710 |

## Health

| Container | Endpoint |
|---|---|
| Server | `GET /v1.0/api/health` on 8700 (no authentication); reports version `0.2.0` |
| Worker | `GET /health/live` and `GET /health/ready` on 8710 |

## Licenses

Garrison is MIT licensed. See [THIRD_PARTY_NOTICES.md](https://github.com/jchristn/Garrison/blob/main/THIRD_PARTY_NOTICES.md) and [assets/licenses](https://github.com/jchristn/Garrison/blob/main/assets/licenses) for application dependency terms. Container runtimes, base-image packages, and bundled harness CLIs keep their own notices.
