# Autonomy simulated user testing (AA12.8)

This is the simulated user session for the 0.3.0 autonomy release, run on 2026-11-26 under `SIMULATED_USER_TESTING.md`. Four people used a local Garrison seeded with the gerbil keeper and the site-reliability organization: an operator, a developer, a board member, and a restricted viewer. They worked through the dashboard's Autonomy group and the matching REST, MCP, and SDK calls.

Nothing was fixed during the session. Every finding below is waiting for the user's decision, and the Decision column says so.

## Summary

| Severity | Count | Findings |
|---|---|---|
| S1 Blocker | 0 | |
| S2 Major | 2 | UT-01, UT-02 |
| S3 Minor | 8 | UT-03 to UT-10 |
| S4 Polish | 10 | UT-11 to UT-20 |

| Category | Count |
|---|---|
| Defect | 6 |
| Nonconformance | 1 |
| Friction | 7 |
| Gap | 1 |
| Question | 5 |

The three that matter most:

1. **UT-01.** A `BoardMember` scoped to one organization, which is how `docs/BOARD.md` tells you to set one up, can open the board page and give direction, but it cannot pull a brake, read or answer an escalation, read a report, or read the CEO's keeper. A tenant-wide assignment works.
2. **UT-02.** The same scoped grant only matches the organization's identifier. Every call that names the organization, which is what the SDK README examples do, is refused with 403.
3. **UT-03.** A Viewer sees enabled Answer, Wake now, Pause, Delete, Add keeper, Add rule, and other write buttons on the Autonomy pages. The server refuses each one, so nothing leaks, but `DASHBOARD_STYLE_AND_USABILITY.md` says read-only users should not see mutation actions.

The core journeys held up. The gerbil walkthrough passed all 17 checks, the organization applied cleanly, escalations, freezes, the kill switch, direction, board messages, and eval runs all worked for the right roles, tenant isolation held, data survived a restart, and the Postman autonomy folders passed.

Setup took about five minutes from a built checkout to the first passing walkthrough. The server came up in 12 seconds, the worker in 15, the gerbil script ran in 21 seconds, and the organization applied in about a second. `npm install` for the dashboard was the slowest step.

## Environment

| Item | Value |
|---|---|
| Commit | `df2e3d85` on `feature/autonomous-agents` (branch `aa12-simusers`), clean working tree |
| Platform | macOS (Darwin 25.6.0), Apple silicon |
| Runtimes | .NET SDK 10.0.403, Node.js 24.21.0, Python 3.14, Playwright 1.64.0 (Chromium headless), Docker 29.9.3 with `postman/newman:latest` |
| Install path | Build from source (`dotnet build src/Garrison.sln`), server and worker run from `bin/Debug/net10.0`, dashboard from `npm run dev` (Vite). Docker Compose, Helm, and installers were not used (see Coverage) |
| Database | Sqlite, fresh file in a scratch working directory |
| Ports | REST 8761, MCP 8762, liveness 8763, worker health 8764, dashboard 8765. Port 8760 was already taken by an unrelated process, so the range started at 8761 |
| Settings changed | `GARRISON_ALLOW_INSECURE_DEFAULTS=true` (development mode, as `docs/DEVELOPMENT.md` says), `GARRISON_AGENT_MEMORY_ENABLE=true` (the gerbil README asks for it), `GARRISON_TELEMETRY_ENABLE=false` and `GARRISON_WORKER_TELEMETRY_ENABLE=false` (another local server held 9464), `GARRISON_MCP_PUBLIC_URL`, `GARRISON_WORKER_SERVER_URL`, `GARRISON_WORKER_NODE_NAME=simuser-worker` |
| Harness | `garrison-fake-harness` on the worker's PATH through the two-line wrapper in `docs/DEVELOPMENT.md` |
| Seed data | `scripts/run-autonomy-example.sh` (gerbil, fake variant) and the `examples/autonomous/site-reliability-org/README.md` apply block, run exactly as written |

Evidence (screenshots, request and response captures, scripts) stayed in the session scratchpad and is not committed, as the testing document asks. Each finding names the file it came from so the run can be repeated.

## Users

| Persona | Account | Role | Goal |
|---|---|---|---|
| Olivia, operator | `olivia.operator@usertest.example` | `AgentOperator`, tenant | Answer what the keepers ask, pull the brakes, keep the keepers running |
| Dana, developer | `dana.developer@usertest.example` | `AgentDeveloper`, tenant | Build keepers, revise them, write eval sets, call the API and MCP |
| Bert, board member | `bert.board@usertest.example` | `BoardMember`, Resource scope on `site-reliability-org` (the setup `docs/BOARD.md` recommends) | Read the board, give direction, talk to the CEO, freeze when needed |
| Tina, board member (control) | `tina.board@usertest.example` | `BoardMember`, tenant | Same journeys as Bert, to separate role problems from scoping problems |
| Vic, restricted viewer | `vic.viewer@usertest.example` | `Viewer`, tenant | Watch, never change anything |

The system administrator (`admin@garrison`) seeded the data and was used as the reference for what a full view looks like.

## Coverage

Status is covered, partial (with what was left), or not covered (with the reason).

| Surface | Item | Users | Journeys and probes | Status |
|---|---|---|---|---|
| Setup | `docs/DEVELOPMENT.md` local server, worker, fake harness | Operator | Followed literally on non-default ports | Covered |
| Setup | `scripts/run-autonomy-example.sh` | Operator | Ran against 8761, 17 of 17 checks passed | Covered |
| Setup | site-reliability-org README apply block | Developer | Ran as written; 0 failed documents; eval set approved; two change rules created | Covered |
| Dashboard | Home autonomy card and kill switch | Operator, Viewer | Turned the kill switch on and off; card counts checked | Covered |
| Dashboard | Keepers list and detail | All | List, detail, interval chart, ticks, revisions, compare, pause, resume, wake twice, new revision, publish, bogus id | Covered |
| Dashboard | Add keeper form | Developer | Empty submit, max below min, negative budget | Covered |
| Dashboard | Escalations list and detail | All | Answer with HTML and template text, answer as Viewer, answered state | Covered |
| Dashboard | Freezes | Operator, Board | Freeze a unit from the board, lift from the Freezes tab | Covered |
| Dashboard | Memory | Developer, Viewer | Scopes, entry dialog, saved content shown as text | Covered (delete not clicked, to keep the gerbil's recall intact) |
| Dashboard | Reports list and detail | All | List, detail, metrics | Covered |
| Dashboard | Messages and threads | All | List, thread view | Partial: no person-sent message from the dashboard; sent over REST instead |
| Dashboard | Organizations list and detail | All | Chart, budgets, revisions, proposals tabs; Create organization empty submit | Covered |
| Dashboard | Executives and proposals | Developer, Board | Proposals tab and board panel (empty) | Partial: a real proposal needs an executive's run token across several MCP calls, which the fake harness cannot chain. The examples Touchstone case `site-reliability-org` covers it |
| Dashboard | Change rules | Developer, Board | List; Add rule empty submit | Covered |
| Dashboard | Eval sets, eval runs | Developer | Set detail, Run set dialog, run detail with three passing cases | Covered |
| Dashboard | Shadow trials, canary releases | All | List pages (empty state) | Partial: starting one needs an executive draft, same reason as proposals |
| Dashboard | Board | All | Board tab, board detail, direction, Talk to the CEO, cancel-all dialog, rollback (disabled with one revision), bogus id | Covered |
| Dashboard | Performance | All | Tab, detail, New check empty submit | Covered |
| Dashboard | Phone width, dark theme | Operator | Every Autonomy page at 390 px in dark mode | Covered |
| Dashboard | Another language | Operator | Every Autonomy page in German | Covered |
| Dashboard | Keyboard only | | | Not covered: the AA12.10 accessibility review did this pass the same day |
| REST | Every Autonomy list and detail route | All five | Read matrix per persona (evidence `perm-matrix.txt`) | Covered |
| REST | Writes: freeze, lift, answer, direction, board messages, kill switch, mandates, messages, reports, eval sets, change rules | All | Valid, missing, wrong type, malformed JSON, too long, duplicate, case variant, unknown reference, wrong-type id, double delete, PATCH | Covered |
| REST | Tenant isolation | Viewer, Admin | Autonomy routes under a second tenant, with ids from the first | Covered |
| REST | Docs against routes | | `scripts/check-api-docs.py` (286 paths, 160 tools, 14 channels) | Covered |
| REST | Postman | | Newman, folders Mandates through Performance with their prerequisites: 275 requests, 405 of 405 non-cleanup assertions pass | Covered (the 24 Cleanup failures are deletes of resources from folders that were not run) |
| MCP | Tool list and autonomy tools | All | `tools/list` per persona; calls as Viewer, Board, Operator, Admin with missing, wrong-type, and extra arguments | Covered |
| SDK | Python | Board (both) | Installed into a fresh venv as the README says; board, escalations, kill switch, freeze, performance | Covered |
| SDK | C#, JavaScript, Go | | | Not covered: `scripts/run-sdk-harnesses.sh` starts its own server on 18700, outside the ports this session was allowed |
| Operations | Restart | Operator | Counts of mandates, escalations, reports, messages, memory, freezes, change rules, eval sets, organizations, and board conversations before and after; a keeper ticked after the restart | Covered |
| Operations | Audit and logs | Operator | Audit by event type for each brake and board action; server log for ticks and freezes | Covered |
| Operations | Docker Compose, update scripts, factory reset, installers, Kubernetes | | | Not covered: outside the Autonomy surfaces this task named |

## Findings

Each finding lists its steps against the seeded instance. Identifiers in steps (`org_...`) are whatever the seed produced; names work the same way unless the finding says otherwise.

| ID | Severity | Category | Title | Recommendation | Decision |
|---|---|---|---|---|---|
| UT-01 | S2 | Defect | An organization-scoped board member cannot use the brakes, escalations, reports, or the CEO's keeper | Fix now | Pending |
| UT-02 | S2 | Defect | Organization-scoped grants match the identifier but not the name | Fix now | Pending |
| UT-03 | S3 | Nonconformance | Viewers see enabled write buttons on the Autonomy pages | Fix now | Pending |
| UT-04 | S3 | Defect | Unknown filter values are ignored and return everything | Fix now | Pending |
| UT-05 | S3 | Defect | The Board tab shows a permission error and an empty-state call to action together | Fix with UT-01 | Pending |
| UT-06 | S3 | Gap | Keeper pause, resume, wake, delete, and escalation answers are not audited | Fix later | Pending |
| UT-07 | S3 | Friction | Run set shows 80 and 1.00 as hints, and leaving them gives no threshold and no budget | Fix now | Pending |
| UT-08 | S3 | Question | A board conversation can file briefs | Discuss | Pending |
| UT-09 | S3 | Question | A negative budget over REST becomes 0 and the keeper fails every tick | Discuss | Pending |
| UT-10 | S3 | Friction | Needs attention lists every repeat report from the last 7 days | Fix later | Pending |
| UT-11 | S4 | Defect | The interval chart repeats time labels | Fix later | Pending |
| UT-12 | S4 | Friction | The escalation page names the keeper by identifier | Fix later | Pending |
| UT-13 | S4 | Defect | Type errors name .NET types | Fix later | Pending |
| UT-14 | S4 | Friction | Publishing an unchanged revision is allowed and wakes the keeper | Fix later | Pending |
| UT-15 | S4 | Question | Wakes a person caused are recorded as Schedule | Discuss | Pending |
| UT-16 | S4 | Friction | The Autonomy tab bar hides Shadow trials and Canary releases at desktop width | Fix later | Pending |
| UT-17 | S4 | Friction | The cancel-all control looks like plain text | Fix later | Pending |
| UT-18 | S4 | Friction | "Address already in use" does not name the address | Fix later | Pending |
| UT-19 | S4 | Question | Every MCP tool is listed to every principal | Leave as is | Pending |
| UT-20 | S4 | Question | An unsupported method answers 404 RouteNotFound, not 405 | Leave as is | Pending |

### UT-01: An organization-scoped board member cannot use the brakes, escalations, reports, or the CEO's keeper

- **Severity:** S2
- **Category:** Defect
- **Surface:** REST, MCP, Python SDK, Dashboard
- **User:** Bert (BoardMember scoped to the organization); Tina (tenant-wide) as the control
- **Oracle:** `docs/BOARD.md`, "The BoardMember role": "A scoped board member reads and directs that organization and no other", and the "Brakes from the board" table, which tells the board to call `POST /freezes`, `POST /freezes/{id}/lift`, and `PUT /autonomy/kill-switch`
- **Frequency:** Always

**Steps**
1. As admin, assign `BoardMember` to Bert with `resourceScope` `Resource` and `resourceId` the organization's identifier, as `docs/BOARD.md` shows.
2. As Bert, call `GET /organizations/{orgId}/board`, `POST /organizations/{orgId}/direction`, and `POST /organizations/{orgId}/board/messages`. All succeed.
3. As Bert, call `POST /freezes` with `targetKind` `OrgUnit` and the `latency` unit, `GET /escalations/{id}` for the uptime keeper's open escalation, `GET /mandates/reliability-lead-brief`, `GET /reports?organizationId={orgId}`, `GET /change-rules`, and `GET /autonomy/kill-switch`.
4. Repeat step 3 as Tina.
5. As Bert, open the board page in the dashboard and click the open escalation.

**Expected:** Bert can freeze and lift the organization's units, read and answer escalations its agents raised, read their reports and keepers, and read the kill switch, since the role grants each of those and the guide tells the board to use those routes.
**Actual:** Every call in step 3 is 403 `AuthorizationDenied` ("No grant covers Create on Freeze", "Read on Escalation", "Read on Mandate", "Read on Report", "Read on ChangeRule", "Read on Freeze"). The MCP tools and the Python SDK give the same 403s. Tina gets 200 or 201 on all of them. In the dashboard Bert's board page loads, but the brake buttons are disabled, and the escalation link and the CEO's keeper link open pages that load nothing (the crawl recorded 301 refused requests across the Autonomy pages for Bert, against 2 for the Viewer).

**Evidence:** `evidence/perm-matrix.txt`, `evidence/board-rest.txt`, `evidence/mcp.txt`, `evidence/sdk-board.txt`, `shots/board-1440-light/board-detail.png`
**Workaround:** Assign `BoardMember` tenant-wide, which gives that person every organization in the tenant.
**Proposed fix:** When a principal's grant is scoped to an organization, authorize the organization's own records against it: escalations raised by or addressed to its agents, freezes that target the organization or its units, its agents' reports, memory, and messages, its mandates, change rules on its units, and eval sets, shadow trials, and canaries tied to its proposals. Filter the tenant list routes to those records for such a principal instead of refusing the whole list. If that is too large for 0.3.0, say in `docs/BOARD.md` that a scoped board member can only use the four board routes, and recommend the tenant-wide assignment until it is fixed.

### UT-02: Organization-scoped grants match the identifier but not the name

- **Severity:** S2
- **Category:** Defect
- **Surface:** REST, MCP, Python SDK
- **User:** Bert
- **Oracle:** `docs/BOARD.md` ("`{id}` is the organization's identifier or name") and the SDK README, whose board example is `client.board.get("acme", limit=20)`
- **Frequency:** Always

**Steps**
1. As Bert, `GET /organizations/org_.../board` with the identifier.
2. As Bert, `GET /organizations/site-reliability-org/board` with the name.
3. In Python, follow the SDK README: `client.login(...)`, then `client.board.get("site-reliability-org", limit=5)`.

**Expected:** Both forms reach the same organization, so both succeed.
**Actual:** The identifier returns 200. The name returns 403 "No grant covers Read on Organization". The SDK call fails the same way, as do `board.direct` and `performance.get` by name. For Tina, who is tenant-wide, both forms work.

**Evidence:** `evidence/sdk-board.txt`; the two curl calls are in the session log
**Workaround:** Use the identifier.
**Proposed fix:** Resolve a name to its identifier before checking a resource-scoped grant, for every route that accepts `{idOrName}`.

### UT-03: Viewers see enabled write buttons on the Autonomy pages

- **Severity:** S3
- **Category:** Nonconformance
- **Surface:** Dashboard
- **User:** Vic (Viewer)
- **Oracle:** `DASHBOARD_STYLE_AND_USABILITY.md`: "Hide or disable routes the signed-in user cannot use, and avoid showing mutation actions to read-only users." The keeper page already disables Freeze for Vic, so the pattern exists.
- **Frequency:** Always

**Steps**
1. Sign in as Vic and open each Autonomy page.
2. On a keeper, click Wake now. On the open escalation, click Answer, pick an option, and click Send answer.

**Expected:** Write actions are hidden or disabled for a Viewer, as Freeze is.
**Actual:** These are enabled: Add keeper; New revision, Pause, Wake now, and Delete on a keeper; Cancel escalation and Answer; Create organization; Add rule; Add eval set; Edit, Run set, Add case, and Remove on an eval set; New check on Performance; and Answer on the Home escalation card. Wake now gives a toast "You do not have permission for this action." Answer lets Vic fill in the whole dialog before the toast says "You need Update on Escalation to answer."

**Evidence:** `evidence/viewer-buttons.txt`, `shots/viewer-actions/wake-now.png`, `shots/viewer-actions/answer-result.png`, `shots/viewer-1440-light/escalation-detail.png`
**Proposed fix:** Gate each of these with the same permission check that disables Freeze.

### UT-04: Unknown filter values are ignored and return everything

- **Severity:** S3
- **Category:** Defect
- **Surface:** REST, and the SDKs that pass filters through
- **User:** Dana
- **Oracle:** `SIMULATED_USER_TESTING.md` Outputs ("Nothing is dropped silently"; a validation problem gets a useful error). A typo in a filter shows unfiltered data that looks filtered.
- **Frequency:** Always

**Steps**
1. `GET /escalations?status=Open` returns 1.
2. `GET /escalations?status=Bogus` returns 3.
3. `GET /reports?kind=Bogus` returns all 9 reports. `GET /memory/entries?scopeKind=Bogus` returns all 3 entries.
4. `GET /audit?eventType=NoSuchEvent` returns all 875 records, and so do `eventType=EscalationAnswered` and `MandatePaused`, which do not exist (see UT-06).

**Expected:** 400 with a field code that names the parameter and lists the allowed values.
**Actual:** 200 with every record, as if no filter had been given.

**Evidence:** `evidence/inputs.txt`; the audit queries are in the session log
**Proposed fix:** Validate enum query parameters in the Autonomy list routes and in audit, and answer 400 `Invalid` on a value that does not parse.

### UT-05: The Board tab shows a permission error and an empty-state call to action together

- **Severity:** S3
- **Category:** Defect
- **Surface:** Dashboard
- **User:** Bert
- **Oracle:** The product contradicting itself
- **Frequency:** Always

**Steps**
1. Sign in as Bert and open Autonomy > Board.

**Expected:** Either the organizations Bert can read, or one clear message that he cannot list organizations, with a way to open his organization.
**Actual:** A red "You do not have permission for this action." banner sits above "No organizations yet. Create an organization of keepers first. Its board shows up here." with a "Go to organizations" button. Bert has an organization, and he cannot create one.

**Evidence:** `shots/board-1440-light/board.png`
**Proposed fix:** Show the empty state only after a successful empty list. Fixing UT-01 so the list returns Bert's organization removes the need for it in this case.

### UT-06: Keeper pause, resume, wake, delete, and escalation answers are not audited

- **Severity:** S3
- **Category:** Gap
- **Surface:** REST audit, Dashboard audit
- **User:** Olivia
- **Oracle:** The operator's expectation, and the product's own pattern: freezes, lifts, the kill switch, board direction, and cancel-all are all audited
- **Frequency:** Always

**Steps**
1. As Olivia, pause, resume, and wake `gerbil-keeper`, and answer the uptime keeper's escalation.
2. As admin, query `GET /audit?eventType=...` for `FreezeApplied`, `FreezeLifted`, `KillSwitchChanged`, `BoardDirectionGiven`, and `UnitCascadeCancelled`. Each has records. Look for anything that records the pause, resume, wake, or answer.

**Expected:** An audit record for each keeper state change and each answer, naming who did it.
**Actual:** No audit event type exists for them. The escalation keeps `resolvedBy` on itself, but a paused keeper has nothing that says who paused it or when.

**Evidence:** session log of the audit queries
**Proposed fix:** Add `MandatePaused`, `MandateResumed`, `MandateWoken`, `MandateDeleted`, and `EscalationAnswered` (and `EscalationCancelled`) audit events.

### UT-07: Run set shows 80 and 1.00 as hints, and leaving them gives no threshold and no budget

- **Severity:** S3
- **Category:** Friction
- **Surface:** Dashboard
- **User:** Dana
- **Oracle:** The simulated user's expectation
- **Frequency:** Always

**Steps**
1. Open the `driver-upgrade-checks` eval set and click Run set.
2. Pick the `dependency-keeper` deployment, leave Pass threshold and Budget as they appear (80 and 1.00), and start the run.

**Expected:** A run with an 80 percent threshold and a 1 US dollar budget, or fields that are visibly empty.
**Actual:** Both values are placeholders. The run page says "No threshold", "No verdict", and "No budget", although all three cases passed.

**Evidence:** `shots/developer-journey/03-eval-run-detail.png`, `evidence/dev-journey-eval.txt`
**Proposed fix:** Prefill them as real values, or change the placeholders to "None" so it is clear nothing is set.

### UT-08: A board conversation can file briefs

- **Severity:** S3
- **Category:** Question
- **Surface:** Board, MCP tools inside runs
- **User:** Tina
- **Oracle:** `docs/BOARD.md` describes a brief as the CEO's standing report that Garrison asks for from a tick
- **Frequency:** Always on the fake variant

**Steps**
1. As Tina, open the board and send "What is the riskiest thing right now?" in Talk to the CEO.
2. Open the reply and look at the tool calls, then reload the board.

**Expected:** Unclear, which is why this is a question. A conversation with the board is not a tick, so a reader might expect it to answer, not to file a report.
**Actual:** The conversation run called `garrison_file_report` and filed a `Brief` with audience `Board` and no `mandateTickId`. It became the board's Latest brief. Its call to `garrison_keeper_complete_tick` was refused, so the server already knows it is not a tick. Four briefs were filed within 15 seconds during the session, two of them from conversations. The fake script made the call, but nothing on the server stopped it.

**Evidence:** `shots/board-ui/03-talk-to-ceo.png`, `GET /reports?kind=Brief` in the session log
**Question for the user:** Should board conversation runs keep `garrison_file_report`, or should a `Brief` need a tick?

### UT-09: A negative budget over REST becomes 0 and the keeper fails every tick

- **Severity:** S3
- **Category:** Question
- **Surface:** REST (and the SDKs, MCP, and manifests that use it)
- **User:** Dana
- **Oracle:** The SDK README documents clamping with `warnings`, so this is behaving as written. The dashboard form refuses the same value.
- **Frequency:** Always

**Steps**
1. `POST /mandates` with `budgetPerTickUsd` -5.
2. Wait for its first tick.

**Expected:** A typo like this is refused, as the dashboard does ("Enter an amount from 0 to 1000000").
**Actual:** 201 with a `ValueClamped` warning; 0 is stored. Every tick then fails with `MandateBudgetExceeded: ... has nothing left of its budgetPerTickUsd`. A script that ignores `warnings` creates a keeper that can never succeed. The same request with max interval 60 and min 7200 stores max 7200, which is harmless.

**Evidence:** `evidence/inputs.txt` and the tick JSON in the session log
**Question for the user:** Keep clamping for out-of-range budgets, or answer 400 for negatives as the dashboard does?

### UT-10: Needs attention lists every repeat report from the last 7 days

- **Severity:** S3
- **Category:** Friction
- **Surface:** Board (dashboard and `GET /organizations/{id}/board`)
- **User:** Tina, Olivia
- **Oracle:** The board member's expectation. `docs/BOARD.md` documents the 7-day rule, so this is a design choice.
- **Frequency:** Always

**Steps**
1. Let the organization run for about 20 minutes.
2. Open the board.

**Expected:** Needs attention shows what needs attention now, so each unhealthy author or unit appears once, at its newest report.
**Actual:** Needs attention (13) listed 12 unhealthy reports, 7 of them "Morning brief" from the same CEO and 3 "Outdated database driver" from the same keeper. The count grows with every tick of a degraded keeper, so it stops meaning anything.

**Evidence:** `shots/operator-1440-light-de/board-detail.png`, `shots/phone/board-2.png`
**Proposed fix:** Show the newest unhealthy report per author (or per unit) and fold the rest into "and n earlier".

### UT-11: The interval chart repeats time labels

- **Severity:** S4
- **Category:** Defect
- **Surface:** Dashboard, keeper detail
- **User:** Olivia
- **Oracle:** Convention
- **Frequency:** Always when ticks land in the same minute

**Steps**
1. Open `gerbil-keeper` after the walkthrough.

**Expected:** Distinct axis labels.
**Actual:** "05:13 PM, 05:13 PM, 05:14 PM, 05:14 PM".

**Evidence:** `shots/admin-1440-light/keeper-detail.png`
**Proposed fix:** Show seconds when ticks share a minute, or label by tick number.

### UT-12: The escalation page names the keeper by identifier

- **Severity:** S4
- **Category:** Friction
- **Surface:** Dashboard, escalation detail
- **User:** Olivia
- **Oracle:** Convention; Raised by on the same page uses the name
- **Frequency:** Always

**Steps**
1. Open the uptime keeper's escalation.

**Expected:** Keeper `uptime-watch`.
**Actual:** Keeper `mdt_mwyagjrz_aNgA9byidaSW4MHEZEm`, wrapped over two lines.

**Evidence:** `shots/operator-actions/02-answer-again.png`
**Proposed fix:** Show the mandate's name and keep the identifier in the tooltip.

### UT-13: Type errors name .NET types

- **Severity:** S4
- **Category:** Defect
- **Surface:** REST
- **User:** Dana
- **Oracle:** `SIMULATED_USER_TESTING.md` Outputs: errors should not leak internals and should say how to fix the input
- **Frequency:** Always

**Steps**
1. `POST /mandates` with `"minIntervalSeconds": "soon"`.
2. `POST /mandates` with `"wakeMode": "Sometimes"`.

**Expected:** "minIntervalSeconds must be a whole number" and "wakeMode must be one of Fixed, Backoff".
**Actual:** "The JSON value could not be converted to System.Int32" and "could not be converted to Garrison.Core.Enums.WakeModeEnum", with byte positions. This comes from the shared body parser, so it likely affects every route, not only Autonomy.

**Evidence:** `evidence/inputs.txt`
**Proposed fix:** Map deserializer errors to the field path, a plain type name, and for enums the allowed values.

### UT-14: Publishing an unchanged revision is allowed and wakes the keeper

- **Severity:** S4
- **Category:** Friction
- **Surface:** Dashboard, keeper detail
- **User:** Dana
- **Oracle:** The simulated user's expectation
- **Frequency:** Always

**Steps**
1. On `gerbil-keeper`, click New revision and then Publish without changing anything.

**Expected:** Publish is disabled until something changes, or a note says nothing changed.
**Actual:** Revision 2, identical to revision 1, is published, and the keeper wakes.

**Evidence:** `evidence/dev-forms.txt`
**Proposed fix:** Disable Publish while the form matches the current revision.

### UT-15: Wakes a person caused are recorded as Schedule

- **Severity:** S4
- **Category:** Question
- **Surface:** Keeper ticks (REST and dashboard)
- **User:** Olivia, Tina
- **Oracle:** `docs/KEEPERS.md` lists wake sources; publishing a revision "wakes now"
- **Frequency:** Seen twice

**Steps**
1. As Tina, give direction to the CEO. Look at the CEO keeper's next tick.
2. As Olivia, pause and resume `gerbil-keeper`, then click Wake now twice. Look at the next tick.

**Expected:** A wake source that says a person caused it.
**Actual:** Both ticks have `wakeSource` `Timer`, shown as "Schedule". (The second was then skipped by the kill switch Olivia turned on a moment later, which is correct.)

**Evidence:** tick JSON in the session log
**Question for the user:** Is `Timer` intended for publish and resume, or should they record their own source?

### UT-16: The Autonomy tab bar hides Shadow trials and Canary releases at desktop width

- **Severity:** S4
- **Category:** Friction
- **Surface:** Dashboard
- **User:** All
- **Oracle:** Convention
- **Frequency:** Always at 1440 px

**Steps**
1. Open Autonomy at 1440 px wide.

**Expected:** All 14 tabs reachable, or a visible cue that the bar scrolls.
**Actual:** The bar ends at Eval runs. Shadow trials and Canary releases are off to the right with no scroll cue.

**Evidence:** `shots/admin-1440-light/keepers.png`
**Proposed fix:** Wrap the tabs, add an overflow menu, or add a scroll cue.

### UT-17: The cancel-all control looks like plain text

- **Severity:** S4
- **Category:** Friction
- **Surface:** Dashboard, board chart cards
- **User:** Tina
- **Oracle:** Convention for destructive actions
- **Frequency:** Always

**Steps**
1. Open the board and look at "Cancel everything in this unit" in each unit card.

**Expected:** A visible button, styled as destructive like the one in the Brakes panel.
**Actual:** Small grey text with no button styling. It does open a clear confirmation ("Cancel every queued and running run... This does not freeze the unit"), so nothing fires by accident.

**Evidence:** `shots/admin-1440-light/board-detail.png`, `evidence/board-ui.txt`
**Proposed fix:** Style it as the Brakes panel button is.

### UT-18: "Address already in use" does not name the address

- **Severity:** S4
- **Category:** Friction
- **Surface:** Server log
- **User:** Olivia
- **Oracle:** `SIMULATED_USER_TESTING.md` Behaviors (observability)
- **Frequency:** Once, restarting a few seconds after stopping

**Steps**
1. Stop the server and start it again four seconds later.

**Expected:** The log names the port that is taken.
**Actual:** `startup failed: Address already in use`. A second start a minute later worked. This is not specific to Autonomy.

**Evidence:** session `server2.log`
**Proposed fix:** Include the endpoint in the startup failure message.

### UT-19: Every MCP tool is listed to every principal

- **Severity:** S4
- **Category:** Question
- **Surface:** MCP
- **User:** Vic, Bert
- **Oracle:** The simulated user's expectation
- **Frequency:** Always

**Steps**
1. Call `tools/list` as each persona.

**Expected:** Unclear. A client might expect to see only the tools it can use.
**Actual:** All 160 tools for every persona, including `garrison_freeze` and `garrison_answer_escalation` for Vic. Calls are refused cleanly as tool errors ("Forbidden: Not permitted: No grant covers Create on Freeze."), so nothing leaks.

**Evidence:** `evidence/mcp.txt`
**Question for the user:** Keep one tool list, or filter it by permission?

### UT-20: An unsupported method answers 404 RouteNotFound, not 405

- **Severity:** S4
- **Category:** Question
- **Surface:** REST
- **User:** Dana
- **Oracle:** Convention
- **Frequency:** Always

**Steps**
1. `PATCH /mandates/gerbil-keeper`.

**Expected:** 405 Method Not Allowed with an `Allow` header.
**Actual:** 404 `RouteNotFound` "No route matches the request." This is the router's behavior everywhere, not only Autonomy.

**Evidence:** `evidence/inputs.txt`
**Question for the user:** Worth changing, or leave it?

## What worked

These were checked and behaved as documented. They are listed so the user knows they were covered.

- The gerbil walkthrough: Quiet, backoff to 1800 s, Attention back to 900 s, escalation to the on-call role, the answer waking the keeper, and memory of the previous tick.
- The organization apply, the eval set approval, the gated change rule, the urgent peer-line message, the dependency keeper's report, the CEO's brief, and the curator's tick.
- Answering an escalation as Olivia, with `<b>` and `{{template}}` in the answer, stored and shown as plain text.
- Freeze a unit from the board, lift it from Freezes, pause, resume, kill switch on and off, each with a confirmation that says what it does.
- Unicode, right-to-left text, emoji, and a `<script>` tag in a keeper objective round-trip and render as text.
- Duplicate names (409 `NameConflict`), names with capitals (400 with the rule), unknown agents and deployments (400 `ReferenceNotFound`), malformed JSON (400), direction empty and over 4000 characters (400 with field codes), double delete (204 then 404).
- Cross-tenant reads of Autonomy records answer 404 for a Viewer and for the administrator.
- Data and keeper scheduling survive a restart; a keeper ticked normally afterwards.
- Eval runs scored three of three cases and caused no side effects (no reports, messages, or memory writes from the eval runs).
- MCP argument errors come back as tool errors with useful text; Python SDK errors carry the server's code and message.
- The Autonomy pages in German, at phone width in dark mode (wide tables scroll inside their cards), with no `undefined`, `NaN`, or `[object Object]` anywhere.

## Definition of done

| Item | State |
|---|---|
| Stood up from a clean state by following the docs, deviations recorded | Done for the build-from-source path. Docker Compose, Helm, and installers were not stood up (see Coverage) |
| Environment recorded | Done |
| Coverage matrix, with reasons for anything not covered | Done |
| Core journeys by each user, restricted users, a cross-surface journey per core entity | Done |
| Input, output, and behavior probes | Done |
| Documentation examples and Postman run as written | Done for the Autonomy examples, the SDK README board example, and the Autonomy Postman folders |
| Every finding has id, severity, category, surface, user, oracle, steps, expected, actual, and evidence | Done |
| User shown a summary, asked which findings to address, decisions recorded | Waiting for the user. Every Decision is Pending |
| Nothing fixed without approval; approved fixes verified on a fresh instance | Nothing was fixed. Verification follows the user's decisions |
| Instance torn down | Done: the server, worker, and dashboard dev server were stopped and the scratch database was left in the session scratchpad only |
