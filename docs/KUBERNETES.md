# Running Garrison on Kubernetes

Garrison ships as three images and a set of Kubernetes manifests. The control plane (`garrison-server`) is a stateless Deployment. Worker nodes (`garrison-worker`) are a StatefulSet, so each pod gets a stable name that doubles as its Garrison node name, plus its own workspace volume. The dashboard (`garrison-dashboard`) is a small nginx Deployment that serves the console and proxies the REST API, so a browser only ever talks to one origin.

Everything lives under `k8s/`:

| Path | What it is |
|---|---|
| `k8s/base` | The workloads, services, network policies, the bootstrap Job, and the sample agent manifests. No secrets and no database. |
| `k8s/components/postgres` | An in-cluster PostgreSQL 17 StatefulSet for installs that do not have a database yet, with `max_connections` 200 (room for four server replicas at the shipped pool of 40; `docs/SCALING.md`, "Connections"). |
| `k8s/components/smoke-test` | A fake-harness agent and a Job that invokes it end to end. |
| `k8s/components/observability` | Prometheus, Loki, Tempo, Grafana, and Alloy (see "Observability"). |
| `k8s/components/worker-pools` | A second worker StatefulSet (a Mux pool) next to the default pool, each with its own harness set. |
| `k8s/components/hpa-custom-metrics` | Optional HPA metrics (request rate, active runs) served by Prometheus Adapter. |
| `k8s/components/postgres-backup` | A nightly `pg_dump` CronJob writing to a PersistentVolumeClaim (`docs/BACKUP.md`). |
| `k8s/overlays/minikube` | Base plus Postgres, NodePort services, and smaller resource requests. |
| `k8s/overlays/k3s` | Base plus Postgres and a Traefik Ingress for `garrison.local`. |
| `k8s/overlays/production` | External database, three control-plane replicas with an HPA, disruption budgets, spread, and an ingress-nginx Ingress with TLS. |
| `k8s/overlays/k3s-worker-pools`, `k8s/overlays/production-custom-metrics` | Examples that add the worker-pools and custom-metrics components to an overlay. |
| `k8s/helm/garrison` | A Helm chart that renders the same resources. |
| `k8s/scripts` | Deploy, update, reset, smoke-test, and port-forward helpers, each as a `.sh` and `.bat` pair. |
| `k8s/tests` | Scale, rolling-upgrade, and chaos tests on a throwaway k3d cluster (`docs/SCALING.md`), and the isolation red-team test (`isolation-test.sh`, `docs/SECURITY.md`). |

## Which option to use

| Option | Pick it when | You need | First deploy |
|---|---|---|---|
| k3d (K3S in Docker) | You want a real cluster on macOS or Windows, where K3S does not run natively | Docker, `kubectl`, `openssl`, k3d (`brew install k3d`) | 1 to 10 minutes: cluster start, the image build, and the import |
| K3S in Docker, by hand | The same without installing k3d | Docker, `kubectl`, `openssl` | 5 to 25 minutes: the image build, plus K3S pulling Postgres and two small images on a slow link |
| K3S on a host | You run K3S already, on a VM or a small server | `kubectl` pointed at it, Docker, `sudo` for `k3s ctr` | about the same |
| minikube | You already use minikube | minikube, `kubectl`, `openssl`, 4 CPUs and 8 GB for the VM by default | similar; images build inside minikube |
| Production overlay or Helm | A shared cluster with a managed PostgreSQL and an ingress controller | `kubectl` (and `helm` for the chart), published images or your own registry | depends on the cluster |

Helm is optional everywhere: the scripts use Kustomize, which is built into `kubectl`. The local overlays create namespace `garrison` with one server, two workers, the dashboard, Postgres and a bootstrap Job. Production has three control-plane replicas and expects an external database. Bootstrap creates sample agent records and only creates their deployments when the corresponding credentials or endpoint are configured.

## Secrets come first

Nothing secret is committed. Before the first deploy, `k8s/scripts/generate-secrets.sh` creates application Secrets and a Grafana Secret in the `garrison` namespace with random values:

- `garrison-secrets` holds the master key that encrypts stored credentials, the token signing key, the administrator API key, the administrator password, the database password, and the default administrator access and secret keys.
- `garrison-node-credential` holds the access and secret key that workers use to authenticate. The server seeds a matching credential with the `NodeAgent` role on first boot.
- `garrison-harness-credentials` is optional. It is built from whatever of these variables are set in your shell: `ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`, `OPENAI_API_KEY`, `MUX_BASE_URL`, `MUX_MODEL`, `MUX_API_KEY`, `MUX_ADAPTER_TYPE`, plus optional `MUX_CONTEXT_WINDOW`, `MUX_MAX_TOKENS`, and `CODEX_AUTH_JSON_FILE`, the path to a dedicated Codex login auth.json. Garrison refreshes stored Codex tokens on the control plane; sharing that login with another active installation can invalidate rotated refresh tokens. Create a separate login as described in the [quick start](QUICKSTART.md#1-store-the-credentials).

The script keeps existing `garrison-secrets` and `garrison-node-credential` values on re-runs, because rotating them after first boot changes keys that are already seeded in the database. Pass `--force` only when you mean to start over. The administrator signs in to tenant `default` as `admin@garrison` with the password from `GARRISON_ADMIN_PASSWORD`, or a random one when that variable is not set, which the script prints once. There is no default password, and the server refuses to start with the public built-in defaults (SR-08). The other keys are random, including the administrator API key that some examples send as `x-api-key` (where they show `garrisonadmin`, use yours); read it from the Secret:

```bash
kubectl -n garrison get secret garrison-secrets -o jsonpath='{.data.admin-api-key}' | base64 --decode; echo
kubectl -n garrison get secret garrison-secrets -o jsonpath='{.data.admin-password}' | base64 --decode; echo
```

Signing in with email and password (`POST /v1.0/token`, or the dashboard) works the same way on every runtime, so most people never need the API key.

The SDK examples and test harnesses can also sign in with the default administrator access and secret keys. On Docker they are generated into `docker/.env`, and only a source build in development mode uses `access_garrison_default` and `secret_garrison_default_change_me`. Here they are random and live in the same Secret under `default-access-key` and `default-secret-key`:

```bash
kubectl -n garrison get secret garrison-secrets -o jsonpath='{.data.default-access-key}' | base64 --decode; echo
kubectl -n garrison get secret garrison-secrets -o jsonpath='{.data.default-secret-key}' | base64 --decode; echo
```

Harness credentials never become worker environment variables. The bootstrap Job turns each one that is present into a Garrison secret record, encrypted with the master key, and the sample deployments bind those records by alias. That keeps credentials per tenant and lets Garrison scrub them from logs and run output. One caution about `CLAUDE_CODE_OAUTH_TOKEN` and Codex subscription logins: using a personal subscription on a shared, multi-user server may conflict with the provider's terms. API keys are the safer choice for anything shared.

`k8s/secrets.example.yaml` shows the shape of every Secret if you would rather feed them from an external secret manager.

## minikube

```bash
export ANTHROPIC_API_KEY=...        # optional, any of the harness variables above
k8s/scripts/deploy-minikube.sh
```

The script starts minikube when it is not running (with `MINIKUBE_CPUS`, default 4, and `MINIKUBE_MEMORY`, default `8g`), builds all three images straight into minikube's image store (so nothing is pulled), generates secrets, applies `overlays/minikube`, waits for every rollout and for the bootstrap Job, and prints the URLs. The dashboard is on NodePort 30880, the REST API on 30870, and MCP on 30871 at the address `minikube ip` reports. Set `SKIP_BUILD=1` to reuse images you already built.

If you already built the images with Docker (for example with `docker/update.sh` or `deploy-k3s.sh --build`), loading them is much faster than building inside minikube:

```bash
minikube start --driver=docker --cpus=4 --memory=3g
for i in server worker dashboard; do minikube image load jchristn77/garrison-$i:v0.2.0; done
SKIP_BUILD=1 k8s/scripts/deploy-minikube.sh
```

Verified with minikube 1.39.0 on the Docker driver with 3 GB, alongside another cluster: every pod Ready in about 30 seconds, `examples/validate.sh` 25 of 25 with Claude Code, Codex, and Mux. The Helm chart passes the same check on minikube (`helm install garrison k8s/helm/garrison -n garrison -f k8s/helm/garrison/values-minikube.yaml` after `generate-secrets.sh`).

Two things catch people on macOS and Windows. With minikube's Docker driver, the `minikube ip` address is not reachable from the host, so the NodePort URLs time out; use `k8s/scripts/port-forward.sh` (or `minikube service -n garrison garrison-dashboard`) instead. And the default 8 GB does not fit inside a Docker Desktop that only has 8 GB itself; start with `MINIKUBE_MEMORY=6g` or give Docker more.

## K3S

On a host that already runs K3S, point `kubectl` at it and run:

```bash
k8s/scripts/deploy-k3s.sh --build
```

`--build` builds the images with Docker and imports them with `sudo k3s ctr images import`. Without it, the overlay pulls `jchristn77/garrison-*` images at the tag pinned in `k8s/base/kustomization.yaml`.

K3S itself only runs on Linux. On macOS and Windows it runs inside Docker, and k3d is the standard tool for that:

```bash
brew install k3d                     # or see https://k3d.io for other platforms
k3d cluster create garrison --api-port 127.0.0.1:6550 -p "127.0.0.1:8080:80@loadbalancer"
K3D_CLUSTER=garrison k8s/scripts/deploy-k3s.sh --build
```

k3d switches `kubectl` to the new cluster. With `K3D_CLUSTER` set, the script imports images with `k3d image import`. The ingress answers on `http://127.0.0.1:8080` with the host header `garrison.local` (add `127.0.0.1 garrison.local` to your hosts file and open `http://garrison.local:8080`), or use `k8s/scripts/port-forward.sh`. Pick other host ports if 6550 or 8080 is taken. Remove the cluster with `k3d cluster delete garrison`. Verified with k3d 5.9.0 (K3S 1.35.5): `examples/validate.sh` 25 of 25.

Without k3d, you can run the K3S container yourself. From the repository root:

```bash
docker run -d --name garrison-k3s --privileged -p 127.0.0.1:6443:6443 -p 127.0.0.1:8080:80 rancher/k3s:v1.31.4-k3s1 server
until docker exec garrison-k3s test -s /etc/rancher/k3s/k3s.yaml; do sleep 2; done   # K3S writes it a few seconds after start
mkdir -p ~/.kube && docker cp garrison-k3s:/etc/rancher/k3s/k3s.yaml ~/.kube/garrison-k3s.yaml
export KUBECONFIG=~/.kube/garrison-k3s.yaml
until kubectl get nodes 2>/dev/null | grep -q ' Ready'; do sleep 2; done
K3S_CONTAINER=garrison-k3s k8s/scripts/deploy-k3s.sh --build
```

The kubeconfig is a cluster-administrator credential, which is why it goes in `~/.kube` and not in the repository. With `K3S_CONTAINER` set, the script imports the images into that container instead of the host: the three Garrison images, plus `postgres:17`, `busybox:1.36`, and `curlimages/curl:8.10.1` when your Docker already has them. Anything it cannot import, K3S pulls from Docker Hub, which on a slow link is most of the first deploy's time. `deploy-k3s.sh` returns once every rollout is done and the bootstrap Job has finished.

If 6443 or 8080 is taken on your machine, publish other host ports and point the kubeconfig at the API port you chose:

```bash
docker run -d --name garrison-k3s --privileged -p 127.0.0.1:16443:6443 -p 127.0.0.1:18080:80 rancher/k3s:v1.31.4-k3s1 server
# after the docker cp above:
sed -i.bak 's#https://127.0.0.1:6443#https://127.0.0.1:16443#' ~/.kube/garrison-k3s.yaml
```

To remove the whole cluster afterwards: `docker rm -f -v garrison-k3s` and delete `~/.kube/garrison-k3s.yaml`.

## Reaching the stack

Two ways in, and you can use both.

**Port-forward** needs no DNS and no ingress:

```bash
k8s/scripts/port-forward.sh                                     # REST 127.0.0.1:8700, MCP 8701, dashboard 8080
REST_PORT=9700 MCP_PORT=9701 DASHBOARD_PORT=9080 k8s/scripts/port-forward.sh   # when those are taken
```

It keeps running in the foreground; Ctrl+C stops it. The Windows script reads the same three variables.

**The Ingress.** The K3S overlay creates a Traefik Ingress for host `garrison.local`, which serves the dashboard at `/`, the REST API under `/v1.0`, and MCP under `/mcp`. Agentic apps need no extra rule: the app UI at `/apps/{slug}/` is served by the dashboard and the app gateway under `/v1.0/apps/` by the server, so both fall under the existing paths ([APP_UI.md](APP_UI.md#kubernetes)). Add `127.0.0.1 garrison.local` to your hosts file (`/etc/hosts`, which needs `sudo`) and open `http://garrison.local:8080` with K3S in Docker, or `http://garrison.local` on a host install. Without editing the hosts file, curl can still reach it:

```bash
curl -s --resolve garrison.local:8080:127.0.0.1 http://garrison.local:8080/v1.0/api/health
```

Sign in as `admin@garrison` in tenant `default` with the password `generate-secrets.sh` printed (a random one, unless you set `GARRISON_ADMIN_PASSWORD`; there is no default, and the server refuses the public built-in defaults). From there, `docs/QUICKSTART.md` builds a set of agents that delegate to each other and checks them with `examples/validate.sh`.

A note on A2A agent cards: cards advertise the external URL, not the in-cluster address runs use. The base leaves `GARRISON_EXTERNAL_BASE_URL` unset, so a card shows whatever host the caller used: `http://127.0.0.1:8700/...` through a port-forward, `http://garrison.local/...` through the K3S Ingress. The production overlay and `values-production.yaml` set it to `https://garrison.example.com`; change that to your Ingress host.

## Checking that it works

```bash
k8s/scripts/smoke-test.sh
```

The smoke test needs no model credentials. It applies a `smoke-echo` agent that runs `garrison-fake-harness`, invokes it through the REST API with `wait=true`, and fails unless the run reaches `Succeeded`. A pass means the request went through authentication, the scheduler, a worker lease, a real harness process, and run completion.

It takes a few seconds. To see the state of everything:

```bash
kubectl -n garrison get pods,jobs          # server, dashboard, postgres, and workers Running; bootstrap Completed
kubectl -n garrison logs job/garrison-bootstrap
kubectl -n garrison logs statefulset/garrison-worker | grep harness   # which harness CLIs the worker found
```

## Production

`overlays/production` assumes you bring a managed PostgreSQL and a TLS certificate:

1. Create Secret `garrison-db` with keys `host`, `port`, `database`, `username`, and `password`.
2. Create Secret `garrison-tls` for your host name, for example with cert-manager.
3. Replace `garrison.example.com` in `overlays/production/ingress.yaml`.
4. Pin image tags with `kustomize edit set image` or an `images:` block in your own overlay. Never deploy `latest`.
5. Run `generate-secrets.sh`, then `kubectl apply -k k8s/overlays/production`.

The production Ingress routes `/mcp` to the server's MCP listener and everything else as in the K3S overlay, so MCP clients use `https://<your host>/mcp`. If A2A clients outside the cluster discover agents through their cards, see the note on agent cards under "Reaching the stack".

The overlay runs three control-plane replicas spread across zones and nodes, an HPA between two and ten replicas on CPU, disruption budgets that let a drain take one server and one worker at a time, and four workers with 50 GiB workspaces. "Autoscaling" and "Placement and disruption budgets" below explain the choices and how to tighten them. Ingress buffering is off and timeouts are an hour, because run events stream over SSE and workers long-poll for leases.

Multiple control-plane replicas need PostgreSQL. The server refuses to start on SQLite when `GARRISON_EXPECTED_REPLICAS` is greater than one.

## Helm

The chart in `k8s/helm/garrison` renders the same resources as the Kustomize base and components. It expects the same Secrets, so run `generate-secrets.sh` first:

```bash
k8s/scripts/generate-secrets.sh
helm install garrison k8s/helm/garrison -n garrison -f k8s/helm/garrison/values-k3s.yaml --set smokeTest.enabled=true
helm test garrison -n garrison
```

The chart does not build or import images. On a local cluster, run `deploy-k3s.sh --build` or `deploy-minikube.sh` once first (or build and import the images yourself), or the pods pull `jchristn77/garrison-*` from Docker Hub.

`values-minikube.yaml`, `values-k3s.yaml`, and `values-production.yaml` match the overlays, and `values-worker-pools.yaml` adds a second worker pool on top of any of them (see "Worker pools"). The most useful values are `image.tag`, `database.mode` (`embedded` or `external`), `server.hpa`, `ingress`, and `workerPools`. Each entry in `workerPools` becomes its own StatefulSet with its own labels, concurrency, storage, node selector, and tolerations, which is how you put GPU-backed Mux workers in one pool and Claude Code workers in another. The bootstrap Job runs as a post-install and post-upgrade hook.

The chart keeps copies of the sample manifests, settings, and scripts under `files/`. CI diffs them against `k8s/base` and `k8s/components`, so change both places together.

## Scaling

Workers scale by replica count. Each new pod registers itself under its pod name, advertises the harnesses it found, and starts pulling work:

```bash
kubectl -n garrison scale statefulset/garrison-worker --replicas=6
```

Scaling down is safe. A worker that receives SIGTERM stops leasing new runs and waits for its running harnesses to finish, for up to the 900-second termination grace period. Raise `terminationGracePeriodSeconds` if your runs take longer.

The control plane scales the same way on PostgreSQL. Replicas are interchangeable because workers pull work and never need to be reached by the server, so REST, A2A, and event streams need no session affinity (`docs/SCALING.md` covers MCP). Set `GARRISON_EXPECTED_REPLICAS` to match so the startup checks know the deployment is clustered. Each server pod registers itself under its pod name as a control node; `GET /v1.0/api/control-nodes` lists them with their status, version, and which one leads (`docs/SCALING.md`).

Both the Kustomize base and the chart roll the server out with `maxSurge: 1` and `maxUnavailable: 0`: a new replica has to pass its readiness probe before an old one is told to stop, so an upgrade never drops below the current replica count. Each old replica gets five seconds (`preStop`) to leave the Service endpoints before SIGTERM, and 30 seconds in total to finish.

The server's probes split the work. The startup probe calls `/v1.0/api/health/live` on 8700, which answers while the replica migrates. Readiness calls `/v1.0/api/health/ready` on 8700 every 5 seconds and is what takes an overloaded or database-less replica out of the Service. Liveness calls `/v1.0/api/health/live` on the separate liveness port 8702 every 10 seconds with a 10-second timeout and restarts the container only after 6 failures in a row (a minute). That port is answered by its own thread and never waits for the database or the REST request queue, so overload makes a replica unready, never restarted.

Every replica's connection pool has to fit PostgreSQL's `max_connections`: `maxReplicas x (Database.MaxPoolSize + 2) + 13`. The base sets the pool to 40 and the postgres component allows 200 connections (four replicas); the production overlay sets the pool to 20 for up to ten HPA replicas, which needs at least 250 connections on your PostgreSQL. With Helm, `server.dbMaxPoolSize` and `database.embedded.maxConnections` set the two, and the chart refuses to render an embedded combination that does not fit. `docs/SCALING.md` has the table.

### Autoscaling

The production overlay and `values-production.yaml` scale the server between two and ten replicas at 70% CPU. Scaling up is quick (up to two pods a minute after 30 seconds above target) and scaling down is slow (one pod every two minutes after five minutes below target), because every replica that goes away makes its worker long polls and SSE subscribers reconnect. CPU needs metrics-server, which most managed clusters run.

CPU is a lagging signal for a control plane that spends much of its time waiting on the database, so two more metrics are available through [Prometheus Adapter](https://github.com/kubernetes-sigs/prometheus-adapter). Both are optional; nothing in the base install needs the adapter.

| Metric | API | Meaning | Default target |
|---|---|---|---|
| `garrison_http_requests_per_second` | `custom.metrics.k8s.io` (Pods) | REST requests per second per server pod, from `garrison_http_requests_total` | 50 per pod |
| `garrison_runs_active` | `external.metrics.k8s.io` | Runs executing on all workers in the namespace, from the workers' `garrison_worker_runs_active` | 100 per server replica |

To turn them on:

1. Run a Prometheus that scrapes Garrison and keeps the `namespace` and `pod` labels. `k8s/components/observability` does; so does any Prometheus that honors the `prometheus.io/*` annotations with the usual relabeling.
2. Install the adapter with the values file from the component. It points at `garrison-prometheus`; change `prometheus.url` for your own Prometheus.
   ```bash
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm install garrison-metrics prometheus-community/prometheus-adapter -n garrison \
     -f k8s/components/hpa-custom-metrics/prometheus-adapter-values.yaml
   kubectl get --raw "/apis/custom.metrics.k8s.io/v1beta1/namespaces/garrison/pods/*/garrison_http_requests_per_second"
   kubectl get --raw "/apis/external.metrics.k8s.io/v1beta1/namespaces/garrison/garrison_runs_active"
   ```
3. Add `components/hpa-custom-metrics` to your production overlay (`overlays/production-custom-metrics` is the example), or with Helm set `server.hpa.customMetrics.requestsPerSecond.enabled=true` and `server.hpa.customMetrics.runsActive.enabled=true`.
4. Watch `kubectl -n garrison describe hpa garrison-server`. The HPA takes the highest replica count any metric asks for.

Install the adapter before you add the metrics. An HPA that cannot read one of its metrics still scales up on the others but refuses to scale down, so a forgotten adapter shows up as a control plane stuck at its high-water mark. Only one adapter can serve each metrics API in a cluster; if you already run one (or KEDA, which registers the external API), add the two rules from `prometheus-adapter-values.yaml` to it instead. The targets are starting points: measure with `k8s/tests/loadtest.sh` and set them from your own numbers.

### Placement and disruption budgets

Every placement rule that ships is a preference, not a requirement, so a single-node minikube or K3S cluster schedules everything. The base spreads servers and workers across hosts (`topologySpreadConstraints` on `kubernetes.io/hostname` with `ScheduleAnyway`). The production overlay adds zone spread, pod anti-affinity that keeps server replicas on different hosts, and a weaker preference that keeps workers off hosts that run a server so a busy harness cannot starve the API. In Helm the same knobs are `server.podAntiAffinity` (`soft`, `hard`, or `none`), `server.topologySpreadConstraints`, `workerDefaults.topologySpreadConstraints`, and each pool's `affinity`.

Once a cluster has at least as many nodes (and zones) as server replicas, harden the server rules: `podAntiAffinity: hard` and `whenUnsatisfiable: DoNotSchedule` in Helm, or the `required...` and `DoNotSchedule` forms in your overlay. Hard rules on a cluster that is too small leave replicas Pending, which is worse than two replicas sharing a node.

Disruption budgets apply to voluntary disruptions such as node drains and cluster upgrades. The server budget is `maxUnavailable: 1` rather than `minAvailable: 1`: with the HPA at its minimum of two replicas, a drain can always proceed, and it never takes two at once. The worker budget is also `maxUnavailable: 1`, and since an evicted worker drains its harnesses for up to fifteen minutes, draining a node full of workers is slow by design. Both budgets set `unhealthyPodEvictionPolicy: AlwaysAllow`, so a pod that never became ready cannot block a drain. Budgets are off in the chart's default values, because a budget on a single replica makes `kubectl drain` wait forever; `values-production.yaml` turns them on. A pod covered by two budgets cannot be evicted at all, which is why each worker pool gets its own (see "Worker pools").

### Worker pools

A worker pool is a StatefulSet of workers that share a harness set, a set of labels, and a Garrison node pool. Pools are how you keep GPU-backed Mux workers apart from Claude Code workers, give one team its own capacity, or put workers with different credentials or images on different Kubernetes node pools.

Three things decide where a run goes, and a pool can use any of them:

| Mechanism | Worker side | Deployment side |
|---|---|---|
| Harness capability | The probes in the worker's settings decide which harnesses it reports; a pool that does not probe `mux` never gets Mux runs | Nothing to do: the scheduler only leases a run to a worker that reports the run's harness |
| Labels | `GARRISON_WORKER_LABELS` (`garrison.io/pool=<pool>` plus anything else, for example `tier=gpu`) | `nodeSelector` in the deployment, for example `garrison.io/pool: mux` |
| Node pool | `GARRISON_WORKER_NODE_POOL`; Garrison creates the node pool when the first worker registers with that name | The deployment's node pool (`nodePoolId`, set through the REST API or the dashboard) |

With Kustomize, `components/worker-pools` turns the base into two pools: `garrison-worker` (pool `default`, probing Claude Code, Codex, Gemini, and the fake harness) and `garrison-worker-mux` (pool `mux`, probing Mux and the fake harness). The Mux pool prefers Kubernetes nodes labeled `garrison.io/node-pool=mux` and comments show the hard selector and toleration for a dedicated, tainted node pool. `overlays/k3s-worker-pools` applies it on K3S:

```bash
kubectl apply -k k8s/overlays/k3s-worker-pools
kubectl label node <node> garrison.io/node-pool=mux        # optional; the pool runs anywhere without it
```

With Helm, each entry in `workerPools` is a pool: `name` becomes the pool name, the pod label `garrison.io/pool`, and the first worker label; `labels` adds more; `harnesses` (a list of `claude`, `codex`, `mux`, `gemini`, `opencode`, `pi`, `fake`, `provider-api`) or `probes` limit what it advertises; `image` swaps the image; `nodeSelector`, `tolerations`, and `affinity` place it. `values-worker-pools.yaml` is the two-pool example. Every pool keeps `app.kubernetes.io/name=garrison-worker`, so network policies, Prometheus (which records the pool as the `pool` label), and the Grafana dashboards treat all pools alike.

To send a deployment to a pool explicitly, select its labels in the manifest:

```yaml
apiVersion: garrison/v1
kind: Deployment
metadata:
  name: mux-gpu
spec:
  agent: assistant
  harnessProfile: builtin/mux
  nodeSelector:
    garrison.io/pool: mux
```

A queued run that no pool can take says why: its `blockedReason` is `NoCapableWorker` when no Ready worker reports the harness, `NoMatchingPool` when capable workers exist but none matches the node pool or selector, and `NoIsolatingWorker` when the run is `Untrusted` and no Ready worker with its harness can isolate it.

### Pod-per-run executor

By default a run is a subprocess of the worker that leased it, inside the worker's container. A deployment can instead ask for its own pod per run: set `executor: KubernetesJob` on the deployment (or `defaultExecutor` on its node pool). The worker that leases such a run creates a Kubernetes Job for it, streams the pod's log, relays its events, keeps the lease, and reports the completion, exactly as for a subprocess run. The run pod never talks to the control plane or the Kubernetes API.

What happens for one run:

1. The worker creates a Job named `garrison-run-<run>-<hash>-<epoch>` in the run namespace, labelled `garrison.io/run-id`, `garrison.io/worker`, `garrison.io/tenant`, and `garrison.io/epoch`, with `backoffLimit: 0`, `ttlSecondsAfterFinished` (300 by default), and an `activeDeadlineSeconds` backstop of the run timeout plus the pending timeout plus grace.
2. It then creates a Secret holding the compiled execution spec, with an owner reference to the Job, so Kubernetes deletes the Secret together with the Job.
3. The pod runs the worker image with `garrison-worker run-one --spec /run/garrison/spec.json`. `run-one` builds the work, home, and config directories on emptyDir volumes, runs the harness with the same process executor and run guards as a subprocess run, and writes events and the completion to stdout. Each line starts with `@@garrison:<nonce>:<sequence>`, where the nonce is a random value the worker generated for this run and passed only inside the Secret. The worker ignores every line without that exact prefix at the start, so harness output that imitates the format is never taken as an event or a completion.
4. Cancelling the run, or the run timing out, deletes the Job with foreground propagation: the pod gets SIGTERM, then SIGKILL after its grace period. A finished Job stays until its TTL so you can read its log.
5. On start, and every minute after, each worker deletes the unfinished Jobs labelled with its own name for runs it no longer holds. After a worker restart that is every Job it had; the control plane requeues those runs (under the `AtLeastOnce` effect policy) or fails them with `NodeLost` when their leases expire.

Failures that never reach the harness end with outcome `PodFailed` and a message that says what happened: the pod stayed Pending longer than the pending timeout (with the scheduler's reason, for example `Insufficient memory`), the image could not be pulled, the container configuration was invalid, the container was OOMKilled (with its memory limit), the pod was evicted, or `run-one` exited without reporting a completion.

**Resources.** `podResources` on the deployment sets the run pod's `cpuRequest`, `cpuLimit`, `memoryRequest`, `memoryLimit`, `ephemeralStorageRequest`, and `ephemeralStorageLimit` (Kubernetes quantities such as `500m`, `2`, `512Mi`, `4Gi`). Anything unset comes from the worker's `Kubernetes.DefaultResources` (requests 100m CPU and 256Mi memory, limits 2 CPU, 4Gi memory, and 10Gi ephemeral storage).

```yaml
apiVersion: garrison/v1
kind: Deployment
metadata:
  name: helper-isolated
spec:
  agent: claude-helper
  harnessProfile: builtin/claude-code
  executor: KubernetesJob
  podResources:
    cpuRequest: 500m
    memoryLimit: 2Gi
    ephemeralStorageLimit: 5Gi
```

**Workspaces.** Job runs use an emptyDir workspace that disappears with the pod. A workspace template of kind `PersistentVolume` names an existing PersistentVolumeClaim (`persistentVolumeClaim`) in the run namespace; the claim is mounted at the run's workspace path and its contents persist across runs. Garrison does not create the claim, and retention never deletes it. A run mounts a claim only when the claim carries the label `garrison.io/tenant` with the run's tenant identifier as its value, so a tenant cannot name the PostgreSQL backup claim, the Loki or Tempo claims, or another tenant's claim (SR-09). Label each claim you hand to a tenant, for example `kubectl -n garrison label pvc shared-repo garrison.io/tenant=default`. The worker reads the claim before it creates the Job; a missing, unlabeled, or other-tenant claim fails the run with outcome `WorkspaceFailed` and a message naming the claim. Use `ReadWriteMany` storage if several runs may use the claim at once. Only `KubernetesJob` deployments can use these templates. Structured output repairs resume the harness session in the directories of the original execution, which a run pod does not keep, so Job runs that fail schema validation are not repaired.

**Placement.** Workers report the `KubernetesJob` executor only when `GARRISON_WORKER_KUBERNETES_ENABLED` is `true`, they run in a cluster (or have `GARRISON_WORKER_KUBECONFIG`), they know the run image, and a SelfSubjectAccessReview confirms their Role. The scheduler gives `KubernetesJob` runs only to such workers and keeps filtering in SQL, so a backlog of Job runs never starves Process-only workers. A queued Job run with no capable worker shows `blockedReason: NoCapableWorker` and a message naming the executor. Deployments with `trustLevel: Untrusted` (P11.14) need at least Container isolation: an unset executor resolves to `KubernetesJob` for them, and their runs queue with `blockedReason: NoIsolatingWorker` until a worker reporting `KubernetesJob` is Ready. Job runs still count against the worker's `MaxConcurrentRuns`, even though the harness does not run in the worker's container.

**What the manifests set up.** `base/rbac.yaml` gives the `garrison-worker` service account a Role in its namespace: create, get, list, watch, and delete Jobs; create Secrets (never get, list, or watch them); get, list, and watch pods; get `pods/log`; create, get, list, and delete NetworkPolicies (for egress allowlists, below); get PersistentVolumeClaims (to check a PersistentVolume workspace's `garrison.io/tenant` label). Nothing is cluster-wide. The worker StatefulSet mounts its token and sets `GARRISON_WORKER_KUBERNETES_ENABLED=true` and `GARRISON_WORKER_RUN_EGRESS_ALLOWLISTS=true`. `base/serviceaccounts.yaml` adds `garrison-run`, the run pods' account, which has no RoleBindings and whose token run pods never mount. `base/networkpolicies.yaml` adds two run policies:

- `garrison-run` selects every run pod: no ingress, and egress only to DNS and the Garrison MCP port on the server (for delegation).
- `garrison-run-default-egress` selects run pods without the `garrison.io/egress` label and adds port 443 anywhere except link-local addresses (`169.254.0.0/16`), which hold the cloud instance metadata service (SR-23).

It also limits the server's and workers' own egress: any pod in the cluster (DNS, Postgres, the server, run pods) and any address outside it except `169.254.169.254`. Both fetch tenant-chosen URLs (MCP server tests, S3 endpoints, MCP preflight), and a request to the metadata service would carry the node's cloud identity. On an IPv6 cluster in AWS, add `fd00:ec2::254/128` to the same `except` lists. The Helm chart renders the same policies.

Edit the default rule (or, in Helm, `kubernetesExecutor.runEgress`) to the endpoints your harnesses need. Keep its `DoesNotExist` selector: a rule that also selected allowlisted pods would widen their egress, and workers then stop reporting egress control.

**Egress allowlists (P11.15).** A deployment with `egressRules` (CIDR, optional port, protocol; see `docs/SECURITY.md`, "Egress allowlists") narrows its run pods to DNS, the MCP port, and those rules. Its runs need the `EgressControl` capability, so only a worker that enforces allowlists claims them; with none Ready they queue with `blockedReason: NoIsolatingWorker`.

For each such run the worker:

1. builds the Job and pod with the label `garrison.io/egress: allowlist`, so `garrison-run-default-egress` never selects the pod;
2. creates the NetworkPolicy `<job>-egress`, owned by the Job, before the spec Secret, so it exists before `run-one` can start. The policy selects that pod by run ID and epoch, has `policyTypes: [Egress]`, and allows DNS, the server MCP port, and one `ipBlock` entry per rule;
3. deletes the policy when the run ends. Reconciliation deletes policies of runs the worker no longer holds, and the owner reference removes the policy with the Job in any case.

These runs always start cold, never on a warm pod.

A worker reports egress control only when all of these hold:

- `Kubernetes.EgressAllowlists` is on.
- `Kubernetes.EgressCanary` is set. This is the proof that the network plugin enforces NetworkPolicy.
- A SelfSubjectAccessReview allows create, get, list, and delete on `networkpolicies`.
- No NetworkPolicy in the run namespace would widen allowlisted pods: a policy that selects them and allows an `ipBlock` or every destination.

That last check catches a cluster still running the old single `garrison-run` policy with the 443 rule. Upgrade the policies before you rely on allowlists; until then those runs queue rather than run unenforced. NetworkPolicy needs a network plugin that enforces it, including for IPv6 blocks if you list them. K3S's default plugin (kube-router) does. minikube's default does not: start minikube with a policy-enforcing CNI (`minikube start --cni=calico` or `--cni=cilium`), or allowlisted runs stay queued and other Job runs fail the egress canary.

**Worker settings** (all under `Kubernetes` in `garrison-worker.json`, most also as environment variables):

| Setting | Default | Meaning |
|---|---|---|
| `Enabled` (`GARRISON_WORKER_KUBERNETES_ENABLED`) | `false` (`true` in the Kubernetes manifests) | Offer the KubernetesJob executor |
| `RunNamespace` (`GARRISON_WORKER_RUN_NAMESPACE`) | the worker's namespace | Where Jobs, Secrets, and pods go |
| `RunImage` (`GARRISON_WORKER_RUN_IMAGE`) | the worker container's image | Image of the run pod; it must contain the worker and the harnesses |
| `ImagePullPolicy` (`GARRISON_WORKER_RUN_IMAGE_PULL_POLICY`) | the worker container's policy | `Always`, `IfNotPresent`, or `Never` |
| `ImagePullSecrets` (`GARRISON_WORKER_RUN_IMAGE_PULL_SECRETS`) | the worker pod's | Comma-separated Secret names for a private registry |
| `ServiceAccountName` (`GARRISON_WORKER_RUN_SERVICE_ACCOUNT`) | `garrison-run` | Run pod service account |
| `RuntimeClassName` (`GARRISON_WORKER_RUN_RUNTIME_CLASS`) | none | Sandboxed runtime, for example `gvisor` or `kata` |
| `NodeSelector` (`GARRISON_WORKER_RUN_NODE_SELECTOR`) | none | `key=value` pairs for run pods |
| `JobTtlSeconds` (`GARRISON_WORKER_JOB_TTL_SECONDS`) | `300` | How long finished Jobs and their Secrets stay |
| `PendingTimeoutSeconds` (`GARRISON_WORKER_RUN_PENDING_TIMEOUT_SECONDS`) | `300` | How long a run pod may stay Pending |
| `DefaultResources` | see above | Requests and limits when the deployment sets none |
| `RunAsUser`, `RunAsGroup` | `10001` | Run pod user and group (never 0) |
| `EmptyDirSizeLimit` | none | `sizeLimit` of the data and `/tmp` emptyDirs |
| `PodLabels` | none | Extra labels on Jobs, pods, and Secrets |
| `EgressCanary` (`GARRISON_WORKER_RUN_EGRESS_CANARY`) | none (`garrison-server:8700` in the manifests) | An address the run NetworkPolicy blocks. `run-one` starts the harness only once a connection to it fails, so the harness never runs before the policy controller has programmed the new pod (on K3S that took up to about a second in testing). If it is still reachable after `EgressCanaryTimeoutSeconds` (30), the run fails with `PodFailed`. Clear it on clusters that do not enforce NetworkPolicy |
| `EgressAllowlists` (`GARRISON_WORKER_RUN_EGRESS_ALLOWLISTS`) | `false` (`true` in the Kubernetes manifests and Helm) | Enforce per-deployment egress allowlists with a NetworkPolicy per run and report the `EgressControl` capability. Off in code because it is only safe with the split run policies the manifests ship; it also needs `EgressCanary` and NetworkPolicy RBAC |
| `ServerMcpPort` (`GARRISON_WORKER_RUN_SERVER_MCP_PORT`) | `8701` | MCP port that allowlisted run pods may reach on `app.kubernetes.io/name=garrison-server` pods |
| `ServerNamespace` (`GARRISON_WORKER_SERVER_NAMESPACE`) | the worker's namespace | Namespace of the server pods, used in that MCP rule when runs live in another namespace |
| `ReconcileIntervalSeconds` | `60` | How often orphaned Jobs and egress NetworkPolicies are deleted |

In Helm the same choices live under `kubernetesExecutor` (`enabled`, `runNamespace`, `runImage`, `imagePullSecrets`, `runtimeClassName`, `jobTtlSeconds`, `pendingTimeoutSeconds`, `nodeSelector`, `egressCanary`, `egressAllowlists`, `runEgress`). `egressAllowlists` (default `true`) is passed to workers only when `networkPolicies.enabled` is true and `egressCanary` is set, and `runEgress` fills `garrison-run-default-egress`.

A run pod that is evicted, or whose Job is deleted outside Garrison, while the harness runs counts as node loss: the worker does not report the run, its lease expires, and the control plane requeues it when the run's `effectPolicy` is `AtLeastOnce` (and attempts remain) or fails it with `NodeLost`. A worker that is itself lost behaves the same way, and its replacement deletes the orphaned Jobs when it starts.

**A separate run namespace.** Anyone who can create Jobs in a namespace can mount that namespace's Secrets, so a worker that creates run Jobs next to `garrison-secrets` could, if compromised, read them. For untrusted prompts put runs in their own namespace: create it (ideally with the `restricted` Pod Security level, which run pods satisfy), set `kubernetesExecutor.runNamespace` in Helm (the chart then puts the Role, the `garrison-run` account, and the run NetworkPolicy there, and lets the worker read its own pod), set `runImage`, and set `GARRISON_MCP_PUBLIC_URL` to the server's fully qualified name (`http://garrison-server.<namespace>.svc.cluster.local:8701`) so run pods can resolve it. With Kustomize, copy `base/rbac.yaml`, the `garrison-run` account, and the `garrison-run` and `garrison-run-default-egress` NetworkPolicies into the run namespace, change the RoleBinding subject to `namespace: garrison`, and set the same environment variables on the worker.

**Sandboxed runtimes.** Run pods share the node's kernel. gVisor (`runsc`) or Kata Containers give each pod its own kernel boundary. Install the runtime on the nodes, create its RuntimeClass, and set `kubernetesExecutor.runtimeClassName` (or `GARRISON_WORKER_RUN_RUNTIME_CLASS`):

```yaml
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: gvisor
handler: runsc
```

Run pods already run as non-root with a read-only root filesystem, so they work under gVisor and Kata unchanged; expect slower start-up and file I/O.

**Docker Compose** has no Kubernetes API, so its workers keep `Kubernetes.Enabled` off and report only the Process executor. A `KubernetesJob` deployment stays queued with `blockedReason: NoCapableWorker` there, and an `Untrusted` deployment with `blockedReason: NoIsolatingWorker`.

### Backups

`docs/BACKUP.md` covers backups and restores for PostgreSQL (in-cluster and managed) and Sqlite, including the nightly `pg_dump` CronJob in `components/postgres-backup`. Read the part about the master key before you need it: a database restored without the key it was written with keeps every record and loses every secret.

## Configuration

The server reads `garrison.json` from the `garrison-server-settings` ConfigMap and runs with `GARRISON_SETTINGS_READONLY=true`, so the Settings page shows file-backed values as read-only with their source. Cluster runtime settings (scheduling, retention, limits) are stored in the database and stay editable from the dashboard. Workers read `garrison-worker.json` from `garrison-worker-settings`, and every value can be overridden with a `GARRISON_WORKER_*` environment variable on the StatefulSet.

The server tells harnesses where to find Garrison through two internal URLs, `GARRISON_MCP_PUBLIC_URL` (MCP) and `GARRISON_PUBLIC_BASE_URL` (REST). The base sets both to the in-cluster service name, which is right for workers in the same cluster. They never appear in A2A agent cards. What cards and server info advertise to the outside comes from `GARRISON_EXTERNAL_BASE_URL` (Helm: `server.externalBaseUrl`), or from each request's `Host` header when it is unset.

## Updating

```bash
k8s/scripts/update.sh k3s          # or minikube, production
```

`update` re-applies the overlay, restarts the server, workers, and dashboard so they pick up new images and settings, waits for the rollout, and prints pod status. It never touches data. To pick up new source code, rebuild the images first (`deploy-k3s.sh --build` does both).

To add or change harness credentials, export them, refresh the Secret, and run the bootstrap Job again:

```bash
export CLAUDE_CODE_OAUTH_TOKEN=...            # any of the variables listed under "Secrets come first"
k8s/scripts/generate-secrets.sh               # keeps the generated keys, refreshes garrison-harness-credentials
kubectl -n garrison delete job garrison-bootstrap
kubectl apply -k k8s/overlays/k3s             # or minikube; recreates the Job, which updates the Garrison secrets
```

You can also skip all of that and set credentials as secrets in the dashboard (Configuration, Secrets), as `docs/QUICKSTART.md` does.

## Factory reset and removal

```bash
k8s/scripts/factory-reset.sh k3s
```

The factory reset deletes the whole `garrison` namespace, including the database volume, every workspace, and the Secrets, then installs again with new random secrets. It asks you to type `RESET` before doing anything. There is no undo.

To remove Garrison and not reinstall it, `kubectl delete namespace garrison`. For K3S in Docker, removing the container (`docker rm -f -v garrison-k3s`) takes the whole cluster with it.

## Observability

`k8s/components/observability` adds Prometheus, Loki, Tempo, Grafana with fourteen Garrison dashboards (one per section, listed in `docs/TELEMETRY.md`), and Grafana Alloy to the `garrison` namespace. Two overlays include it, and the deploy scripts pick them with `OBSERVABILITY=1`:

```bash
OBSERVABILITY=1 k8s/scripts/deploy-k3s.sh --build       # overlays/k3s-observability
OBSERVABILITY=1 k8s/scripts/deploy-minikube.sh           # overlays/minikube-observability
OBSERVABILITY=1 k8s/scripts/update.sh k3s                # same as update.sh k3s-observability
k8s/scripts/port-forward.sh                              # adds Grafana, Prometheus, Loki, and Tempo when present
```

On Windows, `set OBSERVABILITY=1` before `deploy-k3s.bat`, `deploy-minikube.bat`, or `update.bat`. With Helm, `--set observability.enabled=true` (the values files explain the per-cluster defaults).

| Service | In the cluster | From your machine (port-forward.sh) | Version |
|---|---|---|---|
| Grafana | `garrison-grafana:3000` | http://127.0.0.1:3000 (`GRAFANA_PORT`), user `admin` | 13.0.2 |
| Prometheus | `garrison-prometheus:9090` | http://127.0.0.1:9090 (`PROMETHEUS_PORT`) | 3.5.4 |
| Loki | `garrison-loki:3100` | http://127.0.0.1:3100 (`LOKI_PORT`) | 3.5.5 |
| Tempo | `garrison-tempo:3200` | http://127.0.0.1:3200 (`TEMPO_PORT`) | 2.6.1 |
| Alloy (OTLP gRPC 4317, HTTP 4318) | `garrison-alloy` | not forwarded | 1.5.0 |

The K3S overlay also routes `http://grafana.garrison.local` through Traefik (add it to `/etc/hosts` next to `garrison.local`), and the minikube overlay gives Grafana NodePort 30300 and Prometheus 30909.

What the stack does:

- **Metrics.** Prometheus discovers pods in its own namespace through the Kubernetes API and scrapes the ones annotated `prometheus.io/scrape: "true"` at the pod IP and the annotated port: the dedicated metrics listeners, 9464 on the server and 9465 on each worker. Those listeners answer only requests addressed to the host name they bind, so the pods set `GARRISON_PROMETHEUS_HOSTNAME` (server) and `GARRISON_WORKER_PROMETHEUS_HOSTNAME` (workers) to the pod IP from the downward API. `/metrics` is not served on the REST port or the worker health port, because that endpoint needs no authentication and labels series with tenants and agents (`Telemetry.ServeMetricsOnServicePort`, false by default, SR-20). Every series gets `component` (`server`, `worker`) and `node` (the pod name, which is also the Garrison node name). Retention is 3 days or 1 GiB.
- **Traces.** The component sets `GARRISON_OTLP_ENABLE=true` and `GARRISON_OTLP_ENDPOINT=http://garrison-alloy:4317` on the server, and the `GARRISON_WORKER_OTLP_*` equivalents on workers. Alloy drops health-probe and scrape spans and forwards the rest to Tempo, so a run's `run:create`, `run:claim`, `run:compile`, and worker `harness <type> exec` spans arrive as one trace. Retention is 24 hours.
- **Logs.** Alloy reads the server, worker, and dashboard container logs through the Kubernetes API (a namespaced Role grants `pods` and `pods/log`, no host paths) and ships them to Loki with the labels `app="garrison"`, `component`, `node`, and `level` (Garrison severities). `{app="garrison"} |= "<runId>"` finds a run's lines, and the `trace=` field links each line to its trace. Retention is 72 hours.
- **Grafana.** Datasources `garrison-prometheus`, `garrison-loki`, and `garrison-tempo` with links from traces to logs and back, and the dashboards `garrison-overview`, `garrison-http`, `garrison-runs`, `garrison-agents`, `garrison-models`, `garrison-workers`, `garrison-kubernetes`, `garrison-protocols`, `garrison-scheduler`, `garrison-database`, `garrison-control-plane`, `garrison-security`, `garrison-integrations`, and `garrison-logs` in the `Garrison` folder. Prometheus runs with exemplar storage and created-timestamp zero ingestion (so counters count their first events), Alloy promotes `tenant` to a Loki label and drops traces of idle background iterations, and Grafana has a 2 CPU limit because a section dashboard issues many queries at once. Everything is provisioned from files, so Grafana keeps no state of its own.
- **The Garrison dashboard.** The overlays set the browser-facing URLs (`GARRISON_GRAFANA_URL`, `GARRISON_PROMETHEUS_URL`, `GARRISON_LOKI_URL`, `GARRISON_TEMPO_URL`) to the port-forward defaults above, and the in-cluster URLs the server probes (`GARRISON_*_INTERNAL_URL`) to the services. If you reach Grafana another way, change the URLs in the overlay (`observability-urls.yaml`) or in Helm's `observability.urls`.

The Grafana admin password comes from Secret `garrison-grafana` (keys `admin-user` and `admin-password`). `generate-secrets.sh` always creates it, with the password from `GARRISON_GRAFANA_PASSWORD`, or a random one it prints once, and keeps it on later runs unless you pass `--force`. Creating it even without the observability stack means turning the stack on later needs no extra step. Read it back with `kubectl -n garrison get secret garrison-grafana -o jsonpath='{.data.admin-password}' | base64 -d`.

Resources are sized for a laptop cluster. Requests add up to 225m CPU and 640 MiB of memory, and limits to 4.5 CPU and 2.4 GiB. On a K3S test cluster with light traffic the five pods used about 600 MiB together (Grafana about 160 to 300 MiB, the others 70 to 130 MiB each). Prometheus, Loki, and Tempo each get a 2 GiB PersistentVolumeClaim on the default storage class; Grafana and Alloy use `emptyDir`. A factory reset deletes all of it with the namespace.

`k8s/scripts/deploy-k3s.sh --build` with `OBSERVABILITY=1` also imports the five observability images when Docker already has them, so the cluster does not pull about 1 GB again.

To use your own monitoring instead, skip the component: the annotations above work with any Prometheus that honors them, and setting `GARRISON_OTLP_ENABLE=true` and `GARRISON_OTLP_ENDPOINT` on the server (and the worker equivalents) sends traces to your collector. The default REST listener does not serve `/metrics`. Scrape the dedicated listeners at pod IPs as configured by the component, or explicitly enable `Telemetry.ServeMetricsOnServicePort` for a suitable restricted deployment. See [telemetry](TELEMETRY.md) for listener configuration.

## Build and publish multi-architecture images

`k8s/scripts/publish-images.sh` (or `.bat`) builds server, worker, and dashboard for `linux/amd64,linux/arm64` using a dedicated buildx builder. Without flags it exports reviewable OCI archives and metadata under `artifacts/images/v<product-version>/`. Add `--image server`, `worker`, or `dashboard` to select one. After authenticating to Docker Hub with an account authorized for `jchristn77`, run `k8s/scripts/publish-images.sh --push` to publish all three. Tracked source changes must be committed before publishing; tags mirror the product version. `GARRISON_IMAGE_NAMESPACE`, `GARRISON_IMAGE_BUILDER`, `GARRISON_IMAGE_PLATFORMS`, and `GARRISON_IMAGE_OUTPUT` override build settings. The Windows wrapper is supplied but has not been executed on a Windows host.

## Warm run pods

When the Kubernetes executor is enabled, warm pods default to enabled with one idle pod and a maximum of four per pool, image, and pod configuration. Process-only workers create no pods. Eligible queue depth and recent assignment rate increase idle stock within those bounds.

Helm exposes `kubernetesExecutor.warmPods`; each `workerPools[].warmPods` map can override those defaults. Set `GARRISON_WORKER_WARM_PODS_ENABLED=false` to disable warming, or configure `GARRISON_WORKER_WARM_PODS_MIN` and `GARRISON_WORKER_WARM_PODS_MAX`. The idle input timeout defaults to 900 seconds (`GARRISON_WORKER_WARM_PODS_IDLE_SECONDS`); reconciliation defaults to two seconds (`GARRISON_WORKER_WARM_PODS_INTERVAL_SECONDS`). Stdin specs are limited to 16 MiB (`GARRISON_WORKER_WARM_PODS_MAX_SPEC_BYTES`).

Idle pods hold no run spec or provider credentials. The worker reserves a Ready pod with a resource-version update, delivers one bounded JSON line through authenticated Kubernetes `pods/attach`, and deletes the pod after execution or cancellation. Pods retain the cold executor's non-root user, read-only root, private workspace, and disabled service-account token. A coordination Lease shares refill ownership across workers.

Ordinary runs fall back to cold Jobs when stock is unavailable. Explicit `requiredCapabilities.coldStartClass=Warm` runs require warm support and cannot fall back. PersistentVolume workspaces and custom deployment pod resources use cold execution; validation rejects either with an explicit Warm requirement. A worker reports `warmStart=true` only when warming is enabled and the required RBAC is available; its primary cold-start class remains Cold so it can serve both requirements.

Worker Roles need pod create/update/delete, `pods/attach` get and create, and coordination Lease get/create/update in addition to existing cold executor permissions. Older Kubernetes versions authorize the WebSocket attach as `get` (k3s v1.31 returns 403 without it), newer ones check `create`, so grant both; a worker missing either reports warm pods unavailable and runs cold. Apply the updated base or Helm RBAC before enabling warm requirements. Missing warm permissions leave cold execution available.

Run `scripts/check-warm-pods.sh` after building a current local worker image tagged `garrison-worker:warm-test`. The local gate creates and removes a temporary K3S cluster, checks shared refill bounds, competing reservations, isolation, completion, cancellation, and deletion, and reports warm/cold startup measurements. It uses no provider credentials and is excluded from routine CI.

Local native K3S sample (2026-10-13, six runs each, same shell harness and image): warm claim-to-Started p50 0.072 s and p95 0.110 s; cold p50 1.015 s and p95 2.023 s. These are local observations, not production guarantees. Successful direct worker API writes were 3.33 per warm run versus 2.00 per cold run, excluding controller operations and reads/attach. Warming improves startup but adds reservation and refill coordination; it does not reduce API writes in this sample.

## Optional agent memory and source capabilities

Agent memory defaults to disabled. Current source includes a filesystem provider behind `IAgentMemoryStore`; no NotDory deployment is required. Enable `GARRISON_AGENT_MEMORY_ENABLE=true` on the server and configure `GARRISON_AGENT_MEMORY_ROOT` on persistent storage. All replicas serving the same tenants need a shared root or a replacement shared-store implementation. A server-local `emptyDir` is unsuitable for persistent multi-replica memory. See [agent memory](AGENT_MEMORY.md) for scope, MCP tools and replacement interfaces.

The standard K3S/minikube overlays do not include observability; choose their `-observability` variants or `OBSERVABILITY=1` as shown above. Docker Compose includes those services by default. A checkout may contain capabilities newer than published images: use `deploy-k3s.sh --build` or the minikube source build to test that checkout, and verify the image revision before promising those capabilities to users. Continue with the [quick start](QUICKSTART.md) and [security guide](SECURITY.md).
