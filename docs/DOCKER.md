# Docker Compose

`docker/compose.yaml` runs the same topology as the Kubernetes overlays on a single machine: one control-plane server, two workers, the dashboard, Postgres, and a one-shot bootstrap container. It is the quickest way to try Garrison with real harnesses when you do not want a cluster.

## Start

```bash
cd docker
cp .env.example .env          # optional; every value has a default
./update.sh                   # Windows: update.bat
```

`update.sh` builds the three Garrison images from this repository, recreates the stack, and prints the container status. The first build takes several minutes because the worker image installs Node.js, Claude Code, Codex, and Mux; later builds reuse the cached layers.

| What | URL or value |
|---|---|
| Dashboard | http://127.0.0.1:8080 |
| REST and A2A | http://127.0.0.1:8700 |
| MCP | http://127.0.0.1:8701/mcp |
| Sign-in | tenant `default`, email `admin@garrison`, password `password` |
| Administrator API key (`x-api-key`) | `garrisonadmin` |

Every port binds to `127.0.0.1` only. Change them in `.env` (`GARRISON_REST_PORT`, `GARRISON_MCP_PORT`, `GARRISON_DASHBOARD_PORT`, `GARRISON_POSTGRES_PORT`) if something else already uses them.

## Harness credentials

Set any of these in `.env` before starting. The bootstrap container stores them as Garrison secrets and creates the matching sample agents (`claude-helper`, `codex-coder`, `mux-helper`); agents without credentials are skipped.

| Variable | Harness |
|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` | Claude Code |
| `OPENAI_API_KEY`, or `CODEX_AUTH_JSON_FILE` with the absolute path of a Codex `auth.json` | Codex |
| `MUX_BASE_URL`, `MUX_MODEL`, `MUX_ADAPTER_TYPE`, `MUX_API_KEY` | Mux |

Compose does not expand `~`, so write `CODEX_AUTH_JSON_FILE=/Users/you/.codex/auth.json`. Bootstrap is idempotent; after adding credentials, run `docker compose up garrison-bootstrap` from the `docker` directory to apply them without restarting anything else.

The bootstrap container uses the same script and sample manifests as the Kubernetes bootstrap Job (`k8s/base/scripts/bootstrap.sh`, `k8s/base/manifests/`), so both runtimes create identical agents.

## Update and reset

| Script | What it does | Data |
|---|---|---|
| `docker/update.sh` (`.bat`) | Rebuild the images from source, `docker compose down`, `docker compose up -d`, show status. `--pull` pulls the published images instead of building. | Kept |
| `docker/factory/reset.sh` (`.bat`) | After you type `RESET`: remove the containers and every volume, then rebuild and start a fresh stack. `--no-start` only removes. | Deleted |

The reset deletes the database (agents, runs, secrets, users) and the worker workspaces. The next start seeds tenant `default`, `admin@garrison`, and the sample agents again from your `.env`.

## Checking it

```bash
cd docker
docker compose ps -a                                   # every service healthy, bootstrap exited 0
docker compose logs -f garrison-server                 # server log
docker compose logs garrison-bootstrap                 # which secrets and agents were created
curl -s http://127.0.0.1:8700/v1.0/api/health
```

Then sign in to the dashboard: the Fleet page lists `garrison-worker-1` and `garrison-worker-2`, and Invoke runs any of the sample agents.

## Notes

- Keys in `compose.yaml` default to the server's development defaults. For anything other than your own machine, set `GARRISON_MASTER_KEY`, `GARRISON_AUTH_SIGNING_KEY`, `GARRISON_ADMIN_PASSWORD`, `GARRISON_ADMIN_API_KEY`, and the access and secret keys in `.env` before the first start. The master key encrypts stored secrets, so changing it later makes them unreadable; run a factory reset if you need to change it.
- Agents call back into Garrison (delegation) at `http://garrison-server:8701`, the in-network address, so delegation works without exposing anything extra.
- Docker Compose is a single-host deployment. For multiple control-plane replicas, autoscaling, and production settings use Kubernetes (`docs/KUBERNETES.md`).
