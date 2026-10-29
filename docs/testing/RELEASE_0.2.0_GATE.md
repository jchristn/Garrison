# Release gate: 0.2.0 (AD12.19)

Run on 2026-10-29 on `feature/agent-studio` at commit `b5e8a9c` and the commits before it noted below, on macOS with Docker for the Postgresql test container. Every command exited 0.

| Command | Result |
|---|---|
| `dotnet build src/Garrison.sln -c Release` | 0 warnings, 0 errors |
| `dotnet test src/Garrison.sln -c Release` | Test.Nunit 671 passed (net10.0 and net8.0); Test.Xunit 1 passed (net10.0 and net8.0); 0 failed |
| `Test.Automated` with `GARRISON_TEST_PROVIDERS=sqlite,postgresql` | Sqlite: every suite passed. Postgresql: 692 of 692 passed after the test container was recreated with 1 GiB of shared memory (the first combined run lost 19 Postgresql cases to `53100 could not resize shared memory segment` and the recovery that followed, an environment limit of the 64 MiB default) |
| `cd dashboard && npm run lint && npm run build && npm test` | lint clean, build without warnings, 549 unit tests passed |
| `cd dashboard && npx playwright test` | 245 passed, 1 skipped (the opt-in docs screenshot spec) |
| `cd app-ui && npm run lint && npm run build && npm test` | lint clean, build clean, 48 unit tests passed |
| `cd app-ui && npx playwright test` | 28 passed |
| `scripts/run-sdk-harnesses.sh` | C# 55, Python 54, JavaScript 55, Go 55 passed; console smoke checks pass in all four |
| Newman on `assets/postman/Garrison.postman_collection.json` (every folder except the opt-in provider smoke and the restart) | 490 requests, 784 assertions, 0 failures |
| `scripts/check-em-dash.sh` | no em dashes |
| `scripts/check-version.sh` | every version mirror reports 0.2.0 |
| `scripts/check-api-docs.py` against a live server | 217 REST paths, 95 MCP tools, 8 channels; none missing from the references |
| `docker compose -f docker/compose.yaml config` | only `v0.2.0` Garrison images |
| `kubectl kustomize k8s/base` | `jchristn77/garrison-{dashboard,server,worker}:v0.2.0` |
| `helm lint k8s/helm/garrison` and `helm template` | 1 chart linted, 0 failed; templates use `v0.2.0` images |

Also verified during the release work:

- The Compose stack built from this branch served a studio-built app end to end through the dashboard image (`/apps/desk/`, an anonymous session, a turn on the fake harness, and the SSE turn stream).
- A KubernetesJob run on a live k3d cluster wrote into its conversation file space with no credential in the run pod.
- The worker image built with `INCLUDE_DOC_TOOLS=true` converted Markdown to `.docx` and `.pdf` with the real pandoc and LibreOffice (`scripts/run-research-example.sh --real-tools`).

Known caveat: one app UI test ("returns to sign-in when the session ends") occasionally fails when the suite runs against the built image behind nginx, and never in 15 local repeats; `playwright.image.config.js` retries image tests once.
