# Docker Compose

`docker/compose.yaml` runs a single-host topology: a control-plane server, two workers, the dashboard, Postgres, and a one-shot bootstrap container that stores your harness credentials and creates sample agents. It is the quickest way to try Garrison with real harnesses when you do not want a cluster.

## Before you start

You need Docker with Compose v2 (Docker Desktop on macOS and Windows, or Docker Engine with the Compose plugin on Linux). Allow at least 10 GB of free disk for application and observability images, build cache and retained telemetry. Start with 8 GB allocated to Docker, then size for concurrent harness workloads. The observability containers alone have combined memory limits of about 2.4 GB; these are limits, not an idle-memory measurement.

The first source build downloads .NET base images, Node.js, the Claude Code and Codex packages, and Mux dependencies. Build time and image size depend on architecture, network access and cached layers. `./update.sh --pull` instead uses the image tags in `compose.yaml`; published images contain the source from their build, so rebuild locally to use newer checkout changes.

The worker build runs `claude --version` and `codex --version` after installing them. Both packages fetch their native binaries as optional npm dependencies, which npm skips without an error when a download breaks, so a flaky connection would otherwise produce a worker that cannot run either harness. If the build fails at that step, run `./update.sh` again.

## Start

```bash
cd docker
./update.sh                   # Windows: update.bat
```

`update.sh` first makes sure `docker/.env` holds every key and password the stack needs. It creates `.env` from `.env.example` when there is none, then appends a random value for each of these that is missing: `GARRISON_MASTER_KEY`, `GARRISON_AUTH_SIGNING_KEY`, `GARRISON_ADMIN_PASSWORD`, `GARRISON_ADMIN_API_KEY`, `GARRISON_DB_PASSWORD`, the default and node access and secret keys, and `GARRISON_GRAFANA_PASSWORD`. Values already in `.env` (or in your shell environment) are kept. It prints a generated administrator password once; afterwards it is in `.env` as `GARRISON_ADMIN_PASSWORD`. The script that does this is `env-secrets.sh` (`env-secrets.ps1` on Windows), and you can run it on its own.

Then it checks that the host ports are free, builds the three Garrison images from this repository, recreates the stack, and prints the container status and the URLs:

| What | Default URL or value |
|---|---|
| Dashboard | http://127.0.0.1:8080 |
| REST and A2A | http://127.0.0.1:8700 |
| MCP | http://127.0.0.1:8701/mcp |
| Sign-in | tenant `default`, email `admin@garrison`, password `GARRISON_ADMIN_PASSWORD` from `.env` |
| Administrator API key (`x-api-key`) | `GARRISON_ADMIN_API_KEY` from `.env` |
| Postgres | 127.0.0.1:5433, database and user `garrison`, password `GARRISON_DB_PASSWORD` from `.env` |

Compose has no defaults for these keys and passwords. A plain `docker compose up` without them stops with `required variable GARRISON_MASTER_KEY is missing a value`, and the server refuses to start with the public built-in defaults (`garrisonadmin`, `password`, and the `*_change_me` and `*-override-me` keys) unless `GARRISON_ALLOW_INSECURE_DEFAULTS=true` is set, which is for local development only (see `docs/SECURITY.md`).

Read the values with `grep -E '^GARRISON_(ADMIN_PASSWORD|ADMIN_API_KEY)=' docker/.env`. The examples in these documents use `garrisonadmin` and `password` as placeholders; substitute yours.

### Stacks created before keys were required

`update.sh` will not invent the database password, the master key, the administrator password, or the seeded credentials while the Postgres volume exists, because the database was created with the old values and new ones would lock the stack out of its own data. It stops and names the missing variables instead. A stack created when `compose.yaml` still had defaults used `GARRISON_DB_PASSWORD=garrison`; add that line to `.env` (or rotate the Postgres password and use the new one) and run `./update.sh` again. If any value in `.env` is still a public default, `update.sh` names it as well. Change the administrator password and seeded credentials through the dashboard or API first, then in `.env`, since the server only applies them when it seeds a new database. A factory reset deletes the data and generates everything that is missing.

### Keeping the built-in defaults on a local machine

For a development stack that only you can reach, you can keep the public defaults (for example the `password` administrator password) instead of rotating them. Add this line to `docker/.env`:

```bash
GARRISON_ALLOW_INSECURE_DEFAULTS=true
```

`update.sh` and `update.bat` then list the defaults still in use and continue instead of stopping, and Compose passes the setting to the server, which starts with a warning naming each default. Missing values are still generated, and `GARRISON_DB_PASSWORD` must still match the Postgres volume. Anyone who can reach the stack can sign in with the defaults, so never set it on a stack bound to anything but `127.0.0.1`, and remove the line (after rotating the values) before you share the machine or expose a port. The same switch is `Security.AllowInsecureDefaults` in the server settings (`docs/CONFIGURATION.md`).

Every port binds to `127.0.0.1` only, so nothing is reachable from other machines.

## When a port is already taken

Another application on 8080 or 8700 is common. `update.sh` checks before it builds and stops with a message like this:

```text
These host ports are taken by something else:
  GARRISON_REST_PORT=8700 (127.0.0.1:8700 is already in use)
Pick free ports in docker/.env (copy .env.example if you have not), for example GARRISON_REST_PORT=9700, then run this again.
```

Edit the four port lines in `.env`, for example:

```bash
GARRISON_REST_PORT=9700
GARRISON_MCP_PORT=9701
GARRISON_DASHBOARD_PORT=9080
GARRISON_POSTGRES_PORT=9433
```

and run `./update.sh` again. Only the host side changes. Inside the Docker network the services still talk on their usual ports, so delegation and the dashboard's API proxy keep working, and the URLs `update.sh` prints follow your `.env`. Everywhere else in these documents, read 8700, 8701, and 8080 as your ports.

## Harness credentials

Set any of these in `.env` before starting. The bootstrap container stores each one as a Garrison secret and creates all three sample agent records (`claude-helper`, `codex-coder`, `mux-helper`). Only deployments whose credentials or endpoint are present are created. `claude-helper` is allowed to delegate to the other two.

| Variable | Harness |
|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`) or `ANTHROPIC_API_KEY` | Claude Code |
| `OPENAI_API_KEY`, or `CODEX_AUTH_JSON_FILE` with the absolute path of a Codex `auth.json` | Codex |
| `MUX_BASE_URL`, `MUX_MODEL`, `MUX_ADAPTER_TYPE` (`openai-compatible` or `ollama`), `MUX_API_KEY` | Mux |
| `MUX_CONTEXT_WINDOW`, `MUX_MAX_TOKENS` (optional whole numbers) | Mux: the model's context window and the most tokens one response may generate. They become the `contextWindow` and `maxTokens` parameters of `mux-helper-default`. Leave them unset and Mux falls back to a 32,768-token window, which is much smaller than most current models offer, and Garrison adds a warning event to every Mux run. |

Compose does not expand `~`, so use an absolute path for `CODEX_AUTH_JSON_FILE`. Use a dedicated Codex login rather than the auth.json from an actively used personal installation; see [credential setup](QUICKSTART.md#1-store-the-credentials). The values stay in `.env`, which git ignores and the Docker build context excludes; harness credentials never become environment variables on the workers.

Bootstrap is idempotent. After adding or changing credentials, apply them without restarting anything else:

```bash
docker compose up garrison-bootstrap
```

You can also skip `.env` entirely and store credentials later, from the dashboard (Configuration, Secrets) or the API. `docs/QUICKSTART.md` shows both, and builds a small set of agents that delegate to each other.

The bootstrap container uses the same script and sample manifests as the Kubernetes bootstrap Job (`k8s/base/scripts/bootstrap.sh`, `k8s/base/manifests/`), so both runtimes create identical agents.

## What a healthy stack looks like

```bash
cd docker
docker compose ps -a
```

The output, with some columns left out:

```text
NAME                 SERVICE              STATUS
garrison-bootstrap   garrison-bootstrap   Exited (0) 2 minutes ago
garrison-dashboard   garrison-dashboard   Up 2 minutes (healthy)
garrison-postgres    postgres             Up 2 minutes (healthy)
garrison-server      garrison-server      Up 2 minutes (healthy)
garrison-worker-1    garrison-worker-1    Up 2 minutes (healthy)
garrison-worker-2    garrison-worker-2    Up 2 minutes (healthy)
```

`garrison-bootstrap` is meant to exit; `Exited (0)` means it finished. Anything other than 0 means it could not store a secret or apply a manifest, and its log says which.

```bash
curl -s http://127.0.0.1:8700/v1.0/api/health                 # {"status":"healthy",...,"database":"ok"}
docker compose logs garrison-bootstrap                         # which secrets and agents were created
docker compose logs garrison-worker-1 | grep harness           # which harness CLIs the worker found (Claude Code, Codex, Mux: available)
docker compose logs -f garrison-server                         # server log
```

Then sign in to the dashboard. Fleet > Worker nodes lists `garrison-worker-1` and `garrison-worker-2` as `Ready`, Fleet > Control plane lists the server replica as the leader, and Invoke runs sample agents that have a configured deployment and usable provider credentials. The whole sequence, from `./update.sh` to seeing both workers, takes well under a minute once the images exist.

## Observability

Compose workers always run harnesses as subprocesses (the `Process` executor). The pod-per-run `KubernetesJob` executor needs the Kubernetes API, so Compose leaves it off; a deployment set to `executor: KubernetesJob` stays queued with `blockedReason: NoCapableWorker` here. Use the Kubernetes manifests for that (`docs/KUBERNETES.md`, "Pod-per-run executor").

The default Compose stack includes Prometheus, Loki, Tempo, Grafana with the domain dashboards, and Grafana Alloy. Server and worker OTLP export is enabled, Prometheus scrapes their metrics, and the dashboard Home page links to the tools. Configurations and dashboards are shared with Kubernetes. Start everything with:

```bash
cd docker
./update.sh                        # Windows: update.bat; combines with --pull
# or, without rebuilding:
docker compose up -d
```

Existing commands using `--observability` and `compose.observability.yaml` remain compatible. Set `GARRISON_OTLP_ENABLE=false` and `GARRISON_WORKER_OTLP_ENABLE=false` only when intentionally disabling trace export.

| What | Default URL or value |
|---|---|
| Grafana | http://127.0.0.1:3000, user `admin`, password `GARRISON_GRAFANA_PASSWORD` from `.env` |
| Prometheus | http://127.0.0.1:9090 |
| Loki | http://127.0.0.1:3100 |
| Tempo | http://127.0.0.1:3200 |

The ports are `GARRISON_GRAFANA_PORT`, `GARRISON_PROMETHEUS_PORT`, `GARRISON_LOKI_PORT`, and `GARRISON_TEMPO_PORT` in `.env`, and the services are already in the default Compose file. The optional `--observability` compatibility path also checks those four ports before a fresh start; the ordinary script currently prechecks only application/database ports. Check observability port availability if Compose reports a binding conflict.

How it is wired:

- Prometheus scrapes `/metrics` on the metrics listeners, `garrison-server:9464` and `garrison-worker-N:9465` (`docker/observability/prometheus.yaml`), labeling series with `component` and `node` (the container name). Those listeners answer only requests addressed to the container's host name, so every Garrison service sets `hostname:` to its service name. `/metrics` is not served on the REST port or the worker health port, because that endpoint needs no authentication (`Telemetry.ServeMetricsOnServicePort`, false by default). Add a target there if you add a worker, and give the worker a `hostname:`.
- Alloy reads the logs of this project's Garrison containers through the Docker socket (mounted read-only) and ships them to Loki with `app="garrison"`, `component`, `node`, and `level` (`docker/observability/config.alloy`). It also receives OTLP on 4317 and 4318 inside the Compose network and forwards traces to Tempo.
- Loki, Tempo, the Grafana datasources and dashboard provider, and the dashboards themselves are mounted from `k8s/components/observability`, so Compose and Kubernetes run the same configuration.

Retention is 3 days (or 1 GB) for metrics, 72 hours for logs, and 24 hours for traces. The five containers have memory limits that add up to 2.4 GB; with light traffic they use about 600 MB. The observability services start by default with the application. Their volumes stay until a factory reset. The `--observability` option remains compatible with existing automation.

## Stop, update, and reset

| Command (from `docker/`) | What it does | Data |
|---|---|---|
| `docker compose stop` | Stops the containers; `docker compose start` brings them back | Kept |
| `docker compose down` | Removes the containers and the network | Kept |
| `./update.sh` (`update.bat`) | Rebuilds the images from source, `down`, `up -d`, status. `--pull` pulls the published images instead of building; observability starts by default; `--observability` retains the compatible overlay | Kept |
| `./factory/reset.sh` (`.bat`) | After you type `RESET`: removes the containers and every volume, including the observability data, generates any keys and passwords missing from `.env`, then rebuilds and starts a fresh stack (including the observability services). `--no-start` only removes | Deleted |
| `docker compose --profile observability down -v` | Removes containers and volumes, including the observability ones, without rebuilding | Deleted |

Deleting the volumes removes the database (agents, runs, secrets, users) and the worker workspaces. The next start seeds tenant `default`, `admin@garrison`, and the sample agents again from your `.env`. To also reclaim the image space, `docker image rm jchristn77/garrison-server:v0.2.0 jchristn77/garrison-worker:v0.2.0 jchristn77/garrison-dashboard:v0.2.0`.

## Notes

- Keys and passwords come from `.env` only; `compose.yaml` has no defaults for them. `update.sh` and the factory reset generate random values for any that are missing, and you can set your own in `.env` before the first start instead. The master key encrypts stored secrets, so changing it later makes them unreadable; run a factory reset if you need to change it.
- Agents call back into Garrison (delegation) at `http://garrison-server:8701`, the in-network address, so delegation works without exposing anything extra.
- Garrison uses two URLs. Runs get the internal ones (`GARRISON_PUBLIC_BASE_URL=http://garrison-server:8700` and `GARRISON_MCP_PUBLIC_URL=http://garrison-server:8701`). A2A agent cards and server info advertise `GARRISON_EXTERNAL_BASE_URL`, which defaults to `http://127.0.0.1:<GARRISON_REST_PORT>`, the address you use from the host. If other machines or a proxy reach the stack under a different name, set `GARRISON_EXTERNAL_BASE_URL` in `.env` (for example `https://garrison.example.com`) and run `./update.sh`.
- The containers have fixed names (`garrison-server`, `garrison-worker-1`, and so on), so one machine runs one copy of this stack. A second copy, even under a different Compose project name, collides on those names.
- Docker Compose is a single-host deployment. For multiple control-plane replicas, autoscaling, and production settings use Kubernetes (`docs/KUBERNETES.md`).

## Optional agent memory

Agent memory is disabled by default and does not require NotDory or an external service. Current source provides a filesystem implementation behind `IAgentMemoryStore`, with tenant/agent-scoped MCP tools. To enable it in a source-built deployment, add `GARRISON_AGENT_MEMORY_ENABLE=true` and `GARRISON_AGENT_MEMORY_ROOT` to the server environment and mount persistent storage at that root. Keep memory storage with the database/master-key backup policy. Multiple control-plane replicas need a shared persistent root or a replacement shared-store implementation. Published image support depends on the source revision used to build that image. See [agent memory](AGENT_MEMORY.md) and [configuration](CONFIGURATION.md).

Continue with the [multi-agent quick start](QUICKSTART.md), [security guidance](SECURITY.md), or [Kubernetes deployment](KUBERNETES.md).
