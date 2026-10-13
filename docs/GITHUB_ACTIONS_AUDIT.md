# GitHub Actions Usage Audit

Scanned 50 local workflow files in 24 GitHub repositories under `~/Code`, read-only outside Garrison. Queried GitHub run history for the trailing 30 days, starting 2026-09-13 UTC; captured 2026-10-13 UTC (2026-10-12 local).

Numbers below sum started-to-completed job durations, including failed and cancelled jobs, rather than workflow wall time. They are observed runner minutes, not a billing statement: in-flight jobs, deleted history, billing rounding, runner pricing, and storage can change billed usage. All available runs in the window were queried for private repositories; public repositories use the newest 20 runs, or all runs when fewer exist. Job-list API requests returned no errors. Do not extrapolate public samples to monthly bills.

## Most relevant to the minutes warning

Garrison is the largest observed private-repository consumer in this scan. Repositories owned by other users or organizations use their owner's allowance, so these totals do not share one account budget. Public repositories using standard hosted runners are free; see [GitHub billing documentation](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

| Private repository | Runs in 30 days | Observed completed job-minutes | Main contributor |
|---|---:|---:|---|
| [jchristn/Garrison](https://github.com/jchristn/Garrison/actions) | 396 | 2,460.7 | Tests (1,512.2) |
| [ncolvill/sherpadog](https://github.com/ncolvill/sherpadog/actions) | 220 | 626.7 | Backend and database contract (373.4) |
| [juratinc/Platform](https://github.com/juratinc/Platform/actions) | 12 | 119.6 | Webapp (99.5) |
| [jchristn/Duskspire](https://github.com/jchristn/Duskspire/actions) | 57 | 80.9 | ci (80.9) |
| [jchristn/Hydra](https://github.com/jchristn/Hydra/actions) | 3 | 29.4 | ci (29.4) |

Garrison's old workflows used about 1,512 minutes for Tests, 609 for Kubernetes, 152 for Dashboard, 139 for SDKs, and 39 for Benchmark gate. Six superseded in-progress Garrison runs were cancelled during this change. The historical totals predate the reduced policy and are a lower bound while jobs remain in flight.

## Largest public-repository runtime samples

These consume compute but generally do not explain exhaustion of private-repository standard-runner minutes.

| Repository | Runs in 30 days | Runs sampled | Sample job-minutes | Main risk |
|---|---:|---:|---:|---|
| [litegraphdb/LiteGraph](https://github.com/litegraphdb/LiteGraph/actions) | 64 | 20 | 2,617.2 | Daily CI plus a broad matrix |
| [jchristn/Durable](https://github.com/jchristn/Durable/actions) | 38 | 20 | 1,135.0 | Large platform/framework/provider fan-out |
| [jchristn/Mux](https://github.com/jchristn/Mux/actions) | 181 | 20 | 1,036.9 | Platform/framework matrices; weekly CI and release-check |
| [jchristn/Armada](https://github.com/jchristn/Armada/actions) | 299 | 20 | 629.7 | Daily four-provider parity; weekly install/security |
| [jchristn/Pneuma](https://github.com/jchristn/Pneuma/actions) | 43 | 20 | 313.5 | Platform/framework/provider matrices |
| [jchristn/QoSKit](https://github.com/jchristn/QoSKit/actions) | 32 | 20 | 229.6 | Daily scheduled tests |

## Scheduled workflows found locally

| Repository | Workflow | UTC schedule |
|---|---|---|
| litegraphdb/LiteGraph | `ci.yml` | `17 6 * * *` |
| jchristn/QoSKit | `tests.yaml` | `17 3 * * *` |
| jchristn/Mux | `ci.yml` | `17 6 * * 1` |
| jchristn/Mux | `release-check.yml` | `41 6 * * 1` |
| jchristn/Armada | `install-verify.yml` | `30 6 * * 1` |
| jchristn/Armada | `nightly-parity.yml` | `17 7 * * *` |
| jchristn/Armada | `security.yml` | `17 6 * * 1` |

## Changes made to Garrison

- Push-only triggers; no PR duplicates, manual launches, or timers.
- Path-filtered backend, dashboard, and manifest jobs; text hygiene remains on each push.
- One .NET 10/SQLite smoke pass; no PostgreSQL/framework matrix or repeated xUnit/NUnit runs.
- Three dashboard test files; no hosted contract, browser, Docker, SDK, benchmark, or K3S integration jobs.
- Cancel superseded runs, set 3/10-minute job timeouts, and retain backend artifacts for three days.
- Full local validation scripts remain available. See [CI policy](CI.md).

Next priorities for any further cuts are Sherpadog's backend/database and Docker contract jobs, and Platform's webapp workflow, under their respective owners. Duskspire and Hydra are smaller private contributors. Scheduled public workflows can also be reduced for convenience and resource use, but they are lower priority for this particular minutes warning. No workflows in other repositories were modified.

## All repositories scanned

- `dotnet/WatsonTcp`: `build-and-test.yml`.
- `jchristn/Armada`: `ci.yml`, `install-verify.yml`, `nightly-parity.yml`, `security.yml`, `release.yml`.
- `jchristn/Armor`: `tests.yml`, `release.yml`.
- `jchristn/Clutch`: `tests.yml`, `native-aot.yml`.
- `jchristn/DocConverter`: `tests.yaml`.
- `jchristn/Durable`: `ci.yml`.
- `jchristn/Duskspire`: `ci.yaml`.
- `jchristn/Garrison`: `em-dash.yaml`, `dashboard.yaml`, `benchmark.yaml`, `k8s.yaml`, `sdk.yaml`, `tests.yaml`.
- `jchristn/Hydra`: `ci.yml`.
- `jchristn/Mux`: `ci.yml`, `release-check.yml`, `release.yml`, `vscode-extension.yml`.
- `jchristn/PepperX`: `tests.yaml`.
- `jchristn/PerformanceStatistics`: `ci.yml`.
- `jchristn/Pneuma`: `ci.yaml`.
- `jchristn/QoSKit`: `tests.yaml`.
- `jchristn/SharpAI`: `docker.yml`, `dashboard.yml`, `e2e.yml`, `observability-smoke.yml`, `server-contract.yml`, `backend.yml`, `release.yml`.
- `jchristn/SuperSimpleTcp`: `dotnet.yml`.
- `jchristn/Switchboard`: `tests.yaml`.
- `jchristn/TUIKit`: `tests.yaml`.
- `jchristn/TextChunker`: `tests.yaml`.
- `jchristn/UrlMatcher`: `tests.yaml`.
- `jchristn/Voltaic`: `tests.yml`, `native-aot.yml`.
- `juratinc/Platform`: `webapp.yml`.
- `litegraphdb/LiteGraph`: `ci.yml`.
- `ncolvill/sherpadog`: `shadow.yaml`, `backend.yaml`, `benchmark-gate.yaml`, `frontend.yaml`, `sdks.yaml`, `stack.yaml`.
