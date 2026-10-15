# Continuous Integration

GitHub Actions runs the smoke workflows only on pushes, without scheduled, pull-request, or manual triggers. Path filters avoid unrelated backend, dashboard, and Kubernetes jobs. Each workflow cancels an older run on the same branch. Two workflows are exceptions: `Isolation` also runs on demand (D-053), and `Security scans` also runs on pull requests, weekly, and on demand (D-054), because new advisories appear without any code change.

| Workflow | Commit checks | Timeout |
|---|---|---|
| Backend smoke | .NET 10 build, SQLite templates/parsers/outcomes/identity-unit/worker-host suites | 10 minutes |
| Dashboard smoke | Lint, build, three focused unit test files | 10 minutes |
| Kubernetes | Manifest mirrors, rendering, Helm lint, kubeconform, Compose validation | 10 minutes |
| Text hygiene | Repository punctuation check | 3 minutes |
| Security scans | Vulnerable NuGet packages (transitive), `npm audit` for the dashboard and JavaScript SDK, `pip-audit` for the Python SDK, `govulncheck` for the Go SDK, and Trivy over the server, worker, and dashboard images built from the commit. Fails on High or Critical findings with a fix available | 10 minutes per job, 30 for images |

Backend results are retained for three days. No PostgreSQL services, framework matrix, duplicate xUnit/NUnit adapters, Docker image builds, K3S deployment, browser/contract tests, SDK harnesses, or benchmarks run automatically. This policy reduces Actions usage; passing smoke checks does not imply full regression coverage.

Run broader checks locally when the change warrants them:

```bash
GARRISON_TEST_PROVIDERS=sqlite,postgresql dotnet run --project src/Test.Automated -f net10.0
dotnet run --project src/Test.Automated -f net8.0
dotnet test src/Test.Xunit -f net10.0
dotnet test src/Test.Nunit -f net10.0
npm --prefix dashboard test
npm --prefix dashboard run test:e2e
npm --prefix dashboard run test:contract
scripts/run-sdk-harnesses.sh
bash benchmarks/ci-gate.sh
```

PostgreSQL checks require a configured local test database. Kubernetes runtime smoke checks also remain available through `k8s/scripts/smoke-test.sh` against a deployed test cluster.

## Executor conformance

`dotnet run --project src/Test.Automated -f net10.0 -- --suites executor-conformance` runs the named Process and KubernetesJob behavior gates without a cluster. Repeat with `net8.0` for compatibility.

`scripts/check-executor-conformance.sh` adds real Kubernetes runtime checks using a temporary K3S container and the current locally built worker image. It uses no provider credentials, binds no host ports, and removes the cluster and temporary fixtures on exit. Docker, Python 3, and the .NET 10 SDK are required. Set `GARRISON_CONFORMANCE_IMAGE` to test another local worker image. This heavier check runs locally, not automatically in hosted CI.

The warm-pod gate (`scripts/check-warm-pods.sh`) also runs locally, never on a periodic workflow. Build a current `garrison-worker:warm-test` image first. The script uses a random loopback API port and a temporary private kubeconfig, and removes both the cluster and credentials on exit.

## Security scans

`.github/workflows/security-scans.yaml` (P15.4) runs on every push and pull request, every Monday at 06:17 UTC, and on demand. Each check is its own job, so one failing scanner does not hide the others:

| Job | Command | Fails on |
|---|---|---|
| `nuget` | `dotnet list src/Garrison.sln package --vulnerable --include-transitive --format json` | Any High or Critical advisory |
| `npm` (dashboard, sdk/js) | `npm audit --audit-level=high` | High or Critical |
| `python` | `pip-audit sdk/python` | Any known vulnerability |
| `go` | `govulncheck ./...` in `sdk/go` with the current stable Go | A vulnerability reachable from the SDK's code |
| `images` (server, worker, dashboard) | `docker build`, then Trivy with `severity: HIGH,CRITICAL` and `ignore-unfixed: true` | High or Critical with a fixed version available |

The Trivy action is pinned to a commit and the Trivy binary to an exact release. Images are built on the runner and never pushed. Run the same checks locally before changing dependencies:

```bash
dotnet list src/Garrison.sln package --vulnerable --include-transitive
(cd dashboard && npm audit --audit-level=high)
(cd sdk/js && npm audit --audit-level=high)
docker run --rm -v "$PWD/sdk/python:/src:ro" python:3.12-slim sh -c 'pip install -q pip-audit && cp -r /src /tmp/sdk && pip-audit /tmp/sdk'
docker run --rm -v "$PWD/sdk/go:/src:ro" -w /src golang:latest sh -c 'go install golang.org/x/vuln/cmd/govulncheck@v1.9.0 && "$(go env GOPATH)/bin/govulncheck" ./...'
docker build -f src/Garrison.Server/Dockerfile -t garrison-server:scan .
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:0.75.0 image --scanners vuln --severity HIGH,CRITICAL --ignore-unfixed garrison-server:scan
```

The results of the first run, and which findings remain open, are in `docs/SECURITY_REVIEW.md`.

## Upgrade-path tests

The `upgrade-sqlite` and `upgrade-postgresql` Touchstone suites (P15.6) run with the normal test command. Each builds a database the way an older release left it (schema 1, and schema 1 later moved to schema 15), starts the current server against it, and checks that the migrations reach the latest version, that the data reads back through the API, that the legacy password and credential still authenticate, and that a run executes end to end. `k8s/tests/rolling-upgrade-test.sh` covers the other half: replacing a running server Deployment while runs are queued and in flight.
