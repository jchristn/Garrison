# Continuous Integration

GitHub Actions runs only on pushes, without scheduled, pull-request, or manual triggers. Path filters avoid unrelated backend, dashboard, and Kubernetes jobs. Each workflow cancels an older run on the same branch.

| Workflow | Commit checks | Timeout |
|---|---|---|
| Backend smoke | .NET 10 build, SQLite templates/parsers/outcomes/identity-unit/worker-host suites | 10 minutes |
| Dashboard smoke | Lint, build, three focused unit test files | 10 minutes |
| Kubernetes | Manifest mirrors, rendering, Helm lint, kubeconform, Compose validation | 10 minutes |
| Text hygiene | Repository punctuation check | 3 minutes |

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
