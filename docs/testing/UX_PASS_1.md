# UX pass 1

Design review of the whole dashboard, task LP5 in `LEARNABILITY_PLAN.md`. This file holds the environment the screenshots came from and the reviewers' findings (`UXP1-nnn`).

## Environment

| | |
|---|---|
| Commit | `a7e7829d` (LP4.10), branch `feature/autonomous-agents` |
| Working tree | Clean apart from the two new audit scripts (`dashboard/tests/audit/seed.mjs`, `capture.mjs`). The tours work (LP4.5 to LP4.10) was committed before the capture started, so the shots include it. LP5 recaptures after any later dashboard change |
| Images | None. Server, worker, and fake harness were built from source (`dotnet build -f net10.0`, Debug) and the dashboard was served by the Vite dev server, not an image |
| OS | macOS 26.6 (Darwin 25.6.0, arm64) |
| Node | 24.21.0, Playwright 1.64.0 (Chromium headless shell) |
| .NET SDK | 10.0.403 |
| Server | REST `http://127.0.0.1:18950`, MCP `http://127.0.0.1:18951`, Sqlite |
| Worker | One worker, `uxpass-worker`, health port 18960, fake harness on its `PATH` |
| Dashboard | `http://127.0.0.1:18955` (Vite dev server proxying `/v1.0` to the server) |
| Sign-in | `admin@garrison` / `password` in tenant `default` (development mode) |

Settings changed from their defaults:

| Setting | Value | Default |
|---|---|---|
| `Security.AllowInsecureDefaults` (`GARRISON_ALLOW_INSECURE_DEFAULTS`) | `true` | `false` |
| `Rest.Port`, `Mcp.Port` | 18950, 18951 | 8700, 8701 |
| `Rest.LivenessPort` | 0 (off) | 8702 |
| `Mcp.PublicUrl` | `http://127.0.0.1:18951` | none |
| `Database.Filename` | a file in the scratch directory | `data/garrison.db` |
| `Telemetry.Enabled`, worker telemetry | off | on |
| `AgentMemory.Enabled` | `true`, root in the scratch directory | `false` |
| Worker `HealthPort` | 18960 | 8710 |
| Worker `MaxConcurrentRuns` | 8 | 4 |

No cluster setting was changed. Each capture context starts with cleared browser storage, the setup wizard and the old single tour marked done, the sidebar expanded, and the theme and locale under test.

## How it was captured

`seed.mjs` builds the server, worker, and fake harness into a scratch directory, starts them and the dashboard dev server detached, and seeds them through the REST API only: the gerbil example (played by `scripts/run-autonomy-example.sh`, ending with an escalation a person answered), the site-reliability organization with its first round of ticks, eval set, and change rules, a support-desk organization whose four agents wake each other by urgent mail (an invoke with a trail of three message hops), a fan-out with a failing member and its retry, plain invokes and a conversation, a person's report, a running canary release, two eval runs, a shadow trial, approvals, a pipeline run waiting on review, a studio draft, and an active and a lifted freeze. It writes the record IDs to `seed.json`. `capture.mjs` then signs in and screenshots every page in `navConfig.js`, the detail pages of the seeded records and each of their tabs, the Trail tab in its three views and with a step drawer open, row action menus and the dialogs they open, and forced loading, empty, and error states, at 1366x768, 1280x800, 768x1024, and 390x844, light and dark, in English and German, and in Japanese at 1366x768. The capture blocks every request that would change the server. It writes `coverage.json` (route by viewport by theme by locale, each cell captured or with a reason), `shots.json`, and `mechanical.json` (console errors, sideways scroll, and overflowing text, grouped by route).

The full run on 2026-11-27 took 32 minutes with four browser contexts and took 3,878 shots; three targeted recaptures (Secrets after a secret was seeded, two cells that lost a race with auto refresh, and the prompt template detail after its render preview was allowed through) brought the matrix to 3,994 captured cells and 2,654 skipped cells with reasons, out of 6,648 (277 routes by 24 combinations). Nothing failed.

```bash
cd dashboard
node tests/audit/seed.mjs --out "$SCRATCH/uxpass1"
node tests/audit/capture.mjs --out "$SCRATCH/uxpass1" --workers 4
# a targeted recapture, merged into the same coverage.json:
node tests/audit/capture.mjs --out "$SCRATCH/uxpass1" --routes 'detail-runs-*,trail-*' --viewports 1366x768 --locales en,de
```

## Visual review (LP5.2)

## Sense-making review (LP5.3)

## Triage (LP5.4)

## Triage (LP5.4)

The findings are in two files: [ux-pass-1-visual.md](ux-pass-1-visual.md) (UXP1-V001 to V040: 5 High, 20 Medium, 15 Low) and [ux-pass-1-sense.md](ux-pass-1-sense.md) (UXP1-S001 to S028: 3 High, 15 Medium, 10 Low).

On 2026-11-28 the user decided to fix every finding, all 68 including the Low ones, before UX pass 2. They also asked for a seventh guided tour, "Agents on their own", covering keepers, ticks, messages, memory, and escalations, to become the Autonomy hub's tour. That tour resolves UXP1-S009. Nothing is deferred or declined.

Each fix and its before and after evidence is recorded in a `ux-pass-1-fixes-<area>.md` file next to this one.
