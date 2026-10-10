# New-user documentation review

Plan tasks P8.18 to P8.22. The question was simple: if you have never seen Garrison, can the README and the documents it links get you from a fresh clone to a running stack on Docker or Kubernetes, and then to a few agents that call each other, without asking anyone? The first pass below records what happened when I followed the documents literally, before anything was changed. The second pass, at the end, repeats the walk on the fixed documents.

## Setup

The walk ran on a macOS laptop (Apple silicon, Docker Desktop 29.8 with 18 CPUs and 8 GB of memory, Compose 5.5, kubectl present, no Helm, no minikube) on 2026-10-10. Each pass started from a fresh clone in a scratch directory. The machine was deliberately unfriendly in one way: ports 8700, 8701, 8080, and 8081 were already taken by another K3S cluster's port-forward and another application, which is exactly the situation a real user is in more often than documents assume. Real credentials were used for Claude Code (subscription token), Codex (`auth.json` from a ChatGPT sign-in), and Mux (a self-hosted `gpt-oss:20b` endpoint behind an Ollama-compatible proxy). They lived only in a gitignored `.env` inside the scratch clone and in shell variables.

The Docker image cache was not empty: earlier builds of the same commit existed, so the first build in pass one reused most layers. Cold build times were measured separately in pass two with `--no-cache`.

## First pass: findings

### README and general

| # | Finding | Severity |
|---|---|---|
| R1 | "Getting started" opens with the .NET source path (two terminals, a fake-harness wrapper the reader has to invent) and puts Docker second. Docker is the path a first-time user can actually finish without help. | High |
| R2 | No prerequisites anywhere: Docker version, memory, disk, build time, and that `jq` makes the examples easier. | Medium |
| R3 | The README's curl examples authenticate with `x-api-key: garrisonadmin` and never say what that is. On Kubernetes the administrator API key is random, so every one of those commands fails there, and nothing says how to read the real key. | High |
| R4 | The README shows how to request a token but does not keep it. `MANIFESTS.md` and `REST_API.md` then use `$TOKEN` as if it were set. | Medium |
| R5 | There is no walk-through for the thing most people want next: a couple of agents on different harnesses, one allowed to call the others. The pieces are in `MANIFESTS.md`, `HARNESSES.md`, and `MCP_API.md`, but a new user would have to assemble them, including how a secret alias in a deployment connects to a stored secret. | High |
| R6 | The Docker and Kubernetes stacks create three sample agents (`claude-helper`, `codex-coder`, `mux-helper`) from your credentials, but the README never mentions them, so a user who signs in has no idea what is there or how to try it. | Medium |
| R7 | `wait: true` on invoke returns after 60 seconds with the run still `Running` (HTTP 202). The default is not written down anywhere, and the README example does not mention `waitSeconds`. | Low |

### Docker path (P8.19)

| # | Finding | Severity |
|---|---|---|
| D1 | `./update.sh` builds for minutes and then fails at `docker compose up` with Docker's raw "ports are not available ... 127.0.0.1:8700 ... address already in use". Nothing checks ports before the build. `DOCKER.md` does say to change ports in `.env`, in one sentence below the URL table; the README says nothing. | High |
| D2 | After moving the ports in `.env`, `update.sh` still prints `Dashboard: http://127.0.0.1:8080`, because it reads the shell environment and not `.env`. | Medium |
| D3 | Every document hard-codes 8700, 8701, and 8080, with no reminder that the URLs change when the ports do. | Low |
| D4 | `compose.yaml` pins `container_name` for every service, so a second copy of the stack (or a different `-p` project name) collides on container names. Not documented. | Low |
| D5 | "Several minutes" is the only hint about build time. Here the first `update.sh` took 8 minutes 9 seconds with a partly warm cache; the worker image alone is 2.1 GB. No disk or memory guidance. | Medium |
| D6 | No "how to stop" (`docker compose stop` versus `down` versus `down -v`). | Medium |
| D7 | No description of a healthy stack. `docker compose ps -a` shows `garrison-bootstrap` as `Exited (0)`, which looks like a failure to someone who has not read the compose file. | Low |
| D8 | `docker/.env`, which holds harness credentials, is inside the build context (the repository root) and is not in `.dockerignore`. The Dockerfiles only copy `src/`, so nothing reached an image, but the credentials were still shipped to the builder on every build. | Medium |
| D9 | Once running, everything worked: both workers registered as `Ready`, sign-in with `admin@garrison` / `password` worked, the bootstrap created the three secrets and three sample agents, and Claude Code, Codex, and Mux each answered over REST. A warm `update.sh` took 14 seconds. | (works) |
| D10 | The first Mux run hung: the model endpoint stalled, the run sat in `Running`, and the worker did not kill the harness at the deployment's 600-second deadline. The server eventually marked it `TimedOut`, and the worker only noticed the lost lease and killed Mux 19 minutes after the run started. A retry a few minutes later succeeded in 1.5 seconds, and running Mux by hand in the worker container also worked. This is a product issue, not a documentation one; see "Left open". | High (product) |

### Kubernetes path (P8.20)

minikube is not installed on this machine and installing software was out of scope, so the minikube instructions were reviewed on paper. The production overlay and Helm were also reviewed on paper (no Helm binary, no managed cluster). K3S in Docker was run for real, in a separate container with its own ports and a kubeconfig in the scratch directory.

| # | Finding | Severity |
|---|---|---|
| K1 | `KUBERNETES.md` never says which option to pick or what each one needs installed (kubectl, Docker, openssl; Helm optional; minikube's 4 CPU and 8 GB defaults). | Medium |
| K2 | The K3S-in-Docker recipe runs `docker cp garrison-k3s:/etc/rancher/k3s/k3s.yaml` straight after `docker run`. It fails every time, because K3S has not written the file yet. | High |
| K3 | That recipe publishes 6443 and 8080 on every interface (`-p 6443:6443`), not 127.0.0.1, and gives no guidance when either port is taken. Moving the API port also means editing the server URL in the kubeconfig, which is not mentioned. | Medium |
| K4 | The recipe writes the kubeconfig to `./k3s.yaml` in the repository root, and `.gitignore` does not cover it. That file is a cluster-admin credential one `git add .` away from a commit. | High |
| K5 | The only documented way in is the `garrison.local` Ingress, which needs a hosts-file edit with administrator rights. `curl --resolve` and the port-forward script are alternatives, but only the latter is mentioned, and only in passing. | Low |
| K6 | `port-forward.sh` hard-codes 8700 and 8701 (only the dashboard port can be moved, through an undocumented `DASHBOARD_PORT`). On this machine it failed with "address already in use". | Medium |
| K7 | The administrator API key is random on Kubernetes (see R3); nothing explains how to read it from the `garrison-secrets` Secret. | High |
| K8 | `deploy-k3s.sh --build` took 24 minutes. The Garrison images built and imported in about 20 seconds; 19 minutes went to K3S pulling `postgres:17` (and `busybox`, `curl`) from Docker Hub inside the container, with three other stacks competing for 8 GB of memory. The script imports only the Garrison images, and the documents do not warn that the first deploy pulls these. | Medium |
| K9 | The bootstrap Job's log opens with dozens of `curl: (7) Failed to connect to garrison-server port 8700` lines while it waits for the server, which reads like a failure. | Low |
| K10 | minikube on paper: with the Docker driver on macOS or Windows, the NodePort URLs at `minikube ip` are not reachable from the host. You need `minikube service` or a port-forward. Not documented. The script's default `--memory=8g` also cannot start on a Docker Desktop that only has 8 GB. | Medium |
| K11 | Helm on paper: the commands are right, but the chart neither builds nor imports images, so on a local cluster it depends on pulling `jchristn77/garrison-*` from Docker Hub. Not said. | Low |
| K12 | Production on paper: no mention of `GARRISON_PUBLIC_BASE_URL` (A2A agent cards advertise the request host otherwise) or of how a user reaches MCP through the Ingress. | Low |
| K13 | Changing harness credentials after deploy: the document says to delete the bootstrap Job and apply again, but forgets the step that actually changes the credentials (re-running `generate-secrets.sh` with the new variables). | Medium |
| K14 | `deploy-k3s.bat` copies 2 GB of image tarballs into `%TEMP%` and into the K3S container's `/tmp` and never deletes either. | Low |
| K15 | Once running, the K3S stack was healthy: the bootstrap Job created the secrets and sample agents, `smoke-test.sh` passed in 3.5 seconds, and the Ingress answered at `garrison.local:28090` (through `curl --resolve`). | (works) |

### First configuration (P8.21)

There was no quick start, so I built the configuration from `MANIFESTS.md`, `HARNESSES.md`, `MCP_API.md`, `A2A_API.md`, and `REST_API.md`. The result became `docs/QUICKSTART.md`, `examples/multi-agent.yaml`, and `examples/validate.sh`.

| # | Finding | Severity |
|---|---|---|
| C1 | `MANIFESTS.md` recommends declaring secrets without values and "setting the values once through the API or dashboard", but never shows either. | Medium |
| C2 | `GET .../agents/{name}` answers 404, while `POST .../agents/{name}/invoke` accepts a name. The validation script lists and filters instead. | Low (product) |
| C3 | The dashboard's Delegation dropdown shows the raw values `None`, `AllowList`, and `Any`, and the resource binding Kind shows `McpServer` and `Secret`, though translated labels exist. Dashboard source was out of scope for this task. | Low (dashboard) |
| C4 | There was no browser automation available for this review, so the dashboard route was exercised through the REST calls its forms make (the secret, agent, and deployment for the Mux `researcher` agent). The click-by-click steps in the quick start come from the dashboard's source and English strings, not from clicking. | Note |
| C5 | With the configuration in place, everything held up: four agents on three real harnesses plus the fake harness answered over REST, MCP, and A2A; the SSE stream ended with `run.completed`; Claude Code delegated to the fake harness and to Codex, and the child run showed up under `/children` with `depth 1` and `callChain planner,coder`; the run carried every telemetry field; and the analytics endpoint grouped the runs by agent. | (works) |

### First-pass timings

| Step | Time |
|---|---|
| Clone and read README plus `DOCKER.md` | about 5 minutes |
| `docker/update.sh`, first try (build reused cached layers, then the port conflict) | 8 min 9 s, failed |
| Edit `.env` (ports and credentials), `update.sh` again | 10 min 55 s, of which the stack start was 15 s |
| Warm `update.sh` (nothing changed) | 14 s |
| Sign in and see both workers | under 1 minute |
| K3S container to node `Ready` | about 30 s |
| `deploy-k3s.sh --build` | 24 min 5 s (19 min pulling `postgres:17` inside K3S) |
| `smoke-test.sh` | 3.5 s |
| Secrets, manifest apply, Mux agent | about 2 minutes by hand |
| `examples/validate.sh`, four agents, Docker | 56 s, 30 of 30 checks after two script fixes |
| `examples/validate.sh`, three agents, K3S | 25 of 25 checks |

The ten-minute target of P8.19 (excluding the first build) was met on Docker only after working out the port fix on my own. Without the fix, a user with a busy port 8700 hits a wall right after the longest step.

### A correction to the first pass: the laptop was asleep

During the second pass, a Docker run froze for thirteen minutes, and the macOS power log explained it: the machine spent the whole session in sleep, waking briefly every few minutes (dark wakes), most likely with the lid closed, since sleep happened even with a `caffeinate` assertion held. Docker Desktop's VM stops while the host sleeps. Lining the power log up with the first pass changes three conclusions:

- **D10 is not a Garrison bug.** The Mux run started at 10:19:26 UTC, the host slept seven seconds later, and the worker noticed its lost lease at 10:38:14, right after a wake. The worker never got the chance to enforce the deadline. Mux itself answered in 1.5 seconds once the machine was awake.
- **K8 was mostly sleep.** The 19 minutes "pulling `postgres:17`" spanned four sleep periods; the pull itself took 1 minute 50 seconds by K3S's own account. The fix (importing the images Docker already has) still stands, and on the second pass the whole deploy took 49 seconds.
- **The long build times overstate the work.** The 8- and 11-minute `update.sh` runs both overlap several sleeps. The cold-build figure below has the same problem, which is why the documents now give a range rather than one number.

The friction findings themselves do not depend on timing and stand as written.

## What changed

| Finding | Fix |
|---|---|
| R1, R2, R5, R6 | README "Getting started" now leads with Docker, then Kubernetes, then source, each with its prerequisites and one short block of commands, followed by "Your first agents", which points at the new `docs/QUICKSTART.md`. The sample agents the stacks create are named. |
| R3, R4, K7 | README and the quick start use a session token kept in `$TOKEN`; the README explains `x-api-key` and where its value comes from; `KUBERNETES.md` shows how to read the generated API key and password from `garrison-secrets`. `MANIFESTS.md` shows how `$TOKEN` is set. |
| R7 | `waitSeconds` default (60) documented in `REST_API.md` and the quick start. |
| D1, D2, D3 | `docker/update.sh` and `update.bat` check the four host ports before building (only when the stack is not already running), name the `.env` variable for each busy port, and print the URLs from `.env`. `DOCKER.md` has a section on taken ports; `.env.example` says what to do. |
| D4, D5, D6, D7 | `DOCKER.md` now covers requirements and build time, what a healthy `docker compose ps -a` looks like (including the bootstrap's `Exited (0)`), stop versus down versus reset, and the fixed container names. |
| D8 | `.dockerignore` excludes `.env` files. |
| K1, K10, K11, K12 | `KUBERNETES.md` opens with a table of options, what each needs, and how long the first deploy takes; minikube's Docker-driver and memory caveats; that Helm does not build images; MCP and agent cards behind the production Ingress. |
| K2, K3, K4 | The K3S-in-Docker recipe waits for the kubeconfig, binds 127.0.0.1, writes the kubeconfig to `~/.kube/garrison-k3s.yaml`, and shows how to use other host ports. `.gitignore` ignores `k3s.yaml` and `*.kubeconfig`. |
| K5, K6 | New "Reaching the stack" section: port-forward (now with `REST_PORT`, `MCP_PORT`, `DASHBOARD_PORT` in both `port-forward.sh` and `.bat`, and a busy-port check in the `.sh`) or the Ingress with `--resolve`. |
| K8 | `deploy-k3s.sh --build` also imports `postgres:17`, `busybox:1.36`, and `curlimages/curl:8.10.1` when Docker has them, saving only the local platform (a multi-platform index otherwise fails `ctr import`), and falls back to letting K3S pull. |
| K9 | The bootstrap script waits quietly (`curl -fs`); both copies (`k8s/base/scripts`, Helm `files/`) changed together. |
| K13 | "Updating" now includes re-running `generate-secrets.sh` before recreating the bootstrap Job. |
| K14 | `deploy-k3s.bat` deletes its image tarballs from `%TEMP%` and from the K3S container. |
| C1 | `MANIFESTS.md` shows how to set secret values in the dashboard and the API. |
| P8.21 | New `docs/QUICKSTART.md`, `examples/multi-agent.yaml`, `examples/validate.sh`, `examples/validate.ps1`, and `examples/validate.bat`. |
| New in pass two | The worker Dockerfile now runs `claude --version` and `codex --version` right after installing them (see below). |

## Second pass

The second pass started from a copy of the fixed working tree (nothing was committed), with the same busy ports and a fresh K3S container. Docker was exercised end to end; K3S in Docker the same; minikube, Helm, and the production overlay stayed on paper.

### Docker

`./update.sh` with the default `.env` stopped in half a second and named the three busy ports and the variables to change. After setting 9700, 9701, 9080, and 9433, I rebuilt every layer with `docker compose build --no-cache` to get a cold number.

That cold build turned up the most serious problem of the review. It "succeeded", yet both workers reported `ClaudeCode (claude): unavailable, not installed` and `Codex (codex): unavailable ... Missing optional dependency @openai/codex-linux-arm64`. Claude Code and Codex both ship their native binaries as optional npm dependencies. When those downloads fail (here, interrupted by the host sleeping mid-download), npm prints nothing and moves on, so the image had a 500-byte placeholder where `claude` should be. Runs for `planner` and `coder` then sat in `Queued` with no explanation. The fix is in `src/Garrison.Worker/Dockerfile`: the install step now runs `claude --version` and `codex --version` (and `gemini --version` when Gemini is included), so a partial install fails the build instead of being cached. The rebuilt image printed `2.1.296 (Claude Code)` and `codex-cli 0.159.3`, and every harness probed `available`.

After that, the quick start ran as written, block by block, on the moved ports: secrets, dry run, apply, the Mux agent, REST for all four agents, MCP, A2A, the event stream, a delegation from `planner` to `coder` (`depth 1`, `callChain planner,coder`, answer `def reverse_string(s): return s[::-1]`), the run's telemetry, and analytics grouped by agent. `examples/validate.sh` passed 30 of 30 with four agents; `validate.ps1` (through `pwsh` on macOS) passed as well.

### K3S in Docker

Following the new recipe with other host ports (26443 and 28090) and a kubeconfig outside the repository: the kubeconfig was ready on the first try thanks to the wait loop, and the node was `Ready` five seconds later. The first `deploy-k3s.sh --build` failed while importing `postgres:17` (the multi-platform index problem above, found here and fixed), and the second completed in 49 seconds. `smoke-test.sh` passed. The bootstrap log opened with two clean lines instead of a screen of curl errors. `port-forward.sh` refused 8700 with a message naming the variables, then ran on 29700, 29701, and 29080. The Ingress answered through `curl --resolve`. The quick start and `validate.sh --agents "planner coder echo researcher" --delegate coder` passed 30 of 30.

### Second-pass timings

| Step | Time |
|---|---|
| Copy the working tree | a few seconds |
| `update.sh` with busy ports | 0.5 s, stops with the fix named |
| `docker compose build --no-cache`, all images | 18 min 28 s wall clock, with the host asleep for part of it; this is the build that produced the broken worker |
| Worker rebuild with the new check | 33 min wall clock on the same slow, sleeping link; the npm step alone took 29 minutes |
| `update.sh`, warm | 13 s; both workers `Ready` 1 s later |
| `update.sh` after the Dockerfile change | 5 min 23 s, because the server image's `COPY src/` layer includes the worker Dockerfile and triggered a fresh NuGet restore |
| Quick start steps 4 to 7 (MCP, A2A, stream, delegation, telemetry, analytics) | 28 s |
| `validate.sh`, four agents, Docker | about 1 minute, 30 of 30 |
| K3S container to node `Ready` | 5 s |
| `deploy-k3s.sh --build` (images already built) | 49 s |
| `smoke-test.sh` | 3 s |
| `validate.sh`, four agents, K3S | about 1 minute, 30 of 30 |

On a machine that stays awake, a warm Docker path from `./update.sh` to signing in and seeing both workers takes under a minute, and K3S in Docker takes about two. Both are well inside the ten-minute target of P8.19 and P8.20 once the images exist. The cold build is the long pole and depends almost entirely on the network.

## Left open

- **Agent card URLs.** `GARRISON_PUBLIC_BASE_URL` drives both the A2A agent cards and the `garrison.apiUrl` given to runs. Docker and the Kubernetes base set it to the in-network address so runs work, which means cards fetched from the host advertise `http://garrison-server:8700/...`. Documented as a caveat; the product fix is a separate public URL for cards.
- **`GET .../agents/{name}` answers 404** while invoke accepts names.
- **A run for a harness no worker has waits in `Queued` indefinitely**, with nothing in the run, the dashboard, or the logs that says why. A warning event, or a rejection after a timeout, would have saved a lot of head-scratching during the broken-image episode.
- **Dashboard labels.** The Delegation dropdown shows `None`, `AllowList`, `Any` and the resource binding Kind shows `McpServer`, `Secret` instead of their translated labels.
- **Not exercised here:** clicking through the dashboard (no browser automation; the quick start's dashboard steps come from the source and its English strings, and the same records were created through the REST calls those forms make), minikube, Helm, and the production overlay.
- **Worker deadline enforcement while the host sleeps** is not a bug, but laptops sleep. The documents could say that runs started on a laptop that then sleeps will time out or be requeued; I did not add that.
