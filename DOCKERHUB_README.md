<p align="center">
  <img src="https://raw.githubusercontent.com/jchristn/Garrison/main/assets/logo.png" alt="Garrison" width="160" height="160" />
</p>

# Garrison

> **Alpha (v0.1.0-alpha).** APIs, schema, settings, and image layout can change without notice.

Garrison runs headless agent harnesses (Claude Code, Codex, Mux, Gemini CLI, or any command-line agent described by a harness profile) on a fleet of worker nodes, and exposes them over REST, MCP, and A2A with multi-tenancy and RBAC. The control plane never calls a worker; workers pull runs by lease, so you scale the two independently.

Source, documentation, and issues: https://github.com/jchristn/Garrison

## Images

| Image | Contents | Ports |
|---|---|---|
| `jchristn77/garrison-server` | Control plane: REST, A2A, WebSocket, MCP, scheduler | 8700 (REST, A2A, WebSocket), 8701 (MCP), 9464 (Prometheus) |
| `jchristn77/garrison-worker` | Worker node with Claude Code, Codex, Mux, and the fake test harness installed (Gemini CLI optional at build time) | 8710 (health), 9465 (Prometheus) |
| `jchristn77/garrison-dashboard` | React operator console served by nginx, proxying `/v1.0` to the server | 80 |

All images are built for `linux/amd64` and `linux/arm64`, run as UID 10001 (except the dashboard's nginx), and carry `latest` plus a version tag such as `v0.1.0-alpha`. The worker image records the bundled harness versions in labels (`io.garrison.harness.claude-code`, `io.garrison.harness.codex`, `io.garrison.harness.mux-ref`, `io.garrison.harness.gemini-cli`).

## Kubernetes

Garrison is meant to run on Kubernetes. The repository's `k8s/` directory has a Kustomize base with overlays for minikube, K3S, and production, a Helm chart, and scripts that generate secrets, deploy, and smoke-test. See `docs/KUBERNETES.md` in the repository.

## Docker Compose

The repository's `docker/` directory runs one server, two workers, the dashboard, and PostgreSQL with one command, including the harness credentials and sample agents:

```bash
git clone https://github.com/jchristn/Garrison && cd Garrison/docker
cp .env.example .env      # optional: ports, keys, and harness credentials
./update.sh               # builds the images and starts the stack; ./update.sh --pull uses these published images
```

Open http://127.0.0.1:8080 and sign in to tenant `default` as `admin@garrison` with password `password`. See `docs/DOCKER.md` in the repository.

## Trying it with Docker


The containers below use Sqlite and a user-defined network, which is enough to see a run go end to end. Change every default key before exposing anything.

```bash
docker network create garrison

docker run -d --name garrison-server --network garrison \
  -p 127.0.0.1:8700:8700 -p 127.0.0.1:8701:8701 \
  -e GARRISON_DB_FILENAME=/app/data/garrison.db \
  -e GARRISON_MCP_PUBLIC_URL=http://garrison-server:8701 \
  -e GARRISON_PUBLIC_BASE_URL=http://garrison-server:8700 \
  -e GARRISON_EXTERNAL_BASE_URL=http://127.0.0.1:8700 \
  jchristn77/garrison-server:latest

docker run -d --name garrison-worker-0 --network garrison \
  -e GARRISON_WORKER_SERVER_URL=http://garrison-server:8700 \
  -e GARRISON_WORKER_NODE_NAME=worker-0 \
  jchristn77/garrison-worker:latest

docker run -d --name garrison-dashboard --network garrison \
  -p 127.0.0.1:8080:80 \
  jchristn77/garrison-dashboard:latest
```

Open http://127.0.0.1:8080 and sign in as `admin@garrison` with password `password`, or call the API directly:

```bash
curl -s http://127.0.0.1:8700/v1.0/api/health
curl -s http://127.0.0.1:8700/v1.0/api/nodes -H "x-api-key: garrisonadmin"
```

Mount a volume at `/app/data` on the server to keep the Sqlite database. Multiple control-plane replicas need PostgreSQL (`GARRISON_DB_TYPE=Postgresql` plus the `GARRISON_DB_*` variables below).

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
| `GARRISON_ADMIN_API_KEY` | Administrator API key | `garrisonadmin` |
| `GARRISON_AUTH_SIGNING_KEY` | Session token key | a placeholder; set it |
| `GARRISON_MASTER_KEY` | Secret encryption key | a placeholder; set it |
| `GARRISON_ADMIN_EMAIL` | Seeded administrator email | `admin@garrison` |
| `GARRISON_ADMIN_PASSWORD` | Seeded administrator password | `password` |
| `GARRISON_DEFAULT_ACCESS_KEY`, `GARRISON_DEFAULT_SECRET_KEY` | Seeded administrator credential | `access_garrison_default`, `secret_garrison_default_change_me` |
| `GARRISON_NODE_ACCESS_KEY`, `GARRISON_NODE_SECRET_KEY` | Seeded worker credential | `access_garrison_node`, `secret_garrison_node_change_me` |
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

## License

MIT.
