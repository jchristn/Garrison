# D-060 validation

## Live API and deployment

The source-built isolated Docker Compose stack used PostgreSQL, two workers, and the dashboard. The Postman collection completed 368 items (365 HTTP requests and three intentional skips), with all 565 assertions passing. The two initial assertion mismatches were corrected: Markdown escapes underscores in run IDs, and a suspension-enabled deployment requires `artifactStoreId`. The final run had zero failed requests, scripts, or assertions. Private environments and raw reports remain outside the repository because they contain credentials and response data.

The optional NotDory layer passed authenticated MCP initialization, tool discovery, filesystem memory writes, searches from a second MCP session, and searches after restarting its REST container. `kubectl kustomize k8s/overlays/notdory` rendered successfully. A Garrison deployment then bound the NotDory key as a secret alias and the MCP server as a required resource; authenticated required-tool preflight and the worker run succeeded.

## Dashboard

Lint and all 373 unit tests passed. The accessibility audit scanned login and every navigation page in light and dark themes and passed, along with keyboard dialog checks. All 169 browser tests passed, including responsive screenshots, locales, right-to-left layouts, and the new accessibility audit. README screenshots use synthetic test data.

The built server and worker images were checked for bundled application and dependency notices; the worker also contains the pinned Mux license. The deterministic inventory covers 88 packages with 104 preserved license/notice texts and no missing package text.

## Real harness continuation

The pinned Claude Code 2.1.296 and Codex 0.159.3 app-server CLIs passed the live cross-node gate after the one-time approval grant fix: each pending approval released its lease, the original worker stopped, another worker restored the same session, and the completed and approved commands each produced exactly one expected line in collected artifacts.

The repeatable Codex measurement uses a temporary clone of the app-server profile with account plugin synchronization disabled (`features.plugins=false`, `features.remote_plugin=false`, `features.apps=false`). All session-format, prompt, credential, approval, and execution settings otherwise come from the seeded profile. This isolates the two-command fixture from account plugin downloads; production profiles are unchanged. Separate diagnostic runs with account plugins enabled also passed, but later runs downloaded template assets into HOME and generated 79.8 to 80.5 MB ZIPs, exceeding the configured transfer bound. The snapshot keeps the complete HOME and refuses oversized archives; it does not silently drop plugin state or bypass limits. [Codex configuration reference](https://developers.openai.com/codex/config-reference/) documents the remote plugin catalog flag.

| Harness | Uncompressed checkpoint | ZIP bytes | Capture and upload | Resume to completion |
|---|---:|---:|---:|---:|
| Claude | 110,074 | 40,959 | 39 ms | 11,175 ms |
| Codex, account plugins disabled | 4,569,010 | 618,755 | 34 ms | 7,106 ms |

Resume time includes queueing, restore, provider inference, tools, artifact collection, and completion observation. These are individual shared-host observations. Credential-free reports are in `benchmarks/evidence/d060/continuation-{claude,codex}.json`. Reproduce with `scripts/check-continuation-compose.py --harness NAME --report PATH`; `--include-account-plugins` retains account plugin behavior for a separate diagnostic.

The installed-session compatibility gate separately passed five real reader paths in the default image (Claude, Codex exec, Codex app-server, Mux, provider-api) and six with optional Gemini enabled. It restores sanitized recordings into an empty HOME, uses a local provider with dummy credentials and no external network, and requires the resumed request to retain earlier history. The new CI matrix is configured; hosted CI has not run in this session.

## Backend

The full solution builds with zero warnings or errors. The targeted .NET 8 SQLite/PostgreSQL run passed 72/72 cases for continuation, journal, broker, scheduling, remote execution, and key lifecycle. The NUnit adapter passed both key lifecycle cases. The frozen full .NET 10 verification covers 909 unique cases with all cases passing after the PostgreSQL rerun. The first test PostgreSQL container exhausted its 64 MiB shared-memory mount, then its native server crashed and recovered, interrupting 35 PostgreSQL cases. All SQLite cases passed. A fresh PostgreSQL instance with 256 MiB shared memory passed its complete 587-case PostgreSQL/shared run, including every interrupted case. The credential-free count/provenance summary is `docs/testing/d060-backend-validation.json`. An earlier broad run was invalidated by overlapping assembly replacement and is excluded from evidence.

Independent review then added regressions for remote TTL crossing health discovery, same-epoch credential scope/deadline changes, estimated suspended cost, failed harness checkpoint markers, and node-only internal archive publication. The remote/broker fixes passed 24/24 both-provider cases; execution/continuation fixes passed 40/40; internal archive integration passed 31/31 followed by strengthened artifact authorization 12/12. These scoped results supplement the frozen full run. Latest-source .NET 8 regression passed 85/85 across both databases, including the node upload boundary, work-only restoration, and every review fix. The final source-built Compose images then passed the real Claude and Codex cross-worker gates using node-authenticated internal uploads. All four SDK harnesses and all four console smoke tests passed again against a throwaway server built from this final source.

The retained Compose deployment was rebuilt and restarted with its original named volumes and four existing seeded agents preserved. The original stopped PostgreSQL volume was cold-backed up before migration under `~/.garrison/backups/d060-20261015-232957/postgres-data.tgz`. The server, two workers, database, and dashboard are healthy. Disposable validation services are stopped after checks; NotDory remains an opt-in deployment layer. No images, SDK packages, commits, or launch materials were published.

A final marker-only regression reproduced an unintended epoch/deadline reset from ordinary successful output containing the checkpoint marker. Acceptance now requires a current-epoch durable approval or child-wait boundary under the run lock; otherwise the successful report completes normally with its timestamp normalized. Decided-during-upload approvals and completed-child upload races remain valid. The resulting artifact/cache/continuation integration passed 35/35 both-provider cases plus a strengthened 4/4 boundary matrix.

Compose and the effect-safety PostgreSQL service now configure a 256 MiB shared-memory mount, reflecting the successful full rerun and avoiding the observed Docker 64 MiB limit. This increases the mount ceiling without changing the PostgreSQL image version. Final marker-boundary .NET 8 checks also passed 18/18 across both providers.

Live performance-tooling checks also passed: the finite trace scheduled 16 in-window arrivals with 16 successes, while the capped variant classified seven successes and nine client drops and omitted two arrivals beyond the cutoff. Seven short timing arms completed 64 successful runs and 14 streaming/cancellation probes. These establish functional mechanics on a shared host, not tuning or release claims; raw evidence and provenance are in `benchmarks/D060_MEASUREMENTS.md`.
