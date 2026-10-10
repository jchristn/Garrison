# Running Garrison on Kubernetes

Garrison ships as three images and a set of Kubernetes manifests. The control plane (`garrison-server`) is a stateless Deployment. Worker nodes (`garrison-worker`) are a StatefulSet, so each pod gets a stable name that doubles as its Garrison node name, plus its own workspace volume. The dashboard (`garrison-dashboard`) is a small nginx Deployment that serves the console and proxies the REST API, so a browser only ever talks to one origin.

Everything lives under `k8s/`:

| Path | What it is |
|---|---|
| `k8s/base` | The workloads, services, network policies, the bootstrap Job, and the sample agent manifests. No secrets and no database. |
| `k8s/components/postgres` | An in-cluster PostgreSQL 17 StatefulSet for installs that do not have a database yet. |
| `k8s/components/smoke-test` | A fake-harness agent and a Job that invokes it end to end. |
| `k8s/overlays/minikube` | Base plus Postgres, NodePort services, and smaller resource requests. |
| `k8s/overlays/k3s` | Base plus Postgres and a Traefik Ingress for `garrison.local`. |
| `k8s/overlays/production` | External database, three control-plane replicas with an HPA, disruption budgets, spread, and an ingress-nginx Ingress with TLS. |
| `k8s/helm/garrison` | A Helm chart that renders the same resources. |
| `k8s/scripts` | Deploy, update, reset, smoke-test, and port-forward helpers, each as a `.sh` and `.bat` pair. |

## Which option to use

| Option | Pick it when | You need | First deploy |
|---|---|---|---|
| K3S in Docker | You want a real cluster on a laptop without installing one | Docker, `kubectl`, `openssl` | 5 to 25 minutes: the image build, plus K3S pulling Postgres and two small images on a slow link |
| K3S on a host | You run K3S already, on a VM or a small server | `kubectl` pointed at it, Docker, `sudo` for `k3s ctr` | about the same |
| minikube | You already use minikube | minikube, `kubectl`, `openssl`, 4 CPUs and 8 GB for the VM by default | similar; images build inside minikube |
| Production overlay or Helm | A shared cluster with a managed PostgreSQL and an ingress controller | `kubectl` (and `helm` for the chart), published images or your own registry | depends on the cluster |

Helm is optional everywhere: the scripts use Kustomize, which is built into `kubectl`. All of them end with the same thing: namespace `garrison` with one server, two workers, the dashboard, Postgres (except production), and a bootstrap Job that creates sample agents from your harness credentials.

## Secrets come first

Nothing secret is committed. Before the first deploy, `k8s/scripts/generate-secrets.sh` creates three Secrets in the `garrison` namespace with random values:

- `garrison-secrets` holds the master key that encrypts stored credentials, the token signing key, the administrator API key, the administrator password, the database password, and the default administrator access and secret keys.
- `garrison-node-credential` holds the access and secret key that workers use to authenticate. The server seeds a matching credential with the `NodeAgent` role on first boot.
- `garrison-harness-credentials` is optional. It is built from whatever of these variables are set in your shell: `ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`, `OPENAI_API_KEY`, `MUX_BASE_URL`, `MUX_MODEL`, `MUX_API_KEY`, `MUX_ADAPTER_TYPE`, plus `CODEX_AUTH_JSON_FILE`, a path to a Codex `auth.json` (for example `~/.codex/auth.json`) used when you sign in to Codex with ChatGPT instead of an API key. Codex refreshes those tokens itself, so a refresh inside the cluster can invalidate the copy on your machine; run `codex login` again locally if that happens.

The script keeps existing `garrison-secrets` and `garrison-node-credential` values on re-runs, because rotating them after first boot changes keys that are already seeded in the database. Pass `--force` only when you mean to start over. The administrator signs in to tenant `default` as `admin@garrison` with the password from `GARRISON_ADMIN_PASSWORD`, or `password` when that variable is not set (the script warns when it uses the default). Set it before deploying anywhere shared. The other keys are random, including the administrator API key that some examples send as `x-api-key`; on Docker and source builds it is `garrisonadmin`, but here you read it from the Secret:

```bash
kubectl -n garrison get secret garrison-secrets -o jsonpath='{.data.admin-api-key}' | base64 --decode; echo
kubectl -n garrison get secret garrison-secrets -o jsonpath='{.data.admin-password}' | base64 --decode; echo
```

Signing in with email and password (`POST /v1.0/token`, or the dashboard) works the same way on every runtime, so most people never need the API key.

The SDK examples and test harnesses can also sign in with the default administrator access and secret keys. On Docker and source builds those are `access_garrison_default` and `secret_garrison_default_change_me`. Here they are random and live in the same Secret under `default-access-key` and `default-secret-key`:

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

Two things catch people on macOS and Windows. With minikube's Docker driver, the `minikube ip` address is not reachable from the host, so the NodePort URLs time out; use `k8s/scripts/port-forward.sh` (or `minikube service -n garrison garrison-dashboard`) instead. And the default 8 GB does not fit inside a Docker Desktop that only has 8 GB itself; start with `MINIKUBE_MEMORY=6g` or give Docker more.

## K3S

On a host that already runs K3S, point `kubectl` at it and run:

```bash
k8s/scripts/deploy-k3s.sh --build
```

`--build` builds the images with Docker and imports them with `sudo k3s ctr images import`. Without it, the overlay pulls `jchristn77/garrison-*` images at the tag pinned in `k8s/base/kustomization.yaml`.

K3S also runs happily inside Docker, which is the quickest way to try Garrison on a laptop without installing anything. From the repository root:

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

**The Ingress.** The K3S overlay creates a Traefik Ingress for host `garrison.local`, which serves the dashboard at `/`, the REST API under `/v1.0`, and MCP under `/mcp`. Add `127.0.0.1 garrison.local` to your hosts file (`/etc/hosts`, which needs `sudo`) and open `http://garrison.local:8080` with K3S in Docker, or `http://garrison.local` on a host install. Without editing the hosts file, curl can still reach it:

```bash
curl -s --resolve garrison.local:8080:127.0.0.1 http://garrison.local:8080/v1.0/api/health
```

Sign in as `admin@garrison` in tenant `default` with the password `generate-secrets.sh` printed (`password` unless you set `GARRISON_ADMIN_PASSWORD`). From there, `docs/QUICKSTART.md` builds a set of agents that delegate to each other and checks them with `examples/validate.sh`.

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

The overlay runs three control-plane replicas spread across nodes, an HPA between two and ten replicas on CPU, a disruption budget that keeps one server up, and four workers with 50 GiB workspaces. Ingress buffering is off and timeouts are an hour, because run events stream over SSE and workers long-poll for leases.

Multiple control-plane replicas need PostgreSQL. The server refuses to start on SQLite when `GARRISON_EXPECTED_REPLICAS` is greater than one.

## Helm

The chart in `k8s/helm/garrison` renders the same resources as the Kustomize base and components. It expects the same Secrets, so run `generate-secrets.sh` first:

```bash
k8s/scripts/generate-secrets.sh
helm install garrison k8s/helm/garrison -n garrison -f k8s/helm/garrison/values-k3s.yaml --set smokeTest.enabled=true
helm test garrison -n garrison
```

The chart does not build or import images. On a local cluster, run `deploy-k3s.sh --build` or `deploy-minikube.sh` once first (or build and import the images yourself), or the pods pull `jchristn77/garrison-*` from Docker Hub.

`values-minikube.yaml`, `values-k3s.yaml`, and `values-production.yaml` match the overlays. The most useful values are `image.tag`, `database.mode` (`embedded` or `external`), `server.hpa`, `ingress`, and `workerPools`. Each entry in `workerPools` becomes its own StatefulSet with its own labels, concurrency, storage, node selector, and tolerations, which is how you put GPU-backed Mux workers in one pool and Claude Code workers in another. The bootstrap Job runs as a post-install and post-upgrade hook.

The chart keeps copies of the sample manifests, settings, and scripts under `files/`. CI diffs them against `k8s/base` and `k8s/components`, so change both places together.

## Scaling

Workers scale by replica count. Each new pod registers itself under its pod name, advertises the harnesses it found, and starts pulling work:

```bash
kubectl -n garrison scale statefulset/garrison-worker --replicas=6
```

Scaling down is safe. A worker that receives SIGTERM stops leasing new runs and waits for its running harnesses to finish, for up to the 900-second termination grace period. Raise `terminationGracePeriodSeconds` if your runs take longer.

The control plane scales the same way on PostgreSQL. Replicas are interchangeable because workers pull work and never need to be reached by the server, so there is no session affinity to configure. Set `GARRISON_EXPECTED_REPLICAS` to match so the startup checks know the deployment is clustered.

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

Every Garrison pod exposes Prometheus metrics and carries the standard `prometheus.io/*` scrape annotations: the server on port 9464 and workers on 9465. The bundled Prometheus, Grafana, Tempo, and Loki stack is planned as `k8s/components/observability` (Phase 13). Until then, point an existing Prometheus at the `garrison` namespace, and set `GARRISON_OTLP_ENABLE=true` with `GARRISON_OTLP_ENDPOINT` on the server to export traces to your collector.
