# Docker Compose

`docker/compose.yaml` runs the same topology as the Kubernetes overlays on one machine: a control-plane server, two workers, the dashboard, Postgres, and a one-shot bootstrap container that stores your harness credentials and creates sample agents. It is the quickest way to try Garrison with real harnesses when you do not want a cluster.

## Before you start

You need Docker with Compose v2 (Docker Desktop on macOS and Windows, or Docker Engine with the compose plugin on Linux). The images take about 3 GB, plus a couple of gigabytes of build cache. Docker needs about 4 GB of memory for the stack and a few concurrent harness runs; the stack itself idles at around 200 MB.

The first build is mostly downloads: the .NET base images, Node.js, the Claude Code and Codex packages, and Mux with its NuGet dependencies. On a fast connection it takes about 8 minutes; on a slow one, 20 (18 minutes was measured with every layer rebuilt on a home link). The worker image ends up at 2.1 GB. After that, `update.sh` takes about 15 seconds when nothing has changed.

The worker build runs `claude --version` and `codex --version` after installing them. Both packages fetch their native binaries as optional npm dependencies, which npm skips without an error when a download breaks, so a flaky connection would otherwise produce a worker that cannot run either harness. If the build fails at that step, run `./update.sh` again.

## Start

```bash
cd docker
cp .env.example .env          # ports, keys, and harness credentials; every value is optional
./update.sh                   # Windows: update.bat
```

`update.sh` checks that the host ports are free, builds the three Garrison images from this repository, recreates the stack, and prints the container status and the URLs:

| What | Default URL or value |
|---|---|
| Dashboard | http://127.0.0.1:8080 |
| REST and A2A | http://127.0.0.1:8700 |
| MCP | http://127.0.0.1:8701/mcp |
| Sign-in | tenant `default`, email `admin@garrison`, password `password` |
| Administrator API key (`x-api-key`) | `garrisonadmin` |
| Postgres | 127.0.0.1:5433, database and user `garrison`, password `garrison` |

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

Set any of these in `.env` before starting. The bootstrap container stores each one as a Garrison secret and creates the matching sample agent (`claude-helper`, `codex-coder`, `mux-helper`); agents without credentials are skipped. `claude-helper` is allowed to delegate to the other two.

| Variable | Harness |
|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`) or `ANTHROPIC_API_KEY` | Claude Code |
| `OPENAI_API_KEY`, or `CODEX_AUTH_JSON_FILE` with the absolute path of a Codex `auth.json` | Codex |
| `MUX_BASE_URL`, `MUX_MODEL`, `MUX_ADAPTER_TYPE` (`openai-compatible` or `ollama`), `MUX_API_KEY` | Mux |

Compose does not expand `~`, so write `CODEX_AUTH_JSON_FILE=/Users/you/.codex/auth.json`. The values stay in `.env`, which git ignores and the Docker build context excludes; harness credentials never become environment variables on the workers.

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

Then sign in to the dashboard. Fleet lists `garrison-worker-1` and `garrison-worker-2` as `Ready`, and Invoke runs any of the sample agents. The whole sequence, from `./update.sh` to seeing both workers, takes well under a minute once the images exist.

## Stop, update, and reset

| Command (from `docker/`) | What it does | Data |
|---|---|---|
| `docker compose stop` | Stops the containers; `docker compose start` brings them back | Kept |
| `docker compose down` | Removes the containers and the network | Kept |
| `./update.sh` (`update.bat`) | Rebuilds the images from source, `down`, `up -d`, status. `--pull` pulls the published images instead of building | Kept |
| `./factory/reset.sh` (`.bat`) | After you type `RESET`: removes the containers and every volume, then rebuilds and starts a fresh stack. `--no-start` only removes | Deleted |
| `docker compose down -v` | Removes containers and volumes without rebuilding | Deleted |

Deleting the volumes removes the database (agents, runs, secrets, users) and the worker workspaces. The next start seeds tenant `default`, `admin@garrison`, and the sample agents again from your `.env`. To also reclaim the image space, `docker image rm jchristn77/garrison-server:v0.1.0-alpha jchristn77/garrison-worker:v0.1.0-alpha jchristn77/garrison-dashboard:v0.1.0-alpha`.

## Notes

- Keys in `compose.yaml` default to the server's development defaults, and the server log warns about them at startup. For anything other than your own machine, set `GARRISON_MASTER_KEY`, `GARRISON_AUTH_SIGNING_KEY`, `GARRISON_ADMIN_PASSWORD`, `GARRISON_ADMIN_API_KEY`, and the access and secret keys in `.env` before the first start. The master key encrypts stored secrets, so changing it later makes them unreadable; run a factory reset if you need to change it.
- Agents call back into Garrison (delegation) at `http://garrison-server:8701`, the in-network address, so delegation works without exposing anything extra.
- Garrison uses two URLs. Runs get the internal ones (`GARRISON_PUBLIC_BASE_URL=http://garrison-server:8700` and `GARRISON_MCP_PUBLIC_URL=http://garrison-server:8701`). A2A agent cards and server info advertise `GARRISON_EXTERNAL_BASE_URL`, which defaults to `http://127.0.0.1:<GARRISON_REST_PORT>`, the address you use from the host. If other machines or a proxy reach the stack under a different name, set `GARRISON_EXTERNAL_BASE_URL` in `.env` (for example `https://garrison.example.com`) and run `./update.sh`.
- The containers have fixed names (`garrison-server`, `garrison-worker-1`, and so on), so one machine runs one copy of this stack. A second copy, even under a different Compose project name, collides on those names.
- Docker Compose is a single-host deployment. For multiple control-plane replicas, autoscaling, and production settings use Kubernetes (`docs/KUBERNETES.md`).
