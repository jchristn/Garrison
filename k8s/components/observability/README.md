# Observability component

Kustomize component that adds Prometheus, Loki, Tempo, Grafana (with the fourteen Garrison dashboards, one per section), and Grafana
Alloy to the `garrison` namespace. Enable it with `k8s/overlays/k3s-observability` or
`k8s/overlays/minikube-observability`, or `OBSERVABILITY=1` with the deploy and update scripts. `docs/KUBERNETES.md`
(Observability) describes what it does, how to reach it, and its resource use.

| File | Contents |
|---|---|
| `kustomization.yaml` | The component: resources, ConfigMap generators, and the server and worker patch |
| `rbac.yaml` | Service accounts and namespaced Roles (Prometheus pod discovery; Alloy pod discovery and pod logs) |
| `prometheus.yaml`, `loki.yaml`, `tempo.yaml`, `alloy.yaml`, `grafana.yaml` | Deployments, Services, and PVCs |
| `garrison-env.yaml` | OTLP export and in-cluster observability URLs for the server and workers |
| `config/` | Prometheus, Loki, Tempo, Alloy, and Grafana provisioning files, plus `grafana.ini` (feature toggles) |
| `dashboards/` | Grafana dashboards: `garrison-overview`, `garrison-http`, `garrison-runs`, `garrison-agents`, `garrison-models`, `garrison-workers`, `garrison-kubernetes`, `garrison-protocols`, `garrison-scheduler`, `garrison-database`, `garrison-control-plane`, `garrison-security`, `garrison-integrations`, `garrison-logs` (see the table in `docs/TELEMETRY.md`) |

Keep these copies in step:

- `config/` and `dashboards/` are mirrored in `k8s/helm/garrison/files/observability` (the k8s CI workflow diffs them).
- Docker Compose mounts `config/loki.yaml`, `config/tempo.yaml`, `config/grafana.ini`, `config/grafana-*.yaml`, and
  `dashboards/` directly.
  Prometheus and Alloy have Compose-specific copies in `docker/observability`, because Compose has no pod discovery.
- Image versions appear here, in the Helm values (`observability.*.image`), and in `docker/compose.yaml`.

The dashboards query only metrics the server and worker emit (see `docs/TELEMETRY.md`), labeled by `component` and
`node` at scrape time. Variables `node`, `harness`, and (for log panels) `agent` and `run` can be set from a link,
for example `/d/garrison-workers?var-node=garrison-worker-0`.
