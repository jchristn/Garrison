# Observability component (Phase 13)

This directory will hold the Kustomize component for Prometheus, Grafana, Tempo, Loki, and the OpenTelemetry
Collector, with Grafana dashboards provisioned into a `Garrison` folder. It is tracked as tasks P13.1 through
P13.12 in `GARRISON_PLAN.md`.

Until then, every Garrison pod already exposes Prometheus metrics and carries the standard
`prometheus.io/scrape`, `prometheus.io/port`, and `prometheus.io/path` annotations: the server on port 9464 and
workers on port 9465. Point an existing Prometheus at the `garrison` namespace and the series will show up. To
send traces to a collector, set `GARRISON_OTLP_ENABLE=true` and `GARRISON_OTLP_ENDPOINT` on the server Deployment.

There is intentionally no YAML here yet, so nothing in this folder can be applied by accident.
