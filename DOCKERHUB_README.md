<p align="center">
  <img src="https://raw.githubusercontent.com/jchristn/Garrison/main/assets/logo.png" alt="Garrison" width="160" height="160" />
</p>

# Garrison

> **Alpha (v0.2.0).** APIs, schema, settings, and image layout can change without notice.

**Turn agent harnesses into managed services on your own infrastructure.** Garrison runs Claude Code, Codex, Mux, Gemini CLI, opencode, pi, and configurable command-line agents on pull-based workers. Publish specialists through REST, MCP and A2A, control their tools and credentials, and follow execution from a shared operator console. Tenant-scoped permissions, approvals and audit records let teams share an execution platform with explicit boundaries.

Build agent-to-agent delegation and multi-stage pipelines with human review, start work from schedules or signed webhooks, and collect artifacts and transcripts. Current source also supports remote A2A/MCP agents, direct compatible model API execution, tenant queue bounds and scheduling weights, opt-in durable checkpoints, workspace caches, placement explanations, scoped SQL diagnostics and application telemetry.

Optional persistent memory is agent-scoped and backed by a replaceable interface; the supplied filesystem provider needs no separate memory service. Enable it through `docker/compose.agent-memory.yaml`. NotDory remains an optional external MCP example.

Source and documentation: https://github.com/jchristn/Garrison. Start with `docs/README.md`; `docs/CONTINUATION.md`, `docs/effect-safety.md` and `docs/SECURITY.md` explain checkpoint compatibility, recovery guarantees and Process versus Kubernetes isolation.

**Image availability:** this is a registry description draft for the current checkout. Previously published tags can predate these features. Build the matching server/worker/dashboard from source to use the current implementation; updating this document does not publish images or change the alpha version.

## Images

| Image | Contents | Ports |
|---|---|---|
| `jchristn77/garrison-server` | Control plane: REST, A2A, WebSocket, MCP, scheduler | 8700 (REST, A2A, WebSocket), 8701 (MCP), 9464 (Prometheus) |
| `jchristn77/garrison-worker` | Worker node with Claude Code, Codex, Mux, the provider API harness, and the fake test harness installed (Gemini CLI, opencode, and pi optional at build time) | 8710 (health), 9465 (Prometheus) |
| `jchristn77/garrison-dashboard` | React operator console served by nginx, proxying `/v1.0` to the server | 80 |

The image build/publish tooling targets `linux/amd64` and `linux/arm64` with `latest` and version tags such as `v0.2.0`. Server and worker run as UID 10001; the dashboard uses nginx. Tags describe a published build, not necessarily this checkout. The worker image records the bundled harness versions in labels (`io.garrison.harness.claude-code`, `io.garrison.harness.codex`, `io.garrison.harness.mux`, `io.garrison.harness.mux-ref`, `io.garrison.harness.gemini-cli`). The current worker Dockerfile pins Claude Code 2.1.296, Codex 0.159.3, and Mux 1.3.0.

## Kubernetes

Garrison is meant to run on Kubernetes. The repository's `k8s/` directory has a Kustomize base with overlays for minikube, K3S, and production, a Helm chart, and scripts that generate secrets, deploy, and smoke-test. See `docs/KUBERNETES.md` in the repository.

## Docker Compose

The repository's `docker/` directory runs one server, two workers, the dashboard, PostgreSQL, and Prometheus/Grafana/Tempo/Loki/Alloy through its update script. Keys/passwords are generated; provider credentials are supplied separately and enable the corresponding sample deployments:

```bash
git clone https://github.com/jchristn/Garrison && cd Garrison/docker
./update.sh               # generates keys into .env, builds the images, starts the stack; --pull uses published tags, which may be older
```

Open http://127.0.0.1:8080 and sign in to tenant `default` as `admin@garrison` with the password `update.sh` printed (`GARRISON_ADMIN_PASSWORD` in `docker/.env`). See `docs/DOCKER.md` in the repository.

Allow an 8 GB Docker memory budget and about 10 GB disk as a starting point for Compose; harness workloads and telemetry retention can require more. Grafana starts on loopback port 3000, with its generated password in `.env`. See `docs/DOCKER.md` for all ports and persistent data.

## Trying it with Docker


For the current-source features, build and tag these images from the checkout first or use the source-building Compose script above. The standalone container commands below use whichever build `latest` names.

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
  jchristn77/garrison-server:latest

docker run -d --name garrison-worker-0 --network garrison \
  -e GARRISON_WORKER_SERVER_URL=http://garrison-server:8700 \
  -e GARRISON_WORKER_NODE_NAME=worker-0 \
  -e GARRISON_WORKER_ACCESS_KEY="$NODE_ACCESS_KEY" -e GARRISON_WORKER_SECRET_KEY="$NODE_SECRET_KEY" \
  jchristn77/garrison-worker:latest

docker run -d --name garrison-dashboard --network garrison \
  -p 127.0.0.1:8080:80 \
  jchristn77/garrison-dashboard:latest
```

Open http://127.0.0.1:8080 and sign in as `admin@garrison` with `$ADMIN_PASSWORD`, or call the API directly:

```bash
curl -s http://127.0.0.1:8700/v1.0/api/health
curl -s http://127.0.0.1:8700/v1.0/api/nodes -H "x-api-key: $ADMIN_API_KEY"
```

The example persists server data in the `garrison-server-data` volume at `/app/data`; back up that volume and the generated keys together. Worker workspaces are ephemeral in this standalone example. Multiple control-plane replicas need PostgreSQL (`GARRISON_DB_TYPE=Postgresql` plus the `GARRISON_DB_*` variables below).

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

Harness credentials such as `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` do not belong in the worker's environment: the worker passes only an allowlist of variables (`PATH`, `LANG`, proxy and certificate settings, and a few others) to harnesses. Store keys as Garrison secrets and map them to harness variables in the deployment.

## Dashboard environment variables

| Variable | Meaning | Default |
|---|---|---|
| `GARRISON_API_UPSTREAM` | Where nginx proxies `/v1.0` and `/openapi.json` | `http://garrison-server:8700` |
| `GARRISON_API_URL` | API URL the browser calls; empty means same origin through the proxy | empty |

## Health

| Container | Endpoint |
|---|---|
| Server | `GET /v1.0/api/health` on 8700 (no authentication) |
| Worker | `GET /health/live` and `GET /health/ready` on 8710 |

## Licenses

Garrison is MIT licensed. See `THIRD_PARTY_NOTICES.md` and `assets/licenses/` in the source distribution for application dependency terms. Container runtimes, base-image packages, and bundled harness CLIs retain their own notices.
